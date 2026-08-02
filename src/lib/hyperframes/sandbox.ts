import { Sandbox, Snapshot } from "@vercel/sandbox";
import { get, put } from "@vercel/blob";

// Plain Vercel Functions can't host Chromium + FFmpeg (50MB compressed
// bundle limit) — this renders inside a Vercel Sandbox (a real Firecracker
// microVM) instead, following HyperFrames' own official Vercel template
// (github.com/heygen-com/hyperframes-vercel-template). A pre-baked snapshot
// (built once per deploy in scripts/create-hyperframes-snapshot.ts) skips
// the ~30-60s Chromium/FFmpeg install on every render.
const RENDER_TIMEOUT_MS = 5 * 60 * 1000;
const SNAPSHOT_SETUP_TIMEOUT_MS = 15 * 60 * 1000;
export const SNAPSHOT_TTL_MS = 7 * 24 * 3600 * 1000;
const SANDBOX_OPTS = { runtime: "node22", resources: { vcpus: 4 } } as const;

const pointerKey = (deploymentId: string) => `hyperframes-snapshot-cache/${deploymentId}.json`;

type RunCommandOpts = Parameters<Sandbox["runCommand"]>[0];

async function runSandboxCommand(sandbox: Sandbox, label: string, opts: RunCommandOpts): Promise<void> {
  const result = await sandbox.runCommand(opts);
  if (result.exitCode !== 0) {
    throw new Error(`${label} failed (exit ${result.exitCode}):\n${await result.stderr()}`);
  }
}

export async function prepareSandbox(sandbox: Sandbox): Promise<void> {
  await Promise.all([
    runSandboxCommand(sandbox, "dnf install", {
      cmd: "dnf",
      args: [
        "install", "-y", "--setopt=install_weak_deps=False",
        "nss", "nspr", "atk", "at-spi2-atk", "cups-libs",
        "libdrm", "libxkbcommon", "libXcomposite", "libXdamage",
        "libXext", "libXfixes", "libXrandr", "mesa-libgbm",
        "alsa-lib", "pango",
      ],
      sudo: true,
    }),
    runSandboxCommand(sandbox, "npm install", {
      cmd: "npm",
      args: [
        "install", "--no-save", "--no-audit", "--no-fund",
        "hyperframes@latest", "ffmpeg-static", "ffprobe-static",
      ],
    }),
  ]);

  await Promise.all([
    runSandboxCommand(sandbox, "ffmpeg symlink", {
      cmd: "ln",
      args: ["-sf", "/vercel/sandbox/node_modules/ffmpeg-static/ffmpeg", "/usr/local/bin/ffmpeg"],
      sudo: true,
    }),
    runSandboxCommand(sandbox, "ffprobe symlink", {
      cmd: "ln",
      args: ["-sf", "/vercel/sandbox/node_modules/ffprobe-static/bin/linux/x64/ffprobe", "/usr/local/bin/ffprobe"],
      sudo: true,
    }),
  ]);
}

export async function createFreshSetupSandbox(): Promise<Sandbox> {
  // persistent: false — this script takes its own explicit .snapshot() call
  // below; without this, stop() would also auto-snapshot the filesystem for
  // resume, doubling storage for no benefit (nothing ever resumes this
  // specific sandbox — every render restores fresh from the explicit one).
  return Sandbox.create({ ...SANDBOX_OPTS, timeout: SNAPSHOT_SETUP_TIMEOUT_MS, persistent: false });
}

export async function writeSnapshotPointer(params: {
  deploymentId: string;
  snapshotId: string;
  token: string;
}): Promise<void> {
  await put(pointerKey(params.deploymentId), JSON.stringify({ snapshotId: params.snapshotId }), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: params.token,
  });
}

// Deletes every other non-deleted snapshot for this project, keeping only
// the one just created. Queries the Sandbox API directly instead of a
// pointer file: a previous version tracked "latest" in a public Vercel
// Blob and diffed against it, but a get() shortly after another deploy's
// put() can return a stale, CDN-cached copy — that let a just-created
// snapshot dodge cleanup entirely and sit until its 7-day TTL, which is
// what kept Snapshot Storage creeping back toward full. Re-deriving "what
// exists" from the API on every call is immune to that race.
export async function sweepStaleSnapshots(keepSnapshotId: string): Promise<void> {
  const pages = await Snapshot.list();
  for await (const snapshot of pages) {
    if (snapshot.id === keepSnapshotId || snapshot.status !== "created") continue;
    try {
      const stale = await Snapshot.get({ snapshotId: snapshot.id });
      await stale.delete();
      console.log(`[hyperframes-snapshot] deleted stale snapshot ${snapshot.id}`);
    } catch (err) {
      console.warn(`[hyperframes-snapshot] couldn't delete stale snapshot ${snapshot.id}:`, err);
    }
  }
}

async function readSnapshotId(deploymentId: string, token: string): Promise<string> {
  const result = await get(pointerKey(deploymentId), { access: "public", token });
  if (!result || result.statusCode !== 200) {
    throw new Error(`snapshot pointer missing for deployment ${deploymentId}`);
  }
  const { snapshotId } = (await new Response(result.stream).json()) as { snapshotId: string };
  return snapshotId;
}

async function restoreOrCreate(): Promise<Sandbox> {
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // persistent: false on both paths below — every render restores fresh
  // from the SAME shared snapshot, never resumes a specific prior render's
  // sandbox, so there's nothing to auto-snapshot for later. Without this,
  // stop() (in renderCompositionInSandbox's finally) silently snapshots the
  // filesystem on every single render — this is what blew through the
  // Hobby plan's Snapshot Storage limit.
  if (deploymentId && token) {
    try {
      const snapshotId = await readSnapshotId(deploymentId, token);
      return await Sandbox.create({
        source: { type: "snapshot", snapshotId },
        timeout: RENDER_TIMEOUT_MS,
        resources: SANDBOX_OPTS.resources,
        persistent: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.VERCEL_ENV === "production") {
        throw new Error(`snapshot restore failed in production: ${msg}`);
      }
      console.warn(`[sandbox] snapshot restore failed in dev, falling back: ${msg}`);
    }
  }

  const sandbox = await Sandbox.create({ ...SANDBOX_OPTS, timeout: RENDER_TIMEOUT_MS, persistent: false });
  await prepareSandbox(sandbox);
  return sandbox;
}

export async function renderCompositionInSandbox(
  html: string,
  extraFiles: ReadonlyArray<{ rel: string; content: Buffer }> = []
): Promise<Buffer> {
  const sandbox = await restoreOrCreate();

  try {
    await sandbox.writeFiles([
      { path: "composition/index.html", content: html },
      ...extraFiles.map(({ rel, content }) => ({ path: `composition/${rel}`, content })),
    ]);

    await runSandboxCommand(sandbox, "render", {
      cmd: "npx",
      args: ["--no-install", "hyperframes", "render", "composition", "-o", "out.mp4", "--workers", "auto"],
    });

    const mp4 = await sandbox.readFileToBuffer({ path: "out.mp4" });
    if (!mp4) throw new Error("render produced no out.mp4");
    return mp4;
  } finally {
    await sandbox.stop().catch(() => {});
  }
}

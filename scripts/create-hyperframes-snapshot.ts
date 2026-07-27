import { Snapshot } from "@vercel/sandbox";
import {
  createFreshSetupSandbox,
  prepareSandbox,
  SNAPSHOT_TTL_MS,
  writeSnapshotPointer,
} from "../src/lib/hyperframes/sandbox";

// Runs once per deploy (see the "build" script in package.json) so every
// actual render request restores this pre-baked sandbox instead of paying
// the ~30-60s Chromium/FFmpeg install cost per request.
async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;

  if (!token || !deploymentId) {
    console.log(
      "[create-hyperframes-snapshot] BLOB_READ_WRITE_TOKEN or VERCEL_DEPLOYMENT_ID missing — skipping (local build)"
    );
    return;
  }

  const t0 = Date.now();
  const sandbox = await createFreshSetupSandbox();

  try {
    await prepareSandbox(sandbox);

    console.log("[create-hyperframes-snapshot] downloading Chrome Headless Shell");
    const browserResult = await sandbox.runCommand({
      cmd: "npx",
      args: ["--no-install", "hyperframes", "browser", "ensure"],
    });
    if (browserResult.exitCode !== 0) {
      throw new Error(`browser ensure failed (exit ${browserResult.exitCode}):\n${await browserResult.stderr()}`);
    }

    console.log("[create-hyperframes-snapshot] taking snapshot");
    const snapshot = await sandbox.snapshot({ expiration: SNAPSHOT_TTL_MS });
    const mb = Math.round(snapshot.sizeBytes / 1024 / 1024);
    console.log(`[create-hyperframes-snapshot] snapshotId=${snapshot.snapshotId} size=${mb}MB`);

    const { previousSnapshotId } = await writeSnapshotPointer({
      deploymentId,
      snapshotId: snapshot.snapshotId,
      token,
    });

    // Only one snapshot is ever actually needed (whichever the current
    // deployment points to) — delete the one this just replaced instead of
    // letting it sit around for its full 7-day TTL. Best-effort: a failure
    // here shouldn't fail the deploy, just leaves that one snapshot to
    // expire naturally.
    if (previousSnapshotId) {
      try {
        const old = await Snapshot.get({ snapshotId: previousSnapshotId });
        await old.delete();
        console.log(`[create-hyperframes-snapshot] deleted previous snapshot ${previousSnapshotId}`);
      } catch (err) {
        console.warn(
          `[create-hyperframes-snapshot] couldn't delete previous snapshot ${previousSnapshotId}:`,
          err
        );
      }
    }

    const s = Math.round((Date.now() - t0) / 1000);
    console.log(`[create-hyperframes-snapshot] done in ${s}s`);
  } finally {
    await sandbox.stop().catch(() => {});
  }
}

main().catch((err) => {
  console.error("[create-hyperframes-snapshot] FAILED", err);
  process.exit(1);
});

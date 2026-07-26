import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import path from "node:path";

const BIN_DIR = path.join(process.cwd(), "bin");
const BIN_PATH = path.join(BIN_DIR, "yt-dlp");

const ASSET_BY_PLATFORM = {
  linux: "yt-dlp_linux",
  darwin: "yt-dlp_macos",
};

async function main() {
  const asset = ASSET_BY_PLATFORM[process.platform];
  if (!asset) {
    console.warn(`[download-yt-dlp] Unsupported platform "${process.platform}" — skipping. The YouTube/Instagram downloader tools will not work.`);
    return;
  }

  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`;
  console.log(`[download-yt-dlp] Fetching ${url} ...`);

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  mkdirSync(BIN_DIR, { recursive: true });
  writeFileSync(BIN_PATH, buffer);
  chmodSync(BIN_PATH, 0o755);
  console.log(`[download-yt-dlp] Wrote ${BIN_PATH} (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB)`);
}

main().catch((err) => {
  // Non-fatal: don't fail the whole `npm install` / build over this — the
  // downloader tools degrade gracefully at runtime if the binary is
  // missing, rather than blocking the entire site's deploy.
  console.warn("[download-yt-dlp] Failed to fetch yt-dlp binary:", err.message);
  console.warn("[download-yt-dlp] The YouTube/Instagram downloader tools will not work until this succeeds.");
});

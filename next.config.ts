import path from "node:path";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "@ffprobe-installer/ffprobe"],
  outputFileTracingIncludes: {
    // Broad glob: the ffmpeg compose step now runs inside a Workflow SDK
    // step handler (an internally-generated route under
    // .well-known/workflow/), not a fixed route we can key on directly.
    // Also includes the yt-dlp binary fetched by scripts/download-yt-dlp.mjs
    // at install time — Next's file tracer can't see it since it's invoked
    // via child_process.spawn(), not require()/import.
    "**/*": ["./src/lib/render/fonts/**", "./bin/yt-dlp"],
  },
};

const withMDX = createMDX({
  options: {
    // String plugin refs (not inline options objects) so Turbopack can
    // pass them through — inline options can't cross the JS/Rust boundary.
    remarkPlugins: ["remark-gfm"],
  },
});

export default withWorkflow(withMDX(nextConfig));

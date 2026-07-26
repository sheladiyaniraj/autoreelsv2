import path from "node:path";
import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],
  outputFileTracingIncludes: {
    // Broad glob: the ffmpeg compose step now runs inside a Workflow SDK
    // step handler (an internally-generated route under
    // .well-known/workflow/), not a fixed route we can key on directly.
    "**/*": ["./src/lib/render/fonts/**"],
  },
};

export default withWorkflow(nextConfig);

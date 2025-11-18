
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Prevent Turbopack from bundling native ffmpeg bits.
  serverExternalPackages: [
    "@ffmpeg-installer/ffmpeg",
    "fluent-ffmpeg",
  ],

  // Disable ESLint blocking builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript blocking builds (safe for MVP/demo only)
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default config;

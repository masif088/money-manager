import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export to `out/` for Firebase Hosting.
  output: "export",
  // `/pencatatan/` → `out/pencatatan/index.html`, which Firebase Hosting serves without rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  webpack: (config, { dev, webpack }) => {
    if (!dev && process.env.VERCEL_ENV !== "preview") {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /ad02-preview-body(?:\.tsx)?$/,
          path.join(process.cwd(), "src/dev/ad02-preview-disabled.tsx"),
        ),
      );
    }
    return config;
  },
};

export default nextConfig;

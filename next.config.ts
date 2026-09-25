import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev badge overlaps the sidebar's bottom controls; errors still surface.
  devIndicators: false,
};

export default nextConfig;

import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Add the jscad-fiber module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@jscad-fiber': path.resolve(__dirname, './jscad-fiber/lib'),
      // Add aliases for internal jscad-fiber imports
      'lib/wrappers/with-color-prop': path.resolve(__dirname, './jscad-fiber/lib/wrappers/with-color-prop'),
      'lib/wrappers/with-offset-prop': path.resolve(__dirname, './jscad-fiber/lib/wrappers/with-offset-prop'),
      'lib': path.resolve(__dirname, './jscad-fiber/lib'),
    };
    
    return config;
  },
};

export default nextConfig;

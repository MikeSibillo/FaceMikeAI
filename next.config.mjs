import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["idb"]
  }
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  fallbacks: {
    document: "/offline"
  }
})(nextConfig);


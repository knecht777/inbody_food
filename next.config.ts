import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (via jwks-rsa -> jose) fails to bundle correctly for
  // serverless functions otherwise: ERR_REQUIRE_ESM at runtime in production.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;

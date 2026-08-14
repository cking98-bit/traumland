import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin laedt seine Submodule per dynamischem require. Gebundelt
  // bricht "firebase-admin/auth" auf Vercel beim Laden der Function ab (500).
  // Als externes Paket wird es zur Laufzeit aus node_modules geladen.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;

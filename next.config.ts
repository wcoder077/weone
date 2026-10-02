import type { NextConfig } from "next";

// Baseline hardening for every response. No full CSP yet: the inline theme
// script would need a nonce.
const SECURITY_HEADERS = [
  // No framing by other sites (clickjacking on login, connect, delete buttons).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Going back to a page seen in the last 30 s reuses it instead of asking the server again.
  experimental: { staleTimes: { dynamic: 30 } },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;

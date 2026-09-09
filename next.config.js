/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Blocks the whole app from being framed by another site
          // (clickjacking protection).
          { key: "X-Frame-Options", value: "DENY" },
          // Stops the browser guessing content types away from what the
          // server declares (MIME-sniffing protection).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak the full referring URL (which can contain query
          // params) to third parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable powerful browser features this app never uses.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

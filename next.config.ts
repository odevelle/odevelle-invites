import type { NextConfig } from "next";

/** Invitation photos are served from the Supabase Storage CDN; allow only that bucket. */
function supabaseImagePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const url = process.env.SUPABASE_URL;
  if (!url) return [];
  const { protocol, hostname, port } = new URL(url);
  return [
    {
      protocol: protocol === "http:" ? "http" : "https",
      hostname,
      port,
      pathname: "/storage/v1/object/public/invitation-media/**",
      search: "",
    },
  ];
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

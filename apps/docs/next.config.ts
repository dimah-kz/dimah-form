import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

/** Old flat URLs (9a7a91f) and nested IA URLs → current flat pages. */
const pageMoves: [string, string][] = [
  ["/docs/setup", "/docs/server"],
  ["/docs/fill", "/docs/react"],
  ["/docs/helpers", "/docs/react"],
  ["/docs/hooks", "/docs/auth"],
  ["/docs/responses", "/docs/snapshots"],
  ["/docs/concepts/architecture", "/docs/architecture"],
  ["/docs/concepts/snapshots", "/docs/snapshots"],
  ["/docs/concepts", "/docs/architecture"],
  ["/docs/guides/server", "/docs/server"],
  ["/docs/guides/forms", "/docs/forms"],
  ["/docs/guides/database", "/docs/database"],
  ["/docs/guides/react", "/docs/react"],
  ["/docs/guides/custom-fields", "/docs/custom-fields"],
  ["/docs/guides/auth", "/docs/auth"],
  ["/docs/guides/plugins", "/docs/plugins"],
  ["/docs/guides", "/docs"],
  ["/docs/reference/protocol", "/docs/protocol"],
  ["/docs/reference/field-types", "/docs/field-types"],
  ["/docs/reference/errors", "/docs/errors"],
  ["/docs/reference/configuration", "/docs/configuration"],
  ["/docs/reference", "/docs/protocol"],
  ["/docs/examples", "/docs"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const cors = { key: "Access-Control-Allow-Origin", value: "*" };
    const describedBy = {
      key: "Link",
      value: '</llms.txt>; rel="describedby"',
    };
    const previewRobots =
      process.env.VERCEL_ENV === "preview"
        ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
        : [];

    return [
      { source: "/", headers: [describedBy, ...previewRobots] },
      { source: "/docs", headers: [describedBy, ...previewRobots] },
      { source: "/docs/:path*", headers: [describedBy, ...previewRobots] },
      { source: "/llms.txt", headers: [cors] },
      { source: "/llms-full.txt", headers: [cors] },
      { source: "/docs.md", headers: [cors, describedBy] },
      { source: "/docs/:path*.md", headers: [cors, describedBy] },
      { source: "/llms.mdx/:path*", headers: [cors, describedBy] },
    ];
  },
  async redirects() {
    return pageMoves.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      {
        source: `${source}.md`,
        destination: `${destination}.md`,
        permanent: true,
      },
    ]);
  },
  async rewrites() {
    return [
      { source: "/docs.md", destination: "/llms.mdx/docs" },
      { source: "/docs.mdx", destination: "/llms.mdx/docs" },
      { source: "/docs/:path*.md", destination: "/llms.mdx/docs/:path*" },
      { source: "/docs/:path*.mdx", destination: "/llms.mdx/docs/:path*" },
    ];
  },
};

export default withMDX(nextConfig);

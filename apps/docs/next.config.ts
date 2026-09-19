import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

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
    return [
      {
        source: "/docs/setup",
        destination: "/docs/guides/server",
        permanent: true,
      },
      {
        source: "/docs/forms",
        destination: "/docs/guides/forms",
        permanent: true,
      },
      {
        source: "/docs/field-types",
        destination: "/docs/reference/field-types",
        permanent: true,
      },
      {
        source: "/docs/responses",
        destination: "/docs/concepts/snapshots",
        permanent: true,
      },
      {
        source: "/docs/hooks",
        destination: "/docs/guides/auth",
        permanent: true,
      },
      {
        source: "/docs/errors",
        destination: "/docs/reference/errors",
        permanent: true,
      },
      {
        source: "/docs/plugins",
        destination: "/docs/guides/plugins",
        permanent: true,
      },
      {
        source: "/docs/database",
        destination: "/docs/guides/database",
        permanent: true,
      },
      {
        source: "/docs/fill",
        destination: "/docs/guides/react",
        permanent: true,
      },
      {
        source: "/docs/helpers",
        destination: "/docs/guides/react",
        permanent: true,
      },
      {
        source: "/docs/setup.md",
        destination: "/docs/guides/server.md",
        permanent: true,
      },
      {
        source: "/docs/forms.md",
        destination: "/docs/guides/forms.md",
        permanent: true,
      },
      {
        source: "/docs/field-types.md",
        destination: "/docs/reference/field-types.md",
        permanent: true,
      },
      {
        source: "/docs/responses.md",
        destination: "/docs/concepts/snapshots.md",
        permanent: true,
      },
      {
        source: "/docs/hooks.md",
        destination: "/docs/guides/auth.md",
        permanent: true,
      },
      {
        source: "/docs/errors.md",
        destination: "/docs/reference/errors.md",
        permanent: true,
      },
      {
        source: "/docs/plugins.md",
        destination: "/docs/guides/plugins.md",
        permanent: true,
      },
      {
        source: "/docs/database.md",
        destination: "/docs/guides/database.md",
        permanent: true,
      },
      {
        source: "/docs/fill.md",
        destination: "/docs/guides/react.md",
        permanent: true,
      },
      {
        source: "/docs/helpers.md",
        destination: "/docs/guides/react.md",
        permanent: true,
      },
    ];
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

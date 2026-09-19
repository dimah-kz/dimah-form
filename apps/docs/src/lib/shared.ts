import corePackage from "../../../../packages/core/package.json" with { type: "json" };

export const appName = "dimah-form";
export const packageVersion = corePackage.version;
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

/** Landing H1, browser tab, and Open Graph title — keep these in sync. */
export const siteTagline =
  "Backend-first questionnaires for the React ecosystem";
export const siteTitle = `${appName} — ${siteTagline}`;
export const siteDescription =
  "Server instance, typed protocol client, and FumaDB persistence. You own rendering. The library owns definition snapshots, drafts, and submit validation.";

/** Site-wide terms for the homepage, layout, and JSON-LD — not copied onto every docs page. */
export const siteKeywords = [
  "dimah-form",
  "dimah form",
  "questionnaire",
  "survey",
  "form builder",
  "headless form",
  "backend-first form",
  "typed form",
  "react form",
  "react hooks",
  "next.js",
  "next.js app router",
  "fumadb",
  "drizzle orm",
  "zod",
  "better-call",
  "typescript",
  "hono",
  "express",
  "fastify",
  "elysia",
  "sveltekit",
];

/** Brand terms for per-page docs meta. */
export const pageBrandKeywords = [
  "dimah-form",
  "dimah form",
  "questionnaire",
] as const;

export function docsPageKeywords(title: string): string[] {
  const extra = title.toLowerCase().trim();
  const keywords: string[] = [...pageBrandKeywords];
  if (extra && !keywords.includes(extra)) {
    keywords.push(extra);
  }
  return keywords;
}

export const gitConfig = {
  user: "dimah-kz",
  repo: "dimah-form",
  branch: "main",
  contentPath: "apps/docs/content/docs",
};

export const xProfileUrl = "https://x.com/dimahkzx";

export const npmPackageUrls = [
  "https://www.npmjs.com/package/@dimah-form/server",
  "https://www.npmjs.com/package/@dimah-form/react",
  "https://www.npmjs.com/package/@dimah-form/core",
  "https://www.npmjs.com/package/@dimah-form/db",
] as const;

export function githubRepoUrl() {
  return `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function docsArticleJsonLd(input: {
  origin: string;
  url: string;
  title: string;
  description: string;
}) {
  const pageUrl = `${input.origin}${input.url}`;

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.title,
    description: input.description,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: appName,
      url: input.origin,
    },
    author: {
      "@type": "Organization",
      name: appName,
      url: input.origin,
    },
  };
}

export function siteJsonLd(origin: string) {
  const repo = githubRepoUrl();
  const orgId = `${origin}/#organization`;
  const sameAs = [repo, xProfileUrl, ...npmPackageUrls];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: appName,
        url: origin,
        logo: `${origin}/logo.svg`,
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: appName,
        url: origin,
        description: siteDescription,
        inLanguage: "en",
        keywords: siteKeywords.join(", "),
        publisher: { "@id": orgId },
      },
      {
        "@type": "SoftwareApplication",
        name: appName,
        description: siteDescription,
        url: origin,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "Forms / Developer Tools",
        operatingSystem: "Web",
        softwareVersion: packageVersion,
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        downloadUrl: npmPackageUrls[0],
        keywords: siteKeywords.join(", "),
        publisher: { "@id": orgId },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Backend-first questionnaire engine",
          "Typed protocol shared by server and React",
          "Definition snapshots with draft and submit validation",
          "Built-in field types plus defineFieldType",
          "Required persistence adapter: memoryAdapter or optional FumaDB",
          "Headless React fill session — you own widgets",
          "Next.js App Router, Hono, Express, Fastify, Elysia, and SvelteKit adapters",
          "Server plugins, domain hooks, and consumer guard auth",
        ],
      },
      {
        "@type": "SoftwareSourceCode",
        name: appName,
        description: siteDescription,
        url: origin,
        codeRepository: repo,
        programmingLanguage: "TypeScript",
        runtimePlatform: "Node.js",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        publisher: { "@id": orgId },
        sameAs,
      },
    ],
  };
}

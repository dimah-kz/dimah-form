import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  githubRepoUrl,
  siteDescription,
  siteHeadline,
  siteHeadlineAccent,
} from "@/lib/shared";
import { InteractiveDemo } from "./interactive-demo";

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function HeroSection() {
  const githubUrl = githubRepoUrl();

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-16 pb-10 sm:pt-24 sm:pb-12"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <Link
          href="/docs/quickstart"
          className="group inline-flex items-center gap-2 rounded-full border bg-fd-card/80 px-3.5 py-1.5 text-xs font-medium text-fd-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-fd-primary/40 hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
        >
          Open source · TypeScript
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>

        <h1
          id="hero-heading"
          className="mt-7 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-balance text-fd-foreground sm:text-6xl sm:leading-[1.05]"
        >
          <span className="block">{siteHeadline}</span>
          <span className="block bg-linear-to-r from-fd-primary via-cyan-500 to-teal-500 bg-clip-text text-transparent dark:via-cyan-200 dark:to-teal-200">
            {siteHeadlineAccent}
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-balance text-fd-muted-foreground sm:text-lg">
          {siteDescription}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/quickstart"
            className={cn(
              buttonVariants(),
              "h-10 px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring",
            )}
          >
            Start building
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>

          <Link
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring",
            )}
          >
            <GitHubIcon />
            View on GitHub
          </Link>
        </div>

        <p className="mt-5 text-xs text-fd-muted-foreground">
          Next.js, Hono, Express, Fastify, Elysia, and SvelteKit.
        </p>
      </div>

      <div className="relative mt-14 sm:mt-18">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[15%] -top-8 h-52 rounded-full bg-fd-primary/15 blur-3xl sm:-top-12 sm:h-64"
        />
        <div className="relative">
          <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4 px-1">
            <p className="font-mono text-[0.7rem] font-medium tracking-[0.14em] text-fd-muted-foreground uppercase">
              Response flow
            </p>
            <span className="text-xs text-fd-muted-foreground">
              Interactive preview
            </span>
          </div>
          <InteractiveDemo />
        </div>
      </div>
    </section>
  );
}

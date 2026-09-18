import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { HomeAnnouncement } from "@/components/home-announcement";
import { HomeArchitecture } from "@/components/home-architecture";
import { HomeBackground } from "@/components/home-background";
import { buttonVariants } from "@/components/ui/button";
import { githubRepoUrl, siteTagline } from "@/lib/shared";

const githubUrl = githubRepoUrl();

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const highlights = ["Headless fill", "Typed protocol", "You own UI"];

export default function HomePage() {
  return (
    <section
      aria-labelledby="home-title"
      className="relative isolate mx-auto flex min-h-[calc(100svh-4rem)] w-full min-w-0 flex-1 items-center overflow-hidden px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
    >
      <HomeBackground />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-12 xl:gap-20">
        <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-start">
          <HomeAnnouncement className={cn("home-enter", "delay-75")} />

          <h1
            id="home-title"
            className={cn(
              "home-enter",
              "mt-7 max-w-4xl bg-linear-to-b from-fd-foreground from-45% to-fd-foreground/60 bg-clip-text text-4xl leading-[1.04] font-semibold tracking-[-0.045em] text-balance text-transparent delay-100 sm:text-5xl lg:max-w-2xl lg:text-[58px]",
            )}
          >
            {siteTagline}
          </h1>

          <p
            className={cn(
              "home-enter",
              "mt-6 max-w-xl text-base leading-7 text-pretty text-fd-muted-foreground delay-150 sm:text-lg sm:leading-8",
            )}
          >
            Server instance, typed client, and FumaDB persistence. Field widgets
            stay in your app.
          </p>

          <div
            className={cn(
              "home-enter",
              "mt-8 flex flex-wrap items-center justify-center gap-3 delay-200 lg:justify-start",
            )}
          >
            <Link
              href="/docs"
              className={cn(
                buttonVariants(),
                "shadow-primary/10 h-11 rounded-full px-5 shadow-lg",
              )}
            >
              Get Started
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <GitHubIcon />
              View on GitHub
            </Link>
          </div>

          <ul
            className={cn(
              "home-enter",
              "mt-9 hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium tracking-wide text-fd-muted-foreground delay-300 sm:flex lg:justify-start",
            )}
          >
            {highlights.map((highlight, index) => (
              <li key={highlight} className="flex items-center gap-x-4">
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="size-1 rounded-full bg-fd-muted-foreground/45"
                  />
                ) : null}
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("home-enter", "relative mx-auto w-full max-w-xl")}>
          <HomeArchitecture />
        </div>
      </div>
    </section>
  );
}

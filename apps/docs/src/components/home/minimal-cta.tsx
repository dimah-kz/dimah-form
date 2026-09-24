import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function MinimalCta() {
  return (
    <section
      aria-labelledby="closing-cta-title"
      className="border-t border-fd-border/80 py-16 text-center sm:py-20"
    >
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[0.7rem] font-medium tracking-[0.14em] text-fd-muted-foreground uppercase">
          Ready when your forms get real
        </p>
        <h2
          id="closing-cta-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
        >
          Keep the protocol. Own the experience.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          One protocol across Next.js, Hono, Express, Fastify, Elysia, and
          SvelteKit.
        </p>

        <Link
          href="/docs/integration"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-7 h-10 px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring",
          )}
        >
          Explore integrations
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function MinimalCta() {
  return (
    <section
      aria-labelledby="closing-cta-title"
      className="border-t border-fd-border/80 py-16 text-center sm:py-20"
    >
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-muted-foreground uppercase">
          Start with one form
        </p>
        <h2
          id="closing-cta-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
        >
          Build the first response flow.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          Use in-memory persistence locally, then add your guard and durable
          database adapter before production.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/quickstart"
            className={buttonVariants({
              className: "h-10 px-5 text-sm font-medium",
            })}
          >
            Open the quickstart
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
          <Link
            href="/docs/integration"
            className={buttonVariants({
              variant: "outline",
              className: "h-10 px-5 text-sm font-medium",
            })}
          >
            Choose a runtime
          </Link>
        </div>
      </div>
    </section>
  );
}

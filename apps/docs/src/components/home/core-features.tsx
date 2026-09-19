import { Code2, Palette, ShieldCheck } from "lucide-react";

export function CoreFeatures() {
  return (
    <section
      aria-labelledby="features-title"
      className="relative py-16 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-title"
          className="text-2xl font-bold tracking-tight text-fd-foreground sm:text-3xl"
        >
          Why dimah-form?
        </h2>
        <p className="mt-2.5 text-sm text-fd-muted-foreground sm:text-base">
          Built for teams that need robust backend lifecycle without sacrificing
          UI freedom.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-fd-border/70 bg-fd-card/40 p-6 backdrop-blur-sm transition-all hover:border-fd-foreground/25 hover:bg-fd-card/70">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-fd-border/80 bg-fd-background text-fd-primary shadow-xs">
                <ShieldCheck className="size-5" />
              </div>
              <span className="rounded-full border border-fd-border bg-fd-muted/50 px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                Zero Schema Drift
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-fd-foreground sm:text-lg">
              Snapshot Isolation
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground sm:text-sm">
              Every response session freezes the form definition at start.
              Updates to the live questionnaire never break active drafts or
              submissions.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-fd-border/70 bg-fd-card/40 p-6 backdrop-blur-sm transition-all hover:border-fd-foreground/25 hover:bg-fd-card/70">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-fd-border/80 bg-fd-background text-fd-primary shadow-xs">
                <Palette className="size-5" />
              </div>
              <span className="rounded-full border border-fd-border bg-fd-muted/50 px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                You Own the UI
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-fd-foreground sm:text-lg">
              100% Headless UI
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground sm:text-sm">
              Zero forced widgets or CSS opinions. Seamlessly bind your own
              Tailwind, shadcn/ui, Radix, or custom components.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-fd-border/70 bg-fd-card/40 p-6 backdrop-blur-sm transition-all hover:border-fd-foreground/25 hover:bg-fd-card/70">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-fd-border/80 bg-fd-background text-fd-primary shadow-xs">
                <Code2 className="size-5" />
              </div>
              <span className="rounded-full border border-fd-border bg-fd-muted/50 px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                Zero Codegen
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-fd-foreground sm:text-lg">
              Type-Safe Protocol
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground sm:text-sm">
              Export server types directly to the client. Enjoy full
              autocompletion and compile-time validation without CLI generation
              steps.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

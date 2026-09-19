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
          Engineered for reliable form lifecycles
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          Robust backend guarantees for multi-step questionnaires, surveys, and
          onboarding flows without sacrificing UI freedom.
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
              <span className="rounded-full border border-fd-border bg-fd-muted/50 px-2.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                Zero Schema Drift
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-fd-foreground sm:text-lg">
              Snapshot Isolation
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground sm:text-sm">
              Every response session captures an immutable definition snapshot
              at initialization. Live form updates never corrupt in-progress
              drafts or past submissions.
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
              <span className="rounded-full border border-fd-border bg-fd-muted/50 px-2.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                Headless first
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-fd-foreground sm:text-lg">
              Headless React
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground sm:text-sm">
              Bind{" "}
              <code className="font-mono text-[0.8em]">FormFieldBinding</code>{" "}
              yourself, or opt into optional{" "}
              <code className="font-mono text-[0.8em]">@dimah-form/ui</code>.
              The fill session never owns widgets.
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
              <span className="rounded-full border border-fd-border bg-fd-muted/50 px-2.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                Pure TypeScript
              </span>
            </div>

            <h3 className="mt-5 text-base font-semibold text-fd-foreground sm:text-lg">
              End-to-End Type Safety
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground sm:text-sm">
              Export server form types directly to your client via{" "}
              <code className="font-mono font-medium text-fd-foreground">
                $Infer
              </code>
              . Enjoy complete autocomplete, dynamic field checking, and
              validation without codegen steps.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

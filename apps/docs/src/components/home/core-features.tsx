import { Code2, Database, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    kicker: "Snapshot-safe",
    title: "The definition stays put",
    body: "Live-form edits never rewrite a draft or submitted response.",
  },
  {
    icon: Database,
    kicker: "Headless session",
    title: "Your components, your flow",
    body: "Hooks handle visibility, drafts, and submit state. Bring your own components or add the UI package.",
  },
  {
    icon: Code2,
    kicker: "Typed protocol",
    title: "One source of truth",
    body: "Field types flow server-to-client through $Infer—no codegen or duplicate schemas.",
  },
] as const;

export function CoreFeatures() {
  return (
    <section
      aria-labelledby="features-title"
      className="relative py-16 sm:py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[0.7rem] font-medium tracking-[0.14em] text-fd-muted-foreground uppercase">
          Built for forms with a lifecycle
        </p>
        <h2
          id="features-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
        >
          Every response keeps its definition.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          The protocol stays stable. The UI, auth, and persistence stay yours.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-2xl border border-fd-border/80 bg-fd-card/80 shadow-sm">
        <div className="grid divide-y divide-fd-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="p-6 sm:p-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="font-mono text-[0.7rem] text-fd-muted-foreground">
                    {feature.kicker}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  {feature.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

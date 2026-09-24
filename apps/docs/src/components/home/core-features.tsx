import { Code2, Database, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    kicker: "snapshot",
    title: "Definition snapshot",
    body: "Starting a response copies the active form into response.definition. Later edits do not change that draft or submission.",
  },
  {
    icon: Database,
    kicker: "session",
    title: "Headless fill session",
    body: "useFormResponse tracks visible fields, drafts, and submit. Bind the fields yourself, or render them with optional @dimah-form/ui.",
  },
  {
    icon: Code2,
    kicker: "$Infer",
    title: "Typed protocol",
    body: "The server instance is the source of truth. Field types reach the client through $Infer. There is no codegen step.",
  },
] as const;

export function CoreFeatures() {
  return (
    <section
      aria-labelledby="features-title"
      className="relative py-16 sm:py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="features-title"
          className="text-2xl font-semibold tracking-tight text-fd-foreground sm:text-3xl"
        >
          One response, one definition
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          Submit validates the snapshot stored on the response, not the live
          questionnaire.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.title}
              className="flex flex-col rounded-xl border bg-fd-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="font-mono text-xs text-fd-muted-foreground">
                  {feature.kicker}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-fd-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                {feature.body}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

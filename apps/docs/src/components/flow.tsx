import { cn } from "@/lib/cn";

export type FlowKind = "client" | "server" | "data" | "protocol";

export type FlowStep = {
  name: string;
  kind?: FlowKind;
  note?: string;
};

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn(
        "size-4 shrink-0 self-center text-fd-muted-foreground/45",
        "my-1 rotate-90 sm:mx-1 sm:my-0 sm:rotate-0 sm:rtl:rotate-180",
        className,
      )}
    >
      <path
        d="M4 12h14M14 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flow({
  steps,
  label = "Flow",
}: {
  steps: FlowStep[];
  label?: string;
}) {
  return (
    <figure className="not-prose my-6 rounded-xl border bg-fd-muted/40 p-4">
      <figcaption className="mb-3 text-xs font-medium text-fd-muted-foreground">
        {label}
      </figcaption>
      <ol
        aria-label={label}
        className="m-0 flex list-none flex-col items-stretch gap-0 p-0 sm:flex-row sm:items-center"
      >
        {steps.map((step, index) => {
          const kind = step.kind ?? "protocol";
          const accent = kind === "protocol" || kind === "server";
          const isLast = index === steps.length - 1;

          return (
            <li
              key={`${step.name}-${index}`}
              className="flex min-w-0 flex-1 flex-col items-stretch sm:flex-row sm:items-center"
            >
              <div
                className={cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col justify-center gap-1 rounded-lg px-3.5 py-3 ring-1 ring-fd-foreground/8",
                  accent ? "bg-fd-primary/12" : "bg-fd-card",
                )}
              >
                <span
                  className={cn(
                    "text-sm leading-tight",
                    accent
                      ? "font-mono text-fd-foreground"
                      : "font-medium text-fd-foreground",
                  )}
                >
                  {step.name}
                </span>
                <span className="text-[11px] leading-tight text-fd-muted-foreground">
                  {step.note ?? kind}
                </span>
              </div>
              {isLast ? null : <Arrow />}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

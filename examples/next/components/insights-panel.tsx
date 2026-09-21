import type { InsightsSummary } from "@dimah-form/insights";
import { parseScoringFieldMeta } from "@dimah-form/scoring";

import { scoreLabel, scoreShare } from "@/lib/format";
import { cn } from "@/lib/utils";

export function insightsWithoutScoredFields(
  summary: InsightsSummary,
  fields: readonly { id: string; meta?: unknown }[],
): InsightsSummary {
  const scored = new Set(
    fields
      .filter((field) => parseScoringFieldMeta(field.meta))
      .map((field) => field.id),
  );
  if (scored.size === 0) return summary;
  return {
    ...summary,
    fields: summary.fields.filter((field) => !scored.has(field.id)),
  };
}

function CountBar({
  label,
  n,
  total,
}: {
  label: string;
  n: number;
  total: number;
}) {
  const share = total > 0 ? n / total : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">{n}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70 transition-[width] duration-300"
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function StatusCounts({ summary }: { summary: InsightsSummary }) {
  const items = [
    { label: "Draft", n: summary.byStatus.draft },
    { label: "Submitted", n: summary.byStatus.submitted },
    { label: "Abandoned", n: summary.byStatus.abandoned },
  ];
  return (
    <dl className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="text-2xl font-medium tracking-tight tabular-nums">
            {item.n}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function InsightsPanel({
  summary,
  className,
}: {
  summary: InsightsSummary;
  className?: string;
}) {
  const fields = summary.fields.filter(
    (field) => (field.values?.length ?? 0) > 0,
  );
  const scores = summary.scores?.variables ?? [];

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {scores.map((variable) => {
        const bands = variable.bands ?? [];
        const meanLabel = scoreLabel(
          variable.mean == null ? null : Number(variable.mean.toFixed(1)),
          variable.max,
        );
        return (
          <section key={variable.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium">
                {variable.label ?? variable.id}
              </h2>
              <p className="text-sm text-muted-foreground">
                {meanLabel
                  ? `Mean ${meanLabel} · ${variable.complete} complete`
                  : `${variable.complete} complete`}
              </p>
            </div>
            {variable.max != null && variable.mean != null ? (
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{
                    width: `${Math.round(scoreShare(variable.mean, variable.max) * 100)}%`,
                  }}
                />
              </div>
            ) : null}
            {bands.length > 0 ? (
              <div className="flex flex-col gap-3">
                {bands.map((band) => (
                  <CountBar
                    key={band.label}
                    label={band.label}
                    n={band.n}
                    total={variable.n}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
      {fields.map((field) => (
        <section key={field.id} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">{field.label}</h2>
            <p className="text-sm text-muted-foreground">
              {field.n} answered
              {field.unanswered > 0 ? ` · ${field.unanswered} skipped` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {(field.values ?? []).map((item) => (
              <CountBar
                key={item.value}
                label={item.label ?? item.value}
                n={item.n}
                total={field.n}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

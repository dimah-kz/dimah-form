"use client";

import type { FormAnswers, FormSnapshot } from "@dimah-form/react";
import {
  hasScoringMeta,
  scoreResponse,
  type ScoreResult,
  type ScoreVariableResult,
} from "@dimah-form/scoring/client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { scoreLabel, scoreShare } from "@/lib/format";
import { cn } from "@/lib/utils";

function variableEntries(scores: ScoreResult) {
  return Object.entries(scores.variables);
}

function ScoreMeter({ variable }: { variable: ScoreVariableResult }) {
  const max = variable.max;
  const share = scoreShare(variable.raw, max);
  const total = scoreLabel(variable.raw, max);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <p className="text-3xl font-medium tracking-tight tabular-nums">
          {total ?? "—"}
        </p>
        {variable.band ? (
          <Badge variant="secondary">{variable.band}</Badge>
        ) : null}
      </div>
      {max != null && max > 0 ? (
        <Progress value={Math.round(share * 100)} max={100} className="gap-0" />
      ) : null}
      {variable.complete ? null : (
        <p className="text-sm text-muted-foreground">
          {variable.missing === 0
            ? "No visible items to score"
            : variable.missing === 1
              ? "1 scored item left"
              : `${variable.missing} scored items left`}
        </p>
      )}
    </div>
  );
}

export function ScoresPreview({
  form,
  answers,
  className,
}: {
  form: FormSnapshot;
  answers: FormAnswers;
  className?: string;
}) {
  if (!hasScoringMeta(form)) return null;

  let scores: ScoreResult;
  try {
    scores = scoreResponse(form, answers);
  } catch {
    return null;
  }

  const entries = variableEntries(scores);
  if (entries.length === 0) return null;

  return (
    <aside className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Score</p>
        <p className="text-sm text-muted-foreground">
          Derived from the snapshot. Not stored in answers.
        </p>
      </div>
      {entries.map(([id, variable]) => (
        <div key={id} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {variable.label ?? id}
          </p>
          <ScoreMeter variable={variable} />
        </div>
      ))}
    </aside>
  );
}

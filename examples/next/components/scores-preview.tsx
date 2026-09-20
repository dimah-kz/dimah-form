"use client";

import type { FormAnswers, FormSnapshot } from "@dimah-form/react";
import {
  hasScoringMeta,
  scoreResponse,
  type ScoreResult,
} from "@dimah-form/scoring/client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function variableEntries(scores: ScoreResult) {
  return Object.entries(scores.variables);
}

export function ScoresPreview({
  form,
  answers,
}: {
  form: FormSnapshot;
  answers: FormAnswers;
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
    <Card size="sm">
      <CardHeader>
        <CardTitle>Score</CardTitle>
        <CardDescription>
          Computed from this response snapshot — not stored in answers
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {entries.map(([id, variable]) => {
          const name = variable.label ?? id;
          const total =
            variable.max != null
              ? `${variable.raw} / ${variable.max}`
              : String(variable.raw);
          return (
            <div key={id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{name}</p>
                {variable.band ? (
                  <Badge variant="secondary">{variable.band}</Badge>
                ) : null}
              </div>
              {variable.complete ? (
                <p className="text-2xl font-medium tabular-nums">{total}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {variable.missing === 1
                    ? "1 item left to score"
                    : `${variable.missing} items left to score`}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

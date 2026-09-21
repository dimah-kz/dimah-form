import type { FormAnswers, FormSnapshot } from "@dimah-form/core";

type ScoreVariable = {
  raw: number | null;
  band?: string;
  complete: boolean;
  label?: string;
};

export type InsightsScores = {
  variables: Record<string, ScoreVariable>;
};

type ScoringApi = {
  hasScoringMeta: (definition: { meta?: unknown }) => boolean;
  scoreResponse: (
    definition: FormSnapshot,
    answers: FormAnswers,
  ) => InsightsScores;
};

async function loadScoring(): Promise<ScoringApi | undefined> {
  try {
    return (await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      "@dimah-form/scoring"
    )) as ScoringApi;
  } catch {
    return undefined;
  }
}

export async function tryScoreResponse(
  definition: FormSnapshot,
  answers: FormAnswers,
): Promise<InsightsScores | undefined> {
  const scoring = await loadScoring();
  if (!scoring?.hasScoringMeta(definition)) return undefined;
  return scoring.scoreResponse(definition, answers);
}

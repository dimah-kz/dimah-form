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

let scoringModule: Promise<ScoringApi | undefined> | undefined;

function loadScoring(): Promise<ScoringApi | undefined> {
  if (!scoringModule) {
    scoringModule = import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      "@dimah-form/scoring"
    )
      .then((mod) => mod as ScoringApi)
      .catch(() => undefined);
  }
  return scoringModule;
}

export async function tryScoreResponse(
  definition: FormSnapshot,
  answers: FormAnswers,
): Promise<InsightsScores | undefined> {
  try {
    const scoring = await loadScoring();
    if (!scoring?.hasScoringMeta(definition)) return undefined;
    return scoring.scoreResponse(definition, answers);
  } catch {
    return undefined;
  }
}

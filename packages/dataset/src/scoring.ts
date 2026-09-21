import type { FormAnswers, FormSnapshot } from "@dimah-form/core";

import type { DatasetScores } from "./spec";

type ScoringApi = {
  hasScoringMeta: (definition: { meta?: unknown }) => boolean;
  scoreResponse: (
    definition: FormSnapshot,
    answers: FormAnswers,
  ) => DatasetScores;
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

/**
 * Attach scores when `@dimah-form/scoring` is installed and the snapshot
 * owns `meta.scoring`. Missing package → `undefined` (no throw).
 */
export async function tryScoreResponse(
  definition: FormSnapshot,
  answers: FormAnswers,
): Promise<DatasetScores | undefined> {
  const scoring = await loadScoring();
  if (!scoring?.hasScoringMeta(definition)) return undefined;
  return scoring.scoreResponse(definition, answers);
}

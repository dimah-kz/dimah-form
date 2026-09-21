import type { FormAnswers, FormSnapshot } from "@dimah-form/core";

import type { DatasetScores } from "./spec";

type ScoringApi = {
  hasScoringMeta: (definition: { meta?: unknown }) => boolean;
  scoreResponse: (
    definition: FormSnapshot,
    answers: FormAnswers,
  ) => DatasetScores;
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

/**
 * Attach scores when `@dimah-form/scoring` is installed and the snapshot
 * owns `meta.scoring`. Missing package or a bad historical snapshot →
 * `undefined` (no throw).
 */
export async function tryScoreResponse(
  definition: FormSnapshot,
  answers: FormAnswers,
): Promise<DatasetScores | undefined> {
  try {
    const scoring = await loadScoring();
    if (!scoring?.hasScoringMeta(definition)) return undefined;
    return scoring.scoreResponse(definition, answers);
  } catch {
    return undefined;
  }
}

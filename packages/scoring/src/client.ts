import { defineClientPlugin } from "@dimah-form/core";

import { SCORING_ERROR_CODES } from "./errors";
import { SCORING_NAMESPACE, type ScoringMeta } from "./meta";
import { SCORING_ROUTES } from "./routes";
import type { ScoreResult } from "./score";

export {
  collectScoringIssues,
  hasScoringMeta,
  reversePoints,
  scoreResponse,
  scoringIssuesOrUndefined,
  tryScoreResponse,
  scoreResultSchema,
  scoreVariableResultSchema,
  type ScoreDefinition,
  type ScoreResult,
  type ScoreVariableResult,
} from "./score";
export {
  parseScoringFieldMeta,
  parseScoringFormMeta,
  parseScoringOptionMeta,
  readScoringFieldMeta,
  readScoringFormMeta,
  scoringAddSchema,
  scoringBandSchema,
  scoringFieldMetaSchema,
  scoringFormMetaSchema,
  scoringFormulaSchema,
  scoringMetaSchema,
  scoringMissingSchema,
  scoringOptionMetaSchema,
  scoringVariableSchema,
  DEFAULT_SCORING_MISSING,
  SCORING_NAMESPACE,
  type ScoringBand,
  type ScoringFieldMeta,
  type ScoringFieldRead,
  type ScoringFormMeta,
  type ScoringFormRead,
  type ScoringFormula,
  type ScoringInnerMeta,
  type ScoringAdd,
  type ScoringMeta,
  type ScoringMissing,
  type ScoringOptionMeta,
  type ScoringVariable,
} from "./meta";
export { SCORING_ERROR_CODES, type ScoringErrorCode } from "./errors";
export { SCORING_ROUTES } from "./routes";

/**
 * Browser companion. Same id `"scoring"`. Use {@link scoreResponse} for
 * live preview without forking `useFormResponse`.
 */
export function scoringClientPlugin() {
  return defineClientPlugin({
    id: SCORING_NAMESPACE,
    $ERROR_CODES: SCORING_ERROR_CODES,
    $Meta: {} as ScoringMeta,
    endpoints: ({ $fetch }) => ({
      getResponseScores: (payload: {
        responseId: string;
        headers?: HeadersInit;
      }) =>
        $fetch<ScoreResult>(SCORING_ROUTES.getResponseScores.path, {
          method: "GET",
          query: { responseId: payload.responseId },
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
    }),
  });
}

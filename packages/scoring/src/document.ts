/**
 * Isomorphic scoring document. No server plugin, so dataset and insights
 * can import it from browser bundles.
 */
export {
  collectScoringIssues,
  hasScoringMeta,
  reversePoints,
  scoreResponse,
  scoringIssuesOrUndefined,
  scoreResultSchema,
  scoreVariableResultSchema,
  tryScoreResponse,
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
  type ScoringAdd,
  type ScoringBand,
  type ScoringFieldMeta,
  type ScoringFieldRead,
  type ScoringFormMeta,
  type ScoringFormRead,
  type ScoringFormula,
  type ScoringInnerMeta,
  type ScoringMeta,
  type ScoringMissing,
  type ScoringOptionMeta,
  type ScoringVariable,
} from "./meta";
export { SCORING_ERROR_CODES, type ScoringErrorCode } from "./errors";

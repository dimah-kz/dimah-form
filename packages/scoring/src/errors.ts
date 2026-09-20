import { defineErrorCodes } from "@dimah-form/core";

export const SCORING_ERROR_CODES = defineErrorCodes({
  SCORING_INVALID_META: "Invalid scoring configuration",
  SCORING_FORM_REQUIRED: "Field scoring requires form meta.scoring",
  SCORING_UNKNOWN_VARIABLE: "Unknown scoring variable",
  SCORING_DUPLICATE_VARIABLE: "Duplicate scoring variable id",
  SCORING_DUPLICATE_FORMULA: "Duplicate scoring formula id",
  SCORING_UNSUPPORTED_TYPE: "This field type cannot contribute to a score",
  SCORING_MISSING_POINTS: "Scored option is missing points",
  SCORING_OPTION_ADD_MIX:
    "Field scoring.variable cannot mix with option scoring.add",
  SCORING_OPTION_POINTS_NEED_VARIABLE:
    "Option scoring.points requires field scoring.variable",
  SCORING_REVERSE_RANGE: "Reverse scoring needs a point range",
  SCORING_UNKNOWN_BAND_VARIABLE: "Band references an unknown scoring variable",
  SCORING_FORMULA_UNKNOWN_VAR: "Formula references an unknown scoring variable",
  SCORING_INVALID_BAND: "Scoring band from must be <= to",
});

export type ScoringErrorCode = keyof typeof SCORING_ERROR_CODES;

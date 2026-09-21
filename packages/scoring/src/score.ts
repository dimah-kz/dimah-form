import {
  APIError,
  isAPIError,
  isFieldVisible,
  type FormAnswers,
  type FormField,
  type ValidationIssue,
} from "@dimah-form/core";
import * as z from "zod";

import { SCORING_ERROR_CODES, type ScoringErrorCode } from "./errors";
import {
  DEFAULT_SCORING_MISSING,
  optionHasAdd,
  optionHasPoints,
  parseScoringFieldMeta,
  parseScoringFormMeta,
  parseScoringOptionMeta,
  scoringMetaTarget,
  type ScoringAdd,
  type ScoringBand,
  type ScoringFieldMeta,
  type ScoringFormMeta,
  type ScoringFormula,
  type ScoringMissing,
  type ScoringOptionMeta,
  type ScoringVariable,
} from "./meta";

const SCOREABLE_TYPES = new Set(["select", "multiSelect", "number", "boolean"]);

export type ScoreDefinition = {
  meta?: unknown;
  fields: readonly FormField[];
};

export type ScoreVariableResult = {
  raw: number | null;
  min?: number;
  max?: number;
  missing: number;
  band?: string;
  complete: boolean;
  label?: string;
};

export type ScoreResult = {
  variables: Record<string, ScoreVariableResult>;
  complete: boolean;
};

export const scoreVariableResultSchema = z.object({
  raw: z.number().nullable(),
  min: z.number().optional(),
  max: z.number().optional(),
  missing: z.number().int().nonnegative(),
  band: z.string().optional(),
  complete: z.boolean(),
  label: z.string().optional(),
});

export const scoreResultSchema = z.object({
  variables: z.record(z.string(), scoreVariableResultSchema),
  complete: z.boolean(),
});

type SelectLikeOption = {
  value: string;
  scoring: ScoringOptionMeta | undefined;
  scoringPresent: boolean;
};

type ScoreBucket = { sum: number; answered: number; missing: number };

function scoringIssue(
  field: string,
  code: ScoringErrorCode,
  params?: Record<string, string | number>,
): ValidationIssue {
  const entry = SCORING_ERROR_CODES[code];
  return {
    field,
    code: entry.code,
    message: entry.message,
    ...(params ? { params } : {}),
  };
}

function optionList(field: FormField): SelectLikeOption[] {
  const options = field.options;
  if (!Array.isArray(options)) return [];
  const list: SelectLikeOption[] = [];
  for (const option of options) {
    if (!option || typeof option !== "object" || Array.isArray(option))
      continue;
    const record = option as { value?: unknown; meta?: unknown };
    if (typeof record.value !== "string") continue;
    list.push({
      value: record.value,
      scoring: parseScoringOptionMeta(record.meta),
      scoringPresent: scoringMetaTarget(record.meta).present,
    });
  }
  return list;
}

function optionHasScoringMeta(field: FormField): boolean {
  const options = field.options;
  if (!Array.isArray(options)) return false;
  for (const option of options) {
    if (!option || typeof option !== "object" || Array.isArray(option))
      continue;
    if (scoringMetaTarget((option as { meta?: unknown }).meta).present) {
      return true;
    }
  }
  return false;
}

function optionPointRange(
  options: readonly SelectLikeOption[],
): { min: number; max: number } | undefined {
  const points = options
    .map((option) =>
      optionHasPoints(option.scoring) ? option.scoring.points : undefined,
    )
    .filter(
      (value): value is number => value != null && Number.isFinite(value),
    );
  if (points.length === 0) return undefined;
  return { min: Math.min(...points), max: Math.max(...points) };
}

function finiteNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** Likert reverse range for a `number` field: `field.min ?? 0` and `field.max`. */
function numberFieldRange(
  field: FormField,
): { min: number; max: number } | undefined {
  const max = finiteNumberValue(field.max);
  if (max == null) return undefined;
  const min = finiteNumberValue(field.min) ?? 0;
  if (min > max) return undefined;
  return { min, max };
}

/**
 * Reverse scoring: `min + max - points`. Likert `option.points` only —
 * `option.add` is never reversed.
 *
 * - select: min/max are that field's option `meta.scoring.points`.
 * - number: min is `field.min ?? 0`, max is `field.max` (required).
 * - boolean: `1 - value` (true → 0, false → 1).
 * - multiSelect: not supported (`SCORING_REVERSE_MULTISELECT`).
 */
export function reversePoints(
  points: number,
  range: { min: number; max: number },
): number {
  return range.min + range.max - points;
}

function isUnanswered(field: FormField, value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (
    field.type === "select" &&
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return true;
  }
  return false;
}

function variableById(
  variables: readonly ScoringVariable[],
): Map<string, ScoringVariable> {
  return new Map(variables.map((variable) => [variable.id, variable]));
}

function collectSelectOptionIssues(
  field: FormField,
  fieldMeta: ScoringFieldMeta | undefined,
  options: readonly SelectLikeOption[],
  knownVariables: Map<string, ScoringVariable>,
  issues: ValidationIssue[],
) {
  if (fieldMeta && options.length === 0) {
    issues.push(
      scoringIssue(field.id, "SCORING_MISSING_POINTS", {
        field: field.id,
      }),
    );
  }
  for (const option of options) {
    const path = `${field.id}.${option.value}`;
    if (option.scoringPresent && !option.scoring) {
      issues.push(scoringIssue(path, "SCORING_INVALID_META"));
      continue;
    }
    if (optionHasAdd(option.scoring)) {
      if (fieldMeta) {
        issues.push(
          scoringIssue(path, "SCORING_OPTION_ADD_MIX", {
            field: field.id,
            option: option.value,
          }),
        );
      }
      for (const row of option.scoring.add) {
        if (!knownVariables.has(row.variable)) {
          issues.push(
            scoringIssue(path, "SCORING_UNKNOWN_VARIABLE", {
              field: field.id,
              option: option.value,
              variable: row.variable,
            }),
          );
        }
      }
      continue;
    }
    if (optionHasPoints(option.scoring)) {
      if (!fieldMeta) {
        issues.push(
          scoringIssue(path, "SCORING_OPTION_POINTS_NEED_VARIABLE", {
            field: field.id,
            option: option.value,
          }),
        );
      }
      continue;
    }
    if (fieldMeta) {
      issues.push(
        scoringIssue(path, "SCORING_MISSING_POINTS", {
          field: field.id,
          option: option.value,
        }),
      );
    }
  }
  if (fieldMeta?.reverse) {
    if (field.type === "multiSelect") {
      issues.push(scoringIssue(field.id, "SCORING_REVERSE_MULTISELECT"));
    } else if (optionPointRange(options) == null) {
      issues.push(scoringIssue(field.id, "SCORING_REVERSE_RANGE"));
    }
  }
}

/**
 * Mapping / config issues. Empty when `meta.scoring` is absent and no field
 * or option uses the namespace (no-op). Does not look at answers.
 */
export function collectScoringIssues(
  definition: ScoreDefinition,
): ValidationIssue[] {
  const formMeta = parseScoringFormMeta(definition.meta);
  if (!formMeta.present) {
    const issues: ValidationIssue[] = [];
    for (const field of definition.fields) {
      if (
        scoringMetaTarget(field.meta).present ||
        optionHasScoringMeta(field)
      ) {
        issues.push(scoringIssue(field.id, "SCORING_FORM_REQUIRED"));
      }
    }
    return issues;
  }
  if (!formMeta.ok) {
    return [scoringIssue("meta.scoring", "SCORING_INVALID_META")];
  }

  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  for (const variable of formMeta.value.variables) {
    if (ids.has(variable.id)) {
      issues.push(
        scoringIssue("meta.scoring", "SCORING_DUPLICATE_VARIABLE", {
          variable: variable.id,
        }),
      );
      continue;
    }
    ids.add(variable.id);
  }

  const knownVariables = variableById(formMeta.value.variables);

  for (const formula of formMeta.value.formulas ?? []) {
    if (ids.has(formula.id)) {
      issues.push(
        scoringIssue("meta.scoring", "SCORING_DUPLICATE_FORMULA", {
          formula: formula.id,
        }),
      );
    } else {
      ids.add(formula.id);
    }
    const seenVars = new Set<string>();
    for (const varId of formula.vars) {
      if (seenVars.has(varId)) {
        issues.push(
          scoringIssue("meta.scoring", "SCORING_FORMULA_DUPLICATE_VAR", {
            formula: formula.id,
            variable: varId,
          }),
        );
      } else {
        seenVars.add(varId);
      }
      if (!knownVariables.has(varId)) {
        issues.push(
          scoringIssue("meta.scoring", "SCORING_FORMULA_UNKNOWN_VAR", {
            formula: formula.id,
            variable: varId,
          }),
        );
      }
    }
  }

  for (const band of formMeta.value.bands ?? []) {
    if (band.from != null && band.to != null && band.from > band.to) {
      issues.push(
        scoringIssue("meta.scoring", "SCORING_INVALID_BAND", {
          variable: band.variable,
        }),
      );
    }
    if (!ids.has(band.variable)) {
      issues.push(
        scoringIssue("meta.scoring", "SCORING_UNKNOWN_BAND_VARIABLE", {
          variable: band.variable,
        }),
      );
    }
  }

  const referenced = new Set<string>();

  for (const field of definition.fields) {
    const fieldTarget = scoringMetaTarget(field.meta);
    const fieldMeta = fieldTarget.present
      ? parseScoringFieldMeta(field.meta)
      : undefined;
    if (fieldTarget.present && !fieldMeta) {
      issues.push(scoringIssue(field.id, "SCORING_INVALID_META"));
      continue;
    }

    const options = optionList(field);
    const hasOptionScoring = options.some((option) => option.scoringPresent);
    if (!fieldMeta && !hasOptionScoring) continue;

    if (fieldMeta) referenced.add(fieldMeta.variable);
    for (const option of options) {
      if (!optionHasAdd(option.scoring)) continue;
      for (const row of option.scoring.add) referenced.add(row.variable);
    }

    if (fieldMeta && !knownVariables.has(fieldMeta.variable)) {
      issues.push(
        scoringIssue(field.id, "SCORING_UNKNOWN_VARIABLE", {
          variable: fieldMeta.variable,
        }),
      );
    }
    if (!SCOREABLE_TYPES.has(field.type)) {
      issues.push(
        scoringIssue(field.id, "SCORING_UNSUPPORTED_TYPE", {
          type: field.type,
        }),
      );
      continue;
    }

    if (field.type === "select" || field.type === "multiSelect") {
      collectSelectOptionIssues(
        field,
        fieldMeta,
        options,
        knownVariables,
        issues,
      );
      continue;
    }

    if (
      field.type === "number" &&
      fieldMeta?.reverse &&
      !numberFieldRange(field)
    ) {
      issues.push(
        scoringIssue(field.id, "SCORING_REVERSE_RANGE", {
          variable: fieldMeta.variable,
        }),
      );
    } else if (!fieldMeta && hasOptionScoring) {
      issues.push(
        scoringIssue(field.id, "SCORING_UNSUPPORTED_TYPE", {
          type: field.type,
        }),
      );
    }
  }

  for (const id of knownVariables.keys()) {
    if (!referenced.has(id)) {
      issues.push(
        scoringIssue("meta.scoring", "SCORING_UNUSED_VARIABLE", {
          variable: id,
        }),
      );
    }
  }

  return issues;
}

export function scoringIssuesOrUndefined(
  definition: ScoreDefinition,
): ValidationIssue[] | undefined {
  const issues = collectScoringIssues(definition);
  return issues.length > 0 ? issues : undefined;
}

/** True when the form document owns `meta.scoring` (even if the value is invalid). */
export function hasScoringMeta(definition: { meta?: unknown }): boolean {
  return scoringMetaTarget(definition.meta).present;
}

/**
 * Score a snapshot when `meta.scoring` is present. Mapping issues
 * (`APIError`) omit the score so a bad historical row can still export.
 * Any other throw propagates.
 */
/**
 * {@link scoreResponse} when the snapshot can be scored.
 * No `meta.scoring`, or a scoring {@link APIError} on a historical snapshot,
 * returns `undefined`. Any other throw propagates.
 */
export function tryScoreResponse(
  definition: ScoreDefinition,
  answers: FormAnswers,
): ScoreResult | undefined {
  if (!hasScoringMeta(definition)) return undefined;
  try {
    return scoreResponse(definition, answers);
  } catch (error) {
    if (isAPIError(error)) return undefined;
    throw error;
  }
}

function throwScoring(issues: ValidationIssue[]): never {
  const first =
    issues[0] ?? scoringIssue("meta.scoring", "SCORING_INVALID_META");
  throw APIError.from("BAD_REQUEST", {
    code: first.code ?? SCORING_ERROR_CODES.SCORING_INVALID_META.code,
    message: first.message,
    issues,
  });
}

function matchBand(
  bands: readonly ScoringBand[] | undefined,
  variableId: string,
  raw: number | null,
): string | undefined {
  if (raw == null || !bands) return undefined;
  for (const band of bands) {
    if (band.variable !== variableId) continue;
    const from = band.from ?? Number.NEGATIVE_INFINITY;
    const to = band.to ?? Number.POSITIVE_INFINITY;
    if (raw >= from && raw <= to) return band.label;
  }
  return undefined;
}

function variableResult(
  raw: number | null,
  missing: number,
  variable: { min?: number; max?: number; label?: string },
  band?: string,
): ScoreVariableResult {
  return {
    raw,
    missing,
    complete: raw !== null,
    ...(variable.min !== undefined ? { min: variable.min } : {}),
    ...(variable.max !== undefined ? { max: variable.max } : {}),
    ...(variable.label !== undefined ? { label: variable.label } : {}),
    ...(band !== undefined ? { band } : {}),
  };
}

function contributeSelect(
  field: FormField,
  value: unknown,
  fieldMeta: ScoringFieldMeta,
): number | "missing" {
  if (typeof value !== "string") return "missing";
  const options = optionList(field);
  const option = options.find((item) => item.value === value);
  if (!option || !optionHasPoints(option.scoring)) {
    return "missing";
  }
  if (!fieldMeta.reverse) return option.scoring.points;
  const range = optionPointRange(options);
  if (!range) return "missing";
  return reversePoints(option.scoring.points, range);
}

function contributeMultiSelect(
  field: FormField,
  value: unknown,
): number | "missing" {
  if (!Array.isArray(value)) return "missing";
  const options = optionList(field);
  let sum = 0;
  for (const selected of value) {
    if (typeof selected !== "string") continue;
    const option = options.find((item) => item.value === selected);
    if (!option || !optionHasPoints(option.scoring)) {
      continue;
    }
    sum += option.scoring.points;
  }
  return sum;
}

function contributeNumber(
  field: FormField,
  value: unknown,
  fieldMeta: ScoringFieldMeta,
): number | "missing" {
  if (typeof value !== "number" || !Number.isFinite(value)) return "missing";
  if (!fieldMeta.reverse) return value;
  const range = numberFieldRange(field);
  if (!range) return "missing";
  return reversePoints(value, range);
}

function contributeBoolean(
  value: unknown,
  fieldMeta: ScoringFieldMeta,
): number | "missing" {
  if (typeof value !== "boolean") return "missing";
  const points = value ? 1 : 0;
  return fieldMeta.reverse ? 1 - points : points;
}

function contribute(
  field: FormField,
  value: unknown,
  fieldMeta: ScoringFieldMeta,
): number | "missing" {
  if (isUnanswered(field, value)) return "missing";
  switch (field.type) {
    case "select":
      return contributeSelect(field, value, fieldMeta);
    case "multiSelect":
      return contributeMultiSelect(field, value);
    case "number":
      return contributeNumber(field, value, fieldMeta);
    case "boolean":
      return contributeBoolean(value, fieldMeta);
    default:
      return "missing";
  }
}

function fieldKeyedVariables(
  fieldMeta: ScoringFieldMeta | undefined,
  options: readonly SelectLikeOption[],
): Set<string> {
  const ids = new Set<string>();
  if (fieldMeta) ids.add(fieldMeta.variable);
  for (const option of options) {
    if (!optionHasAdd(option.scoring)) continue;
    for (const row of option.scoring.add) ids.add(row.variable);
  }
  return ids;
}

function applyToUnion(
  totals: Map<string, ScoreBucket>,
  union: ReadonlySet<string>,
  pointsByVariable: Map<string, number> | "missing",
) {
  for (const id of union) {
    const bucket = totals.get(id);
    if (!bucket) continue;
    if (pointsByVariable === "missing") {
      bucket.missing += 1;
    } else {
      bucket.sum += pointsByVariable.get(id) ?? 0;
      bucket.answered += 1;
    }
  }
}

function mergeAdds(
  into: Map<string, number>,
  add: readonly ScoringAdd[] | undefined,
) {
  if (!add) return;
  for (const row of add) {
    into.set(row.variable, (into.get(row.variable) ?? 0) + row.points);
  }
}

function keyingPoints(
  field: FormField,
  value: unknown,
  options: readonly SelectLikeOption[],
): Map<string, number> | "missing" {
  if (isUnanswered(field, value)) return "missing";
  const points = new Map<string, number>();
  if (field.type === "select") {
    if (typeof value !== "string") return "missing";
    const option = options.find((item) => item.value === value);
    if (!option) return "missing";
    mergeAdds(
      points,
      optionHasAdd(option.scoring) ? option.scoring.add : undefined,
    );
    return points;
  }
  if (field.type === "multiSelect") {
    if (!Array.isArray(value)) return "missing";
    for (const selected of value) {
      if (typeof selected !== "string") continue;
      const option = options.find((item) => item.value === selected);
      if (!option || !optionHasAdd(option.scoring)) continue;
      mergeAdds(points, option.scoring.add);
    }
    return points;
  }
  return "missing";
}

function finishVariable(
  variable: ScoringVariable,
  sum: number,
  answered: number,
  missing: number,
): { raw: number | null; missing: number } {
  const policy: ScoringMissing = variable.missing ?? DEFAULT_SCORING_MISSING;
  if (policy === "incomplete" && (missing > 0 || answered === 0)) {
    return { raw: null, missing };
  }
  if (policy === "omit" && answered === 0) {
    return { raw: null, missing };
  }
  return { raw: sum, missing };
}

function scoreFormula(
  formula: ScoringFormula,
  results: Record<string, ScoreVariableResult>,
): { raw: number | null; missing: number; min?: number; max?: number } {
  const parts: ScoreVariableResult[] = [];
  for (const varId of formula.vars) {
    const source = results[varId];
    if (!source) {
      return { raw: null, missing: 0 };
    }
    parts.push(source);
  }
  const missing = parts.reduce((sum, part) => sum + part.missing, 0);
  if (parts.some((part) => part.raw == null)) {
    return { raw: null, missing };
  }
  let raw = 0;
  let min = 0;
  let max = 0;
  let minOk = true;
  let maxOk = true;
  for (const source of parts) {
    raw += source.raw ?? 0;
    if (source.min === undefined) minOk = false;
    else min += source.min;
    if (source.max === undefined) maxOk = false;
    else max += source.max;
  }
  return {
    raw,
    missing,
    ...(minOk ? { min } : {}),
    ...(maxOk ? { max } : {}),
  };
}

/**
 * Pure isomorphic score. Uses the definition you pass (typically the
 * response snapshot) and stored/preview answers. Hidden `showWhen` fields
 * do not contribute. Mapping issues throw `APIError` (`issues` + a scoring
 * code) — call {@link collectScoringIssues} first if you need a non-throwing
 * check. Forms without `meta.scoring` return an empty result.
 */
export function scoreResponse(
  definition: ScoreDefinition,
  answers: FormAnswers,
): ScoreResult {
  const issues = collectScoringIssues(definition);
  if (issues.length > 0) throwScoring(issues);

  const formMeta = parseScoringFormMeta(definition.meta);
  if (!formMeta.present || !formMeta.ok) {
    return { variables: {}, complete: true };
  }

  const config: ScoringFormMeta = formMeta.value;
  const totals = new Map<
    string,
    { sum: number; answered: number; missing: number }
  >();
  for (const variable of config.variables) {
    totals.set(variable.id, { sum: 0, answered: 0, missing: 0 });
  }

  for (const field of definition.fields) {
    const fieldMeta = parseScoringFieldMeta(field.meta);
    const options = optionList(field);
    const union = fieldKeyedVariables(fieldMeta, options);
    if (union.size === 0) continue;
    if (!isFieldVisible(field, answers, definition.fields)) continue;

    const value = answers[field.id];
    if (fieldMeta) {
      const points = contribute(field, value, fieldMeta);
      applyToUnion(
        totals,
        union,
        points === "missing"
          ? "missing"
          : new Map([[fieldMeta.variable, points]]),
      );
      continue;
    }

    applyToUnion(totals, union, keyingPoints(field, value, options));
  }

  const variables: Record<string, ScoreVariableResult> = {};
  for (const variable of config.variables) {
    const bucket = totals.get(variable.id) ?? {
      sum: 0,
      answered: 0,
      missing: 0,
    };
    const finished = finishVariable(
      variable,
      bucket.sum,
      bucket.answered,
      bucket.missing,
    );
    variables[variable.id] = variableResult(
      finished.raw,
      finished.missing,
      variable,
      matchBand(config.bands, variable.id, finished.raw),
    );
  }

  for (const formula of config.formulas ?? []) {
    const finished = scoreFormula(formula, variables);
    variables[formula.id] = variableResult(
      finished.raw,
      finished.missing,
      { min: finished.min, max: finished.max, label: formula.label },
      matchBand(config.bands, formula.id, finished.raw),
    );
  }

  return {
    variables,
    complete: Object.values(variables).every((item) => item.complete),
  };
}

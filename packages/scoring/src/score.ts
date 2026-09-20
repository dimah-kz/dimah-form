import {
  APIError,
  isFieldVisible,
  type FormAnswers,
  type FormField,
  type ValidationIssue,
} from "@dimah-form/core";
import * as z from "zod";

import { SCORING_ERROR_CODES, type ScoringErrorCode } from "./errors";
import {
  DEFAULT_SCORING_MISSING,
  parseScoringFieldMeta,
  parseScoringFormMeta,
  parseScoringOptionMeta,
  scoringMetaTarget,
  type ScoringBand,
  type ScoringFieldMeta,
  type ScoringFormMeta,
  type ScoringFormula,
  type ScoringMissing,
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
  points: number | undefined;
};

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
      points: parseScoringOptionMeta(record.meta)?.points,
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
    .map((option) => option.points)
    .filter(
      (value): value is number => value != null && Number.isFinite(value),
    );
  if (points.length === 0) return undefined;
  return { min: Math.min(...points), max: Math.max(...points) };
}

/**
 * Reverse scoring: `min + max - points`.
 *
 * - select / multiSelect: min/max are that field's option `meta.scoring.points`.
 * - number: min is `variable.min ?? 0`, max is `variable.max` (required).
 * - boolean: `1 - value` (true → 0, false → 1).
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
    for (const varId of formula.vars) {
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

  for (const field of definition.fields) {
    const fieldTarget = scoringMetaTarget(field.meta);
    if (!fieldTarget.present) continue;
    const fieldMeta = parseScoringFieldMeta(field.meta);
    if (!fieldMeta) {
      issues.push(scoringIssue(field.id, "SCORING_INVALID_META"));
      continue;
    }
    if (!knownVariables.has(fieldMeta.variable)) {
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

    const variable = knownVariables.get(fieldMeta.variable);
    if (field.type === "select" || field.type === "multiSelect") {
      const options = optionList(field);
      if (options.length === 0) {
        issues.push(
          scoringIssue(field.id, "SCORING_MISSING_POINTS", {
            field: field.id,
          }),
        );
      }
      for (const option of options) {
        if (option.points == null || !Number.isFinite(option.points)) {
          issues.push(
            scoringIssue(
              `${field.id}.${option.value}`,
              "SCORING_MISSING_POINTS",
              {
                field: field.id,
                option: option.value,
              },
            ),
          );
        }
      }
      if (fieldMeta.reverse && optionPointRange(options) == null) {
        issues.push(scoringIssue(field.id, "SCORING_REVERSE_RANGE"));
      }
    } else if (
      field.type === "number" &&
      fieldMeta.reverse &&
      (variable?.max == null || !Number.isFinite(variable.max))
    ) {
      issues.push(
        scoringIssue(field.id, "SCORING_REVERSE_RANGE", {
          variable: fieldMeta.variable,
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
  if (!option || option.points == null || !Number.isFinite(option.points)) {
    return "missing";
  }
  if (!fieldMeta.reverse) return option.points;
  const range = optionPointRange(options);
  if (!range) return "missing";
  return reversePoints(option.points, range);
}

function contributeMultiSelect(
  field: FormField,
  value: unknown,
  fieldMeta: ScoringFieldMeta,
): number | "missing" {
  if (!Array.isArray(value)) return "missing";
  const options = optionList(field);
  const range = fieldMeta.reverse ? optionPointRange(options) : undefined;
  if (fieldMeta.reverse && !range) return "missing";
  let sum = 0;
  for (const selected of value) {
    if (typeof selected !== "string") continue;
    const option = options.find((item) => item.value === selected);
    if (!option || option.points == null || !Number.isFinite(option.points)) {
      continue;
    }
    sum +=
      fieldMeta.reverse && range
        ? reversePoints(option.points, range)
        : option.points;
  }
  return sum;
}

function contributeNumber(
  value: unknown,
  fieldMeta: ScoringFieldMeta,
  variable: ScoringVariable,
): number | "missing" {
  if (typeof value !== "number" || !Number.isFinite(value)) return "missing";
  if (!fieldMeta.reverse) return value;
  const max = variable.max;
  if (max == null || !Number.isFinite(max)) return "missing";
  return reversePoints(value, { min: variable.min ?? 0, max });
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
  variable: ScoringVariable,
): number | "missing" {
  if (isUnanswered(field, value)) return "missing";
  switch (field.type) {
    case "select":
      return contributeSelect(field, value, fieldMeta);
    case "multiSelect":
      return contributeMultiSelect(field, value, fieldMeta);
    case "number":
      return contributeNumber(value, fieldMeta, variable);
    case "boolean":
      return contributeBoolean(value, fieldMeta);
    default:
      return "missing";
  }
}

function finishVariable(
  variable: ScoringVariable,
  sum: number,
  answered: number,
  missing: number,
): { raw: number | null; missing: number } {
  const policy: ScoringMissing = variable.missing ?? DEFAULT_SCORING_MISSING;
  if (policy === "incomplete" && missing > 0) {
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
 * do not contribute. Forms without `meta.scoring` return an empty result.
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
  const known = variableById(config.variables);
  const totals = new Map<
    string,
    { sum: number; answered: number; missing: number }
  >();
  for (const variable of config.variables) {
    totals.set(variable.id, { sum: 0, answered: 0, missing: 0 });
  }

  for (const field of definition.fields) {
    const fieldMeta = parseScoringFieldMeta(field.meta);
    if (!fieldMeta) continue;
    const variable = known.get(fieldMeta.variable);
    const bucket = totals.get(fieldMeta.variable);
    if (!variable || !bucket) continue;
    if (!isFieldVisible(field, answers, definition.fields)) continue;

    const points = contribute(field, answers[field.id], fieldMeta, variable);
    if (points === "missing") {
      bucket.missing += 1;
    } else {
      bucket.sum += points;
      bucket.answered += 1;
    }
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

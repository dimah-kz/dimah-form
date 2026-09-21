import {
  fieldIdSchema,
  metaSchemaTarget,
  type FormDefinitionMetaSchema,
  type NamespacedMeta,
} from "@dimah-form/core";
import * as z from "zod";

/** Plugin id, `meta` namespace, and `meta.scoring` document key. */
export const SCORING_NAMESPACE = "scoring" as const;

/**
 * How unanswered visible items affect `raw`.
 *
 * - `incomplete` — any missing visible item, or no visible contributing
 *   item at all, yields `raw: null` (default; safer for clinical totals).
 * - `zero` — missing items add 0 (typical Likert running total). All-hidden
 *   subscales stay `0`.
 * - `omit` — drop missing items from the sum; `raw` is null only when
 *   nothing scored (including all-hidden).
 */
export const scoringMissingSchema = z.enum(["zero", "omit", "incomplete"]);

export type ScoringMissing = z.output<typeof scoringMissingSchema>;

/** Default when `variables[].missing` is omitted. */
export const DEFAULT_SCORING_MISSING =
  "incomplete" as const satisfies ScoringMissing;

const finiteNumber = z.number().check((ctx) => {
  if (!Number.isFinite(ctx.value)) {
    ctx.issues.push({
      code: "custom",
      message: "must be finite",
      input: ctx.value,
    });
  }
});

export const scoringVariableSchema = z
  .object({
    id: fieldIdSchema,
    label: z.string().optional(),
    min: finiteNumber.optional(),
    max: finiteNumber.optional(),
    missing: scoringMissingSchema.optional(),
  })
  .check((ctx) => {
    const { min, max } = ctx.value;
    if (min != null && max != null && min > max) {
      ctx.issues.push({
        code: "custom",
        message: "min must be <= max",
        input: ctx.value,
      });
    }
  });

export type ScoringVariable = z.output<typeof scoringVariableSchema>;

export const scoringBandSchema = z.object({
  variable: fieldIdSchema,
  from: finiteNumber.optional(),
  to: finiteNumber.optional(),
  label: z.string().trim().min(1),
});

export type ScoringBand = z.output<typeof scoringBandSchema>;

/** Closed formula AST — never a JS string. Likert sums are the main path. */
export const scoringFormulaSchema = z.object({
  id: fieldIdSchema,
  label: z.string().optional(),
  op: z.literal("sum"),
  vars: z.array(fieldIdSchema).min(1),
});

export type ScoringFormula = z.output<typeof scoringFormulaSchema>;

export const scoringFormMetaSchema = z.object({
  variables: z.array(scoringVariableSchema).min(1),
  bands: z.array(scoringBandSchema).optional(),
  formulas: z.array(scoringFormulaSchema).optional(),
});

export type ScoringFormMeta = z.output<typeof scoringFormMetaSchema>;

export const scoringFieldMetaSchema = z.object({
  variable: fieldIdSchema,
  reverse: z.boolean().optional(),
});

export type ScoringFieldMeta = z.output<typeof scoringFieldMetaSchema>;

export const scoringAddSchema = z.object({
  variable: fieldIdSchema,
  points: finiteNumber,
});

export type ScoringAdd = z.output<typeof scoringAddSchema>;

/**
 * Likert `{ points }` or keying `{ add }`. Never both — `points` is sugar
 * for adding that number to `field.meta.scoring.variable`.
 */
export const scoringOptionMetaSchema = z
  .object({
    points: finiteNumber.optional(),
    add: z.array(scoringAddSchema).min(1).optional(),
  })
  .check((ctx) => {
    const { points, add } = ctx.value;
    const hasPoints = points !== undefined;
    const hasAdd = add !== undefined;
    if (hasPoints === hasAdd) {
      ctx.issues.push({
        code: "custom",
        message: hasPoints
          ? "option scoring cannot mix points and add"
          : "option scoring needs points or add",
        input: ctx.value,
      });
      return;
    }
    if (!add) return;
    const seen = new Set<string>();
    for (const row of add) {
      if (seen.has(row.variable)) {
        ctx.issues.push({
          code: "custom",
          message: "duplicate variable in option add",
          input: ctx.value,
          path: ["add"],
        });
        return;
      }
      seen.add(row.variable);
    }
  });

/** Likert points, or per-variable keying. Exclusive. */
export type ScoringOptionMeta = { points: number } | { add: ScoringAdd[] };

export type ScoringInnerMeta = {
  form: ScoringFormMeta;
  field: ScoringFieldMeta;
  option: ScoringOptionMeta;
};

/** Phantom authoring bag for `createDefineForm({ plugins })`. */
export type ScoringMeta = NamespacedMeta<"scoring", ScoringInnerMeta>;

export const scoringMetaSchema: FormDefinitionMetaSchema = {
  form: scoringFormMetaSchema,
  field: scoringFieldMetaSchema,
  option: scoringOptionMetaSchema,
};

export function scoringMetaTarget(
  meta: unknown,
): { present: false } | { present: true; value: unknown } {
  return metaSchemaTarget(meta, SCORING_NAMESPACE);
}

export function parseScoringFormMeta(
  meta: unknown,
):
  | { present: false }
  | { present: true; ok: true; value: ScoringFormMeta }
  | { present: true; ok: false } {
  const target = scoringMetaTarget(meta);
  if (!target.present) return { present: false };
  const parsed = scoringFormMetaSchema.safeParse(target.value);
  if (!parsed.success) return { present: true, ok: false };
  return { present: true, ok: true, value: parsed.data };
}

export function parseScoringFieldMeta(
  meta: unknown,
): ScoringFieldMeta | undefined {
  const target = scoringMetaTarget(meta);
  if (!target.present) return undefined;
  const parsed = scoringFieldMetaSchema.safeParse(target.value);
  return parsed.success ? parsed.data : undefined;
}

export function parseScoringOptionMeta(
  meta: unknown,
): ScoringOptionMeta | undefined {
  const target = scoringMetaTarget(meta);
  if (!target.present) return undefined;
  const parsed = scoringOptionMetaSchema.safeParse(target.value);
  if (!parsed.success) return undefined;
  const value = parsed.data;
  if (value.add) return { add: value.add };
  if (value.points !== undefined) return { points: value.points };
  return undefined;
}

export function optionHasPoints(
  scoring: ScoringOptionMeta | undefined,
): scoring is { points: number } {
  return scoring != null && "points" in scoring;
}

export function optionHasAdd(
  scoring: ScoringOptionMeta | undefined,
): scoring is { add: ScoringAdd[] } {
  return scoring != null && "add" in scoring;
}

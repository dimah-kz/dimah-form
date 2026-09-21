import {
  fieldLabel,
  formCompletion,
  isAnswerEmpty,
  isFieldVisible,
  resolveFieldTypeRegistry,
  type FieldTypeRegistryInput,
  type FormField,
  type ResponseRecord,
} from "@dimah-form/core";

import {
  catalogValues,
  categoricalTokens,
  compareByOrder,
  isCategoricalField,
} from "./categorical";
import {
  addNumeric,
  createNumericAcc,
  numericSnapshot,
  type NumericAcc,
} from "./numeric";
import {
  emptyScoringCatalog,
  mergeScoringCatalog,
  scoringCatalogFromMeta,
  type InsightsScores,
} from "./scoring";
import type { InsightsField, InsightsSummary } from "./spec";

function minIso(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function maxIso(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function utcDay(iso: string): string | undefined {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return undefined;
  return new Date(time).toISOString().slice(0, 10);
}

type ValueAcc = { label?: string; n: number };

type FieldAcc = {
  id: string;
  type: string;
  label: string;
  n: number;
  hidden: number;
  unanswered: number;
  answered: number;
  values: Map<string, ValueAcc>;
  valueOrder: string[];
  numeric: NumericAcc;
  dateMin?: string;
  dateMax?: string;
};

type ScoreAcc = {
  id: string;
  label?: string;
  n: number;
  complete: number;
  numeric: NumericAcc;
  bands: Map<string, number>;
};

function seedValues(acc: FieldAcc, field: FormField): void {
  if (!isCategoricalField(field)) return;
  for (const token of catalogValues(field)) {
    if (acc.values.has(token.value)) continue;
    acc.values.set(token.value, {
      n: 0,
      ...(token.label ? { label: token.label } : {}),
    });
    acc.valueOrder.push(token.value);
  }
}

function bumpValue(
  acc: FieldAcc,
  value: string,
  label: string | undefined,
): void {
  const existing = acc.values.get(value);
  if (existing) {
    existing.n += 1;
    if (label && existing.label == null) existing.label = label;
    return;
  }
  acc.values.set(value, { n: 1, ...(label ? { label } : {}) });
  acc.valueOrder.push(value);
}

function extraByN(
  counts: Map<string, number>,
): (a: string, b: string) => number {
  return (a, b) =>
    (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b, "en");
}

export type InsightsAccumulatorOptions = {
  fieldTypes?: FieldTypeRegistryInput;
  series?: boolean;
  /** Live questionnaire: field order and unused catalog levels. Not a flatten. */
  liveFields?: readonly FormField[];
  /** Live `meta` for scoring variable / band order. */
  liveMeta?: unknown;
};

/**
 * Fold full response rows into a form summary. Counts follow each row's
 * **definition snapshot**, not the live questionnaire. Field `n` is visible
 * occurrences; hidden skip-logic fields increment `hidden`. Categorical
 * `values` follow the document catalog (unused levels stay at `n: 0`).
 */
export function createInsightsAccumulator(
  formId: string,
  options: InsightsAccumulatorOptions = {},
) {
  const registry = resolveFieldTypeRegistry(options.fieldTypes);
  const liveById = new Map(
    (options.liveFields ?? []).map((field) => [field.id, field]),
  );
  const liveFieldIds = (options.liveFields ?? []).map((field) => field.id);
  const byStatus = { draft: 0, submitted: 0, abandoned: 0 };
  let submittedAtMin: string | undefined;
  let submittedAtMax: string | undefined;
  let completionSubmitted = 0;
  let completionComplete = 0;
  const fields = new Map<string, FieldAcc>();
  const scores = new Map<string, ScoreAcc>();
  const scoringCatalog = emptyScoringCatalog();
  const liveScoring = scoringCatalogFromMeta(options.liveMeta);
  if (liveScoring) mergeScoringCatalog(scoringCatalog, liveScoring);
  const byDay = options.series ? new Map<string, number>() : undefined;

  function fieldAcc(field: FormField): FieldAcc {
    let existing = fields.get(field.id);
    if (!existing) {
      existing = {
        id: field.id,
        type: field.type,
        label: fieldLabel(field),
        n: 0,
        hidden: 0,
        unanswered: 0,
        answered: 0,
        values: new Map(),
        valueOrder: [],
        numeric: createNumericAcc(),
      };
      fields.set(field.id, existing);
    }
    seedValues(existing, field);
    const live = liveById.get(field.id);
    if (live) seedValues(existing, live);
    return existing;
  }

  return {
    add(row: ResponseRecord, score?: InsightsScores) {
      byStatus[row.status] += 1;
      if (row.submittedAt) {
        submittedAtMin = minIso(submittedAtMin, row.submittedAt);
        submittedAtMax = maxIso(submittedAtMax, row.submittedAt);
        if (byDay) {
          const day = utcDay(row.submittedAt);
          if (day) byDay.set(day, (byDay.get(day) ?? 0) + 1);
        }
      }
      if (row.status === "submitted") {
        completionSubmitted += 1;
        if (formCompletion(row.definition, row.answers, registry).complete) {
          completionComplete += 1;
        }
      }
      for (const field of row.definition.fields) {
        const acc = fieldAcc(field);
        if (!isFieldVisible(field, row.answers, row.definition.fields)) {
          acc.hidden += 1;
          continue;
        }
        acc.n += 1;
        const value = Object.hasOwn(row.answers, field.id)
          ? row.answers[field.id]
          : null;
        if (isAnswerEmpty(field, value, registry)) {
          acc.unanswered += 1;
          continue;
        }
        acc.answered += 1;
        if (isCategoricalField(field)) {
          for (const token of categoricalTokens(field, value)) {
            bumpValue(acc, token.value, token.label);
          }
        }
        if (typeof value === "number" && Number.isFinite(value)) {
          addNumeric(acc.numeric, value);
        }
        if (field.type === "date" && typeof value === "string") {
          acc.dateMin = minIso(acc.dateMin, value);
          acc.dateMax = maxIso(acc.dateMax, value);
        }
      }
      const snapshotScoring = scoringCatalogFromMeta(row.definition.meta);
      if (snapshotScoring) mergeScoringCatalog(scoringCatalog, snapshotScoring);
      if (!score) return;
      for (const [id, variable] of Object.entries(score.variables)) {
        let acc = scores.get(id);
        if (!acc) {
          acc = {
            id,
            label: variable.label,
            n: 0,
            complete: 0,
            numeric: createNumericAcc(),
            bands: new Map(),
          };
          scores.set(id, acc);
        }
        acc.n += 1;
        if (variable.label && acc.label == null) acc.label = variable.label;
        if (variable.complete) acc.complete += 1;
        if (variable.raw != null) addNumeric(acc.numeric, variable.raw);
        if (variable.band) {
          acc.bands.set(variable.band, (acc.bands.get(variable.band) ?? 0) + 1);
        }
      }
    },
    finish(): Omit<InsightsSummary, "scanned" | "truncated"> {
      const seenFieldIds = [...fields.keys()];
      const fieldRows: InsightsField[] = [...fields.values()]
        .map((field) => {
          const nByValue = new Map(
            [...field.values.entries()].map(([value, item]) => [value, item.n]),
          );
          const values = [...field.values.entries()]
            .map(([value, item]) => ({
              value,
              n: item.n,
              pct: field.answered > 0 ? item.n / field.answered : 0,
              ...(item.label ? { label: item.label } : {}),
            }))
            .sort((a, b) =>
              compareByOrder(
                field.valueOrder,
                a.value,
                b.value,
                extraByN(nByValue),
              ),
            );
          const numeric = numericSnapshot(field.numeric);
          return {
            id: field.id,
            type: field.type,
            label: field.label,
            n: field.n,
            hidden: field.hidden,
            unanswered: field.unanswered,
            ...(values.length > 0 ? { values } : {}),
            ...(numeric ? { numeric } : {}),
            ...(field.dateMin && field.dateMax
              ? { dates: { min: field.dateMin, max: field.dateMax } }
              : {}),
          };
        })
        .sort((a, b) =>
          compareByOrder(liveFieldIds, a.id, b.id, (left, right) =>
            compareByOrder(seenFieldIds, left, right),
          ),
        );
      const seenScoreIds = [...scores.keys()];
      const variables = [...scores.values()]
        .map((variable) => {
          const catalogBands =
            scoringCatalog.bandsByVariable.get(variable.id) ?? [];
          const labels = new Set([...catalogBands, ...variable.bands.keys()]);
          const bands = [...labels]
            .map((label) => {
              const n = variable.bands.get(label) ?? 0;
              return {
                label,
                n,
                pct: variable.n > 0 ? n / variable.n : 0,
              };
            })
            .sort((a, b) =>
              compareByOrder(
                catalogBands,
                a.label,
                b.label,
                extraByN(variable.bands),
              ),
            );
          const numeric = numericSnapshot(variable.numeric);
          const catalogLabel = scoringCatalog.variableLabels.get(variable.id);
          return {
            id: variable.id,
            ...(variable.label || catalogLabel
              ? { label: variable.label ?? catalogLabel }
              : {}),
            n: variable.n,
            complete: variable.complete,
            ...(numeric ? { min: numeric.min, max: numeric.max } : {}),
            mean: numeric ? numeric.mean : null,
            stdev: numeric ? numeric.stdev : null,
            ...(bands.length > 0 ? { bands } : {}),
          };
        })
        .sort((a, b) =>
          compareByOrder(
            scoringCatalog.variableIds,
            a.id,
            b.id,
            (left, right) => compareByOrder(seenScoreIds, left, right),
          ),
        );
      const seriesPoints = byDay
        ? [...byDay.entries()]
            .map(([t, n]) => ({ t, n }))
            .sort((a, b) => a.t.localeCompare(b.t))
        : undefined;
      return {
        formId,
        total: byStatus.draft + byStatus.submitted + byStatus.abandoned,
        byStatus: { ...byStatus },
        ...(submittedAtMin && submittedAtMax
          ? { submittedAt: { min: submittedAtMin, max: submittedAtMax } }
          : {}),
        completion: {
          submitted: completionSubmitted,
          complete: completionComplete,
          rate:
            completionSubmitted > 0
              ? completionComplete / completionSubmitted
              : null,
        },
        fields: fieldRows,
        ...(variables.length > 0 ? { scores: { variables } } : {}),
        ...(seriesPoints
          ? { series: { bucket: "day" as const, points: seriesPoints } }
          : {}),
      };
    },
  };
}

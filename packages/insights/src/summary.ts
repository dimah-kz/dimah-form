import {
  fieldLabel,
  fieldOptions,
  formCompletion,
  type ResponseRecord,
} from "@dimah-form/core";

import type { InsightsScores } from "./scoring";
import type { InsightsField, InsightsSummary } from "./spec";

const CATEGORICAL = new Set(["select", "boolean", "multiSelect"]);

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

function isUnanswered(value: unknown): boolean {
  if (value == null) return true;
  if (value === "") return true;
  return Array.isArray(value) && value.length === 0;
}

type ValueAcc = { label?: string; n: number };

type FieldAcc = {
  id: string;
  type: string;
  label: string;
  n: number;
  unanswered: number;
  values: Map<string, ValueAcc>;
};

type ScoreAcc = {
  id: string;
  label?: string;
  n: number;
  complete: number;
  sum: number;
  counted: number;
  min?: number;
  max?: number;
  bands: Map<string, number>;
};

function bumpValue(
  acc: FieldAcc,
  value: string,
  label: string | undefined,
): void {
  const existing = acc.values.get(value);
  if (existing) {
    existing.n += 1;
    if (label) existing.label = label;
    return;
  }
  acc.values.set(value, { n: 1, ...(label ? { label } : {}) });
}

function optionLabel(
  field: ResponseRecord["definition"]["fields"][number],
  value: string,
): string | undefined {
  const match = fieldOptions(field).find((option) => option.value === value);
  return match?.label;
}

/**
 * Fold full response rows into a form summary. Counts follow each row's
 * **definition snapshot**, not the live questionnaire.
 */
export function createInsightsAccumulator(formId: string) {
  const byStatus = { draft: 0, submitted: 0, abandoned: 0 };
  let submittedAtMin: string | undefined;
  let submittedAtMax: string | undefined;
  let completionSubmitted = 0;
  let completionComplete = 0;
  const fields = new Map<string, FieldAcc>();
  const scores = new Map<string, ScoreAcc>();

  function fieldAcc(
    field: ResponseRecord["definition"]["fields"][number],
  ): FieldAcc {
    const existing = fields.get(field.id);
    if (existing) return existing;
    const next: FieldAcc = {
      id: field.id,
      type: field.type,
      label: fieldLabel(field),
      n: 0,
      unanswered: 0,
      values: new Map(),
    };
    fields.set(field.id, next);
    return next;
  }

  return {
    add(row: ResponseRecord, score?: InsightsScores) {
      byStatus[row.status] += 1;
      if (row.submittedAt) {
        submittedAtMin = minIso(submittedAtMin, row.submittedAt);
        submittedAtMax = maxIso(submittedAtMax, row.submittedAt);
      }
      if (row.status === "submitted") {
        completionSubmitted += 1;
        if (formCompletion(row.definition, row.answers).complete) {
          completionComplete += 1;
        }
      }
      for (const field of row.definition.fields) {
        const acc = fieldAcc(field);
        acc.n += 1;
        const value = Object.hasOwn(row.answers, field.id)
          ? row.answers[field.id]
          : null;
        if (isUnanswered(value)) {
          acc.unanswered += 1;
          continue;
        }
        if (!CATEGORICAL.has(field.type)) continue;
        if (field.type === "boolean") {
          if (value === true) bumpValue(acc, "true", "Yes");
          else if (value === false) bumpValue(acc, "false", "No");
          continue;
        }
        if (field.type === "multiSelect" && Array.isArray(value)) {
          for (const item of value) {
            if (typeof item !== "string") continue;
            bumpValue(acc, item, optionLabel(field, item));
          }
          continue;
        }
        if (typeof value === "string") {
          bumpValue(acc, value, optionLabel(field, value));
        }
      }
      if (!score) return;
      for (const [id, variable] of Object.entries(score.variables)) {
        let acc = scores.get(id);
        if (!acc) {
          acc = {
            id,
            label: variable.label,
            n: 0,
            complete: 0,
            sum: 0,
            counted: 0,
            bands: new Map(),
          };
          scores.set(id, acc);
        }
        acc.n += 1;
        if (variable.label) acc.label = variable.label;
        if (variable.complete) acc.complete += 1;
        if (variable.raw != null) {
          acc.sum += variable.raw;
          acc.counted += 1;
          acc.min =
            acc.min === undefined
              ? variable.raw
              : Math.min(acc.min, variable.raw);
          acc.max =
            acc.max === undefined
              ? variable.raw
              : Math.max(acc.max, variable.raw);
        }
        if (variable.band) {
          acc.bands.set(variable.band, (acc.bands.get(variable.band) ?? 0) + 1);
        }
      }
    },
    finish(): InsightsSummary {
      const fieldRows: InsightsField[] = [...fields.values()]
        .map((field) => {
          const values = [...field.values.entries()]
            .map(([value, item]) => ({
              value,
              n: item.n,
              ...(item.label ? { label: item.label } : {}),
            }))
            .sort((a, b) => b.n - a.n || a.value.localeCompare(b.value, "en"));
          return {
            id: field.id,
            type: field.type,
            label: field.label,
            n: field.n,
            unanswered: field.unanswered,
            ...(values.length > 0 ? { values } : {}),
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
      const variables = [...scores.values()]
        .map((variable) => {
          const bands = [...variable.bands.entries()]
            .map(([label, n]) => ({ label, n }))
            .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "en"));
          return {
            id: variable.id,
            ...(variable.label ? { label: variable.label } : {}),
            n: variable.n,
            complete: variable.complete,
            ...(variable.min !== undefined ? { min: variable.min } : {}),
            ...(variable.max !== undefined ? { max: variable.max } : {}),
            mean: variable.counted > 0 ? variable.sum / variable.counted : null,
            ...(bands.length > 0 ? { bands } : {}),
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
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
        },
        fields: fieldRows,
        ...(variables.length > 0 ? { scores: { variables } } : {}),
      };
    },
  };
}

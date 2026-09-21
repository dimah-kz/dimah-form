import {
  fieldLabel,
  fieldOptions,
  type FormField,
  type FormSnapshot,
} from "@dimah-form/core";

import { canonicalJson, snapshotKey, type SnapshotKeyCache } from "./hash";
import {
  DATASET_SPEC,
  emptyCodebook,
  sortDatasetIds,
  type Codebook,
  type CodebookField,
  type CodebookFieldConstraints,
  type CodebookFieldHistory,
  type CodebookFieldScoring,
  type CodebookFieldView,
  type CodebookOption,
  type CodebookScoreBand,
  type CodebookScoreBandHistory,
  type CodebookScoreFormula,
  type CodebookScoreFormulaHistory,
  type CodebookScoreFormulaView,
  type CodebookScoreVariable,
  type CodebookScoreVariableHistory,
  type CodebookScoreVariableView,
  type CodebookScoringAdd,
  type CodebookScoringMissing,
  type CodebookSnapshot,
} from "./spec";

export type CodebookSource = {
  snapshotKey: string;
  definition: FormSnapshot;
  seenAt?: string | null;
};

type FieldVariant = CodebookFieldView & {
  snapshotKey: string;
};

type ScoreVariableVariant = CodebookScoreVariableView & {
  snapshotKey: string;
  id: string;
};

type ScoreBandVariant = {
  snapshotKey: string;
  variable: string;
  from?: number;
  to?: number;
  label: string;
};

type ScoreFormulaVariant = CodebookScoreFormulaView & {
  snapshotKey: string;
  id: string;
};

const SCORING_MISSING = new Set<CodebookScoringMissing>([
  "zero",
  "omit",
  "incomplete",
]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  return value as Record<string, unknown>;
}

function asFinite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function scoringMissing(value: unknown): CodebookScoringMissing | undefined {
  return typeof value === "string" &&
    SCORING_MISSING.has(value as CodebookScoringMissing)
    ? (value as CodebookScoringMissing)
    : undefined;
}

function scoringAdd(value: unknown): CodebookScoringAdd[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return;
  const add: CodebookScoringAdd[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    const record = asRecord(row);
    if (
      !record ||
      typeof record.variable !== "string" ||
      record.variable.length === 0
    ) {
      return;
    }
    const points = asFinite(record.points);
    if (points === undefined || seen.has(record.variable)) return;
    seen.add(record.variable);
    add.push({ variable: record.variable, points });
  }
  return add;
}

/** Likert `points` or keying `add`. Both or neither → omit (invalid). */
function optionScoring(
  meta: unknown,
): Pick<CodebookOption, "points" | "add"> | undefined {
  const scoring = asRecord(asRecord(meta)?.scoring);
  if (!scoring) return;
  const points = asFinite(scoring.points);
  const add = scoringAdd(scoring.add);
  if ((points !== undefined) === (add !== undefined)) return;
  if (points !== undefined) return { points };
  if (add) return { add };
  return;
}

function fieldScoring(meta: unknown): CodebookFieldScoring | undefined {
  const scoring = asRecord(asRecord(meta)?.scoring);
  if (
    !scoring ||
    typeof scoring.variable !== "string" ||
    scoring.variable.length === 0
  ) {
    return;
  }
  return {
    variable: scoring.variable,
    ...(scoring.reverse === true ? { reverse: true } : {}),
  };
}

function formulaOf(
  row: unknown,
): Omit<ScoreFormulaVariant, "snapshotKey"> | undefined {
  const record = asRecord(row);
  if (!record || typeof record.id !== "string" || record.id.length === 0) {
    return;
  }
  if (
    record.op !== "sum" ||
    !Array.isArray(record.vars) ||
    record.vars.length === 0
  ) {
    return;
  }
  const vars: string[] = [];
  const seen = new Set<string>();
  for (const item of record.vars) {
    if (typeof item !== "string" || item.length === 0 || seen.has(item)) {
      return;
    }
    seen.add(item);
    vars.push(item);
  }
  return {
    id: record.id,
    op: "sum",
    vars,
    ...(typeof record.label === "string" ? { label: record.label } : {}),
  };
}

function scoringDocs(meta: unknown):
  | {
      variables: Omit<ScoreVariableVariant, "snapshotKey">[];
      bands: Omit<ScoreBandVariant, "snapshotKey">[];
      formulas: Omit<ScoreFormulaVariant, "snapshotKey">[];
    }
  | undefined {
  const scoring = asRecord(asRecord(meta)?.scoring);
  if (!scoring) return;
  const variables: Omit<ScoreVariableVariant, "snapshotKey">[] = [];
  if (Array.isArray(scoring.variables)) {
    for (const row of scoring.variables) {
      const record = asRecord(row);
      if (!record || typeof record.id !== "string" || record.id.length === 0) {
        continue;
      }
      const missing = scoringMissing(record.missing);
      const min = asFinite(record.min);
      const max = asFinite(record.max);
      variables.push({
        id: record.id,
        ...(typeof record.label === "string" ? { label: record.label } : {}),
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
        ...(missing !== undefined ? { missing } : {}),
      });
    }
  }
  const bands: Omit<ScoreBandVariant, "snapshotKey">[] = [];
  if (Array.isArray(scoring.bands)) {
    for (const row of scoring.bands) {
      const record = asRecord(row);
      if (
        !record ||
        typeof record.variable !== "string" ||
        record.variable.length === 0 ||
        typeof record.label !== "string" ||
        record.label.trim().length === 0
      ) {
        continue;
      }
      const from = asFinite(record.from);
      const to = asFinite(record.to);
      bands.push({
        variable: record.variable,
        label: record.label,
        ...(from !== undefined ? { from } : {}),
        ...(to !== undefined ? { to } : {}),
      });
    }
  }
  const formulas: Omit<ScoreFormulaVariant, "snapshotKey">[] = [];
  if (Array.isArray(scoring.formulas)) {
    for (const row of scoring.formulas) {
      const formula = formulaOf(row);
      if (formula) formulas.push(formula);
    }
  }
  if (variables.length === 0 && bands.length === 0 && formulas.length === 0) {
    return;
  }
  return { variables, bands, formulas };
}

function fieldConstraints(
  field: FormField,
): CodebookFieldConstraints | undefined {
  const min = asFinite(field.min);
  const max = asFinite(field.max);
  const minLength =
    typeof field.minLength === "number" &&
    Number.isInteger(field.minLength) &&
    field.minLength >= 0
      ? field.minLength
      : undefined;
  const maxLength =
    typeof field.maxLength === "number" &&
    Number.isInteger(field.maxLength) &&
    field.maxLength >= 0
      ? field.maxLength
      : undefined;
  const integer = field.integer === true || undefined;
  if (
    min === undefined &&
    max === undefined &&
    minLength === undefined &&
    maxLength === undefined &&
    integer === undefined
  ) {
    return undefined;
  }
  return {
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(minLength !== undefined ? { minLength } : {}),
    ...(maxLength !== undefined ? { maxLength } : {}),
    ...(integer ? { integer: true } : {}),
  };
}

function codebookOptions(field: FormField): CodebookOption[] | undefined {
  const options = fieldOptions(field).map((option) => {
    const scoring = optionScoring(option.meta);
    return {
      value: option.value,
      label: option.label,
      ...scoring,
    };
  });
  return options.length > 0 ? options : undefined;
}

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

function pickNewestKey(
  keys: readonly string[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): string | undefined {
  let winner: string | undefined;
  let winnerSeen: string | undefined;
  for (const key of keys) {
    const seen = snapshots.get(key)?.lastSeenAt;
    if (
      !winner ||
      (seen && (!winnerSeen || seen > winnerSeen)) ||
      (seen === winnerSeen && key > (winner ?? ""))
    ) {
      winner = key;
      winnerSeen = seen;
    }
  }
  return winner;
}

function noteSnapshot(
  map: Map<string, CodebookSnapshot>,
  key: string,
  seenAt: string | null | undefined,
  countResponses: boolean,
): void {
  if (!countResponses) {
    if (!map.has(key)) map.set(key, { key, n: 0 });
    return;
  }
  const at = seenAt && seenAt.length > 0 ? seenAt : undefined;
  const existing = map.get(key);
  if (!existing) {
    map.set(key, {
      key,
      n: 1,
      ...(at ? { firstSeenAt: at, lastSeenAt: at } : {}),
    });
    return;
  }
  existing.n += 1;
  const first = minIso(existing.firstSeenAt, at);
  const last = maxIso(existing.lastSeenAt, at);
  if (first) existing.firstSeenAt = first;
  if (last) existing.lastSeenAt = last;
}

function uniqueKeys(keys: readonly string[]): string[] {
  return sortDatasetIds([...new Set(keys)]);
}

function fieldView(variant: FieldVariant): CodebookFieldView {
  return {
    type: variant.type,
    label: variant.label,
    ...(variant.required === true ? { required: true } : {}),
    ...(variant.description ? { description: variant.description } : {}),
    ...(variant.showWhen !== undefined ? { showWhen: variant.showWhen } : {}),
    ...(variant.constraints ? { constraints: variant.constraints } : {}),
    ...(variant.options ? { options: variant.options } : {}),
    ...(variant.scoring ? { scoring: variant.scoring } : {}),
  };
}

function variableView(
  variant: ScoreVariableVariant,
): CodebookScoreVariableView {
  return {
    ...(variant.label !== undefined ? { label: variant.label } : {}),
    ...(variant.min !== undefined ? { min: variant.min } : {}),
    ...(variant.max !== undefined ? { max: variant.max } : {}),
    ...(variant.missing !== undefined ? { missing: variant.missing } : {}),
  };
}

function bandRange(
  variant: ScoreBandVariant,
): Pick<ScoreBandVariant, "from" | "to"> {
  return {
    ...(variant.from !== undefined ? { from: variant.from } : {}),
    ...(variant.to !== undefined ? { to: variant.to } : {}),
  };
}

function formulaView(variant: ScoreFormulaVariant): CodebookScoreFormulaView {
  return {
    op: variant.op,
    vars: variant.vars,
    ...(variant.label !== undefined ? { label: variant.label } : {}),
  };
}

function historyOf<T extends { snapshotKey: string }>(
  keys: readonly string[],
  newestKey: string | undefined,
  byKey: ReadonlyMap<string, T>,
  viewOf: (variant: T) => unknown,
): T[] {
  const newest = newestKey ? byKey.get(newestKey) : undefined;
  if (!newest) return [];
  const canonical = canonicalJson(viewOf(newest));
  const history: T[] = [];
  for (const key of sortDatasetIds([...keys])) {
    if (key === newestKey) continue;
    const variant = byKey.get(key);
    if (!variant) continue;
    if (canonicalJson(viewOf(variant)) === canonical) continue;
    history.push(variant);
  }
  return history;
}

function finalizeField(
  id: string,
  variants: readonly FieldVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookField {
  const byKey = new Map<string, FieldVariant>();
  for (const variant of variants) byKey.set(variant.snapshotKey, variant);
  const inSnapshots = uniqueKeys([...byKey.keys()]);
  const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
  const newest = (newestKey ? byKey.get(newestKey) : undefined) ?? variants[0];
  const history: CodebookFieldHistory[] = historyOf(
    inSnapshots,
    newestKey,
    byKey,
    fieldView,
  ).map((variant) => ({
    snapshotKey: variant.snapshotKey,
    ...fieldView(variant),
  }));
  return {
    id,
    ...fieldView(newest ?? { snapshotKey: id, type: "text", label: id }),
    inSnapshots,
    ...(history.length > 0 ? { history } : {}),
  };
}

function finalizeScoreVariables(
  variants: readonly ScoreVariableVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookScoreVariable[] {
  const byId = new Map<string, Map<string, ScoreVariableVariant>>();
  for (const variant of variants) {
    const byKey =
      byId.get(variant.id) ?? new Map<string, ScoreVariableVariant>();
    byKey.set(variant.snapshotKey, variant);
    byId.set(variant.id, byKey);
  }
  const result: CodebookScoreVariable[] = [];
  for (const id of sortDatasetIds([...byId.keys()])) {
    const byKey = byId.get(id) ?? new Map<string, ScoreVariableVariant>();
    const inSnapshots = uniqueKeys([...byKey.keys()]);
    const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
    const newest =
      (newestKey ? byKey.get(newestKey) : undefined) ?? [...byKey.values()][0];
    const history: CodebookScoreVariableHistory[] = historyOf(
      inSnapshots,
      newestKey,
      byKey,
      variableView,
    ).map((variant) => ({
      snapshotKey: variant.snapshotKey,
      ...variableView(variant),
    }));
    result.push({
      id,
      inSnapshots,
      ...(newest ? variableView(newest) : {}),
      ...(history.length > 0 ? { history } : {}),
    });
  }
  return result;
}

function finalizeScoreBands(
  variants: readonly ScoreBandVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookScoreBand[] {
  const byIdentity = new Map<string, Map<string, ScoreBandVariant>>();
  for (const variant of variants) {
    const identity = `${variant.variable}\0${variant.label}`;
    const byKey =
      byIdentity.get(identity) ?? new Map<string, ScoreBandVariant>();
    byKey.set(variant.snapshotKey, variant);
    byIdentity.set(identity, byKey);
  }
  const result: CodebookScoreBand[] = [];
  for (const byKey of byIdentity.values()) {
    const inSnapshots = uniqueKeys([...byKey.keys()]);
    const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
    const newest =
      (newestKey ? byKey.get(newestKey) : undefined) ?? [...byKey.values()][0];
    if (!newest) continue;
    const history: CodebookScoreBandHistory[] = historyOf(
      inSnapshots,
      newestKey,
      byKey,
      bandRange,
    ).map((variant) => ({
      snapshotKey: variant.snapshotKey,
      ...bandRange(variant),
    }));
    result.push({
      variable: newest.variable,
      label: newest.label,
      inSnapshots,
      ...bandRange(newest),
      ...(history.length > 0 ? { history } : {}),
    });
  }
  return result.sort(
    (a, b) =>
      a.variable.localeCompare(b.variable, "en", { numeric: true }) ||
      a.label.localeCompare(b.label, "en"),
  );
}

function finalizeScoreFormulas(
  variants: readonly ScoreFormulaVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookScoreFormula[] {
  const byId = new Map<string, Map<string, ScoreFormulaVariant>>();
  for (const variant of variants) {
    const byKey =
      byId.get(variant.id) ?? new Map<string, ScoreFormulaVariant>();
    byKey.set(variant.snapshotKey, variant);
    byId.set(variant.id, byKey);
  }
  const result: CodebookScoreFormula[] = [];
  for (const id of sortDatasetIds([...byId.keys()])) {
    const byKey = byId.get(id) ?? new Map<string, ScoreFormulaVariant>();
    const inSnapshots = uniqueKeys([...byKey.keys()]);
    const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
    const newest =
      (newestKey ? byKey.get(newestKey) : undefined) ?? [...byKey.values()][0];
    const history: CodebookScoreFormulaHistory[] = historyOf(
      inSnapshots,
      newestKey,
      byKey,
      formulaView,
    ).map((variant) => ({
      snapshotKey: variant.snapshotKey,
      ...formulaView(variant),
    }));
    result.push({
      id,
      inSnapshots,
      ...(newest ? formulaView(newest) : { op: "sum", vars: [id] }),
      ...(history.length > 0 ? { history } : {}),
    });
  }
  return result;
}

function snapshotList(
  map: ReadonlyMap<string, CodebookSnapshot>,
): CodebookSnapshot[] {
  return [...map.values()].sort((a, b) => {
    const last = (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "");
    if (last !== 0) return last;
    return a.key.localeCompare(b.key);
  });
}

function keysWithHistory(
  inSnapshots: readonly string[],
  history: readonly { snapshotKey: string }[] | undefined,
): string[] {
  return uniqueKeys([
    ...inSnapshots,
    ...(history ?? []).map((item) => item.snapshotKey),
  ]);
}

function variantsFromField(field: CodebookField): FieldVariant[] {
  const history = new Map(
    (field.history ?? []).map((item) => [item.snapshotKey, item]),
  );
  return keysWithHistory(field.inSnapshots, field.history).map(
    (snapshotKey) => {
      const prior = history.get(snapshotKey);
      const source = prior ?? field;
      return {
        snapshotKey,
        type: source.type,
        label: source.label,
        ...(source.required === true ? { required: true } : {}),
        ...(source.description ? { description: source.description } : {}),
        ...(source.showWhen !== undefined ? { showWhen: source.showWhen } : {}),
        ...(source.constraints ? { constraints: source.constraints } : {}),
        ...(source.options ? { options: source.options } : {}),
        ...(source.scoring ? { scoring: source.scoring } : {}),
      };
    },
  );
}

function collectFromCodebook(
  codebook: Codebook,
  snapshots: Map<string, CodebookSnapshot>,
  fieldVariants: Map<string, FieldVariant[]>,
  scoreVariables: ScoreVariableVariant[],
  scoreBands: ScoreBandVariant[],
  scoreFormulas: ScoreFormulaVariant[],
): void {
  for (const snapshot of codebook.snapshots) {
    const existing = snapshots.get(snapshot.key);
    if (!existing) {
      snapshots.set(snapshot.key, { ...snapshot });
      continue;
    }
    existing.n += snapshot.n;
    const first = minIso(existing.firstSeenAt, snapshot.firstSeenAt);
    const last = maxIso(existing.lastSeenAt, snapshot.lastSeenAt);
    if (first) existing.firstSeenAt = first;
    if (last) existing.lastSeenAt = last;
  }
  for (const field of codebook.fields) {
    const list = fieldVariants.get(field.id) ?? [];
    list.push(...variantsFromField(field));
    fieldVariants.set(field.id, list);
  }
  for (const variable of codebook.scores?.variables ?? []) {
    const history = new Map(
      (variable.history ?? []).map((item) => [item.snapshotKey, item]),
    );
    for (const key of keysWithHistory(variable.inSnapshots, variable.history)) {
      const prior = history.get(key);
      const source = prior ?? variable;
      scoreVariables.push({
        snapshotKey: key,
        id: variable.id,
        ...(source.label !== undefined ? { label: source.label } : {}),
        ...(source.min !== undefined ? { min: source.min } : {}),
        ...(source.max !== undefined ? { max: source.max } : {}),
        ...(source.missing !== undefined ? { missing: source.missing } : {}),
      });
    }
  }
  for (const band of codebook.scores?.bands ?? []) {
    const history = new Map(
      (band.history ?? []).map((item) => [item.snapshotKey, item]),
    );
    for (const key of keysWithHistory(band.inSnapshots, band.history)) {
      const prior = history.get(key);
      const source = prior ?? band;
      scoreBands.push({
        snapshotKey: key,
        variable: band.variable,
        label: band.label,
        ...(source.from !== undefined ? { from: source.from } : {}),
        ...(source.to !== undefined ? { to: source.to } : {}),
      });
    }
  }
  for (const formula of codebook.scores?.formulas ?? []) {
    const history = new Map(
      (formula.history ?? []).map((item) => [item.snapshotKey, item]),
    );
    for (const key of keysWithHistory(formula.inSnapshots, formula.history)) {
      const prior = history.get(key);
      const source = prior ?? formula;
      scoreFormulas.push({
        snapshotKey: key,
        id: formula.id,
        op: "sum",
        vars: source.vars,
        ...(source.label !== undefined ? { label: source.label } : {}),
      });
    }
  }
}

function assemble(
  snapshots: Map<string, CodebookSnapshot>,
  fieldVariants: Map<string, FieldVariant[]>,
  scoreVariables: ScoreVariableVariant[],
  scoreBands: ScoreBandVariant[],
  scoreFormulas: ScoreFormulaVariant[],
  fieldOrder: "sorted" | "live",
  liveFieldIds?: readonly string[],
): Codebook {
  const ids =
    fieldOrder === "live" && liveFieldIds
      ? [...liveFieldIds]
      : sortDatasetIds([...fieldVariants.keys()]);
  const fields = ids
    .map((id) => {
      const variants = fieldVariants.get(id);
      if (!variants?.length) return undefined;
      return finalizeField(id, variants, snapshots);
    })
    .filter((field): field is CodebookField => field !== undefined);
  const variables = finalizeScoreVariables(scoreVariables, snapshots);
  const bands = finalizeScoreBands(scoreBands, snapshots);
  const formulas = finalizeScoreFormulas(scoreFormulas, snapshots);
  const codebook: Codebook = {
    spec: DATASET_SPEC,
    snapshots: snapshotList(snapshots),
    fields,
  };
  if (variables.length > 0 || bands.length > 0 || formulas.length > 0) {
    codebook.scores = {
      variables,
      ...(bands.length > 0 ? { bands } : {}),
      ...(formulas.length > 0 ? { formulas } : {}),
    };
  }
  return codebook;
}

function ingestSource(
  source: CodebookSource,
  snapshots: Map<string, CodebookSnapshot>,
  fieldVariants: Map<string, FieldVariant[]>,
  scoreVariables: ScoreVariableVariant[],
  scoreBands: ScoreBandVariant[],
  scoreFormulas: ScoreFormulaVariant[],
  countResponses: boolean,
): void {
  noteSnapshot(snapshots, source.snapshotKey, source.seenAt, countResponses);
  for (const field of source.definition.fields) {
    const list = fieldVariants.get(field.id) ?? [];
    const constraints = fieldConstraints(field);
    const options = codebookOptions(field);
    const scoring = fieldScoring(field.meta);
    list.push({
      snapshotKey: source.snapshotKey,
      type: field.type,
      label: fieldLabel(field),
      ...(field.required === true ? { required: true } : {}),
      ...(field.description ? { description: field.description } : {}),
      ...(field.showWhen !== undefined ? { showWhen: field.showWhen } : {}),
      ...(constraints ? { constraints } : {}),
      ...(options ? { options } : {}),
      ...(scoring ? { scoring } : {}),
    });
    fieldVariants.set(field.id, list);
  }
  const docs = scoringDocs(source.definition.meta);
  if (!docs) return;
  for (const variable of docs.variables) {
    scoreVariables.push({ ...variable, snapshotKey: source.snapshotKey });
  }
  for (const band of docs.bands) {
    scoreBands.push({ ...band, snapshotKey: source.snapshotKey });
  }
  for (const formula of docs.formulas) {
    scoreFormulas.push({ ...formula, snapshotKey: source.snapshotKey });
  }
}

/**
 * Historical codebook from snapshots that appear in the dataset.
 * Field order is sorted ids (stable across newest-first pagination).
 * Canonical label / type / constraints / scoring follow `lastSeenAt`.
 * Earlier views that differ are `history` (one entry per snapshot key).
 */
export function buildCodebook(sources: readonly CodebookSource[]): Codebook {
  const snapshots = new Map<string, CodebookSnapshot>();
  const fieldVariants = new Map<string, FieldVariant[]>();
  const scoreVariables: ScoreVariableVariant[] = [];
  const scoreBands: ScoreBandVariant[] = [];
  const scoreFormulas: ScoreFormulaVariant[] = [];
  for (const source of sources) {
    ingestSource(
      source,
      snapshots,
      fieldVariants,
      scoreVariables,
      scoreBands,
      scoreFormulas,
      true,
    );
  }
  return assemble(
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    scoreFormulas,
    "sorted",
  );
}

/** Union two codebooks. Canonical properties follow `lastSeenAt`. */
export function mergeCodebooks(left: Codebook, right: Codebook): Codebook {
  const snapshots = new Map<string, CodebookSnapshot>();
  const fieldVariants = new Map<string, FieldVariant[]>();
  const scoreVariables: ScoreVariableVariant[] = [];
  const scoreBands: ScoreBandVariant[] = [];
  const scoreFormulas: ScoreFormulaVariant[] = [];
  collectFromCodebook(
    left,
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    scoreFormulas,
  );
  collectFromCodebook(
    right,
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    scoreFormulas,
  );
  return assemble(
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    scoreFormulas,
    "sorted",
  );
}

/**
 * Codebook of the **live** form. Not a response count — `snapshots[].n` is 0
 * and there is no `firstSeenAt` / `lastSeenAt`. Field order is the live
 * document order. `snapshots[0].key` is the live instrument hash.
 */
export async function liveCodebook(
  definition: FormSnapshot,
  options: { snapshotKeyCache?: SnapshotKeyCache } = {},
): Promise<Codebook> {
  const key = await snapshotKey(definition, options.snapshotKeyCache);
  const snapshots = new Map<string, CodebookSnapshot>();
  const fieldVariants = new Map<string, FieldVariant[]>();
  const scoreVariables: ScoreVariableVariant[] = [];
  const scoreBands: ScoreBandVariant[] = [];
  const scoreFormulas: ScoreFormulaVariant[] = [];
  ingestSource(
    { snapshotKey: key, definition },
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    scoreFormulas,
    false,
  );
  return assemble(
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    scoreFormulas,
    "live",
    definition.fields.map((field) => field.id),
  );
}

export { emptyCodebook };

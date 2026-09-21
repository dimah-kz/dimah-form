import {
  fieldLabel,
  fieldOptions,
  type FormField,
  type FormSnapshot,
} from "@dimah-form/core";

import { snapshotKey, type SnapshotKeyCache } from "./hash";
import {
  DATASET_SPEC,
  emptyCodebook,
  sortDatasetIds,
  type Codebook,
  type CodebookField,
  type CodebookLabelConflict,
  type CodebookOption,
  type CodebookScoreBand,
  type CodebookScoreVariable,
  type CodebookSnapshot,
  type CodebookTypeConflict,
} from "./spec";

export type CodebookSource = {
  snapshotKey: string;
  definition: FormSnapshot;
  seenAt?: string | null;
};

type FieldVariant = {
  snapshotKey: string;
  type: string;
  label: string;
  options?: CodebookOption[];
};

type ScoreVariableVariant = {
  snapshotKey: string;
  id: string;
  label?: string;
  min?: number;
  max?: number;
};

type ScoreBandVariant = {
  snapshotKey: string;
  variable: string;
  from?: number;
  to?: number;
  label: string;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  return value as Record<string, unknown>;
}

function asFinite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function scoringDocs(meta: unknown):
  | {
      variables: ScoreVariableVariant[];
      bands: ScoreBandVariant[];
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
      const next: Omit<ScoreVariableVariant, "snapshotKey"> = { id: record.id };
      if (typeof record.label === "string") next.label = record.label;
      const min = asFinite(record.min);
      const max = asFinite(record.max);
      if (min !== undefined) next.min = min;
      if (max !== undefined) next.max = max;
      variables.push(next);
    }
  }
  const bands: Omit<ScoreBandVariant, "snapshotKey">[] = [];
  if (Array.isArray(scoring.bands)) {
    for (const row of scoring.bands) {
      const record = asRecord(row);
      if (
        !record ||
        typeof record.variable !== "string" ||
        typeof record.label !== "string"
      ) {
        continue;
      }
      const next: Omit<ScoreBandVariant, "snapshotKey"> = {
        variable: record.variable,
        label: record.label,
      };
      const from = asFinite(record.from);
      const to = asFinite(record.to);
      if (from !== undefined) next.from = from;
      if (to !== undefined) next.to = to;
      bands.push(next);
    }
  }
  if (variables.length === 0 && bands.length === 0) return;
  return {
    variables: variables as ScoreVariableVariant[],
    bands: bands as ScoreBandVariant[],
  };
}

function codebookOptions(field: FormField): CodebookOption[] | undefined {
  const options = fieldOptions(field).map((option) => ({
    value: option.value,
    label: option.label,
  }));
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

function optionsKey(options: CodebookOption[] | undefined): string {
  return JSON.stringify(options ?? []);
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

function bumpSnapshot(
  map: Map<string, CodebookSnapshot>,
  key: string,
  seenAt?: string | null,
): void {
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

function finalizeField(
  id: string,
  variants: readonly FieldVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookField {
  const byKey = new Map<string, FieldVariant>();
  for (const variant of variants) {
    byKey.set(variant.snapshotKey, variant);
  }
  const inSnapshots = uniqueKeys([...byKey.keys()]);
  const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
  const newest = (newestKey ? byKey.get(newestKey) : undefined) ?? variants[0];
  const labelConflicts: CodebookLabelConflict[] = [];
  const typeConflicts: CodebookTypeConflict[] = [];
  for (const variant of byKey.values()) {
    if (variant.snapshotKey === newestKey) continue;
    if (
      variant.label !== newest.label ||
      optionsKey(variant.options) !== optionsKey(newest.options)
    ) {
      labelConflicts.push({
        snapshotKey: variant.snapshotKey,
        label: variant.label,
        ...(variant.options ? { options: variant.options } : {}),
      });
    }
    if (variant.type !== newest.type) {
      typeConflicts.push({
        snapshotKey: variant.snapshotKey,
        type: variant.type,
      });
    }
  }
  return {
    id,
    type: newest.type,
    label: newest.label,
    ...(newest.options ? { options: newest.options } : {}),
    inSnapshots,
    ...(labelConflicts.length > 0 ? { labelConflicts } : {}),
    ...(typeConflicts.length > 0 ? { typeConflicts } : {}),
  };
}

function finalizeScoreVariables(
  variants: readonly ScoreVariableVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookScoreVariable[] {
  const byId = new Map<string, ScoreVariableVariant[]>();
  for (const variant of variants) {
    const list = byId.get(variant.id) ?? [];
    list.push(variant);
    byId.set(variant.id, list);
  }
  const result: CodebookScoreVariable[] = [];
  for (const id of sortDatasetIds([...byId.keys()])) {
    const list = byId.get(id) ?? [];
    const inSnapshots = uniqueKeys(list.map((item) => item.snapshotKey));
    const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
    const newest =
      list.find((item) => item.snapshotKey === newestKey) ?? list[0];
    result.push({
      id,
      inSnapshots,
      ...(newest.label !== undefined ? { label: newest.label } : {}),
      ...(newest.min !== undefined ? { min: newest.min } : {}),
      ...(newest.max !== undefined ? { max: newest.max } : {}),
    });
  }
  return result;
}

function finalizeScoreBands(
  variants: readonly ScoreBandVariant[],
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): CodebookScoreBand[] {
  const byKey = new Map<string, ScoreBandVariant[]>();
  for (const variant of variants) {
    const key = `${variant.variable}\0${variant.label}`;
    const list = byKey.get(key) ?? [];
    list.push(variant);
    byKey.set(key, list);
  }
  const result: CodebookScoreBand[] = [];
  for (const list of byKey.values()) {
    const inSnapshots = uniqueKeys(list.map((item) => item.snapshotKey));
    const newestKey = pickNewestKey(inSnapshots, snapshots) ?? inSnapshots[0];
    const newest =
      list.find((item) => item.snapshotKey === newestKey) ?? list[0];
    result.push({
      variable: newest.variable,
      label: newest.label,
      inSnapshots,
      ...(newest.from !== undefined ? { from: newest.from } : {}),
      ...(newest.to !== undefined ? { to: newest.to } : {}),
    });
  }
  return result.sort(
    (a, b) =>
      a.variable.localeCompare(b.variable, "en", { numeric: true }) ||
      a.label.localeCompare(b.label, "en"),
  );
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

function variantsFromField(
  field: CodebookField,
  snapshots: ReadonlyMap<string, CodebookSnapshot>,
): FieldVariant[] {
  const newestKey =
    pickNewestKey(field.inSnapshots, snapshots) ?? field.inSnapshots[0];
  const variants: FieldVariant[] = [
    {
      snapshotKey: newestKey ?? field.id,
      type: field.type,
      label: field.label,
      options: field.options,
    },
  ];
  for (const conflict of field.labelConflicts ?? []) {
    variants.push({
      snapshotKey: conflict.snapshotKey,
      type: field.type,
      label: conflict.label,
      options: conflict.options ?? field.options,
    });
  }
  for (const conflict of field.typeConflicts ?? []) {
    const existing = variants.find(
      (item) => item.snapshotKey === conflict.snapshotKey,
    );
    if (existing) {
      existing.type = conflict.type;
      continue;
    }
    variants.push({
      snapshotKey: conflict.snapshotKey,
      type: conflict.type,
      label: field.label,
      options: field.options,
    });
  }
  return variants;
}

function collectFromCodebook(
  codebook: Codebook,
  snapshots: Map<string, CodebookSnapshot>,
  fieldVariants: Map<string, FieldVariant[]>,
  scoreVariables: ScoreVariableVariant[],
  scoreBands: ScoreBandVariant[],
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
  const snapMap = new Map(
    codebook.snapshots.map((snapshot) => [snapshot.key, snapshot]),
  );
  for (const field of codebook.fields) {
    const list = fieldVariants.get(field.id) ?? [];
    list.push(...variantsFromField(field, snapMap));
    fieldVariants.set(field.id, list);
  }
  for (const variable of codebook.scores?.variables ?? []) {
    for (const key of variable.inSnapshots) {
      scoreVariables.push({
        snapshotKey: key,
        id: variable.id,
        label: variable.label,
        min: variable.min,
        max: variable.max,
      });
    }
  }
  for (const band of codebook.scores?.bands ?? []) {
    for (const key of band.inSnapshots) {
      scoreBands.push({
        snapshotKey: key,
        variable: band.variable,
        from: band.from,
        to: band.to,
        label: band.label,
      });
    }
  }
}

function assemble(
  snapshots: Map<string, CodebookSnapshot>,
  fieldVariants: Map<string, FieldVariant[]>,
  scoreVariables: ScoreVariableVariant[],
  scoreBands: ScoreBandVariant[],
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
  const codebook: Codebook = {
    spec: DATASET_SPEC,
    snapshots: snapshotList(snapshots),
    fields,
  };
  if (variables.length > 0 || bands.length > 0) {
    codebook.scores = {
      variables,
      ...(bands.length > 0 ? { bands } : {}),
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
): void {
  bumpSnapshot(snapshots, source.snapshotKey, source.seenAt);
  for (const field of source.definition.fields) {
    const list = fieldVariants.get(field.id) ?? [];
    list.push({
      snapshotKey: source.snapshotKey,
      type: field.type,
      label: fieldLabel(field),
      options: codebookOptions(field),
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
}

/**
 * Historical codebook from snapshots that appear in the dataset.
 * Field order is sorted ids (stable across newest-first pagination).
 */
export function buildCodebook(sources: readonly CodebookSource[]): Codebook {
  const snapshots = new Map<string, CodebookSnapshot>();
  const fieldVariants = new Map<string, FieldVariant[]>();
  const scoreVariables: ScoreVariableVariant[] = [];
  const scoreBands: ScoreBandVariant[] = [];
  for (const source of sources) {
    ingestSource(source, snapshots, fieldVariants, scoreVariables, scoreBands);
  }
  return assemble(
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    "sorted",
  );
}

/** Union two codebooks. Canonical label/type/options follow `lastSeenAt`. */
export function mergeCodebooks(left: Codebook, right: Codebook): Codebook {
  const snapshots = new Map<string, CodebookSnapshot>();
  const fieldVariants = new Map<string, FieldVariant[]>();
  const scoreVariables: ScoreVariableVariant[] = [];
  const scoreBands: ScoreBandVariant[] = [];
  collectFromCodebook(
    left,
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
  );
  collectFromCodebook(
    right,
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
  );
  return assemble(
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    "sorted",
  );
}

/**
 * Codebook of the **live** form. Not historical — field order is the live
 * document order.
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
  ingestSource(
    { snapshotKey: key, definition },
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
  );
  return assemble(
    snapshots,
    fieldVariants,
    scoreVariables,
    scoreBands,
    "live",
    definition.fields.map((field) => field.id),
  );
}

export { emptyCodebook };

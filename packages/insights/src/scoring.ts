import type { FormAnswers, FormSnapshot } from "@dimah-form/core";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  return value as Record<string, unknown>;
}

/** Duck-typed `meta.scoring` — do not import `@dimah-form/scoring` here. */
export type InsightsScoringCatalog = {
  variableIds: string[];
  variableLabels: Map<string, string>;
  bandsByVariable: Map<string, string[]>;
};

export function emptyScoringCatalog(): InsightsScoringCatalog {
  return {
    variableIds: [],
    variableLabels: new Map(),
    bandsByVariable: new Map(),
  };
}

export function scoringCatalogFromMeta(
  meta: unknown,
): InsightsScoringCatalog | undefined {
  const scoring = asRecord(asRecord(meta)?.scoring);
  if (!scoring) return undefined;
  const variableIds: string[] = [];
  const variableLabels = new Map<string, string>();
  if (Array.isArray(scoring.variables)) {
    for (const row of scoring.variables) {
      const record = asRecord(row);
      if (!record || typeof record.id !== "string" || record.id.length === 0) {
        continue;
      }
      if (!variableIds.includes(record.id)) variableIds.push(record.id);
      if (typeof record.label === "string" && !variableLabels.has(record.id)) {
        variableLabels.set(record.id, record.label);
      }
    }
  }
  const bandsByVariable = new Map<string, string[]>();
  if (Array.isArray(scoring.bands)) {
    for (const row of scoring.bands) {
      const record = asRecord(row);
      if (
        !record ||
        typeof record.variable !== "string" ||
        typeof record.label !== "string" ||
        record.label.length === 0
      ) {
        continue;
      }
      const list = bandsByVariable.get(record.variable) ?? [];
      if (!list.includes(record.label)) list.push(record.label);
      bandsByVariable.set(record.variable, list);
    }
  }
  if (variableIds.length === 0 && bandsByVariable.size === 0) return undefined;
  return { variableIds, variableLabels, bandsByVariable };
}

/** First-wins merge: `into` keeps existing ids, labels, and band order. */
export function mergeScoringCatalog(
  into: InsightsScoringCatalog,
  from: InsightsScoringCatalog,
): void {
  for (const id of from.variableIds) {
    if (!into.variableIds.includes(id)) into.variableIds.push(id);
  }
  for (const [id, label] of from.variableLabels) {
    if (!into.variableLabels.has(id)) into.variableLabels.set(id, label);
  }
  for (const [id, labels] of from.bandsByVariable) {
    const list = into.bandsByVariable.get(id) ?? [];
    for (const label of labels) {
      if (!list.includes(label)) list.push(label);
    }
    into.bandsByVariable.set(id, list);
  }
}

type ScoreVariable = {
  raw: number | null;
  band?: string;
  complete: boolean;
  label?: string;
};

export type InsightsScores = {
  variables: Record<string, ScoreVariable>;
};

type ScoringApi = {
  hasScoringMeta: (definition: { meta?: unknown }) => boolean;
  scoreResponse: (
    definition: FormSnapshot,
    answers: FormAnswers,
  ) => InsightsScores;
};

let scoringModule: Promise<ScoringApi | undefined> | undefined;

function loadScoring(): Promise<ScoringApi | undefined> {
  if (!scoringModule) {
    scoringModule = import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      "@dimah-form/scoring"
    )
      .then((mod) => mod as ScoringApi)
      .catch(() => undefined);
  }
  return scoringModule;
}

export async function tryScoreResponse(
  definition: FormSnapshot,
  answers: FormAnswers,
): Promise<InsightsScores | undefined> {
  try {
    const scoring = await loadScoring();
    if (!scoring?.hasScoringMeta(definition)) return undefined;
    return scoring.scoreResponse(definition, answers);
  } catch {
    return undefined;
  }
}

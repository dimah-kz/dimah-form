import { readScoringFormMeta } from "@dimah-form/scoring/document";

export type InsightsScores = {
  variables: Record<
    string,
    {
      raw: number | null;
      band?: string;
      complete: boolean;
      label?: string;
    }
  >;
};

/** Variable and band order from {@link readScoringFormMeta}. */
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
  const form = readScoringFormMeta(meta);
  if (!form) return;
  const variableIds: string[] = [];
  const variableLabels = new Map<string, string>();
  for (const variable of form.variables) {
    if (!variableIds.includes(variable.id)) variableIds.push(variable.id);
    if (variable.label && !variableLabels.has(variable.id)) {
      variableLabels.set(variable.id, variable.label);
    }
  }
  const bandsByVariable = new Map<string, string[]>();
  for (const band of form.bands) {
    const list = bandsByVariable.get(band.variable) ?? [];
    if (!list.includes(band.label)) list.push(band.label);
    bandsByVariable.set(band.variable, list);
  }
  if (variableIds.length === 0 && bandsByVariable.size === 0) return;
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

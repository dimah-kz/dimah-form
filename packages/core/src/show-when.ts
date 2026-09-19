/** Keys the engine reads on a leaf `showWhen` rule. Extra keys are ignored at runtime. */
const SHOW_WHEN_LEAF_KEYS = new Set([
  "field",
  "equals",
  "notEquals",
  "includes",
]);

/** JSON scalar used in `equals` / `notEquals` / `includes` one-of lists. */
export function isJsonScalar(
  value: unknown,
): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export type ShowWhenCompare = {
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  includes?: unknown;
};

export type ShowWhenRule =
  ShowWhenCompare | { all: ShowWhenRule[] } | { any: ShowWhenRule[] };

export type ShowWhenField = {
  id: string;
  type: string;
  showWhen?: unknown;
};

export function asShowWhen(value: unknown): ShowWhenRule | undefined {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.all)) {
    const all = record.all
      .map((item) => asShowWhen(item))
      .filter((item): item is ShowWhenRule => item !== undefined);
    return all.length > 0 ? { all } : undefined;
  }
  if (Array.isArray(record.any)) {
    const any = record.any
      .map((item) => asShowWhen(item))
      .filter((item): item is ShowWhenRule => item !== undefined);
    return any.length > 0 ? { any } : undefined;
  }
  if (typeof record.field !== "string") return undefined;
  return {
    field: record.field,
    ...(record.equals !== undefined ? { equals: record.equals } : {}),
    ...(record.notEquals !== undefined ? { notEquals: record.notEquals } : {}),
    ...(record.includes !== undefined ? { includes: record.includes } : {}),
  };
}

function isScalarList(
  value: unknown,
): value is readonly (string | number | boolean | null)[] {
  return Array.isArray(value) && value.length > 0 && value.every(isJsonScalar);
}

/** `equals` is `Object.is`, or one-of when it is a non-empty scalar list. */
export function matchesEquals(sibling: unknown, expected: unknown): boolean {
  if (isScalarList(expected)) {
    return expected.some((item) => Object.is(sibling, item));
  }
  return Object.is(sibling, expected);
}

/** `notEquals` is the inverse of {@link matchesEquals}. */
export function matchesNotEquals(sibling: unknown, expected: unknown): boolean {
  return !matchesEquals(sibling, expected);
}

/**
 * `includes` matches one value inside an array sibling, or any-of when the
 * expected value is a non-empty scalar list.
 */
export function matchesIncludes(sibling: unknown, expected: unknown): boolean {
  if (!Array.isArray(sibling)) return false;
  if (isScalarList(expected)) {
    return expected.some((item) =>
      sibling.some((element) => Object.is(element, item)),
    );
  }
  return sibling.some((element) => Object.is(element, expected));
}

function compareMatches(rule: ShowWhenCompare, sibling: unknown): boolean {
  if (rule.equals !== undefined && !matchesEquals(sibling, rule.equals)) {
    return false;
  }
  if (
    rule.notEquals !== undefined &&
    !matchesNotEquals(sibling, rule.notEquals)
  ) {
    return false;
  }
  if (rule.includes !== undefined && !matchesIncludes(sibling, rule.includes)) {
    return false;
  }
  return true;
}

function ruleMatches(
  rule: ShowWhenRule,
  answers: Record<string, unknown>,
  fields: readonly ShowWhenField[] | undefined,
  visiting: Set<string>,
): boolean {
  if ("all" in rule) {
    return rule.all.every((item) =>
      ruleMatches(item, answers, fields, visiting),
    );
  }
  if ("any" in rule) {
    return rule.any.some((item) =>
      ruleMatches(item, answers, fields, visiting),
    );
  }
  if (fields) {
    const sibling = fields.find((item) => item.id === rule.field);
    if (sibling && !fieldIsVisible(sibling, answers, fields, visiting)) {
      return false;
    }
  }
  return compareMatches(rule, answers[rule.field]);
}

function fieldIsVisible(
  field: ShowWhenField,
  answers: Record<string, unknown>,
  fields: readonly ShowWhenField[] | undefined,
  visiting: Set<string>,
): boolean {
  const rule = asShowWhen(field.showWhen);
  if (!rule) return true;
  if (visiting.has(field.id)) return false;
  visiting.add(field.id);
  try {
    return ruleMatches(rule, answers, fields, visiting);
  } finally {
    visiting.delete(field.id);
  }
}

/**
 * True when `showWhen` is absent or the sibling answer matches.
 * Pass `fields` so a nested rule is hidden when its sibling is hidden.
 */
export function isFieldVisible(
  field: ShowWhenField,
  answers: Record<string, unknown>,
  fields?: readonly ShowWhenField[],
): boolean {
  return fieldIsVisible(field, answers, fields, new Set());
}

function cycleMessage(path: readonly string[], id: string): string {
  const start = path.indexOf(id);
  const members = (start === -1 ? path : path.slice(start)).map(
    (item) => `"${item}"`,
  );
  return `showWhen cycle involving ${members.join(", ")}`;
}

function collectRuleIssues(
  ownerId: string,
  raw: unknown,
  ids: Set<string>,
  byId: Map<string, ShowWhenField>,
  adj: Map<string, Set<string>>,
  issues: string[],
): void {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return;
  const record = raw as Record<string, unknown>;
  const hasAll = Array.isArray(record.all);
  const hasAny = Array.isArray(record.any);

  if (hasAll || hasAny) {
    if (hasAll && hasAny) {
      issues.push(`showWhen on "${ownerId}" cannot mix all and any`);
      return;
    }
    for (const key of Object.keys(record)) {
      if (key !== (hasAll ? "all" : "any")) {
        issues.push(`showWhen on "${ownerId}" has unknown key "${key}"`);
      }
    }
    const items = (hasAll ? record.all : record.any) as unknown[];
    if (items.length === 0) {
      issues.push(
        `showWhen on "${ownerId}" ${hasAll ? "all" : "any"} must not be empty`,
      );
      return;
    }
    for (const item of items) {
      collectRuleIssues(ownerId, item, ids, byId, adj, issues);
    }
    return;
  }

  for (const key of Object.keys(record)) {
    if (!SHOW_WHEN_LEAF_KEYS.has(key)) {
      issues.push(`showWhen on "${ownerId}" has unknown key "${key}"`);
    }
  }
  const rule = asShowWhen(raw);
  if (!rule || "all" in rule || "any" in rule) return;
  if (
    rule.equals === undefined &&
    rule.notEquals === undefined &&
    rule.includes === undefined
  ) {
    issues.push(
      `showWhen on "${ownerId}" requires equals, notEquals, or includes`,
    );
  }
  if (rule.field === ownerId) {
    issues.push(`showWhen on "${ownerId}" cannot reference itself`);
    return;
  }
  if (!ids.has(rule.field)) {
    issues.push(
      `showWhen on "${ownerId}" references unknown field "${rule.field}"`,
    );
    return;
  }
  const sibling = byId.get(rule.field);
  if (sibling?.type === "multiSelect") {
    if (rule.equals !== undefined) {
      issues.push(
        `showWhen on "${ownerId}" cannot use equals against multiSelect "${rule.field}"; use includes`,
      );
    }
    if (rule.notEquals !== undefined) {
      issues.push(
        `showWhen on "${ownerId}" cannot use notEquals against multiSelect "${rule.field}"; use includes`,
      );
    }
  }
  const edges = adj.get(ownerId) ?? new Set<string>();
  edges.add(rule.field);
  adj.set(ownerId, edges);
}

/**
 * Authoring issues for a live questionnaire. Stored response snapshots skip
 * this so old documents still load; runtime treats a bad target as hidden.
 */
export function collectShowWhenIssues(
  fields: readonly ShowWhenField[],
): string[] {
  const issues: string[] = [];
  const ids = new Set(fields.map((field) => field.id));
  const byId = new Map(fields.map((field) => [field.id, field]));
  const adj = new Map<string, Set<string>>();

  for (const field of fields) {
    if (field.showWhen == null) continue;
    collectRuleIssues(field.id, field.showWhen, ids, byId, adj, issues);
  }

  const state = new Map<string, "open" | "done">();
  const visit = (id: string, path: readonly string[]): void => {
    const current = state.get(id);
    if (current === "done") return;
    if (current === "open") {
      issues.push(cycleMessage(path, id));
      return;
    }
    state.set(id, "open");
    for (const next of adj.get(id) ?? []) visit(next, [...path, id]);
    state.set(id, "done");
  };
  for (const id of adj.keys()) visit(id, []);

  return issues;
}

export function showWhenListIssue(
  key: "equals" | "notEquals" | "includes",
  value: unknown,
): string | undefined {
  if (!Array.isArray(value)) return undefined;
  if (value.length === 0 || !value.every(isJsonScalar)) {
    return `showWhen ${key} array must be a non-empty list of strings, numbers, booleans, or null`;
  }
  return undefined;
}

/** Keys the engine reads on a `showWhen` rule. Extra keys are ignored at runtime. */
const SHOW_WHEN_KEYS = new Set(["field", "equals", "includes"]);

/** JSON scalar used in `equals` / `includes` one-of lists. */
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

export type ShowWhenRule = {
  field: string;
  equals?: unknown;
  includes?: unknown;
};

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
  if (typeof record.field !== "string") return undefined;
  return {
    field: record.field,
    ...(record.equals !== undefined ? { equals: record.equals } : {}),
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

function ruleMatches(rule: ShowWhenRule, sibling: unknown): boolean {
  if (rule.equals !== undefined && !matchesEquals(sibling, rule.equals)) {
    return false;
  }
  if (rule.includes !== undefined && !matchesIncludes(sibling, rule.includes)) {
    return false;
  }
  return true;
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
    if (fields) {
      const sibling = fields.find((item) => item.id === rule.field);
      if (sibling && !fieldIsVisible(sibling, answers, fields, visiting)) {
        return false;
      }
    }
    return ruleMatches(rule, answers[rule.field]);
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
  const adj = new Map<string, string>();

  for (const field of fields) {
    const raw = field.showWhen;
    if (raw == null) continue;
    if (typeof raw !== "object" || Array.isArray(raw)) continue;
    for (const key of Object.keys(raw)) {
      if (!SHOW_WHEN_KEYS.has(key)) {
        issues.push(`showWhen on "${field.id}" has unknown key "${key}"`);
      }
    }
    const rule = asShowWhen(raw);
    if (!rule) continue;
    if (rule.field === field.id) {
      issues.push(`showWhen on "${field.id}" cannot reference itself`);
      continue;
    }
    if (!ids.has(rule.field)) {
      issues.push(
        `showWhen on "${field.id}" references unknown field "${rule.field}"`,
      );
      continue;
    }
    const sibling = byId.get(rule.field);
    if (sibling?.type === "multiSelect" && rule.equals !== undefined) {
      issues.push(
        `showWhen on "${field.id}" cannot use equals against multiSelect "${rule.field}"; use includes`,
      );
    }
    adj.set(field.id, rule.field);
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
    const next = adj.get(id);
    if (next) visit(next, [...path, id]);
    state.set(id, "done");
  };
  for (const id of adj.keys()) visit(id, []);

  return issues;
}

export function showWhenListIssue(
  key: "equals" | "includes",
  value: unknown,
): string | undefined {
  if (!Array.isArray(value)) return undefined;
  if (value.length === 0 || !value.every(isJsonScalar)) {
    return `showWhen ${key} array must be a non-empty list of strings, numbers, booleans, or null`;
  }
  return undefined;
}

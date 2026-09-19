import { describe, expect, it } from "vitest";
import type { FormField } from "@dimah-form/react";

import {
  fieldStepKey,
  groupFieldsBySection,
  groupFieldsByStep,
  selectVisibleFields,
  shouldGroupBySection,
} from "@/lib/field-groups";

function field(
  over: Partial<FormField> & Pick<FormField, "id" | "type">,
): FormField {
  return over;
}

describe("selectVisibleFields", () => {
  const fields = [
    field({ id: "a", type: "text" }),
    field({ id: "b", type: "text" }),
    field({ id: "c", type: "text" }),
  ];

  it("filters by id list and predicate", () => {
    expect(
      selectVisibleFields(fields, {
        ids: ["c", "a"],
        filter: (item) => item.id !== "c",
      }).map((item) => item.id),
    ).toEqual(["a"]);
  });

  it("returns none when the id list is empty", () => {
    expect(selectVisibleFields(fields, { ids: [] })).toEqual([]);
  });
});

describe("groupFieldsBySection", () => {
  it("keeps untitled fields together and preserves first-seen order", () => {
    const groups = groupFieldsBySection([
      field({ id: "name", type: "text" }),
      field({ id: "role", type: "select", meta: { section: "Work" } }),
      field({ id: "team", type: "text", meta: { section: "Work" } }),
      field({ id: "ok", type: "boolean", meta: { section: "Legal" } }),
    ]);
    expect(
      groups.map((group) => [group.title, group.fields.map((item) => item.id)]),
    ).toEqual([
      [undefined, ["name"]],
      ["Work", ["role", "team"]],
      ["Legal", ["ok"]],
    ]);
    expect(shouldGroupBySection(groups.flatMap((group) => group.fields))).toBe(
      true,
    );
  });
});

describe("groupFieldsByStep", () => {
  it("defaults missing step to 1 and sorts numeric keys", () => {
    const groups = groupFieldsByStep([
      field({ id: "late", type: "text", meta: { step: 10 } }),
      field({ id: "name", type: "text" }),
      field({ id: "role", type: "select", meta: { step: 2 } }),
      field({ id: "team", type: "text", meta: { step: "2" } }),
    ]);
    expect(
      groups.map((group) => [group.key, group.fields.map((item) => item.id)]),
    ).toEqual([
      ["1", ["name"]],
      ["2", ["role", "team"]],
      ["10", ["late"]],
    ]);
  });

  it("keeps named steps after numeric ones", () => {
    expect(
      fieldStepKey(field({ id: "a", type: "text", meta: { step: "review" } })),
    ).toBe("review");
    const groups = groupFieldsByStep([
      field({ id: "b", type: "text", meta: { step: "review" } }),
      field({ id: "a", type: "text", meta: { step: 1 } }),
    ]);
    expect(groups.map((group) => group.key)).toEqual(["1", "review"]);
  });

  it("uses meta.stepTitle as the group title", () => {
    const groups = groupFieldsByStep([
      field({
        id: "name",
        type: "text",
        meta: { step: 1, stepTitle: "About you" },
      }),
      field({ id: "role", type: "select", meta: { step: 1 } }),
    ]);
    expect(groups[0]?.title).toBe("About you");
    expect(groups[0]?.key).toBe("1");
  });
});

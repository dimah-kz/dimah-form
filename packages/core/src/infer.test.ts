import { describe, expect, expectTypeOf, it } from "vitest";

import { defineFieldType, defineForm } from "./define";
import type { InferFormAnswers } from "./infer";

const contact = defineForm({
  title: "Contact",
  fields: [
    { id: "name", type: "text", required: true },
    { id: "age", type: "number" },
    { id: "email", type: "email", required: true },
    { id: "born", type: "date" },
    { id: "ok", type: "boolean", required: true },
    {
      id: "role",
      type: "select",
      options: [{ value: "eng" }],
    },
    {
      id: "skills",
      type: "multiSelect",
      options: [{ value: "ts" }],
    },
  ],
});

const rating = defineFieldType({
  type: "rating",
  validate: () => undefined,
  $Infer: 0 as number,
});

const scored = defineForm({
  title: "Scored",
  fields: [{ id: "score", type: "rating", required: true }],
});

describe("InferFormAnswers", () => {
  it("maps builtin field types from $Infer", () => {
    expect(contact.fields[0]?.id).toBe("name");
    expectTypeOf<InferFormAnswers<typeof contact>>().toEqualTypeOf<{
      name: string;
      age: number | undefined;
      email: string;
      born: string | undefined;
      ok: boolean;
      role: string | undefined;
      skills: string[] | undefined;
    }>();
  });

  it("maps custom field types from $Infer", () => {
    expect(rating.type).toBe("rating");
    expect(scored.fields[0]?.id).toBe("score");
    expectTypeOf<
      InferFormAnswers<typeof scored, readonly [typeof rating]>
    >().toEqualTypeOf<{
      score: number;
    }>();
  });
});

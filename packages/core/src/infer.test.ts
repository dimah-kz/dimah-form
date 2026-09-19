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

const job = defineForm({
  title: "Job",
  fields: [
    { id: "employed", type: "boolean", required: true },
    {
      id: "company",
      type: "text",
      required: true,
      showWhen: { field: "employed", equals: true },
    },
  ],
});

describe("InferFormAnswers", () => {
  it("maps builtin field types from $Infer", () => {
    expect(contact.fields[0]?.id).toBe("name");
    expectTypeOf<InferFormAnswers<typeof contact>>().toEqualTypeOf<{
      name: string;
      email: string;
      ok: boolean;
      age?: number;
      born?: string;
      role?: "eng";
      skills?: "ts"[];
    }>();
    expectTypeOf({
      name: "Ada",
      email: "ada@example.com",
      ok: true,
    }).toMatchTypeOf<InferFormAnswers<typeof contact>>();
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

  it("omits required keys that have showWhen", () => {
    expect(job.fields[1]?.id).toBe("company");
    expectTypeOf<InferFormAnswers<typeof job>>().toEqualTypeOf<{
      employed: boolean;
      company?: string;
    }>();
  });
});

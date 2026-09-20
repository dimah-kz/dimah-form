import { describe, expect, expectTypeOf, it } from "vitest";
import * as z from "zod";

import { createDefineForm, defineFieldType, defineForm } from "./define";
import type { FieldDocumentFor, InferFieldDocument } from "./form-definition";
import type { InferFormAnswers } from "./infer";

const rating = defineFieldType({
  type: "rating",
  fieldSchema: z.looseObject({
    type: z.literal("rating"),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  validate: () => undefined,
  $Infer: 0 as number,
});

const handle = defineFieldType({
  type: "handle",
  validate: () => undefined,
  $Infer: "" as string,
});

describe("FieldDocumentFor", () => {
  it("types builtin keys and custom fieldSchema keys", () => {
    expect(handle.type).toBe("handle");
    ({ id: "name", type: "text", minLength: 2 }) satisfies FieldDocumentFor;
    ({
      id: "role",
      type: "select",
      options: [{ value: "eng" }],
    }) satisfies FieldDocumentFor;
    type RatingField = Extract<
      FieldDocumentFor<readonly [typeof rating]>,
      { type: "rating" }
    >;
    expectTypeOf<RatingField["max"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<InferFieldDocument<typeof rating>["max"]>().toEqualTypeOf<
      number | undefined
    >();
    ({
      id: "score",
      type: "rating",
      max: 5,
    }) satisfies FieldDocumentFor<readonly [typeof rating]>;
    ({
      id: "n",
      type: "handle",
      pattern: "^@",
    }) satisfies FieldDocumentFor<readonly [typeof handle]>;
  });
});

describe("createDefineForm", () => {
  it("parses like defineForm", () => {
    const defineAppForm = createDefineForm({ fieldTypes: [rating] });
    const form = defineAppForm({
      title: "Scored",
      fields: [{ id: "score", type: "rating", required: true, max: 5 }],
    });
    expect(form.fields[0]?.id).toBe("score");
    expect(() => defineAppForm({ title: "", fields: [] })).toThrow();
  });

  it("keeps answer $Infer and option literals", () => {
    const defineAppForm = createDefineForm({ fieldTypes: [rating] });
    const form = defineAppForm({
      title: "Scored",
      fields: [
        { id: "score", type: "rating", required: true, max: 5 },
        {
          id: "role",
          type: "select",
          options: [{ value: "eng" }],
        },
      ],
    });
    expect(form.title).toBe("Scored");
    expectTypeOf<
      InferFormAnswers<typeof form, readonly [typeof rating]>
    >().toEqualTypeOf<{
      score: number;
      role?: "eng";
    }>();
  });

  it("does not replace defineForm for unknown types", () => {
    const form = defineForm({
      title: "Intake",
      fields: [{ id: "file", type: "file", required: true }],
    });
    expect(form.fields[0]?.type).toBe("file");
  });
});

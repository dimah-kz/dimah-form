import { describe, expect, it } from "vitest";
import * as z from "zod";

import { defineForm, isFormErrorCode } from "@dimah-form/core";

import { dimahForm } from "./dimah-form";
import { memoryAdapter } from "./store";
import {
  apiUrl,
  createInstance,
  expectErrorCode,
  FORM_API_ROUTES,
  FORM_ERROR_CODES,
  jsonRequest,
} from "./test/harness";

describe("live catalog", () => {
  it("reads and writes dynamic forms from the database", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const intake = {
      id: "intake",
      title: "Intake",
      fields: [{ id: "name", type: "text" as const, required: true }],
    };

    await expect(
      form.api.getForm({ query: { formId: "intake" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );

    const saved = await form.api.saveForm({ body: intake });
    expect(saved).toMatchObject({
      ...intake,
      slug: "intake",
      status: "active",
    });
    expect(saved.createdAt).toEqual(expect.any(String));
    expect(saved.updatedAt).toEqual(expect.any(String));
    await expect(
      form.api.getForm({ query: { formId: "intake" } }),
    ).resolves.toMatchObject({
      ...intake,
      slug: "intake",
      status: "active",
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });

    const listed = await form.api.listForms({});
    expect(listed.forms).toHaveLength(1);
    expect(listed.forms[0]).toMatchObject({
      ...intake,
      slug: "intake",
      status: "active",
    });
    expect(listed.nextOffset).toBeNull();

    const started = await form.api.startResponse({
      body: { formId: "intake", respondentId: "user-1" },
    });
    expect(started.respondentId).toBe("user-1");
    expect(started.definition.title).toBe("Intake");

    const listedResponses = await form.api.listResponses({
      query: { formId: "intake" },
    });
    expect(listedResponses.responses.map((row) => row.id)).toEqual([
      started.id,
    ]);
    await expect(
      form.api.listResponses({
        query: { formId: "intake", respondentId: "user-1" },
      }),
    ).resolves.toMatchObject({ responses: [{ id: started.id }] });
    await expect(
      form.api.listResponses({
        query: { formId: "intake", respondentId: "other" },
      }),
    ).resolves.toMatchObject({ responses: [] });
  });

  it("round-trips meta on builtin fields", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const withHints = {
      id: "hints",
      title: "Hints",
      fields: [
        {
          id: "name",
          type: "text" as const,
          required: true,
          meta: { placeholder: "Ada" },
        },
      ],
    };
    await expect(form.api.saveForm({ body: withHints })).resolves.toMatchObject(
      {
        ...withHints,
        slug: "hints",
        status: "active",
      },
    );
    await expect(
      form.api.getForm({ query: { formId: "hints" } }),
    ).resolves.toMatchObject({
      ...withHints,
      slug: "hints",
      status: "active",
    });
  });

  it("rejects unknown keys on builtin fields", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await expect(
      form.api.saveForm({
        body: {
          id: "hints",
          title: "Hints",
          fields: [
            { id: "name", type: "text", required: true, placeholder: "Ada" },
          ],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
  });

  it("round-trips description and meta on the form document", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const withCopy = {
      id: "copy",
      title: "Copy",
      description: "Shown in the consumer UI",
      meta: { locale: "en" },
      fields: [{ id: "n", type: "text" as const }],
    };
    await expect(form.api.saveForm({ body: withCopy })).resolves.toMatchObject({
      description: "Shown in the consumer UI",
      meta: { locale: "en" },
      slug: "copy",
      status: "active",
    });
    await expect(
      form.api.getForm({ query: { formId: "copy" } }),
    ).resolves.toMatchObject({
      description: "Shown in the consumer UI",
      meta: { locale: "en" },
    });
  });

  it("validates form and field meta against dimahForm metaSchema", async () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        metaSchema: {
          form: z.object({ locale: z.string() }),
        },
        forms: {
          copy: defineForm({
            title: "Copy",
            fields: [{ id: "n", type: "text" }],
          }),
        },
      }),
    ).toThrow(/Invalid form "copy"/);

    const form = dimahForm({
      database: memoryAdapter(),
      metaSchema: {
        form: z.object({ locale: z.string() }),
        field: z.object({ placeholder: z.string().optional() }),
        option: z.object({ icon: z.string().optional() }),
      },
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "copy",
          title: "Copy",
          meta: { locale: "en" },
          fields: [
            {
              id: "role",
              type: "select",
              options: [{ value: "eng", meta: { icon: "cpu" } }],
            },
          ],
        },
      }),
    ).resolves.toMatchObject({ meta: { locale: "en" } });
    await expect(
      form.api.saveForm({
        body: {
          id: "bad",
          title: "Bad",
          fields: [{ id: "n", type: "text", meta: { placeholder: 1 } }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
  });

  it("prefers code-authored forms and refuses to overwrite them", async () => {
    const form = createInstance();
    const listed = await form.api.listForms({});
    expect(listed.forms.some((item) => item.id === "onboarding")).toBe(true);
    const archived = await form.api.listForms({
      query: { status: "archived" },
    });
    expect(archived.forms.some((item) => item.id === "onboarding")).toBe(false);

    const res = await form.handler(
      jsonRequest(apiUrl(FORM_API_ROUTES.form), {
        body: { id: "onboarding", title: "Nope", fields: [] },
      }),
    );
    await expectErrorCode(res, 409, FORM_ERROR_CODES.CODE_AUTHORED_FORM);
  });

  it("does not rewrite a stored live form when starting a code-authored response", async () => {
    const database = memoryAdapter();
    await database.saveForm({
      id: "onboarding",
      slug: "onboarding",
      status: "active",
      title: "From DB",
      fields: [{ id: "name", type: "text" }],
    });
    const form = createInstance({ database });
    const live = await form.api.getForm({ query: { formId: "onboarding" } });
    expect(live.title).toBe("Onboarding");
    await form.api.startResponse({ body: { formId: "onboarding" } });
    expect((await database.getForm("onboarding"))?.title).toBe("From DB");
  });

  it("applies fieldSchema at init and saveForm", async () => {
    const rating = {
      type: "rating" as const,
      fieldSchema: z.looseObject({
        type: z.literal("rating"),
        max: z.number(),
      }),
      validate: () => undefined,
      $Infer: 0 as number,
    };
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        fieldTypes: [rating],
        forms: {
          scored: defineForm({
            title: "Scored",
            fields: [{ id: "score", type: "rating" }],
          }),
        },
      }),
    ).toThrow(/Invalid form "scored"/);

    const form = dimahForm({
      database: memoryAdapter(),
      fieldTypes: [rating],
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "scored",
          title: "Scored",
          fields: [{ id: "score", type: "rating" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
    await expect(
      form.api.saveForm({
        body: {
          id: "scored",
          title: "Scored",
          fields: [{ id: "score", type: "rating", max: 5 }],
        },
      }),
    ).resolves.toMatchObject({
      fields: [{ id: "score", type: "rating", max: 5 }],
    });
  });

  it("rejects saveForm with an unknown field type", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await expect(
      form.api.saveForm({
        body: {
          id: "x",
          title: "X",
          fields: [{ id: "f", type: "file" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FIELD_TYPE"),
    );
  });

  it("keeps createdAt when updating a live form", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const saved = await form.api.saveForm({
      body: {
        id: "intake",
        title: "Intake",
        fields: [{ id: "n", type: "text" }],
      },
    });
    const updated = await form.api.saveForm({
      body: {
        id: "intake",
        title: "Intake v2",
        fields: [{ id: "n", type: "text" }],
        createdAt: saved.createdAt,
      },
    });
    expect(updated.createdAt).toBe(saved.createdAt);
    expect(updated.title).toBe("Intake v2");
  });
});

describe("slug and list", () => {
  it("looks up a form by slug", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      forms: {
        onboarding: defineForm({
          title: "Onboarding",
          slug: "join",
          fields: [{ id: "name", type: "text", required: true }],
        }),
      },
    });
    await expect(
      form.api.getForm({ query: { formId: "join" } }),
    ).resolves.toMatchObject({ id: "onboarding", slug: "join" });
  });

  it("looks up a stored form by slug for get and start", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "intake",
        slug: "join",
        title: "Intake",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await expect(
      form.api.getForm({ query: { formId: "join" } }),
    ).resolves.toMatchObject({ id: "intake", slug: "join" });
    const started = await form.api.startResponse({
      body: { formId: "join" },
    });
    expect(started.formId).toBe("intake");
    expect(started.definition.id).toBe("intake");
  });

  it("rejects a taken slug", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "one",
        slug: "join",
        title: "One",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "two",
          slug: "join",
          title: "Two",
          fields: [{ id: "n", type: "text" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "SLUG_TAKEN"),
    );
  });

  it("rejects a slug that collides with a code-authored form", async () => {
    const form = createInstance();
    await expect(
      form.api.saveForm({
        body: {
          id: "other",
          slug: "onboarding",
          title: "Other",
          fields: [{ id: "n", type: "text" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "SLUG_TAKEN"),
    );
  });

  it("lists response summaries without answers by default", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await form.api.saveDraft({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    const listed = await form.api.listResponses({
      query: { formId: "onboarding" },
    });
    expect(listed.responses[0]).toMatchObject({
      id: started.id,
      status: "draft",
    });
    expect(listed.responses[0]).not.toHaveProperty("answers");
    const full = await form.api.listResponses({
      query: { formId: "onboarding", include: "full" },
    });
    expect(full.responses[0]).toMatchObject({ answers: { name: "Ada" } });
  });

  it("filters listForms and listResponses by status", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "open",
        title: "Open",
        status: "active",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await form.api.saveForm({
      body: {
        id: "closed",
        title: "Closed",
        status: "archived",
        fields: [{ id: "n", type: "text" }],
      },
    });
    const archived = await form.api.listForms({
      query: { status: "archived" },
    });
    expect(archived.forms.map((item) => item.id)).toEqual(["closed"]);

    const started = await form.api.startResponse({
      body: { formId: "open" },
    });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { n: "Ada" } },
    });
    const submitted = await form.api.listResponses({
      query: { formId: "open", status: "submitted" },
    });
    expect(submitted.responses.map((item) => item.id)).toEqual([started.id]);
    const drafts = await form.api.listResponses({
      query: { formId: "open", status: "draft" },
    });
    expect(drafts.responses).toEqual([]);
  });

  it("paginates listForms and listResponses with nextOffset", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "a",
        title: "A",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await form.api.saveForm({
      body: {
        id: "b",
        title: "B",
        fields: [{ id: "n", type: "text" }],
      },
    });
    const page = await form.api.listForms({ query: { limit: 1, offset: 0 } });
    expect(page.forms).toHaveLength(1);
    expect(page.nextOffset).toBe(1);
    const rest = await form.api.listForms({
      query: { limit: 1, offset: page.nextOffset ?? 0 },
    });
    expect(rest.forms).toHaveLength(1);
    expect(rest.nextOffset).toBeNull();

    await form.api.startResponse({ body: { formId: "a" } });
    await form.api.startResponse({ body: { formId: "b" } });
    const responses = await form.api.listResponses({
      query: { limit: 1, offset: 0 },
    });
    expect(responses.responses).toHaveLength(1);
    expect(responses.nextOffset).toBe(1);
  });

  it("skips invalid stored forms when listing", async () => {
    const database = memoryAdapter();
    await database.saveForm({
      id: "broken",
      slug: "broken",
      status: "active",
      title: "Broken",
      fields: [{ id: "x", type: "not-a-type" }],
    });
    const form = createInstance({ database });
    const listed = await form.api.listForms({});
    expect(listed.forms.some((item) => item.id === "broken")).toBe(false);
    expect(listed.forms.some((item) => item.id === "onboarding")).toBe(true);
  });
});

describe("delete form", () => {
  it("deletes a dynamic form with no responses", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "temp",
        title: "Temp",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await expect(
      form.api.deleteForm({ body: { formId: "temp" } }),
    ).resolves.toEqual({ ok: true, formId: "temp" });
    await expect(
      form.api.getForm({ query: { formId: "temp" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );
  });

  it("refuses to delete a form that still has responses", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "temp",
        title: "Temp",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await form.api.startResponse({ body: { formId: "temp" } });
    await expect(
      form.api.deleteForm({ body: { formId: "temp" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "FORM_HAS_RESPONSES"),
    );
  });

  it("refuses to delete a code-authored form", async () => {
    const form = createInstance();
    await expect(
      form.api.deleteForm({ body: { formId: "onboarding" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "CODE_AUTHORED_FORM"),
    );
  });
});

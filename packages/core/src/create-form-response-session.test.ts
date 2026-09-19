import { describe, expect, it, vi } from "vitest";

import { APIError, FORM_ERROR_CODES } from "./error";
import { createFieldTypeRegistry } from "./field-types";
import { defineFieldType, defineForm } from "./define";
import {
  createFormResponseSession,
  type FormResponseSessionClient,
} from "./create-form-response-session";
import type { FormSnapshot } from "./schema/definition";
import type { ResponseRecord } from "./schema/protocol";

const snapshot: FormSnapshot = {
  id: "feedback",
  slug: "feedback",
  status: "active",
  ...defineForm({
    title: "Feedback",
    fields: [
      { id: "name", type: "text", required: true, minLength: 2 },
      {
        id: "role",
        type: "select",
        defaultValue: "eng",
        options: [{ value: "eng" }, { value: "pm" }],
      },
      {
        id: "team",
        type: "text",
        showWhen: { field: "role", equals: "eng" },
      },
    ],
  }),
};

function row(over: Partial<ResponseRecord> = {}): ResponseRecord {
  return {
    id: "res-1",
    formId: snapshot.id,
    status: "draft",
    definition: snapshot,
    answers: { role: "eng" },
    respondentId: null,
    submittedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function mockClient(
  over: Partial<FormResponseSessionClient> = {},
): FormResponseSessionClient {
  return {
    startResponse: vi.fn(async () => row()),
    getResponse: vi.fn(async () => row()),
    saveDraft: vi.fn(async (payload) =>
      row({
        answers: { role: "eng", ...payload.answers },
        updatedAt: "2026-01-01T00:00:01.000Z",
      }),
    ),
    submitResponse: vi.fn(async (payload) =>
      row({
        status: "submitted",
        answers: payload.answers ?? { role: "eng" },
        submittedAt: "2026-01-01T00:00:02.000Z",
        updatedAt: "2026-01-01T00:00:02.000Z",
      }),
    ),
    reopenResponse: vi.fn(async () =>
      row({ status: "draft", updatedAt: "2026-01-01T00:00:03.000Z" }),
    ),
    abandonResponse: vi.fn(async () =>
      row({ status: "abandoned", updatedAt: "2026-01-01T00:00:04.000Z" }),
    ),
    ...over,
  };
}

describe("createFormResponseSession", () => {
  it("seeds defaults and strips hidden answers on change", () => {
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot,
    });
    expect(session.getState().answers).toEqual({ role: "eng" });
    expect(session.getState().visibleFields.map((field) => field.id)).toEqual([
      "name",
      "role",
      "team",
    ]);

    session.setAnswer("team", "Platform");
    session.setAnswer("role", "pm");
    expect(session.getState().answers).toEqual({ role: "pm" });
    expect(session.getState().visibleFields.map((field) => field.id)).toEqual([
      "name",
      "role",
    ]);
    expect(session.getState().dirty).toBe(true);
  });

  it("blocks submit locally before touching the network", async () => {
    const client = mockClient();
    const session = createFormResponseSession({ client, snapshot });
    const submitted = await session.submit();
    expect(submitted).toBeUndefined();
    expect(session.getState().issues).toEqual({ name: "Required" });
    expect(client.startResponse).not.toHaveBeenCalled();
    expect(client.submitResponse).not.toHaveBeenCalled();
  });

  it("starts then saves a draft patch, including nulls for hidden keys", async () => {
    const client = mockClient();
    const onStarted = vi.fn();
    const onSaved = vi.fn();
    const session = createFormResponseSession({
      client,
      snapshot,
      respondentId: () => "user-1",
      onStarted,
      onSaved,
    });
    session.setAnswer("name", "Ada");
    session.setAnswer("team", "Platform");
    session.setAnswer("role", "pm");

    const saved = await session.saveDraft();
    expect(client.startResponse).toHaveBeenCalledWith({
      formId: "feedback",
      respondentId: "user-1",
    });
    expect(client.saveDraft).toHaveBeenCalledWith({
      responseId: "res-1",
      answers: { name: "Ada", role: "pm" },
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(saved?.id).toBe("res-1");
    expect(onStarted).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
    expect(session.getState().dirty).toBe(false);
    expect(session.getState().pending).toBeUndefined();
  });

  it("submits the full answers object after start", async () => {
    const client = mockClient();
    const onSubmitted = vi.fn();
    const session = createFormResponseSession({
      client,
      snapshot,
      onSubmitted,
    });
    session.setAnswer("name", "Ada");
    const submitted = await session.submit();
    expect(client.submitResponse).toHaveBeenCalledWith({
      responseId: "res-1",
      answers: { role: "eng", name: "Ada" },
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(submitted?.status).toBe("submitted");
    expect(session.getState().locked).toBe(true);
    expect(onSubmitted).toHaveBeenCalled();
    expect(session.field("name").disabled).toBe(true);
  });

  it("strips nested hidden answers on hydrate and treats required as visible-only", () => {
    const nested: FormSnapshot = {
      id: "job",
      slug: "job",
      status: "active",
      title: "Job",
      fields: [
        { id: "a", type: "text" },
        {
          id: "b",
          type: "text",
          required: true,
          showWhen: { field: "a", equals: "yes" },
        },
        {
          id: "c",
          type: "text",
          required: true,
          showWhen: { field: "b", equals: "ok" },
        },
      ],
    };
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot: nested,
      response: row({
        definition: nested,
        answers: { a: "no", b: "ok", c: "keep" },
      }),
    });
    expect(session.getState().answers).toEqual({ a: "no" });
    expect(session.getState().visibleFields.map((field) => field.id)).toEqual([
      "a",
    ]);
    expect(session.field("b").visible).toBe(false);
    expect(session.field("b").required).toBe(false);
    expect(session.field("c").required).toBe(false);

    session.setAnswer("a", "yes");
    session.setAnswer("b", "ok");
    expect(session.field("c").visible).toBe(true);
    expect(session.field("c").required).toBe(true);
  });

  it("refetches on STALE_UPDATE", async () => {
    const fresh = row({
      answers: { role: "pm", name: "Lin" },
      updatedAt: "2026-01-01T00:00:09.000Z",
    });
    const client = mockClient({
      saveDraft: vi.fn(async () => {
        throw APIError.from("CONFLICT", FORM_ERROR_CODES.STALE_UPDATE);
      }),
      getResponse: vi.fn(async () => fresh),
    });
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row(),
    });
    session.setAnswer("name", "Ada");
    await session.saveDraft();
    expect(client.getResponse).toHaveBeenCalledWith({ responseId: "res-1" });
    expect(session.getState().answers).toEqual({ role: "pm", name: "Lin" });
    expect(session.getState().error).toBe("Response was updated");
    expect(session.getState().dirty).toBe(false);
  });

  it("maps VALIDATION_ERROR issues from the server", async () => {
    const client = mockClient({
      saveDraft: vi.fn(async () => {
        throw APIError.from("BAD_REQUEST", {
          ...FORM_ERROR_CODES.VALIDATION_ERROR,
          issues: [{ field: "name", message: "Expected a string" }],
        });
      }),
    });
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row(),
    });
    await session.saveDraft();
    expect(session.getState().issues).toEqual({
      name: "Expected a string",
    });
    expect(session.getState().error).toBeUndefined();
  });

  it("does not start an inactive form", async () => {
    const client = mockClient();
    const session = createFormResponseSession({
      client,
      snapshot: { ...snapshot, status: "archived" },
    });
    expect(session.getState().inactive).toBe(true);
    await session.saveDraft();
    expect(client.startResponse).not.toHaveBeenCalled();
    expect(session.getState().error).toBe("Form is not active");
  });

  it("sends null for a field that became hidden since last save", async () => {
    const client = mockClient();
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row({ answers: { role: "eng", team: "Platform" } }),
    });
    session.setAnswer("role", "pm");
    await session.saveDraft();
    expect(client.saveDraft).toHaveBeenCalledWith({
      responseId: "res-1",
      answers: { role: "pm", team: null },
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("reopens a locked row", async () => {
    const client = mockClient();
    const onReopened = vi.fn();
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row({ status: "submitted" }),
      onReopened,
    });
    expect(session.getState().locked).toBe(true);
    session.setAnswer("name", "Ada");
    expect(session.getState().answers).toEqual({ role: "eng" });
    expect(session.getState().dirty).toBe(false);
    await session.saveDraft();
    expect(client.saveDraft).not.toHaveBeenCalled();
    await session.reopen();
    expect(client.reopenResponse).toHaveBeenCalled();
    expect(onReopened).toHaveBeenCalled();
    expect(session.getState().status).toBe("draft");
    expect(session.getState().locked).toBe(false);
  });

  it("uses a custom field type registry", async () => {
    const rating = defineFieldType({
      type: "rating",
      validate: (value) => (value === 5 ? undefined : "Expected 5"),
      $Infer: 0 as number,
    });
    const rated: FormSnapshot = {
      ...snapshot,
      fields: [{ id: "score", type: "rating", required: true }],
    };
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot: rated,
      fieldTypes: [rating],
    });
    session.setAnswer("score", 3);
    await session.submit();
    expect(session.getState().issues).toEqual({ score: "Expected 5" });

    session.setAnswer("score", 5);
    const client = mockClient();
    session.sync({ client });
    await session.submit();
    expect(client.submitResponse).toHaveBeenCalled();
  });

  it("revalidates on change after a failed submit", async () => {
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot,
    });
    await session.submit();
    expect(session.getState().issues.name).toBe("Required");
    session.setAnswer("name", "Ada");
    expect(session.getState().issues.name).toBeUndefined();
  });

  it("accepts a prepared registry Map", () => {
    const registry = createFieldTypeRegistry();
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot,
      fieldTypes: registry,
    });
    session.setAnswer("name", 1);
    session.validate("draft");
    expect(session.getState().issues).toEqual({
      name: "Expected a string",
    });
  });

  it("patches answers and notifies subscribers", () => {
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot,
    });
    const listener = vi.fn();
    const stop = session.subscribe(listener);
    session.setAnswers({ name: "Ada", role: "pm" });
    expect(session.getState().answers).toEqual({ name: "Ada", role: "pm" });
    expect(listener).toHaveBeenCalled();
    stop();
    session.setAnswer("name", "Bob");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("validates on change when configured", () => {
    const session = createFormResponseSession({
      client: mockClient(),
      snapshot,
      validate: "change",
    });
    session.setAnswer("name", "A");
    expect(session.getState().issues.name).toBe(
      "Must be at least 2 characters",
    );
  });

  it("uses client.fieldTypes when the session omits a registry", () => {
    const rating = defineFieldType({
      type: "rating",
      validate: (value) => (value === 5 ? undefined : "Expected 5"),
      $Infer: 0 as number,
    });
    const session = createFormResponseSession({
      client: mockClient({ fieldTypes: [rating] }),
      snapshot: {
        ...snapshot,
        fields: [{ id: "score", type: "rating", required: true }],
      },
    });
    session.setAnswer("score", 3);
    session.validate("draft");
    expect(session.getState().issues).toEqual({ score: "Expected 5" });
  });

  it("abandons a draft row", async () => {
    const client = mockClient();
    const onAbandoned = vi.fn();
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row(),
      onAbandoned,
    });
    await session.abandon();
    expect(client.abandonResponse).toHaveBeenCalledWith({
      responseId: "res-1",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(onAbandoned).toHaveBeenCalled();
    expect(session.getState().status).toBe("abandoned");
    expect(session.getState().locked).toBe(true);
  });

  it("does not abandon before a response exists", async () => {
    const client = mockClient();
    const session = createFormResponseSession({ client, snapshot });
    await session.abandon();
    expect(client.abandonResponse).not.toHaveBeenCalled();
  });

  it("refreshes from the server", async () => {
    const fresh = row({
      answers: { name: "Lin", role: "pm" },
      updatedAt: "2026-01-01T00:00:09.000Z",
    });
    const client = mockClient({
      getResponse: vi.fn(async () => fresh),
    });
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row(),
    });
    await session.refresh();
    expect(client.getResponse).toHaveBeenCalledWith({ responseId: "res-1" });
    expect(session.getState().answers).toEqual({ name: "Lin", role: "pm" });
    expect(session.getState().dirty).toBe(false);
  });

  it("ignores a second save while one is pending", async () => {
    let release!: (value: ReturnType<typeof row>) => void;
    const client = mockClient({
      saveDraft: vi.fn(
        () =>
          new Promise<ReturnType<typeof row>>((resolve) => {
            release = resolve;
          }),
      ),
    });
    const session = createFormResponseSession({
      client,
      snapshot,
      response: row(),
    });
    session.setAnswer("name", "Ada");
    const first = session.saveDraft();
    await expect(session.saveDraft()).resolves.toBeUndefined();
    release(row({ updatedAt: "2026-01-01T00:00:01.000Z" }));
    await first;
    expect(client.saveDraft).toHaveBeenCalledTimes(1);
  });
});

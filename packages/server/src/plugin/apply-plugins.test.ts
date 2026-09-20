import { describe, expect, it } from "vitest";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { FORM_API_ROUTES } from "@dimah-form/core";

import { applyPlugins } from "./apply-plugins";
import { definePlugin } from "./define-plugin";

describe("applyPlugins", () => {
  it("accepts an empty plugin list", () => {
    expect(() => applyPlugins(undefined)).not.toThrow();
    expect(() => applyPlugins([])).not.toThrow();
  });

  it("rejects duplicate plugin ids", () => {
    expect(() =>
      applyPlugins([{ id: "analytics" }, { id: "analytics" }]),
    ).toThrow(/Duplicate dimah-form plugin id "analytics"/);
  });

  it("rejects reserved plugin ids", () => {
    expect(() => applyPlugins([{ id: "api" }])).toThrow(/reserved/);
  });

  it("rejects endpoint names that collide with core", () => {
    expect(() =>
      applyPlugins([
        definePlugin({
          id: "dup",
          endpoints: {
            getForm: createFormEndpoint(
              "/plugin-form",
              { method: "GET" },
              async () => ({}),
            ),
          },
        }),
      ]),
    ).toThrow(/Duplicate dimah-form endpoint "getForm"/);
  });

  it("rejects routes that collide with core paths", () => {
    expect(() =>
      applyPlugins([
        definePlugin({
          id: "dup",
          endpoints: {
            ping: createFormEndpoint(
              FORM_API_ROUTES.form,
              { method: "GET" },
              async () => ({}),
            ),
          },
        }),
      ]),
    ).toThrow(/Duplicate dimah-form route GET \/form/);
  });

  it("collects plugin field types and chains hooks", async () => {
    const order: string[] = [];
    const applied = applyPlugins([
      {
        id: "a",
        fieldTypes: [{ type: "rating", validate: () => undefined }],
        hooks: {
          onStart: () => {
            order.push("a");
          },
        },
      },
      {
        id: "b",
        hooks: {
          onStart: () => {
            order.push("b");
          },
        },
      },
    ]);
    expect(applied.fieldTypes.map((type) => type.type)).toEqual(["rating"]);
    await applied.hooks.onStart?.({
      request: new Request("http://localhost"),
      response: {} as never,
    });
    expect(order).toEqual(["a", "b"]);
  });

  it("rejects an empty plugin id", () => {
    expect(() => applyPlugins([{ id: "  " }])).toThrow(/non-empty string/);
  });

  it("runs dependsOn plugins first", async () => {
    const order: string[] = [];
    const applied = applyPlugins([
      {
        id: "b",
        dependsOn: ["a"],
        hooks: {
          onStart: () => {
            order.push("b");
          },
        },
      },
      {
        id: "a",
        hooks: {
          onStart: () => {
            order.push("a");
          },
        },
      },
    ]);
    await applied.hooks.onStart?.({
      request: new Request("http://localhost"),
      response: {} as never,
    });
    expect(order).toEqual(["a", "b"]);
  });

  it("maps plugin routes to endpoint names", () => {
    const applied = applyPlugins([
      definePlugin({
        id: "ping",
        endpoints: {
          ping: createFormEndpoint("/ping", { method: "GET" }, async () => ({
            ok: true,
          })),
        },
      }),
    ]);
    expect(applied.pluginOperations.get("GET /ping")).toBe("ping");
  });

  it("rejects a plugin field type that shadows a built-in", () => {
    expect(() =>
      applyPlugins([
        {
          id: "dup",
          fieldTypes: [{ type: "text", validate: () => undefined }],
        },
      ]),
    ).toThrow(/conflicts with a built-in type/);
  });

  it("rejects the same field type from two plugins", () => {
    expect(() =>
      applyPlugins([
        {
          id: "a",
          fieldTypes: [{ type: "rating", validate: () => undefined }],
        },
        {
          id: "b",
          fieldTypes: [{ type: "rating", validate: () => undefined }],
        },
      ]),
    ).toThrow(/Plugin "b" conflicts with plugin "a"/);
  });

  it("rejects a plugin error code that shadows core", () => {
    expect(() =>
      applyPlugins([
        {
          id: "ping",
          $ERROR_CODES: {
            VALIDATION_ERROR: {
              code: "VALIDATION_ERROR",
              message: "Nope",
            },
          },
        },
      ]),
    ).toThrow(/conflicts with a core code/);
  });

  it("collects namespaced meta schemas in dependsOn order", () => {
    const applied = applyPlugins([
      {
        id: "b",
        dependsOn: ["a"],
        metaNamespace: "formula",
        metaSchema: { form: {} as never },
      },
      {
        id: "a",
        metaNamespace: "scoring",
        metaSchema: { form: {} as never },
      },
    ]);
    expect(applied.metaSchemas.map((bag) => bag.namespace)).toEqual([
      "scoring",
      "formula",
    ]);
  });

  it("rejects duplicate meta namespaces", () => {
    expect(() =>
      applyPlugins([
        { id: "a", metaNamespace: "scoring" },
        { id: "b", metaNamespace: "scoring" },
      ]),
    ).toThrow(/Duplicate dimah-form meta namespace "scoring"/);
  });

  it("rejects an empty meta namespace", () => {
    expect(() => applyPlugins([{ id: "a", metaNamespace: "  " }])).toThrow(
      /metaNamespace must be a non-empty string/,
    );
  });

  it("chains plugin validateAnswers in dependsOn order", async () => {
    const order: string[] = [];
    const applied = applyPlugins([
      {
        id: "b",
        dependsOn: ["a"],
        validateAnswers: () => {
          order.push("b");
          return [{ field: "b", message: "b", code: "B" }];
        },
      },
      {
        id: "a",
        validateAnswers: () => {
          order.push("a");
          return [{ field: "a", message: "a", code: "A" }];
        },
      },
    ]);
    await expect(
      applied.validateAnswers?.(
        { id: "f", slug: "f", status: "active", title: "F", fields: [] },
        {},
        "submit",
      ),
    ).resolves.toEqual([
      { field: "a", message: "a", code: "A" },
      { field: "b", message: "b", code: "B" },
    ]);
    expect(order).toEqual(["a", "b"]);
  });

  it("chains plugin validateDefinition in dependsOn order", () => {
    const order: string[] = [];
    const applied = applyPlugins([
      {
        id: "b",
        dependsOn: ["a"],
        validateDefinition: () => {
          order.push("b");
          return [{ field: "b", message: "b", code: "B" }];
        },
      },
      {
        id: "a",
        validateDefinition: () => {
          order.push("a");
          return [{ field: "a", message: "a", code: "A" }];
        },
      },
    ]);
    expect(
      applied.validateDefinition?.({
        fields: [],
      }),
    ).toEqual([
      { field: "a", message: "a", code: "A" },
      { field: "b", message: "b", code: "B" },
    ]);
    expect(order).toEqual(["a", "b"]);
  });
});

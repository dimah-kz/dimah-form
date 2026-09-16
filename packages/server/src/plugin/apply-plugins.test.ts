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
        fieldTypes: [{ type: "email", validate: () => undefined }],
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
    expect(applied.fieldTypes.map((type) => type.type)).toEqual(["email"]);
    await applied.hooks.onStart?.({
      request: new Request("http://localhost"),
      response: {} as never,
    });
    expect(order).toEqual(["a", "b"]);
  });
});

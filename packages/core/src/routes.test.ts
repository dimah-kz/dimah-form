import { describe, expect, it } from "vitest";

import {
  FORM_API_BASE_PATH,
  FORM_API_OPERATIONS,
  FORM_API_ROUTE_KEYS,
  FORM_API_ROUTES,
  normalizeFormApiBasePath,
} from "./routes";

describe("normalizeFormApiBasePath", () => {
  it("defaults to FORM_API_BASE_PATH", () => {
    expect(normalizeFormApiBasePath()).toBe(FORM_API_BASE_PATH);
    expect(normalizeFormApiBasePath("")).toBe(FORM_API_BASE_PATH);
    expect(normalizeFormApiBasePath("/")).toBe(FORM_API_BASE_PATH);
  });

  it("adds a leading slash and strips a trailing one", () => {
    expect(normalizeFormApiBasePath("api/form")).toBe("/api/form");
    expect(normalizeFormApiBasePath("/api/form/")).toBe("/api/form");
  });

  it("keeps an absolute URL", () => {
    expect(normalizeFormApiBasePath("https://api.example.com/api/form/")).toBe(
      "https://api.example.com/api/form",
    );
  });
});

describe("FORM_API_OPERATIONS", () => {
  it("indexes every core route by METHOD path", () => {
    expect(FORM_API_ROUTE_KEYS["GET /form"]).toBe("getForm");
    expect(FORM_API_ROUTE_KEYS["POST /form"]).toBe("saveForm");
    expect(FORM_API_OPERATIONS.listForms.path).toBe(FORM_API_ROUTES.forms);
  });
});

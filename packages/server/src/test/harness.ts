import {
  defineForm,
  FORM_API_BASE_PATH,
  FORM_API_ROUTES,
  FORM_ERROR_CODES,
  type FormErrorCode,
} from "@dimah-form/core";
import { expect } from "vitest";

import { dimahForm, type DimahFormConfig } from "@/dimah-form";
import { memoryAdapter } from "@/store";

export const onboarding = defineForm({
  title: "Onboarding",
  fields: [
    { id: "name", type: "text", required: true },
    { id: "age", type: "number" },
    { id: "ok", type: "boolean", required: true },
    {
      id: "role",
      type: "select",
      options: [{ value: "eng" }, { value: "pm" }],
    },
  ],
});

export function createInstance(overrides: Partial<DimahFormConfig> = {}) {
  return dimahForm({
    database: memoryAdapter(),
    ...overrides,
    forms: overrides.forms ?? { onboarding },
  });
}

export function apiUrl(path: string, basePath = FORM_API_BASE_PATH) {
  return `http://localhost${basePath}${path}`;
}

export function jsonRequest(
  url: string,
  init: {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
  } = {},
) {
  const { method = "POST", body, headers } = init;
  const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...Object.fromEntries(new Headers(headers).entries()),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });
}

export function getRequest(path: string, query: Record<string, string>) {
  const url = new URL(apiUrl(path));
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return new Request(url);
}

export async function expectErrorCode(
  response: Response,
  status: number,
  error: { code: FormErrorCode | string },
) {
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toMatchObject({ code: error.code });
}

export { FORM_API_ROUTES, FORM_ERROR_CODES };

"use client";

import { createFormClient, useFormClient } from "@dimah-form/react";

import { demoClient } from "./demo-plugin";
import type { fieldTypes } from "./field-types";
import type { forms } from "./forms";

const ADMIN_KEY = "dimah-form-demo-admin";

export function isDemoAdmin() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(ADMIN_KEY) === "1"
  );
}

export function setDemoAdmin(enabled: boolean) {
  window.localStorage.setItem(ADMIN_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new Event("dimah-form-demo-admin"));
}

export function subscribeDemoAdmin(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("dimah-form-demo-admin", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("dimah-form-demo-admin", onStoreChange);
  };
}

export function respondentId() {
  const key = "dimah-form-demo-respondent";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export const formClient = createFormClient<
  [typeof demoClient],
  typeof forms,
  typeof fieldTypes
>({
  basePath: "/api/form",
  plugins: [demoClient],
  headers: (): HeadersInit => (isDemoAdmin() ? { "x-demo-admin": "1" } : {}),
});

export function useDemoFormClient() {
  return useFormClient<[typeof demoClient], typeof forms, typeof fieldTypes>();
}

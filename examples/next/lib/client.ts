"use client";

import { createFormClient } from "@dimah-form/react";

export const formClient = createFormClient({
  basePath: "/api/form",
});

export function respondentId() {
  const key = "dimah-form-demo-respondent";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

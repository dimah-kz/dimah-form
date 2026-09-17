"use client";

import { createFormClient } from "@dimah-form/react";

import type { Form } from "./form";
import { fieldTypes } from "./field-types";

export const formClient = createFormClient<Form>({ fieldTypes });

export function respondentId() {
  const key = "dimah-form-demo-respondent";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

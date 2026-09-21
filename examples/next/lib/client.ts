"use client";

import { datasetClientPlugin } from "@dimah-form/dataset/client";
import { createFormClient } from "@dimah-form/react";
import { scoringClientPlugin } from "@dimah-form/scoring/client";

import type { Form } from "./form";
import { fieldTypes } from "./field-types";

const clientPlugins = [scoringClientPlugin(), datasetClientPlugin()] as const;

export const formClient = createFormClient<Form, typeof clientPlugins>({
  fieldTypes,
  plugins: clientPlugins,
});
export const { useFormClient, useFormResponse } = formClient;

export function respondentId() {
  const key = "dimah-form-demo-respondent";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

import { db } from "@dimah-form/db";
import { dimahForm } from "@dimah-form/server";

import { formDb } from "./db";
import { fieldTypes } from "./field-types";
import { forms } from "./forms";

export const form = dimahForm({
  database: db(formDb),
  fieldTypes,
  forms,
});

export type Form = typeof form;

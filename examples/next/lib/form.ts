import { db } from "@dimah-form/db";
import { dimahForm } from "@dimah-form/server";

import { formDb } from "./db";
import { forms } from "./forms";

export const form = dimahForm({
  database: db(formDb),
  forms,
});

export type Form = typeof form;

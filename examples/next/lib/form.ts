import { db } from "@dimah-form/db";
import { APIError, FORM_ERROR_CODES } from "@dimah-form/core";
import { dimahForm } from "@dimah-form/server";

import { formDb } from "./db";
import { demoPlugin } from "./demo-plugin";
import { fieldTypes } from "./field-types";
import { forms } from "./forms";

const adminOperations = new Set([
  "saveForm",
  "deleteForm",
  "listResponses",
  "deleteResponse",
]);

export const form = dimahForm({
  database: db(formDb),
  forms,
  fieldTypes,
  plugins: [demoPlugin],
  guard: ({ request, operation }) => {
    if (!adminOperations.has(operation)) return;
    if (request.headers.get("x-demo-admin") === "1") return;
    throw APIError.from("FORBIDDEN", FORM_ERROR_CODES.FORBIDDEN);
  },
  hooks: {
    afterSubmit: ({ response }) => {
      console.info("[dimah-form demo] submitted", response.id);
    },
    afterAbandon: ({ response }) => {
      console.info("[dimah-form demo] abandoned", response.id);
    },
  },
});

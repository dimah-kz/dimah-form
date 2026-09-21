import { datasetPlugin } from "@dimah-form/dataset";
import { db } from "@dimah-form/db";
import { insightsPlugin } from "@dimah-form/insights";
import { scoringPlugin } from "@dimah-form/scoring";
import { dimahForm } from "@dimah-form/server";

import { formDb } from "./db";
import { fieldTypes } from "./field-types";
import { forms } from "./forms";

export const form = dimahForm({
  database: db(formDb),
  fieldTypes,
  forms,
  plugins: [scoringPlugin(), datasetPlugin(), insightsPlugin()],
});

export type Form = typeof form;

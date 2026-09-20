import { scoringPlugin } from "@dimah-form/scoring";
import { createDefineForm } from "@dimah-form/server";
import type { FormDefinitionUi } from "@dimah-form/ui/types";

import { fieldTypes } from "../field-types";

const plugins = [scoringPlugin()] as const;

export const defineAppForm = createDefineForm({
  fieldTypes,
  plugins,
});

export type AppForm = FormDefinitionUi<typeof fieldTypes, typeof plugins>;

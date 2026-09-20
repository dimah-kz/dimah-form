import { scoringPlugin } from "@dimah-form/scoring";
import { createDefineForm } from "@dimah-form/server";
import type { FormDefinitionUi } from "@dimah-form/ui/types";

import { fieldTypes } from "../field-types";

export const defineAppForm = createDefineForm({
  fieldTypes,
  plugins: [scoringPlugin()],
});

export type AppForm = FormDefinitionUi<
  typeof fieldTypes,
  readonly [ReturnType<typeof scoringPlugin>]
>;

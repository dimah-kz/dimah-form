import { FORM_API_OPERATIONS, type FormList } from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { listLiveForms } from "@/forms";

const { method, path } = FORM_API_OPERATIONS.listForms;

export const listForms = createFormEndpoint(
  path,
  { method },
  async (ctx): Promise<FormList> => {
    return { forms: await listLiveForms(ctx.context.config) };
  },
);

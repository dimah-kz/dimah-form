import {
  FORM_API_OPERATIONS,
  getFormQuerySchema,
  type FormSnapshot,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { resolveLiveForm } from "@/forms";

const { method, path } = FORM_API_OPERATIONS.getForm;

export const getForm = createFormEndpoint(
  path,
  { method, query: getFormQuerySchema },
  async (ctx): Promise<FormSnapshot> => {
    return resolveLiveForm(ctx.context.config, ctx.query.formId);
  },
);

import {
  FORM_API_ROUTES,
  getFormQuerySchema,
  type FormSnapshot,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { resolveLiveForm } from "@/forms";

export const getForm = createFormEndpoint(
  FORM_API_ROUTES.form,
  { method: "GET", query: getFormQuerySchema },
  async (ctx): Promise<FormSnapshot> => {
    return resolveLiveForm(ctx.context.config.forms, ctx.query.formId);
  },
);

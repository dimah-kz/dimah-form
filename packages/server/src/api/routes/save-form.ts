import {
  FORM_API_OPERATIONS,
  saveFormBodySchema,
  type FormSnapshot,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { parseLiveSnapshot } from "@/forms";

const { method, path } = FORM_API_OPERATIONS.saveForm;

export const saveForm = createFormEndpoint(
  path,
  { method, body: saveFormBodySchema },
  async (ctx): Promise<FormSnapshot> => {
    if (Object.hasOwn(ctx.context.config.forms, ctx.body.id)) {
      throw errors.conflict();
    }
    const form = parseLiveSnapshot(ctx.body, ctx.context.config.fieldTypes);
    await ctx.context.config.hooks.onSaveForm?.({
      request: ctx.context.request,
      form,
    });
    await ctx.context.config.database.saveForm(form);
    return form;
  },
);

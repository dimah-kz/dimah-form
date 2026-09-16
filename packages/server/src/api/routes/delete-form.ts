import { FORM_API_OPERATIONS, deleteFormBodySchema } from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { resolveLiveForm } from "@/forms";
import { commitLifecycle } from "@/helpers/lifecycle";

const { method, path } = FORM_API_OPERATIONS.deleteForm;

export const deleteForm = createFormEndpoint(
  path,
  { method, body: deleteFormBodySchema },
  async (ctx): Promise<{ ok: true; formId: string }> => {
    const form = await resolveLiveForm(ctx.context.config, ctx.body.formId);
    if (Object.hasOwn(ctx.context.config.forms, form.id)) {
      throw errors.codeAuthoredForm(form.id);
    }
    const existing = await ctx.context.config.database.listResponses({
      formId: form.id,
      limit: 1,
      offset: 0,
    });
    if (existing.length > 0) {
      throw errors.formHasResponses(form.id);
    }
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    await commitLifecycle(
      () => hooks.onDeleteForm?.({ request, form }),
      () => ctx.context.config.database.deleteForm(form.id),
      () => hooks.afterDeleteForm?.({ request, form }),
    );
    return { ok: true, formId: form.id };
  },
);

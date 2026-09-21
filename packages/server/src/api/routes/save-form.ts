import {
  FORM_API_OPERATIONS,
  saveFormBodySchema,
  type FormSnapshot,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { assertSlugAvailable, parseLiveSnapshot } from "@/forms";
import { commitLifecycle, writeForm } from "@/helpers/lifecycle";
import { formHookContext } from "@/plugin/context";

const { method, path } = FORM_API_OPERATIONS.saveForm;

export const saveForm = createFormEndpoint(
  path,
  { method, body: saveFormBodySchema },
  async (ctx): Promise<FormSnapshot> => {
    if (Object.hasOwn(ctx.context.config.forms, ctx.body.id)) {
      throw errors.codeAuthoredForm(ctx.body.id);
    }
    const parsed = parseLiveSnapshot(
      ctx.body,
      ctx.context.config.fieldTypes,
      ctx.context.config.metaSchemas,
      ctx.context.config.validateDefinition,
    );
    await assertSlugAvailable(ctx.context.config, parsed);
    const existing = await ctx.context.config.database.getForm(parsed.id);
    const now = new Date().toISOString();
    const form: FormSnapshot = {
      ...parsed,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    const hook = () => formHookContext(ctx.context.config, request, form);
    return commitLifecycle(
      () => hooks.onSaveForm?.(hook()),
      () =>
        writeForm(ctx.context.config.database, form, {
          expectedUpdatedAt: existing ? parsed.updatedAt : undefined,
        }),
      () => hooks.afterSaveForm?.(hook()),
    );
  },
);

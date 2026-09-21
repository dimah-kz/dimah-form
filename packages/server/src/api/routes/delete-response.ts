import {
  FORM_API_OPERATIONS,
  deleteResponseBodySchema,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle } from "@/helpers/lifecycle";
import { responseHookContext } from "@/plugin/context";

const { method, path } = FORM_API_OPERATIONS.deleteResponse;

export const deleteResponse = createFormEndpoint(
  path,
  { method, body: deleteResponseBodySchema },
  async (ctx): Promise<{ ok: true; responseId: string }> => {
    const existing = await ctx.context.config.database.getResponse(
      ctx.body.responseId,
    );
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    const hook = () =>
      responseHookContext(ctx.context.config, request, existing);
    await commitLifecycle(
      () => hooks.onDeleteResponse?.(hook()),
      () => ctx.context.config.database.deleteResponse(existing.id),
      () => hooks.afterDeleteResponse?.(hook()),
    );
    return { ok: true, responseId: existing.id };
  },
);

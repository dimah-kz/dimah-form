import {
  FORM_API_OPERATIONS,
  deleteResponseBodySchema,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle } from "@/helpers/lifecycle";

const { method, path } = FORM_API_OPERATIONS.deleteResponse;

export const deleteResponse = createFormEndpoint(
  path,
  { method, body: deleteResponseBodySchema },
  async (ctx): Promise<{ ok: true; responseId: string }> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    await commitLifecycle(
      () => hooks.onDeleteResponse?.({ request, response: existing }),
      () => ctx.context.config.database.delete(existing.id),
      () => hooks.afterDeleteResponse?.({ request, response: existing }),
    );
    return { ok: true, responseId: existing.id };
  },
);

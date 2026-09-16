import {
  FORM_API_OPERATIONS,
  listResponsesQuerySchema,
  type ResponseList,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";

const { method, path } = FORM_API_OPERATIONS.listResponses;

export const listResponses = createFormEndpoint(
  path,
  {
    method,
    query: listResponsesQuerySchema,
  },
  async (ctx): Promise<ResponseList> => {
    const responses = await ctx.context.config.database.listResponses({
      formId: ctx.query.formId,
    });
    return { responses };
  },
);

import {
  FORM_API_OPERATIONS,
  getResponseQuerySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";

const { method, path } = FORM_API_OPERATIONS.getResponse;

export const getResponse = createFormEndpoint(
  path,
  { method, query: getResponseQuerySchema },
  async (ctx): Promise<ResponseRecord> => {
    const row = await ctx.context.config.database.get(ctx.query.responseId);
    if (!row) {
      throw errors.unknownResponse(ctx.query.responseId);
    }
    return row;
  },
);

import {
  FORM_API_ROUTES,
  getResponseQuerySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";

export const getResponse = createFormEndpoint(
  FORM_API_ROUTES.getResponse,
  { method: "GET", query: getResponseQuerySchema },
  async (ctx): Promise<ResponseRecord> => {
    const row = await ctx.context.config.database.get(ctx.query.responseId);
    if (!row) {
      throw errors.unknownResponse(ctx.query.responseId);
    }
    return row;
  },
);

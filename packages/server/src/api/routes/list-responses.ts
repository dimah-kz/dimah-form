import {
  FORM_API_OPERATIONS,
  listResponsesQuerySchema,
  normalizeListPage,
  pageFromOverfetch,
  toResponseSummary,
  type ResponseList,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";

const { method, path } = FORM_API_OPERATIONS.listResponses;

export const listResponses = createFormEndpoint(
  path,
  {
    method,
    query: listResponsesQuerySchema.optional(),
  },
  async (ctx): Promise<ResponseList> => {
    const query = ctx.query ?? {};
    const { limit, offset } = normalizeListPage(query);
    const include = query.include === "full" ? "full" : "summary";
    const rows = await ctx.context.config.database.listResponses({
      formId: query.formId,
      respondentId: query.respondentId,
      status: query.status,
      include,
      limit: limit + 1,
      offset,
    });
    const page = pageFromOverfetch(rows, limit, offset);
    return {
      responses:
        include === "full" ? page.items : page.items.map(toResponseSummary),
      limit,
      offset,
      nextOffset: page.nextOffset,
    };
  },
);

import {
  FORM_API_OPERATIONS,
  listFormsQuerySchema,
  normalizeListPage,
  paginateItems,
  type FormList,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { listLiveForms } from "@/forms";

const { method, path } = FORM_API_OPERATIONS.listForms;

export const listForms = createFormEndpoint(
  path,
  { method, query: listFormsQuerySchema.optional() },
  async (ctx): Promise<FormList> => {
    const query = ctx.query ?? {};
    const { limit, offset } = normalizeListPage(query);
    const forms = await listLiveForms(ctx.context.config, {
      status: query.status,
    });
    const page = paginateItems(forms, limit, offset);
    return {
      forms: page.items,
      limit,
      offset,
      nextOffset: page.nextOffset,
    };
  },
);

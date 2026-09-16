import {
  FORM_API_OPERATIONS,
  listFormsQuerySchema,
  normalizeListPage,
  pageFromOverfetch,
  paginateItems,
  type FormList,
  type FormSnapshot,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { listLiveForms, parseLiveSnapshot } from "@/forms";

const { method, path } = FORM_API_OPERATIONS.listForms;

export const listForms = createFormEndpoint(
  path,
  { method, query: listFormsQuerySchema.optional() },
  async (ctx): Promise<FormList> => {
    const query = ctx.query ?? {};
    const { limit, offset } = normalizeListPage(query);
    const hasCodeForms = Object.keys(ctx.context.config.forms).length > 0;
    if (!hasCodeForms) {
      const rows = await ctx.context.config.database.listForms({
        status: query.status,
        limit: limit + 1,
        offset,
      });
      const forms: FormSnapshot[] = [];
      for (const form of rows) {
        try {
          forms.push(parseLiveSnapshot(form, ctx.context.config.fieldTypes));
        } catch {
          continue;
        }
      }
      const page = pageFromOverfetch(forms, limit, offset);
      return {
        forms: page.items,
        limit,
        offset,
        nextOffset: page.nextOffset,
      };
    }
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

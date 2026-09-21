import {
  formDefinitionSchema,
  LIST_MAX_LIMIT,
  normalizeFormSnapshot,
  pageFromOverfetch,
  type FormSnapshot,
  type ResponseRecord,
} from "@dimah-form/core";
import {
  createFormEndpoint,
  definePlugin,
  errors,
  type ListResponsesStoreQuery,
  type ResponseStore,
} from "@dimah-form/server";

import { INSIGHTS_ID } from "./errors";
import { INSIGHTS_ROUTES } from "./routes";
import { tryScoreResponse } from "./scoring";
import {
  insightsSummaryQuerySchema,
  insightsSummarySchema,
  type InsightsSummary,
} from "./spec";
import { createInsightsAccumulator } from "./summary";

function isFullRecord(row: { definition?: unknown }): row is ResponseRecord {
  return "definition" in row && row.definition != null;
}

function catalogSnapshot(
  forms: Record<string, unknown>,
  formId: string,
): FormSnapshot | undefined {
  if (Object.hasOwn(forms, formId)) {
    const parsed = formDefinitionSchema.safeParse(forms[formId]);
    if (parsed.success) {
      return normalizeFormSnapshot({ id: formId, ...parsed.data });
    }
  }
  for (const [id, definition] of Object.entries(forms)) {
    const parsed = formDefinitionSchema.safeParse(definition);
    if (!parsed.success) continue;
    const snapshot = normalizeFormSnapshot({ id, ...parsed.data });
    if (snapshot.slug === formId) return snapshot;
  }
  return undefined;
}

async function requireForm(
  forms: Record<string, unknown>,
  getForm: (
    idOrSlug: string,
  ) => FormSnapshot | undefined | Promise<FormSnapshot | undefined>,
  formId: string,
): Promise<FormSnapshot> {
  const fromCatalog = catalogSnapshot(forms, formId);
  if (fromCatalog) return fromCatalog;
  const stored = await getForm(formId);
  if (stored) return stored;
  throw errors.unknownForm(formId);
}

function storeFilter(
  formId: string,
  query: {
    respondentId?: string;
    status?: ListResponsesStoreQuery["status"];
    submittedFrom?: string;
    submittedTo?: string;
    updatedAfter?: string;
  },
): ListResponsesStoreQuery {
  return {
    formId,
    ...(query.respondentId ? { respondentId: query.respondentId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.submittedFrom ? { submittedFrom: query.submittedFrom } : {}),
    ...(query.submittedTo ? { submittedTo: query.submittedTo } : {}),
    ...(query.updatedAfter ? { updatedAfter: query.updatedAfter } : {}),
  };
}

async function walkInsights(
  filter: ListResponsesStoreQuery,
  listResponses: ResponseStore["listResponses"],
  signal: AbortSignal,
): Promise<InsightsSummary> {
  const acc = createInsightsAccumulator(filter.formId ?? "");
  let offset = 0;
  const limit = LIST_MAX_LIMIT;
  for (;;) {
    signal.throwIfAborted();
    const rows = await listResponses({
      ...filter,
      include: "full",
      limit: limit + 1,
      offset,
    });
    const page = pageFromOverfetch(rows, limit, offset);
    for (const row of page.items) {
      if (!isFullRecord(row)) continue;
      const scores = await tryScoreResponse(row.definition, row.answers);
      acc.add(row, scores);
    }
    if (page.nextOffset == null) break;
    offset = page.nextOffset;
  }
  return acc.finish();
}

/**
 * Official insights plugin. Compute-on-read counts from response snapshots.
 * Does not add tables or a `meta` namespace. Large N belongs in a warehouse.
 */
export function insightsPlugin() {
  return definePlugin({
    id: INSIGHTS_ID,
    endpoints: {
      getFormInsights: createFormEndpoint(
        INSIGHTS_ROUTES.getFormInsights.path,
        {
          method: INSIGHTS_ROUTES.getFormInsights.method,
          query: insightsSummaryQuerySchema,
          output: insightsSummarySchema,
        },
        async (ctx): Promise<InsightsSummary> => {
          const config = ctx.context.config;
          const form = await requireForm(
            config.forms,
            (id) => config.database.getForm(id),
            ctx.query.formId,
          );
          const filter = storeFilter(form.id, ctx.query);
          return walkInsights(
            filter,
            (query) => config.database.listResponses(query),
            ctx.context.request.signal,
          );
        },
      ),
    },
  });
}

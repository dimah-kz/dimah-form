import type { ResponseListFilter, ResponseStatus } from "@dimah-form/core";
import type { ListResponsesStoreQuery } from "@dimah-form/server";

export type DatasetListQuery = ResponseListFilter & {
  formId: string;
};

/** Dataset HTTP defaults `status=submitted`. */
export function datasetStoreFilter(
  query: DatasetListQuery,
): ListResponsesStoreQuery {
  const status: ResponseStatus = query.status ?? "submitted";
  return {
    formId: query.formId,
    status,
    ...(query.respondentId ? { respondentId: query.respondentId } : {}),
    ...(query.submittedFrom ? { submittedFrom: query.submittedFrom } : {}),
    ...(query.submittedTo ? { submittedTo: query.submittedTo } : {}),
    ...(query.updatedAfter ? { updatedAfter: query.updatedAfter } : {}),
  };
}

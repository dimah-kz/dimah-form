import {
  formatAnswer,
  type FieldTypeDefinition,
  type FormField,
  type ResponseRecord,
} from "@dimah-form/core";

import { snapshotKey, type SnapshotKeyCache } from "./hash";
import { DATASET_SPEC, type DatasetRecord, type DatasetScores } from "./spec";

export type ProjectFieldTypes =
  ReadonlyMap<string, FieldTypeDefinition> | readonly FieldTypeDefinition[];

export type ProjectResponseOptions = {
  fieldTypes?: ProjectFieldTypes;
  scores?: DatasetScores;
  /** HTTP default on; encode default off. */
  includeRespondentId?: boolean;
  snapshotKey?: string;
  snapshotKeyCache?: SnapshotKeyCache;
};

function fieldValue(
  field: FormField,
  answers: ResponseRecord["answers"],
  fieldTypes: ProjectFieldTypes | undefined,
): DatasetRecord["fields"][number] {
  const value = Object.hasOwn(answers, field.id) ? answers[field.id] : null;
  return {
    id: field.id,
    type: field.type,
    value: value ?? null,
    formatted: formatAnswer(field, value, fieldTypes),
  };
}

/**
 * Project a stored response onto a {@link DatasetRecord}. Uses the
 * **response definition snapshot**, never the live questionnaire.
 * One entry per snapshot field (unanswered → `value: null`).
 */
export async function projectResponse(
  row: ResponseRecord,
  options: ProjectResponseOptions = {},
): Promise<DatasetRecord> {
  const key =
    options.snapshotKey ??
    (await snapshotKey(row.definition, options.snapshotKeyCache));
  const record: DatasetRecord = {
    spec: DATASET_SPEC,
    id: row.id,
    formId: row.formId,
    status: row.status,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    snapshotKey: key,
    fields: row.definition.fields.map((field) =>
      fieldValue(field, row.answers, options.fieldTypes),
    ),
  };
  if (options.includeRespondentId) {
    record.respondentId = row.respondentId;
  }
  if (options.scores) {
    record.scores = options.scores;
  }
  return record;
}

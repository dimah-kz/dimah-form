import { sortDatasetIds, type Codebook, type DatasetRecord } from "./spec";

const CSV_BOM = "\uFEFF";
const CSV_EOL = "\r\n";
const MULTI_SELECT_JOIN = ";";

export const DATASET_IDENTITY_COLUMNS = [
  "id",
  "formId",
  "status",
  "submittedAt",
  "createdAt",
  "updatedAt",
  "snapshotKey",
] as const;

export type CsvMode = "codes" | "labels";

export type EncodeOptions = {
  /** Package encode default off. */
  includeRespondentId?: boolean;
  /** Allowlist of field ids. Omitted → every codebook field. */
  fields?: readonly string[];
  /** Drop these column names (identity, field ids, or `score.*`). */
  omit?: readonly string[];
  /** Labels CSV only — protocol `formatted` stays English Yes/No. */
  booleanLabels?: { true?: string; false?: string };
};

export type DataPackageFiles = {
  "datapackage.json": string;
  "codebook.json": string;
  "responses.jsonl": string;
  "responses.csv": string;
  "responses.labels.csv": string;
};

export type CsvEncoder = {
  columns: string[];
  header: (mode?: CsvMode) => string;
  row: (record: DatasetRecord, mode?: CsvMode) => string;
};

function withoutRespondentId(record: DatasetRecord): DatasetRecord {
  if (!("respondentId" in record)) return record;
  const { respondentId: _respondentId, ...rest } = record;
  return rest;
}

function encodeRecords(
  records: readonly DatasetRecord[],
  includeRespondentId: boolean,
): DatasetRecord[] {
  if (includeRespondentId) return [...records];
  return records.map(withoutRespondentId);
}

function identityColumns(includeRespondentId: boolean): string[] {
  return includeRespondentId
    ? [...DATASET_IDENTITY_COLUMNS, "respondentId"]
    : [...DATASET_IDENTITY_COLUMNS];
}

function scoreColumnIds(
  codebook: Codebook,
  records: readonly DatasetRecord[],
): string[] {
  if (codebook.scores?.variables.length) {
    return codebook.scores.variables.map((variable) => variable.id);
  }
  const ids = new Set<string>();
  for (const record of records) {
    if (!record.scores) continue;
    for (const id of Object.keys(record.scores.variables)) ids.add(id);
  }
  return sortDatasetIds([...ids]);
}

function scoreColumns(variableIds: readonly string[]): string[] {
  const columns: string[] = [];
  for (const id of variableIds) {
    columns.push(`score.${id}.raw`, `score.${id}.band`, `score.${id}.complete`);
  }
  return columns;
}

function applyColumnFilters(
  columns: readonly string[],
  options: EncodeOptions,
  fieldIds: ReadonlySet<string>,
): string[] {
  const allow =
    options.fields && options.fields.length > 0
      ? new Set(options.fields)
      : undefined;
  const omit = options.omit ? new Set(options.omit) : undefined;
  return columns.filter((column) => {
    if (omit?.has(column)) return false;
    if (!allow) return true;
    if (!fieldIds.has(column)) return true;
    return allow.has(column);
  });
}

export function datasetCsvColumns(
  codebook: Codebook,
  options: EncodeOptions = {},
  records: readonly DatasetRecord[] = [],
): string[] {
  const includeRespondentId = options.includeRespondentId === true;
  const fieldIds =
    codebook.fields.length > 0
      ? codebook.fields.map((field) => field.id)
      : sortDatasetIds([
          ...new Set(
            records.flatMap((record) => record.fields.map((field) => field.id)),
          ),
        ]);
  const columns = [
    ...identityColumns(includeRespondentId),
    ...fieldIds,
    ...scoreColumns(scoreColumnIds(codebook, records)),
  ];
  return applyColumnFilters(columns, options, new Set(fieldIds));
}

function rfc4180(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function csvCodeValue(value: unknown, type: string): string {
  if (value == null) return "";
  if (type === "multiSelect" && Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .join(MULTI_SELECT_JOIN);
  }
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

function csvLabelValue(
  field: { id: string; type: string; formatted: string; value: unknown },
  options: readonly { value: string; label: string }[],
  booleanLabels?: EncodeOptions["booleanLabels"],
): string {
  if (field.value == null) return "";
  if (field.type === "boolean") {
    if (field.value === true) return booleanLabels?.true ?? field.formatted;
    if (field.value === false) return booleanLabels?.false ?? field.formatted;
    return "";
  }
  if (field.type === "multiSelect" && Array.isArray(field.value)) {
    return field.value
      .filter((item): item is string => typeof item === "string")
      .map(
        (item) =>
          options.find((option) => option.value === item)?.label ?? item,
      )
      .join(MULTI_SELECT_JOIN);
  }
  return field.formatted;
}

function identityCell(record: DatasetRecord, column: string): string {
  if (column === "respondentId") return record.respondentId ?? "";
  const value = record[column as keyof DatasetRecord];
  if (value == null || Array.isArray(value) || typeof value === "object") {
    return "";
  }
  return String(value);
}

function scoreCell(record: DatasetRecord, column: string): string {
  const match = /^score\.(.+)\.(raw|band|complete)$/.exec(column);
  if (!match) return "";
  const variable = record.scores?.variables[match[1]];
  if (!variable) return "";
  if (match[2] === "raw")
    return variable.raw == null ? "" : String(variable.raw);
  if (match[2] === "band") return variable.band ?? "";
  return variable.complete ? "true" : "false";
}

function optionLookup(
  codebook: Codebook,
): Map<string, { value: string; label: string }[]> {
  return new Map(
    codebook.fields.map((field) => [field.id, field.options ?? []]),
  );
}

function csvRow(
  record: DatasetRecord,
  columns: readonly string[],
  optionsByField: Map<string, { value: string; label: string }[]>,
  mode: CsvMode,
  booleanLabels: EncodeOptions["booleanLabels"],
): string {
  const identity = new Set<string>([
    ...DATASET_IDENTITY_COLUMNS,
    "respondentId",
  ]);
  const byId = new Map(record.fields.map((field) => [field.id, field]));
  const cells = columns.map((column) => {
    if (identity.has(column)) return rfc4180(identityCell(record, column));
    if (column.startsWith("score.")) return rfc4180(scoreCell(record, column));
    const field = byId.get(column);
    if (!field) return "";
    const text =
      mode === "labels"
        ? csvLabelValue(field, optionsByField.get(column) ?? [], booleanLabels)
        : csvCodeValue(field.value, field.type);
    return rfc4180(text);
  });
  return cells.join(",");
}

/**
 * Streaming CSV. Build the codebook first (`getDatasetCodebook` /
 * `readCodebook`) so columns are stable, then write one row per record.
 */
export function createCsvEncoder(
  codebook: Codebook,
  options: EncodeOptions = {},
  records: readonly DatasetRecord[] = [],
): CsvEncoder {
  const includeRespondentId = options.includeRespondentId === true;
  const encoded = encodeRecords(records, includeRespondentId);
  const columns = datasetCsvColumns(codebook, options, encoded);
  const optionsByField = optionLookup(codebook);
  return {
    columns,
    header(mode: CsvMode = "codes") {
      const line = columns.map(rfc4180).join(",") + CSV_EOL;
      return mode === "labels" ? CSV_BOM + line : line;
    },
    row(record, mode = "codes") {
      const next = includeRespondentId ? record : withoutRespondentId(record);
      return (
        csvRow(next, columns, optionsByField, mode, options.booleanLabels) +
        CSV_EOL
      );
    },
  };
}

function csvBody(
  records: readonly DatasetRecord[],
  codebook: Codebook,
  options: EncodeOptions,
  mode: CsvMode,
): string {
  const encoded = encodeRecords(records, options.includeRespondentId === true);
  const encoder = createCsvEncoder(codebook, options, encoded);
  return (
    encoder.header(mode) +
    encoded.map((record) => encoder.row(record, mode)).join("")
  );
}

/** RFC 4180 CSV of stored codes. multiSelect values joined with `;`. */
export function toCsv(
  records: readonly DatasetRecord[],
  codebook: Codebook,
  options: EncodeOptions = {},
): string {
  return csvBody(records, codebook, options, "codes");
}

/** Excel convenience CSV of display labels. UTF-8 BOM only here. */
export function toCsvLabels(
  records: readonly DatasetRecord[],
  codebook: Codebook,
  options: EncodeOptions = {},
): string {
  return csvBody(records, codebook, options, "labels");
}

/** Canonical interchange: one {@link DatasetRecord} JSON object per line. */
export function toJsonl(
  records: readonly DatasetRecord[],
  options: EncodeOptions = {},
): string {
  const encoded = encodeRecords(records, options.includeRespondentId === true);
  if (encoded.length === 0) return "";
  return encoded.map((record) => JSON.stringify(record)).join("\n") + "\n";
}

/** One JSONL line, including the trailing newline. */
export function toJsonlLine(
  record: DatasetRecord,
  options: EncodeOptions = {},
): string {
  const encoded = encodeRecords([record], options.includeRespondentId === true);
  const next = encoded[0];
  if (!next) return "";
  return `${JSON.stringify(next)}\n`;
}

function tableSchemaFields(
  codebook: Codebook,
  options: EncodeOptions,
  records: readonly DatasetRecord[],
): { name: string; type: string }[] {
  const columns = datasetCsvColumns(codebook, options, records);
  const fieldType = new Map(
    codebook.fields.map((field) => [field.id, field.type]),
  );
  return columns.map((name) => {
    if (
      name === "submittedAt" ||
      name === "createdAt" ||
      name === "updatedAt"
    ) {
      return { name, type: "datetime" };
    }
    if (name.endsWith(".raw")) return { name, type: "number" };
    if (name.endsWith(".complete")) return { name, type: "boolean" };
    const type = fieldType.get(name);
    if (type === "number") return { name, type: "number" };
    if (type === "boolean") return { name, type: "boolean" };
    if (type === "date") return { name, type: "date" };
    return { name, type: "string" };
  });
}

/**
 * Frictionless-style file map. Not a zip — the consumer writes files.
 */
export function toDataPackage(
  records: readonly DatasetRecord[],
  codebook: Codebook,
  options: EncodeOptions = {},
): DataPackageFiles {
  const encoded = encodeRecords(records, options.includeRespondentId === true);
  const jsonl = toJsonl(encoded, {
    includeRespondentId: options.includeRespondentId,
  });
  const csv = toCsv(encoded, codebook, options);
  const labels = toCsvLabels(encoded, codebook, options);
  const datapackage = {
    profile: "tabular-data-package",
    resources: [
      {
        name: "responses",
        path: "responses.jsonl",
        format: "jsonl",
        mediatype: "application/x-ndjson",
        schema: { fields: tableSchemaFields(codebook, options, encoded) },
      },
      {
        name: "responses-csv",
        path: "responses.csv",
        format: "csv",
        mediatype: "text/csv",
      },
      {
        name: "responses-labels",
        path: "responses.labels.csv",
        format: "csv",
        mediatype: "text/csv",
      },
      {
        name: "codebook",
        path: "codebook.json",
        format: "json",
        mediatype: "application/json",
      },
    ],
  };
  return {
    "datapackage.json": `${JSON.stringify(datapackage, null, 2)}\n`,
    "codebook.json": `${JSON.stringify(codebook, null, 2)}\n`,
    "responses.jsonl": jsonl,
    "responses.csv": csv,
    "responses.labels.csv": labels,
  };
}

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
  /** Drop these output column names (identity, field columns, or `score.*`). */
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
  const documented = [
    ...(codebook.scores?.variables.map((variable) => variable.id) ?? []),
    ...(codebook.scores?.formulas?.map((formula) => formula.id) ?? []),
  ];
  if (documented.length > 0) return [...new Set(documented)];
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
    columns.push(
      `score.${id}.raw`,
      `score.${id}.band`,
      `score.${id}.complete`,
      `score.${id}.missing`,
    );
  }
  return columns;
}

const RESERVED_FIELD_IDS = new Set<string>([
  ...DATASET_IDENTITY_COLUMNS,
  "respondentId",
]);

/** Identity and `score.*` names are not field columns. Collisions use `field.<id>`. */
export function csvFieldColumn(id: string): string {
  if (RESERVED_FIELD_IDS.has(id) || id.startsWith("score."))
    return `field.${id}`;
  return id;
}

function fieldIdForColumn(
  column: string,
  fieldIds: ReadonlySet<string>,
): string | undefined {
  if (fieldIds.has(column) && csvFieldColumn(column) === column) return column;
  if (!column.startsWith("field.")) return;
  const id = column.slice("field.".length);
  if (fieldIds.has(id) && csvFieldColumn(id) === column) return id;
  return;
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
    const fieldId = fieldIdForColumn(column, fieldIds);
    if (!fieldId) return true;
    return allow.has(fieldId);
  });
}

function assertUniqueColumns(columns: readonly string[]): void {
  const seen = new Set<string>();
  for (const column of columns) {
    if (seen.has(column)) {
      throw new Error(`Dataset CSV column "${column}" is ambiguous`);
    }
    seen.add(column);
  }
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
    ...fieldIds.map(csvFieldColumn),
    ...scoreColumns(scoreColumnIds(codebook, records)),
  ];
  assertUniqueColumns(columns);
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
  const match = /^score\.(.+)\.(raw|band|complete|missing)$/.exec(column);
  if (!match) return "";
  const id = match[1];
  if (!id) return "";
  const variable = record.scores?.variables[id];
  if (!variable) return "";
  if (match[2] === "raw")
    return variable.raw == null ? "" : String(variable.raw);
  if (match[2] === "band") return variable.band ?? "";
  if (match[2] === "missing") return String(variable.missing);
  return variable.complete ? "true" : "false";
}

function fieldForColumn(
  column: string,
  byId: ReadonlyMap<string, DatasetRecord["fields"][number]>,
): DatasetRecord["fields"][number] | undefined {
  const id = fieldIdForColumn(column, new Set(byId.keys()));
  return id ? byId.get(id) : undefined;
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
    const field = fieldForColumn(column, byId);
    if (field) {
      const text =
        mode === "labels"
          ? csvLabelValue(
              field,
              optionsByField.get(field.id) ?? [],
              booleanLabels,
            )
          : csvCodeValue(field.value, field.type);
      return rfc4180(text);
    }
    if (identity.has(column)) return rfc4180(identityCell(record, column));
    if (column.startsWith("score.")) return rfc4180(scoreCell(record, column));
    return "";
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

/** Frictionless Tabular Data Package profile. */
export const TABULAR_DATA_PACKAGE_PROFILE =
  "https://specs.frictionlessdata.io/schemas/tabular-data-package.json";

/** Frictionless Tabular Data Resource profile. */
export const TABULAR_DATA_RESOURCE_PROFILE =
  "https://specs.frictionlessdata.io/schemas/tabular-data-resource.json";

const CSV_DIALECT = {
  delimiter: ",",
  quoteChar: '"',
  doubleQuote: true,
  header: true,
  lineTerminator: "\r\n",
} as const;

const REQUIRED_IDENTITY = new Set<string>([
  "id",
  "formId",
  "status",
  "createdAt",
  "updatedAt",
  "snapshotKey",
]);

type TableConstraint = {
  required?: true;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
};

type TableField = {
  name: string;
  type: string;
  constraints?: TableConstraint;
};

function withConstraints(
  name: string,
  type: string,
  constraints: TableConstraint,
): TableField {
  return Object.keys(constraints).length > 0
    ? { name, type, constraints }
    : { name, type };
}

function tableSchemaFields(
  codebook: Codebook,
  options: EncodeOptions,
  records: readonly DatasetRecord[],
): TableField[] {
  const columns = datasetCsvColumns(codebook, options, records);
  const byId = new Map(codebook.fields.map((field) => [field.id, field]));
  const fieldIds = new Set(byId.keys());
  return columns.map((name) => {
    if (REQUIRED_IDENTITY.has(name)) {
      const type =
        name === "createdAt" || name === "updatedAt" ? "datetime" : "string";
      return withConstraints(name, type, { required: true });
    }
    if (name === "submittedAt") return { name, type: "datetime" };
    if (name.startsWith("score.") && name.endsWith(".raw")) {
      return { name, type: "number" };
    }
    if (name.startsWith("score.") && name.endsWith(".complete")) {
      return { name, type: "boolean" };
    }
    if (name.startsWith("score.") && name.endsWith(".missing")) {
      return { name, type: "integer" };
    }
    const field = byId.get(fieldIdForColumn(name, fieldIds) ?? "");
    if (!field) return { name, type: "string" };
    const constraints: TableConstraint = {};
    if (field.required) constraints.required = true;
    if (field.type === "select" && field.options && field.options.length > 0) {
      constraints.enum = field.options.map((option) => option.value);
    }
    const limits = field.constraints;
    if (limits?.min !== undefined) constraints.minimum = limits.min;
    if (limits?.max !== undefined) constraints.maximum = limits.max;
    if (limits?.minLength !== undefined)
      constraints.minLength = limits.minLength;
    if (limits?.maxLength !== undefined)
      constraints.maxLength = limits.maxLength;
    if (field.type === "number") {
      return withConstraints(
        name,
        limits?.integer ? "integer" : "number",
        constraints,
      );
    }
    if (field.type === "boolean")
      return withConstraints(name, "boolean", constraints);
    if (field.type === "date")
      return withConstraints(name, "date", constraints);
    return withConstraints(name, "string", constraints);
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
  const fields = tableSchemaFields(codebook, options, encoded);
  const datapackage = {
    profile: TABULAR_DATA_PACKAGE_PROFILE,
    resources: [
      {
        name: "responses",
        path: "responses.jsonl",
        format: "jsonl",
        mediatype: "application/x-ndjson",
      },
      {
        name: "responses-csv",
        path: "responses.csv",
        profile: TABULAR_DATA_RESOURCE_PROFILE,
        format: "csv",
        mediatype: "text/csv",
        encoding: "utf-8",
        dialect: CSV_DIALECT,
        schema: {
          fields,
          missingValues: [""],
          ...(fields.some((field) => field.name === "id")
            ? { primaryKey: ["id"] }
            : {}),
        },
      },
      {
        name: "responses-labels",
        path: "responses.labels.csv",
        format: "csv",
        mediatype: "text/csv",
        encoding: "utf-8",
        dialect: CSV_DIALECT,
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

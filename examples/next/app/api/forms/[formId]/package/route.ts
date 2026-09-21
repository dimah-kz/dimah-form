import {
  createDatasetReader,
  toCsv,
  toCsvLabels,
  toJsonl,
} from "@dimah-form/dataset";
import { isFormErrorCode } from "@dimah-form/server";
import { notFound } from "next/navigation";

import { form } from "@/lib/form";

type Format = "jsonl" | "csv" | "labels";

function parseFormat(value: string | null): Format {
  if (value === "csv" || value === "labels" || value === "jsonl") return value;
  return "jsonl";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ formId: string }> },
) {
  const { formId } = await context.params;
  const format = parseFormat(new URL(request.url).searchParams.get("format"));
  let pack;
  try {
    const reader = createDatasetReader({
      page: ({ limit, offset }) =>
        form.api.getDatasetPage({
          query: { formId, limit, offset },
        }),
    });
    pack = await reader.readAll();
  } catch (error) {
    if (isFormErrorCode(error, "UNKNOWN_FORM")) notFound();
    throw error;
  }

  if (format === "csv") {
    return new Response(toCsv(pack.records, pack.codebook), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${formId}-responses.csv"`,
      },
    });
  }
  if (format === "labels") {
    return new Response(toCsvLabels(pack.records, pack.codebook), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${formId}-responses.labels.csv"`,
      },
    });
  }
  return new Response(toJsonl(pack.records), {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "content-disposition": `attachment; filename="${formId}-responses.jsonl"`,
    },
  });
}

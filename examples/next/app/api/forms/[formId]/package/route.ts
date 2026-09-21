import {
  createCsvEncoder,
  createDatasetReader,
  toJsonlLine,
} from "@dimah-form/dataset";
import { isFormErrorCode } from "@dimah-form/server";
import { notFound } from "next/navigation";

import { form } from "@/lib/form";

type Format = "jsonl" | "csv" | "labels" | "codebook";

function parseFormat(value: string | null): Format {
  if (
    value === "csv" ||
    value === "labels" ||
    value === "jsonl" ||
    value === "codebook"
  ) {
    return value;
  }
  return "jsonl";
}

function utf8Body(write: (push: (chunk: string) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await write((chunk) => {
          controller.enqueue(encoder.encode(chunk));
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ formId: string }> },
) {
  const { formId } = await context.params;
  const format = parseFormat(new URL(request.url).searchParams.get("format"));
  try {
    const reader = createDatasetReader({
      page: ({ limit, offset }) =>
        form.api.getDatasetPage({
          query: { formId, limit, offset },
        }),
      signal: request.signal,
    });
    if (format === "csv" || format === "labels" || format === "codebook") {
      const history = await form.api.getDatasetCodebook({
        query: { formId },
      });
      if (history.truncated) {
        return new Response(
          JSON.stringify({
            code: "DATASET_TRUNCATED",
            message:
              "Historical codebook walk was truncated. Raise datasetPlugin({ maxRows }) or persist rows with onProject.",
          }),
          {
            status: 409,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }
      if (format === "codebook") {
        return new Response(`${JSON.stringify(history.codebook, null, 2)}\n`, {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "content-disposition": `attachment; filename="${formId}-codebook.json"`,
          },
        });
      }
      const mode = format === "labels" ? "labels" : "codes";
      const encoder = createCsvEncoder(history.codebook);
      const filename =
        mode === "labels"
          ? `${formId}-responses.labels.csv`
          : `${formId}-responses.csv`;
      return new Response(
        utf8Body(async (push) => {
          push(encoder.header(mode));
          for await (const record of reader.records()) {
            push(encoder.row(record, mode));
          }
        }),
        {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="${filename}"`,
          },
        },
      );
    }
    return new Response(
      utf8Body(async (push) => {
        for await (const record of reader.records()) {
          push(toJsonlLine(record));
        }
      }),
      {
        headers: {
          "content-type": "application/x-ndjson; charset=utf-8",
          "content-disposition": `attachment; filename="${formId}-responses.jsonl"`,
        },
      },
    );
  } catch (error) {
    if (isFormErrorCode(error, "UNKNOWN_FORM")) notFound();
    throw error;
  }
}

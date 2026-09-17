import { isFormErrorCode } from "@dimah-form/server";
import { notFound } from "next/navigation";

import { Questionnaire } from "@/components/questionnaire";
import { form } from "@/lib/form";

export default async function ResponsePage({
  params,
}: {
  params: Promise<{ responseId: string }>;
}) {
  const { responseId } = await params;
  let row;
  try {
    row = await form.api.getResponse({ query: { responseId } });
  } catch (error) {
    if (isFormErrorCode(error, "UNKNOWN_RESPONSE")) notFound();
    throw error;
  }
  return <Questionnaire form={row.definition} response={row} />;
}

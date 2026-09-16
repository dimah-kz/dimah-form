import { isFormErrorCode } from "@dimah-form/server";
import { notFound } from "next/navigation";

import { Questionnaire } from "@/components/questionnaire";
import { form } from "@/lib/form";

export default async function FormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  let snapshot;
  try {
    snapshot = await form.api.getForm({ query: { formId } });
  } catch (error) {
    if (isFormErrorCode(error, "UNKNOWN_FORM")) notFound();
    throw error;
  }
  return <Questionnaire form={snapshot} />;
}

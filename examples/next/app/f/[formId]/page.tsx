import { isFormErrorCode } from "@dimah-form/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Questionnaire } from "@/components/questionnaire";
import { form } from "@/lib/form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formId: string }>;
}): Promise<Metadata> {
  const { formId } = await params;
  try {
    const snapshot = await form.api.getForm({ query: { formId } });
    return { title: snapshot.title };
  } catch (error) {
    if (isFormErrorCode(error, "UNKNOWN_FORM")) notFound();
    throw error;
  }
}

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

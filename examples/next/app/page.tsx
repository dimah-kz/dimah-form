import { Questionnaire } from "@/components/questionnaire";
import { form } from "@/lib/form";

export default async function Page() {
  let snapshot;
  try {
    snapshot = await form.api.getForm({ query: { formId: "feedback" } });
  } catch {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load the form. Did you run <code>db:push</code>?
      </p>
    );
  }

  return <Questionnaire form={snapshot} />;
}

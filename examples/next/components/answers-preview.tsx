import {
  isFieldVisible,
  stripHiddenAnswers,
  type FormAnswers,
  type FormSnapshot,
  type ResponseStatus,
} from "@dimah-form/core";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fieldLabel, formatAnswer } from "@/lib/field-display";

export function StatusBadge({ status }: { status: ResponseStatus | string }) {
  const variant =
    status === "submitted"
      ? "default"
      : status === "abandoned"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function AnswersPreview({
  form,
  answers,
  status,
}: {
  form: FormSnapshot;
  answers: FormAnswers;
  status?: ResponseStatus | string;
}) {
  const visible = stripHiddenAnswers(form, answers);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Answers</CardTitle>
        <CardDescription>Payload sent on save and submit</CardDescription>
        {status ? (
          <CardAction>
            <StatusBadge status={status} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3">
          {form.fields
            .filter((field) => isFieldVisible(field, answers))
            .map((field) => (
              <div key={field.id} className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">{fieldLabel(field)}</dt>
                <dd>{formatAnswer(field, visible[field.id])}</dd>
              </div>
            ))}
        </dl>
        <Separator />
        <pre className="overflow-x-auto font-mono text-xs text-muted-foreground">
          {JSON.stringify(visible, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

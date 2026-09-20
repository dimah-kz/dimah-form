import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { form } from "@/lib/form";

function isStepped(fields: readonly { meta?: { step?: unknown } }[]) {
  return (
    new Set(
      fields.map((field) => {
        const step = field.meta?.step;
        return typeof step === "string" || typeof step === "number"
          ? String(step)
          : "1";
      }),
    ).size > 1
  );
}

export default async function Page() {
  let listed;
  try {
    listed = await form.api.listForms({});
  } catch {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load forms. Did you run <code>db:push</code>?
      </p>
    );
  }

  if (!listed.forms.length) {
    return (
      <p className="text-sm text-muted-foreground">No forms in the catalog.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-medium">Forms</h1>
        <p className="text-sm text-muted-foreground">
          One single-page questionnaire and one stepped wizard. Each keeps its
          own draft.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {listed.forms.map((item) => {
          const stepped = isStepped(item.fields);
          return (
            <li key={item.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {item.title}
                    <Badge variant={stepped ? "default" : "secondary"}>
                      {stepped ? "Stepped" : "Single page"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {item.description ?? item.slug}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link
                    href={`/f/${item.slug}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    Open
                  </Link>
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

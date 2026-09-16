import Link from "next/link";
import type { FormSnapshot } from "@dimah-form/server";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { form } from "@/lib/form";

export default async function Page() {
  let forms: FormSnapshot[] | undefined;
  try {
    ({ forms } = await form.api.listForms({
      query: { status: "active" },
    }));
  } catch {
    forms = undefined;
  }

  if (!forms) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load forms. Did you run <code>db:push</code>?
      </p>
    );
  }

  if (!forms.length) {
    return <p className="text-sm text-muted-foreground">No active forms.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-medium">Forms</h1>
        <p className="text-sm text-muted-foreground">
          Active questionnaires. Open one to fill, save a draft, and submit.
        </p>
      </div>
      <ul className="grid gap-3">
        {forms.map((item) => (
          <li key={item.id}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  /{item.slug} · {item.fields.length} fields
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href={`/f/${item.slug}`} className={buttonVariants()}>
                  Open
                </Link>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

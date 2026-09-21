import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PULSE_FORM_ID } from "@/lib/forms";

export default function NotFound() {
  return (
    <Empty className="border-border">
      <EmptyHeader>
        <EmptyTitle>Not found</EmptyTitle>
        <EmptyDescription>
          That form or response is not in this demo.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href={`/f/${PULSE_FORM_ID}`}
          className={buttonVariants({ size: "sm" })}
        >
          Start check-in
        </Link>
      </EmptyContent>
    </Empty>
  );
}

import { Badge } from "@/components/ui/badge";
import type { ResponseStatus } from "@dimah-form/react";

export function StatusBadge({ status }: { status: ResponseStatus | string }) {
  const variant =
    status === "submitted"
      ? "default"
      : status === "abandoned"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

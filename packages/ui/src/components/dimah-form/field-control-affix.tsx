"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

export function FieldControlAffix({
  prefix,
  suffix,
  children,
}: {
  prefix?: string;
  suffix?: string;
  children: ReactNode;
}) {
  if (!prefix && !suffix) return children;

  return (
    <div
      className={cn(
        "min-w-0 rounded-lg flex items-stretch overflow-hidden border border-dimah-form-border",
        "has-[:focus-visible]:border-dimah-form-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-dimah-form-ring/50",
        "has-[[aria-invalid=true]]:border-dimah-form-destructive",
      )}
    >
      {prefix ? (
        <span className="px-2.5 text-sm flex items-center bg-dimah-form-muted text-dimah-form-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 [&_[data-slot=input]]:rounded-none [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:focus-visible:ring-0">
        {children}
      </div>
      {suffix ? (
        <span className="px-2.5 text-sm flex items-center bg-dimah-form-muted text-dimah-form-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

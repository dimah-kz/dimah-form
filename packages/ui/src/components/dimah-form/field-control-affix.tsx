"use client";

import type { ReactNode } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "cn";

export type FieldControlAffixProps = useRender.ComponentProps<"div"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  children: ReactNode;
};

export function FieldControlAffix({
  prefix,
  suffix,
  children,
  className,
  render,
  ...props
}: FieldControlAffixProps) {
  const hasAffix = Boolean(prefix || suffix);
  const element = useRender({
    enabled: hasAffix,
    defaultTagName: "div",
    render,
    state: { slot: "field-control-affix" },
    props: mergeProps<"div">(
      {
        className: cn(
          "min-w-0 rounded-lg flex items-stretch overflow-hidden border border-dimah-form-border",
          "has-[:focus-visible]:border-dimah-form-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-dimah-form-ring/50",
          "has-[[aria-invalid=true]]:border-dimah-form-destructive",
          className,
        ),
        children: (
          <>
            {prefix ? (
              <span
                data-slot="field-control-prefix"
                className="px-2.5 text-sm flex items-center bg-dimah-form-muted text-dimah-form-muted-foreground"
              >
                {prefix}
              </span>
            ) : null}
            <div className="min-w-0 flex-1 [&_[data-slot=input]]:rounded-none [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:focus-visible:ring-0">
              {children}
            </div>
            {suffix ? (
              <span
                data-slot="field-control-suffix"
                className="px-2.5 text-sm flex items-center bg-dimah-form-muted text-dimah-form-muted-foreground"
              >
                {suffix}
              </span>
            ) : null}
          </>
        ),
      },
      props,
    ),
  });
  return hasAffix ? element : children;
}

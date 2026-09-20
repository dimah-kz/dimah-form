"use client";

import type { ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";

/**
 * shadcn {@link InputGroup} around a control when `prefix` / `suffix` /
 * `count` is set. Pass {@link InputGroupInput} or {@link InputGroupTextarea}
 * as `children`. Without chrome, `children` render as-is.
 */
export function FieldInputGroup({
  prefix,
  suffix,
  count,
  children,
}: {
  prefix?: ReactNode;
  suffix?: ReactNode;
  count?: ReactNode;
  children: ReactNode;
}) {
  const hasAffix = Boolean(prefix || suffix);
  if (!hasAffix && !count) return children;

  return (
    <InputGroup>
      {children}
      {prefix ? (
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      ) : null}
      {suffix ? (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      ) : null}
      {count && !hasAffix ? (
        <InputGroupAddon align="block-end">
          <InputGroupText className="ms-auto tabular-nums">
            {count}
          </InputGroupText>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

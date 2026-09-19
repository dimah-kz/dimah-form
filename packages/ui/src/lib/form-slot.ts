import type { ReactNode } from "react";

/**
 * Template slot: omit for the default, `false` to hide, a node to replace.
 * Future templates reuse this instead of boolean `hideX` flags.
 */
export type FormSlot = ReactNode | false;

export function renderFormSlot(
  slot: FormSlot | undefined,
  fallback: ReactNode,
): ReactNode {
  if (slot === false) return null;
  return slot ?? fallback;
}

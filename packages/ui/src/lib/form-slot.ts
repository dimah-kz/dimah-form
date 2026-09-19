import type { ReactNode } from "react";

/**
 * Template slot: omit for the default, `false` to hide, a node to replace,
 * or a function to wrap the default (`({ default: node }) => …`).
 */
export type FormSlotRender = (ctx: { default: ReactNode }) => ReactNode;

export type FormSlot = ReactNode | false | FormSlotRender;

export function renderFormSlot(
  slot: FormSlot | undefined,
  fallback: ReactNode,
): ReactNode {
  if (slot === false) return null;
  if (typeof slot === "function") return slot({ default: fallback });
  return slot ?? fallback;
}

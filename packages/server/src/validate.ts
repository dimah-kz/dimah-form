import { errors } from "./errors";

/** Draft-only mutations. Submitted and abandoned rows are locked. */
export function requireDraft(row: { id: string; status: string }): void {
  if (row.status !== "draft") {
    throw errors.responseNotDraft(row.id);
  }
}

/** Reopen-only. Draft rows are already editable. */
export function requireLocked(row: { id: string; status: string }): void {
  if (row.status !== "submitted" && row.status !== "abandoned") {
    throw errors.responseNotLocked(row.id);
  }
}

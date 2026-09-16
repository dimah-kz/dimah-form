export {
  applyAnswerPatch,
  assertAnswers,
  collectAnswerIssues,
  parseAnswers,
  type AnswerValidationMode,
} from "@dimah-form/core";

import { errors } from "./errors";

/** Draft-only mutations. Submitted and abandoned rows are locked. */
export function requireDraft(row: { id: string; status: string }): void {
  if (row.status !== "draft") {
    throw errors.responseNotDraft(row.id);
  }
}

export function assertFresh(
  existing: { updatedAt: string },
  expected?: string,
): void {
  if (expected !== undefined && expected !== existing.updatedAt) {
    throw errors.staleUpdate();
  }
}

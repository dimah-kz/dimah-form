import { isAPIError } from "@dimah-form/core";

export function formIssues(error: unknown): Record<string, string> {
  if (!isAPIError(error) || !error.issues?.length) return {};
  return Object.fromEntries(
    error.issues.map((issue) => [issue.field, issue.message]),
  );
}

export function formErrorMessage(error: unknown, fallback = "Request failed") {
  return isAPIError(error) ? error.message : fallback;
}

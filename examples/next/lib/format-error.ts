import { isAPIError, isFormErrorCode } from "@dimah-form/core";

export function formIssues(caught: unknown): Record<string, string> {
  if (!isAPIError(caught) || !caught.issues?.length) return {};
  return Object.fromEntries(
    caught.issues.map((issue) => [issue.field, issue.message]),
  );
}

export function formatFormError(caught: unknown, fallback: string) {
  if (!isAPIError(caught)) return fallback;
  if (isFormErrorCode(caught, "STALE_UPDATE")) {
    return "This response changed on the server. Reload and try again.";
  }
  if (isFormErrorCode(caught, "FORM_INACTIVE")) {
    return "This form is not accepting new responses.";
  }
  if (caught.issues?.length) {
    return caught.issues
      .map((issue) => `${issue.field}: ${issue.message}`)
      .join(" · ");
  }
  return caught.message || fallback;
}

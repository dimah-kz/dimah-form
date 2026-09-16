import { isAPIError, isFormErrorCode } from "@dimah-form/core";

export function formatFormError(caught: unknown, fallback: string) {
  if (!isAPIError(caught)) return fallback;
  if (isFormErrorCode(caught, "STALE_UPDATE")) {
    return "This response changed on the server. Reload and try again.";
  }
  if (isFormErrorCode(caught, "FORM_INACTIVE")) {
    return "This form is not accepting new responses.";
  }
  const issues = caught.issues;
  if (issues?.length) {
    return issues
      .map((issue) => `${issue.field}: ${issue.message}`)
      .join(" · ");
  }
  return caught.message || fallback;
}

"use client";

import { FORM_ERROR_CODES } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";

/**
 * Localize a session request error from `errorCode`.
 * Falls back to the English `error` string from the session.
 */
export function useSessionError(session: {
  error?: string;
  errorCode?: string;
}): string | undefined {
  const t = useTranslations();
  const code = session.errorCode;
  if (!code) return session.error;

  switch (code) {
    case FORM_ERROR_CODES.NOT_FOUND.code:
      return t("Not Found", { note: "session error" });
    case FORM_ERROR_CODES.UNAUTHORIZED.code:
      return t("Unauthorized", { note: "session error" });
    case FORM_ERROR_CODES.FORBIDDEN.code:
      return t("Forbidden", { note: "session error" });
    case FORM_ERROR_CODES.CONFLICT.code:
      return t("Conflict", { note: "session error" });
    case FORM_ERROR_CODES.INTERNAL_ERROR.code:
      return t("Internal server error", { note: "session error" });
    case FORM_ERROR_CODES.VALIDATION_ERROR.code:
      return t("Validation Error", { note: "session error" });
    case FORM_ERROR_CODES.UNKNOWN_FORM.code:
      return t("Unknown form", { note: "session error" });
    case FORM_ERROR_CODES.UNKNOWN_RESPONSE.code:
      return t("Unknown response", { note: "session error" });
    case FORM_ERROR_CODES.FORM_INACTIVE.code:
      return t("Form is not active", { note: "session error" });
    case FORM_ERROR_CODES.STALE_UPDATE.code:
      return t("The record was updated", { note: "session error" });
    case FORM_ERROR_CODES.RESPONSE_NOT_DRAFT.code:
      return t("Response is not a draft", { note: "session error" });
    case FORM_ERROR_CODES.RESPONSE_NOT_LOCKED.code:
      return t("Response is not locked", { note: "session error" });
    case FORM_ERROR_CODES.CODE_AUTHORED_FORM.code:
      return t("Cannot modify a code-authored form", { note: "session error" });
    case FORM_ERROR_CODES.FORM_HAS_RESPONSES.code:
      return t("Form still has responses", { note: "session error" });
    case FORM_ERROR_CODES.SLUG_TAKEN.code:
      return t("Form slug is already in use", { note: "session error" });
    case FORM_ERROR_CODES.UNKNOWN_FIELD_TYPE.code:
      return t("Unknown field type", { note: "session error" });
    case FORM_ERROR_CODES.RESUME_REQUIRES_RESPONDENT.code:
      return t("resume requires respondentId", { note: "session error" });
    default:
      return session.error;
  }
}

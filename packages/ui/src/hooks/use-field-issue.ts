"use client";

import { FIELD_ISSUE_CODES, type FormFieldBinding } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { useFormUiFormatters } from "@/components/dimah-form/form-ui-components";

function param(params: FormFieldBinding["errorParams"], key: string): string {
  const value = params?.[key];
  return value === undefined ? "" : String(value);
}

/**
 * Localize a field issue from `errorCode` + `errorParams`.
 * `FormUiProvider` `formatIssue` wins when it returns a string.
 * Falls back to the English `error` string from the session.
 *
 * `t("…")` stays inside this hook so fuma-translate can extract keys.
 */
export function useFieldIssue(
  binding: Pick<FormFieldBinding, "error" | "errorCode" | "errorParams">,
): string | undefined {
  const t = useTranslations();
  const { formatIssue } = useFormUiFormatters();
  const custom = formatIssue?.(binding);
  if (custom) return custom;

  const code = binding.errorCode;
  if (!code) return binding.error;

  const params = binding.errorParams;

  switch (code) {
    case FIELD_ISSUE_CODES.REQUIRED.code:
      return t("Required", { note: "field issue" });
    case FIELD_ISSUE_CODES.UNKNOWN_FIELD.code:
      return t("Unknown field", { note: "field issue" });
    case FIELD_ISSUE_CODES.UNKNOWN_FIELD_TYPE.code:
      return t("Unknown field type", { note: "field issue" });
    case FIELD_ISSUE_CODES.INVALID.code:
      return t("Invalid", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_STRING.code:
      return t("Expected a string", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_NUMBER.code:
      return t("Expected a number", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_INTEGER.code:
      return t("Expected an integer", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_BOOLEAN.code:
      return t("Expected a boolean", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_STRING_ARRAY.code:
      return t("Expected an array of strings", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_EMAIL.code:
      return t("Expected an email", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_DATE.code:
      return t("Expected a date", { note: "field issue" });
    case FIELD_ISSUE_CODES.EXPECTED_FILE.code:
      return t("Expected file metadata", { note: "field issue" });
    case FIELD_ISSUE_CODES.TOO_SHORT.code:
      return t("Must be at least {min} characters", {
        note: "field issue",
        variables: { min: param(params, "min") },
      });
    case FIELD_ISSUE_CODES.TOO_LONG.code:
      return t("Must be at most {max} characters", {
        note: "field issue",
        variables: { max: param(params, "max") },
      });
    case FIELD_ISSUE_CODES.TOO_SMALL.code:
      return t("Must be at least {min}", {
        note: "field issue",
        variables: { min: param(params, "min") },
      });
    case FIELD_ISSUE_CODES.TOO_LARGE.code:
      return t("Must be at most {max}", {
        note: "field issue",
        variables: { max: param(params, "max") },
      });
    case FIELD_ISSUE_CODES.INVALID_FORMAT.code:
      return t("Invalid format", { note: "field issue" });
    case FIELD_ISSUE_CODES.INVALID_OPTION.code:
      return t("Invalid option", { note: "field issue" });
    case FIELD_ISSUE_CODES.DUPLICATE_OPTION.code:
      return t("Duplicate option", { note: "field issue" });
    default:
      return binding.error;
  }
}

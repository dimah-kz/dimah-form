import {
  APIError,
  FORM_ERROR_CODES,
  isAPIError,
  isFormErrorCode,
  type ValidationIssue,
} from "@dimah-form/core";

export { APIError, FORM_ERROR_CODES, isAPIError, isFormErrorCode };

/** English API errors with stable codes for client-side localization. */
export const errors = {
  notFound: () => APIError.from("NOT_FOUND", FORM_ERROR_CODES.NOT_FOUND),

  conflict: () => APIError.from("CONFLICT", FORM_ERROR_CODES.CONFLICT),

  internalError: () =>
    APIError.from("INTERNAL_SERVER_ERROR", FORM_ERROR_CODES.INTERNAL_ERROR),

  unknownForm: (formId: string) =>
    APIError.from("NOT_FOUND", {
      ...FORM_ERROR_CODES.UNKNOWN_FORM,
      params: { formId },
    }),

  unknownResponse: (responseId: string) =>
    APIError.from("NOT_FOUND", {
      ...FORM_ERROR_CODES.UNKNOWN_RESPONSE,
      params: { responseId },
    }),

  validationError: (messageOrIssues?: string | ValidationIssue[]) => {
    if (Array.isArray(messageOrIssues)) {
      return APIError.from("BAD_REQUEST", {
        ...FORM_ERROR_CODES.VALIDATION_ERROR,
        issues: messageOrIssues,
      });
    }
    return APIError.from("BAD_REQUEST", {
      code: FORM_ERROR_CODES.VALIDATION_ERROR.code,
      message: messageOrIssues ?? FORM_ERROR_CODES.VALIDATION_ERROR.message,
    });
  },
} as const;

/**
 * App-facing protocol surface. `@dimah-form/server` and `@dimah-form/react`
 * re-export this module so apps import from the package they already use.
 * Protocol/plugin authors still import the rest from `@dimah-form/core`.
 */
export {
  APIError,
  FIELD_ISSUE_CODES,
  FORM_ERROR_CODES,
  defineErrorCodes,
  isAPIError,
  isFormErrorCode,
  type ErrorCodeCatalog,
  type ErrorCodeEntry,
  type FieldIssueCode,
  type FormErrorCode,
} from "./error";
export {
  applyAnswerPatch,
  chainAnswersValidators,
  collectAnswerIssues,
  isFieldVisible,
  parseAnswers,
  seedDefaultAnswers,
  stripHiddenAnswers,
  type AnswerValidationMode,
  type AnswersValidator,
} from "./answers";
export {
  emptyToNull,
  fieldIssueMap,
  fieldLabel,
  fieldOptions,
  formCompletion,
  formErrorCode,
  formErrorMessage,
  formErrorParams,
  formatAnswer,
  issuesByField,
  visibleFields,
  type FieldOption,
  type FormCompletion,
} from "./field-view";
export {
  createDefineForm,
  defineFieldType,
  defineForm,
  type CreateDefineFormOptions,
  type FieldIssueInput,
  type FieldTypeDefinition,
  type FieldValidateContext,
  type FieldValidateResult,
  type FormDefinitionInput,
} from "./define";
export type {
  BuiltinFieldTypeName,
  FieldDocumentFor,
  FormDefinitionFor,
  FormDefinitionMeta,
  FormDefinitionMetaDefault,
  InferFieldDocument,
  MergeFormMeta,
  NamespacedMeta,
} from "./form-definition";
export type {
  PluginFieldTypeUnion,
  PluginMetaMap,
  PluginMetaSource,
} from "./plugin/types";
export type { FormDefinitionMetaSchema } from "./plugin/meta-schema";
export { FORM_API_BASE_PATH } from "./routes";
export type {
  InferAnswersMap,
  InferClientFormAnswers,
  InferFormAnswers,
} from "./infer";
export type { FormFetchError, ValidationIssue } from "./schema/error";
export type {
  DocumentMeta,
  FieldShowWhen,
  FormAnswers,
  FormDefinition,
  FormField,
  FormList,
  FormSnapshot,
  FormStatus,
  SelectOption,
  ResponseList,
  ResponseListFilter,
  ResponseRecord,
  ResponseStatus,
  ResponseSummary,
} from "./schema";
export { matchesResponseListFilter } from "./schema";

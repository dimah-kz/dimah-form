import type { Endpoint } from "better-call";
import type {
  FieldTypeDefinition,
  FormApiOperation,
  FormSnapshot,
  ResponseRecord,
} from "@dimah-form/core";

import type { ResponseStore } from "./store";

export type MaybePromise<T> = T | Promise<T>;

/** Core operations plus plugin-defined strings. */
export type FormOperation = FormApiOperation | (string & {});

export type DimahFormGuard = (context: {
  request: Request;
  operation: FormOperation;
  formId?: string;
  responseId?: string;
}) => MaybePromise<void>;

type ResponseHookContext = {
  request: Request;
  response: ResponseRecord;
};

type FormHookContext = {
  request: Request;
  form: FormSnapshot;
};

export type DimahFormHooks = {
  /** After validation, before persist. May set `response.respondentId`. */
  onStart?: (context: ResponseHookContext) => MaybePromise<void>;
  onSaveDraft?: (context: ResponseHookContext) => MaybePromise<void>;
  onSubmit?: (context: ResponseHookContext) => MaybePromise<void>;
  onSaveForm?: (context: FormHookContext) => MaybePromise<void>;
  onAbandon?: (context: ResponseHookContext) => MaybePromise<void>;
  onReopen?: (context: ResponseHookContext) => MaybePromise<void>;
  onDeleteResponse?: (context: ResponseHookContext) => MaybePromise<void>;
  onDeleteForm?: (context: FormHookContext) => MaybePromise<void>;
  /** After persist. Skip irreversible I/O in `on*` — use these instead. */
  afterStart?: (context: ResponseHookContext) => MaybePromise<void>;
  afterSaveDraft?: (context: ResponseHookContext) => MaybePromise<void>;
  afterSubmit?: (context: ResponseHookContext) => MaybePromise<void>;
  afterSaveForm?: (context: FormHookContext) => MaybePromise<void>;
  afterAbandon?: (context: ResponseHookContext) => MaybePromise<void>;
  afterReopen?: (context: ResponseHookContext) => MaybePromise<void>;
  afterDeleteResponse?: (context: ResponseHookContext) => MaybePromise<void>;
  afterDeleteForm?: (context: FormHookContext) => MaybePromise<void>;
};

export const FORM_HOOK_KEYS = [
  "onStart",
  "onSaveDraft",
  "onSubmit",
  "onSaveForm",
  "onAbandon",
  "onReopen",
  "onDeleteResponse",
  "onDeleteForm",
  "afterStart",
  "afterSaveDraft",
  "afterSubmit",
  "afterSaveForm",
  "afterAbandon",
  "afterReopen",
  "afterDeleteResponse",
  "afterDeleteForm",
] as const satisfies readonly (keyof DimahFormHooks)[];

type MissingFormHook = Exclude<
  keyof DimahFormHooks,
  (typeof FORM_HOOK_KEYS)[number]
>;
const _allHooksListed: [MissingFormHook] extends [never]
  ? true
  : MissingFormHook = true;
void _allHooksListed;

/**
 * Additive feature plugin. Persistence is `database`, not a plugin.
 *
 * @typeParam TEndpoints — better-call endpoints merged onto `form.api`.
 */
export type DimahFormPlugin<
  TEndpoints extends Record<string, Endpoint> = Record<string, Endpoint>,
> = {
  readonly id: string;
  endpoints?: TEndpoints;
  hooks?: DimahFormHooks;
  fieldTypes?: readonly FieldTypeDefinition[];
};

export type ResolvedDimahFormConfig = {
  basePath: string;
  /** Live catalog — read on get/start, not copied at init. */
  forms: Record<string, unknown>;
  guard?: DimahFormGuard;
  hooks: DimahFormHooks;
  database: ResponseStore;
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
};

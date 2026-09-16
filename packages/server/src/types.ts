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

export type DimahFormHooks = {
  /** After validation, before persist. May set `response.respondentId`. */
  onStart?: (context: {
    request: Request;
    response: ResponseRecord;
  }) => MaybePromise<void>;
  onSaveDraft?: (context: {
    request: Request;
    response: ResponseRecord;
  }) => MaybePromise<void>;
  onSubmit?: (context: {
    request: Request;
    response: ResponseRecord;
  }) => MaybePromise<void>;
  onSaveForm?: (context: {
    request: Request;
    form: FormSnapshot;
  }) => MaybePromise<void>;
};

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

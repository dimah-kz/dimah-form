import {
  createFieldTypeRegistry,
  FORM_API_BASE_PATH,
  FORM_ERROR_CODES,
  normalizeFormApiBasePath,
  type FieldTypeDefinition,
  type InferAnswersMap,
} from "@dimah-form/core";

import { coreEndpoints, type CoreEndpoints } from "./api/routes";
import { createFormRouter } from "./api/router";
import { assertFormsConfig } from "./forms";
import { applyPlugins } from "./plugin/apply-plugins";
import type { ResponseStore } from "./store";
import type {
  DimahFormGuard,
  DimahFormPlugin,
  ResolvedDimahFormConfig,
} from "./types";

export type { DimahFormGuard, DimahFormPlugin };

export type DimahFormConfig<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = readonly FieldTypeDefinition[],
> = {
  /** API path prefix for the HTTP `handler`. @default "/api/form" */
  basePath?: string;
  /**
   * Persistence adapter. Use `memoryAdapter()` for tests, or `db()` from
   * `@dimah-form/db`.
   */
  database: ResponseStore;
  /** Additive feature plugins. Persistence is `database`, not a plugin. */
  plugins?: TPlugins;
  /** Custom field types — validators only, not UI. Registered on this instance. */
  fieldTypes?: TFieldTypes;
  /** Code-authored forms. Dynamic forms live in the database. */
  forms?: TForms;
  /** Runs before every operation. Throw to reject. */
  guard?: DimahFormGuard;
};

export type DimahForm<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = readonly FieldTypeDefinition[],
> = {
  handler: (request: Request) => Promise<Response>;
  api: CoreEndpoints;
  $ERROR_CODES: typeof FORM_ERROR_CODES;
  $Infer: {
    forms: TForms;
    answers: InferAnswersMap<TForms, TFieldTypes>;
    plugins: TPlugins;
  };
};

/**
 * Create a dimah-form server instance.
 *
 * Submit validates against the definition snapshot taken at start, not the
 * live questionnaire in {@link DimahFormConfig.forms}.
 */
export function dimahForm<
  const TPlugins extends readonly DimahFormPlugin[] = [],
  const TForms extends Record<string, unknown> = Record<string, unknown>,
  const TFieldTypes extends readonly FieldTypeDefinition[] = [],
>(
  config: DimahFormConfig<TPlugins, TForms, TFieldTypes>,
): DimahForm<TPlugins, TForms, TFieldTypes> {
  if (config.database == null) {
    throw new Error(
      "`dimahForm()` requires `database`. Use `memoryAdapter()` from `@dimah-form/server` for tests, or `db()` from `@dimah-form/db` for persistence.",
    );
  }

  const fieldTypes = createFieldTypeRegistry(config.fieldTypes);
  const forms = (config.forms ?? {}) as Record<string, unknown>;
  assertFormsConfig(forms, fieldTypes);
  applyPlugins(config.plugins);

  const resolved: ResolvedDimahFormConfig = {
    basePath: normalizeFormApiBasePath(config.basePath ?? FORM_API_BASE_PATH),
    forms,
    guard: config.guard,
    database: config.database,
    fieldTypes,
  };

  const { handler, endpoints } = createFormRouter(coreEndpoints, {
    config: resolved,
  });

  return {
    handler,
    api: endpoints,
    $ERROR_CODES: FORM_ERROR_CODES,
    $Infer: undefined as unknown as DimahForm<
      TPlugins,
      TForms,
      TFieldTypes
    >["$Infer"],
  };
}

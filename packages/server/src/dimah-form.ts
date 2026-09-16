import {
  FORM_API_BASE_PATH,
  FORM_ERROR_CODES,
  normalizeFormApiBasePath,
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
  /** Custom field types — validators only, not UI. */
  fieldTypes?: readonly { type: string }[];
  /** Code-authored forms. Dynamic forms live in the database. */
  forms?: TForms;
  /** Runs before every operation. Throw to reject. */
  guard?: DimahFormGuard;
};

export type DimahForm<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
> = {
  handler: (request: Request) => Promise<Response>;
  api: CoreEndpoints;
  $ERROR_CODES: typeof FORM_ERROR_CODES;
  $Infer: {
    forms: TForms;
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
>(config: DimahFormConfig<TPlugins, TForms>): DimahForm<TPlugins, TForms> {
  if (config.database == null) {
    throw new Error(
      "`dimahForm()` requires `database`. Use `memoryAdapter()` from `@dimah-form/server` for tests, or `db()` from `@dimah-form/db` for persistence.",
    );
  }

  const forms = (config.forms ?? {}) as Record<string, unknown>;
  assertFormsConfig(forms);
  applyPlugins(config.plugins);

  const resolved: ResolvedDimahFormConfig = {
    basePath: normalizeFormApiBasePath(config.basePath ?? FORM_API_BASE_PATH),
    forms,
    guard: config.guard,
    database: config.database,
  };

  const { handler, endpoints } = createFormRouter(coreEndpoints, {
    config: resolved,
  });

  return {
    handler,
    api: endpoints,
    $ERROR_CODES: FORM_ERROR_CODES,
    $Infer: undefined as unknown as DimahForm<TPlugins, TForms>["$Infer"],
  };
}

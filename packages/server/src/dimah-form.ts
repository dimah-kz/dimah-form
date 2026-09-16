import {
  FORM_API_BASE_PATH,
  FORM_ERROR_CODES,
  normalizeFormApiBasePath,
} from "@dimah-form/core";

export type DimahFormPlugin = {
  readonly id: string;
};

export type DimahFormConfig<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** API path prefix for the HTTP `handler`. @default "/api/form" */
  basePath?: string;
  /** Optional server plugins (e.g. `db()` from `@dimah-form/db`). */
  plugins?: TPlugins;
  /** Custom field types — validators only, not UI. */
  fieldTypes?: readonly { type: string }[];
  /** Code-authored forms. Dynamic forms live in the database. */
  forms?: TForms;
  /** Runs before every operation. Throw to reject. */
  guard?: (context: { request: Request }) => Promise<void> | void;
};

export type DimahForm<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
> = {
  handler: (request: Request) => Promise<Response>;
  api: Record<string, never>;
  $ERROR_CODES: typeof FORM_ERROR_CODES;
  $Infer: {
    forms: TForms;
    plugins: TPlugins;
  };
};

/**
 * Create a dimah-form server instance.
 *
 * Protocol endpoints are not implemented yet — this is the public shell.
 */
export function dimahForm<
  const TPlugins extends readonly DimahFormPlugin[] = [],
  const TForms extends Record<string, unknown> = Record<string, unknown>,
>(config: DimahFormConfig<TPlugins, TForms> = {}): DimahForm<TPlugins, TForms> {
  const {
    basePath: basePathOption,
    plugins: _plugins,
    fieldTypes: _fieldTypes,
    forms: _forms,
    guard: _guard,
  } = config;
  const basePath = normalizeFormApiBasePath(
    basePathOption ?? FORM_API_BASE_PATH,
  );

  return {
    async handler() {
      return Response.json(
        {
          message: "dimah-form handler is not implemented yet",
          code: FORM_ERROR_CODES.INTERNAL_ERROR.code,
          basePath,
        },
        { status: 501 },
      );
    },
    api: {},
    $ERROR_CODES: FORM_ERROR_CODES,
    $Infer: undefined as unknown as DimahForm<TPlugins, TForms>["$Infer"],
  };
}

import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";
import {
  createFormClient as createFormApiClient,
  type CreateFormClientOptions,
  type CreateFormClientResult,
  type FieldTypeDefinition,
  type FormClientPlugin,
  type FormServerLike,
} from "@dimah-form/core";

const FormClientContext = createContext<unknown>(null);

export type FormClient<
  TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
  TServer = undefined,
> = CreateFormClientResult<TPlugins, TForms, TFieldTypes, TServer> & {
  Provider: (props: { children: ReactNode }) => ReactNode;
  useFormClient: () => CreateFormClientResult<
    TPlugins,
    TForms,
    TFieldTypes,
    TServer
  >;
};

/**
 * React client — protocol API plus `Provider`.
 *
 * Re-export `useFormClient` from this instance for `$Infer` types:
 *
 * @example
 * ```ts
 * export type Form = typeof form;
 * export const formClient = createFormClient<Form>();
 * export const { Provider, useFormClient } = formClient;
 * ```
 */
export function createFormClient<
  TServer extends FormServerLike | undefined = undefined,
  const TPlugins extends readonly FormClientPlugin[] = [],
  const TForms extends Record<string, unknown> = Record<string, unknown>,
  const TFieldTypes extends readonly FieldTypeDefinition[] = [],
>(
  options: CreateFormClientOptions<TPlugins, TForms, TFieldTypes> = {},
): FormClient<TPlugins, TForms, TFieldTypes, TServer> {
  const client = createFormApiClient<TServer, TPlugins, TForms, TFieldTypes>(
    options,
  );

  function Provider({ children }: { children: ReactNode }) {
    return createElement(
      FormClientContext.Provider,
      { value: client },
      children,
    );
  }

  function useBoundFormClient(): CreateFormClientResult<
    TPlugins,
    TForms,
    TFieldTypes,
    TServer
  > {
    const ctx = useContext(FormClientContext);
    if (ctx == null) {
      throw new Error("useFormClient must be used under formClient.Provider");
    }
    return ctx as CreateFormClientResult<
      TPlugins,
      TForms,
      TFieldTypes,
      TServer
    >;
  }

  return {
    ...client,
    Provider,
    useFormClient: useBoundFormClient,
  } as FormClient<TPlugins, TForms, TFieldTypes, TServer>;
}

/**
 * Reads the client from context. Prefer `formClient.useFormClient` (or a
 * re-export of it) so `$Infer` stays tied to your instance.
 */
export function useFormClient<
  TClient extends CreateFormClientResult = CreateFormClientResult,
>(): TClient {
  const client = useContext(FormClientContext);
  if (client == null) {
    throw new Error("useFormClient must be used under formClient.Provider");
  }
  return client as TClient;
}

export type {
  CreateFormClientOptions,
  CreateFormClientResult,
  FormClientApi,
  FormClientPlugin,
  FormServerLike,
} from "@dimah-form/core";

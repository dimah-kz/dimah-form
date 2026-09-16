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
} from "@dimah-form/core";

const FormClientContext = createContext<unknown>(null);

export type FormClient<
  TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
> = CreateFormClientResult<TPlugins, TForms, TFieldTypes> & {
  Provider: (props: { children: ReactNode }) => ReactNode;
};

export function createFormClient<
  const TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
>(
  options: CreateFormClientOptions<TPlugins> = {},
): FormClient<TPlugins, TForms, TFieldTypes> {
  const client = createFormApiClient<TPlugins, TForms, TFieldTypes>(options);

  function Provider({ children }: { children: ReactNode }) {
    return createElement(
      FormClientContext.Provider,
      { value: client },
      children,
    );
  }

  return { ...client, Provider } as FormClient<TPlugins, TForms, TFieldTypes>;
}

export function useFormClient<
  TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
>(): CreateFormClientResult<TPlugins, TForms, TFieldTypes> {
  const client = useContext(FormClientContext);
  if (client == null) {
    throw new Error("useFormClient must be used under FormClient.Provider");
  }
  return client as unknown as CreateFormClientResult<
    TPlugins,
    TForms,
    TFieldTypes
  >;
}

export type {
  CreateFormClientOptions,
  CreateFormClientResult,
  FormClientApi,
  FormClientPlugin,
} from "@dimah-form/core";

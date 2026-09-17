import { createElement, useContext, type ReactNode } from "react";
import {
  createFormClient as createFormApiClient,
  type CreateFormClientOptions,
  type CreateFormClientResult,
  type FieldTypeDefinition,
  type FormClientPlugin,
  type FormServerLike,
} from "@dimah-form/core";

import { FormClientContext } from "./form-client-context";
import {
  useFormResponse,
  type FormResponseApi,
  type UseFormResponseOptions,
} from "./use-form-response";

export type FormClient<
  TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
  TServer = undefined,
> = CreateFormClientResult<TPlugins, TForms, TFieldTypes, TServer> & {
  Provider: (props: { children: ReactNode }) => ReactNode;
  useFormClient: () => CreateFormClientResult<
    TPlugins,
    TForms,
    TFieldTypes,
    TServer
  >;
  useFormResponse: (
    options: Omit<UseFormResponseOptions, "client">,
  ) => FormResponseApi;
};

/**
 * React client — protocol API plus bound hooks.
 *
 * Re-export hooks from this instance so the protocol client and field types
 * stay tied to it. `$Infer` lives on the client (`formClient.$Infer` /
 * `useFormClient`). Bound `useFormResponse` is the headless fill session
 * (`answers` are `FormAnswers`). Bound hooks do not need `Provider`.
 * Package-level `useFormClient` / `useFormResponse` read context and are the
 * untyped escape hatch.
 *
 * @example
 * ```ts
 * export type Form = typeof form;
 * export const formClient = createFormClient<Form>({ fieldTypes });
 * export const { useFormClient, useFormResponse } = formClient;
 * ```
 */
export function createFormClient<
  TServer extends FormServerLike | undefined = undefined,
  const TPlugins extends readonly FormClientPlugin[] = [],
  const TForms extends Record<string, unknown> = Record<string, unknown>,
  const TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
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
    return client;
  }

  function useBoundFormResponse(
    options: Omit<UseFormResponseOptions, "client">,
  ): FormResponseApi {
    return useFormResponse({
      ...options,
      client,
      fieldTypes: options.fieldTypes ?? client.fieldTypes,
    });
  }

  return {
    ...client,
    Provider,
    useFormClient: useBoundFormClient,
    useFormResponse: useBoundFormResponse,
  };
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

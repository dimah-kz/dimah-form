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
} from "@dimah-form/core";

const FormClientContext = createContext<CreateFormClientResult | null>(null);

export type FormClient = CreateFormClientResult & {
  Provider: (props: { children: ReactNode }) => ReactNode;
};

export function createFormClient(
  options: CreateFormClientOptions = {},
): FormClient {
  const client = createFormApiClient(options);

  function Provider({ children }: { children: ReactNode }) {
    return createElement(
      FormClientContext.Provider,
      { value: client },
      children,
    );
  }

  return { ...client, Provider };
}

export function useFormClient(): CreateFormClientResult {
  const client = useContext(FormClientContext);
  if (!client) {
    throw new Error("useFormClient must be used under FormClient.Provider");
  }
  return client;
}

export type {
  CreateFormClientOptions,
  CreateFormClientResult,
  FormClientApi,
} from "@dimah-form/core";

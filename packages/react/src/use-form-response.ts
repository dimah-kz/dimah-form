import {
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  createFormResponseSession,
  type CreateFormResponseSessionOptions,
  type FormResponseApi,
  type FormResponseSessionClient,
} from "@dimah-form/core";

import { FormClientContext } from "./form-client-context";

export type UseFormResponseOptions = Omit<
  CreateFormResponseSessionOptions,
  "client"
> & {
  client?: FormResponseSessionClient;
};

export type { FormResponseApi };

function sessionKey(options: UseFormResponseOptions) {
  return `${options.snapshot.id}:${options.response?.id ?? ""}:${options.validate ?? "submit"}`;
}

/**
 * Headless fill session. Bind widgets with `visibleFields` / `field(id)`.
 *
 * Prefer `formClient.useFormResponse` (or a re-export) so the protocol client
 * and field types come from your instance. This unbound hook reads context.
 */
export function useFormResponse(
  options: UseFormResponseOptions,
): FormResponseApi {
  const ctx = useContext(FormClientContext) as FormResponseSessionClient | null;
  const client = options.client ?? ctx;
  if (client == null) {
    throw new Error(
      "useFormResponse requires a client option or formClient.Provider",
    );
  }

  const fieldTypes = options.fieldTypes ?? client.fieldTypes;
  const key = sessionKey(options);
  const session = useMemo(
    () =>
      createFormResponseSession({
        client,
        snapshot: options.snapshot,
        response: options.response,
        respondentId: options.respondentId,
        fieldTypes,
        validate: options.validate,
        onStarted: options.onStarted,
        onSaved: options.onSaved,
        onSubmitted: options.onSubmitted,
        onReopened: options.onReopened,
        onAbandoned: options.onAbandoned,
      }),
    // Callbacks / fieldTypes are synced below — do not reset answers.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on form row
    [key, client],
  );

  useLayoutEffect(() => {
    session.sync({
      client,
      respondentId: options.respondentId,
      fieldTypes,
      validate: options.validate,
      onStarted: options.onStarted,
      onSaved: options.onSaved,
      onSubmitted: options.onSubmitted,
      onReopened: options.onReopened,
      onAbandoned: options.onAbandoned,
    });
  });

  const state = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState,
  );

  return useMemo(
    () => ({
      ...state,
      setAnswer: session.setAnswer,
      setAnswers: session.setAnswers,
      field: session.field,
      validate: session.validate,
      saveDraft: session.saveDraft,
      submit: session.submit,
      reopen: session.reopen,
      abandon: session.abandon,
      refresh: session.refresh,
    }),
    [session, state],
  );
}

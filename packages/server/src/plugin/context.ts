import type { FormSnapshot, ResponseRecord } from "@dimah-form/core";

import type { FormHookContext, ResponseHookContext } from "@/types";

type PluginContextSource = {
  pluginContext: ReadonlyMap<string, unknown>;
};

function pluginContextLookup(
  source: PluginContextSource,
): ResponseHookContext["getPluginContext"] {
  return <T = unknown>(id: string) =>
    source.pluginContext.get(id) as T | undefined;
}

/** Read the value returned from a plugin `init({ context })`. */
export function getPluginContext<T = unknown>(
  source: PluginContextSource,
  id: string,
): T | undefined {
  return source.pluginContext.get(id) as T | undefined;
}

export function responseHookContext(
  source: PluginContextSource,
  request: Request,
  response: ResponseRecord,
): ResponseHookContext {
  return {
    request,
    response,
    getPluginContext: pluginContextLookup(source),
  };
}

export function formHookContext(
  source: PluginContextSource,
  request: Request,
  form: FormSnapshot,
): FormHookContext {
  return {
    request,
    form,
    getPluginContext: pluginContextLookup(source),
  };
}

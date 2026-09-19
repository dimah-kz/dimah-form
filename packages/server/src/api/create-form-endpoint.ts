import { FORM_API_ROUTE_KEYS, formApiRouteKey } from "@dimah-form/core";
import { createEndpoint, type EndpointOptions } from "better-call";
import * as z from "zod";

import { errors } from "@/errors";
import { findLiveForm } from "@/forms";
import type { FormOperation } from "@/types";
import type { FormEndpointContext } from "./context";
import { formContextMiddleware } from "./create-form-middleware";

const createEndpointWithContext = createEndpoint.create({
  use: [formContextMiddleware],
});

function compileIfZod<T>(schema: T): T {
  if (schema !== null && typeof schema === "object" && "_zod" in schema) {
    return z.compile(schema as unknown as z.ZodType) as T;
  }
  return schema;
}

function withFormValidation<O extends EndpointOptions>(options: O): O {
  return {
    ...options,
    ...(options.body !== undefined ? { body: compileIfZod(options.body) } : {}),
    ...(options.query !== undefined
      ? { query: compileIfZod(options.query) }
      : {}),
    onValidationError:
      options.onValidationError ??
      (({ message }: { message: string }) => {
        throw errors.validationError(message);
      }),
  };
}

function idsFrom(ctx: {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): { formId?: string; responseId?: string } {
  const query = ctx.query ?? {};
  const body = ctx.body ?? {};
  const formId = [query.formId, body.formId, body.id].find(
    (value) => typeof value === "string",
  );
  const responseId = [query.responseId, body.responseId].find(
    (value) => typeof value === "string",
  );
  return {
    ...(formId ? { formId } : {}),
    ...(responseId ? { responseId } : {}),
  };
}

function inferOperation(
  options: EndpointOptions,
  path: string,
  pluginOperations?: ReadonlyMap<string, string>,
): FormOperation {
  const explicit = options.metadata?.operation;
  if (typeof explicit === "string") return explicit;
  const key = formApiRouteKey(String(options.method), path);
  return FORM_API_ROUTE_KEYS[key] ?? pluginOperations?.get(key) ?? key;
}

function guardHandler(
  options: EndpointOptions,
  path: string,
  handler: (...args: never[]) => unknown,
) {
  return async (ctx: {
    context: FormEndpointContext;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  }) => {
    const config = ctx.context.config;
    await config.guard?.({
      request: ctx.context.request,
      operation: inferOperation(options, path, config.pluginOperations),
      ...idsFrom(ctx),
      getResponse: (responseId) => config.database.get(responseId),
      getForm: (idOrSlug) => findLiveForm(config, idOrSlug),
    });
    return handler(ctx as never);
  };
}

type CreateFormEndpoint = typeof createEndpointWithContext;

/**
 * Typed endpoint for dimah-form core and plugin routes.
 *
 * Paths are absolute under `basePath`. Context (`config`, `request`) is
 * injected by the router / `form.api`. Zod failures throw `APIError`
 * (`VALIDATION_ERROR`) via better-call `onValidationError`.
 *
 * Guard `operation` is `metadata.operation` when set, otherwise the core
 * route name or the plugin `endpoints` key (e.g. `"ping"`).
 */
export const createFormEndpoint: CreateFormEndpoint = ((
  pathOrOptions: string | EndpointOptions,
  optionsOrHandler: EndpointOptions | ((...args: never[]) => unknown),
  maybeHandler?: (...args: never[]) => unknown,
) => {
  if (typeof pathOrOptions === "string") {
    const options = optionsOrHandler as EndpointOptions;
    return createEndpointWithContext(
      pathOrOptions,
      withFormValidation(options),
      guardHandler(
        options,
        pathOrOptions,
        maybeHandler as (...args: never[]) => unknown,
      ),
    );
  }
  const options = pathOrOptions;
  const path =
    "path" in options && typeof options.path === "string" ? options.path : "";
  return createEndpointWithContext(
    withFormValidation(options),
    guardHandler(
      options,
      path,
      optionsOrHandler as (...args: never[]) => unknown,
    ),
  );
}) as unknown as CreateFormEndpoint;

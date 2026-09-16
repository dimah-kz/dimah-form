import { createEndpoint, type EndpointOptions } from "better-call";
import * as z from "zod";

import { errors } from "@/errors";
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

type CreateFormEndpoint = typeof createEndpointWithContext;

/**
 * Typed endpoint for dimah-form core routes.
 *
 * Paths are absolute under `basePath`. Context (`config`, `request`) is
 * injected by the router / `form.api`. Zod failures throw `APIError`
 * (`VALIDATION_ERROR`) via better-call `onValidationError`.
 */
export const createFormEndpoint: CreateFormEndpoint = ((
  pathOrOptions: string | EndpointOptions,
  optionsOrHandler: EndpointOptions | ((...args: never[]) => unknown),
  maybeHandler?: (...args: never[]) => unknown,
) => {
  if (typeof pathOrOptions === "string") {
    return createEndpointWithContext(
      pathOrOptions,
      withFormValidation(optionsOrHandler as EndpointOptions),
      maybeHandler as never,
    );
  }
  return createEndpointWithContext(
    withFormValidation(pathOrOptions),
    optionsOrHandler as never,
  );
}) as unknown as CreateFormEndpoint;

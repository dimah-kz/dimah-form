import type { IncomingMessage, ServerResponse } from "node:http";
import { toNodeHandler } from "./node";
import type { DimahFormHandlerSource } from "./types";

/** Structural Fastify request/reply — avoids a hard dependency on `fastify`. */
type FastifyRequestLike = {
  raw: IncomingMessage;
};

type FastifyReplyLike = {
  raw: ServerResponse;
  hijack: () => void;
};

/**
 * Adapt a dimah-form instance to a Fastify route handler.
 *
 * Uses `reply.hijack()` and the Node adapter so Fastify does not touch the
 * response stream. Mount this route **before** body parsers (or disable JSON
 * parsing for `/api/form/*`) so the request body stays readable.
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { toFastifyHandler } from "@dimah-form/server/fastify";
 * import { form } from "./form";
 *
 * const app = Fastify();
 * app.all("/api/form/*", toFastifyHandler(form));
 * ```
 */
export function toFastifyHandler(form: DimahFormHandlerSource) {
  const handler = toNodeHandler(form);
  return async (req: FastifyRequestLike, reply: FastifyReplyLike) => {
    reply.hijack();
    await handler(req.raw, reply.raw);
  };
}

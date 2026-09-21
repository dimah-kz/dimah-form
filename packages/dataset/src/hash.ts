import type { FormSnapshot } from "@dimah-form/core";
import canonicalize from "canonicalize";

/** SHA-256 hex of the questionnaire instrument — not timestamps or slug. */
export type SnapshotKeyCache = Map<string, Promise<string>>;

/**
 * RFC 8785 (JSON Canonicalization Scheme). Object key order does not change
 * the bytes. `undefined` object members are omitted.
 */
export function canonicalJson(value: unknown): string {
  const json = canonicalize(value);
  if (typeof json !== "string") {
    throw new TypeError("dimah-form dataset cannot canonicalize this value.");
  }
  return json;
}

/**
 * Definition keys that change the instrument. `id`, `slug`, `status`,
 * `createdAt`, and `updatedAt` are omitted so a touch-save does not
 * fragment the codebook.
 */
export function instrumentSlice(definition: FormSnapshot): unknown {
  return {
    title: definition.title,
    ...(definition.description !== undefined
      ? { description: definition.description }
      : {}),
    fields: definition.fields,
    ...(definition.meta !== undefined ? { meta: definition.meta } : {}),
  };
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function snapshotKey(
  definition: FormSnapshot,
  cache?: SnapshotKeyCache,
): Promise<string> {
  const json = canonicalJson(instrumentSlice(definition));
  const hit = cache?.get(json);
  if (hit) return hit;
  const pending = sha256Hex(json);
  cache?.set(json, pending);
  return pending;
}

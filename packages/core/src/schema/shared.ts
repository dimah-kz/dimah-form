import * as z from "zod";

/** Non-empty trimmed string. */
export const trimmedString = z.string().trim().min(1);

/** `dimahForm({ forms })` record key. */
export const formIdSchema = trimmedString;

/** Stable field key — also the answers object key. */
export const fieldIdSchema = trimmedString;

/** Response row id (UUID at runtime). */
export const responseIdSchema = trimmedString;

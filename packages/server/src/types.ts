import type { FieldTypeDefinition } from "@dimah-form/core";

import type { ResponseStore } from "./store";

export type DimahFormGuard = (context: {
  request: Request;
}) => Promise<void> | void;

/** Additive feature plugin. Persistence is `database`, not a plugin. */
export type DimahFormPlugin = {
  readonly id: string;
};

export type ResolvedDimahFormConfig = {
  basePath: string;
  /** Live catalog — read on get/start, not copied at init. */
  forms: Record<string, unknown>;
  guard?: DimahFormGuard;
  database: ResponseStore;
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
};

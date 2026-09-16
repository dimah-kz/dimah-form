import type { ResponseStore } from "./store";

export type DimahFormGuard = (context: {
  request: Request;
}) => Promise<void> | void;

export type DimahFormPlugin = {
  readonly id: string;
  /** Replaces the in-memory response store. Only one plugin may set this. */
  store?: ResponseStore;
};

export type ResolvedDimahFormConfig = {
  basePath: string;
  /** Live catalog — read on get/start, not copied at init. */
  forms: Record<string, unknown>;
  guard?: DimahFormGuard;
  store: ResponseStore;
};

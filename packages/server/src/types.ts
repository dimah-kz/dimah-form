import type { ResponseStore } from "./store";

export type DimahFormGuard = (context: {
  request: Request;
}) => Promise<void> | void;

export type ResolvedDimahFormConfig = {
  basePath: string;
  /** Live catalog — read on get/start, not copied at init. */
  forms: Record<string, unknown>;
  guard?: DimahFormGuard;
  store: ResponseStore;
};

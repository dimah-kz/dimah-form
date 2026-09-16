import { getForm } from "./get-form";
import { getResponse } from "./get-response";
import { saveDraft } from "./save-draft";
import { startResponse } from "./start-response";
import { submitResponse } from "./submit-response";

/** Core better-call endpoints — keys become `form.api.*`. */
export const coreEndpoints = {
  getForm,
  startResponse,
  getResponse,
  saveDraft,
  submitResponse,
};

export type CoreEndpoints = typeof coreEndpoints;

export const CORE_ENDPOINT_NAMES = Object.keys(
  coreEndpoints,
) as (keyof CoreEndpoints)[];

import { abandonResponse } from "./abandon-response";
import { deleteForm } from "./delete-form";
import { deleteResponse } from "./delete-response";
import { getForm } from "./get-form";
import { getResponse } from "./get-response";
import { listForms } from "./list-forms";
import { listResponses } from "./list-responses";
import { saveDraft } from "./save-draft";
import { saveForm } from "./save-form";
import { startResponse } from "./start-response";
import { submitResponse } from "./submit-response";

/** Core better-call endpoints — keys become `form.api.*`. */
export const coreEndpoints = {
  getForm,
  saveForm,
  deleteForm,
  listForms,
  startResponse,
  getResponse,
  listResponses,
  saveDraft,
  submitResponse,
  abandonResponse,
  deleteResponse,
};

export type CoreEndpoints = typeof coreEndpoints;

export const CORE_ENDPOINT_NAMES = Object.keys(
  coreEndpoints,
) as (keyof CoreEndpoints)[];

import { toNextJsHandler } from "@dimah-form/server/next";

import { form } from "@/lib/form";

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(form);

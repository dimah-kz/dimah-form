import { fumadb } from "fumadb";

import { v1 } from "./schema/v1";

export const DimahFormDB = fumadb({
  namespace: "dimah_form",
  schemas: [v1],
});

export { v1 };

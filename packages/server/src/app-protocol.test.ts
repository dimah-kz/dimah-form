import { describe, expect, it } from "vitest";
import * as appProtocol from "@dimah-form/core/app-protocol";

import * as server from "./index";

describe("app protocol barrel", () => {
  it("re-exports every runtime symbol from @dimah-form/core/app-protocol", () => {
    const missing = Object.keys(appProtocol).filter((key) => !(key in server));
    expect(missing).toEqual([]);
  });
});

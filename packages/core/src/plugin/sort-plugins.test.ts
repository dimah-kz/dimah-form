import { describe, expect, it } from "vitest";

import { sortPluginsByDependsOn } from "./sort-plugins";

describe("sortPluginsByDependsOn", () => {
  it("keeps original order when nothing depends", () => {
    expect(
      sortPluginsByDependsOn([{ id: "b" }, { id: "a" }], "plugin").map(
        (plugin) => plugin.id,
      ),
    ).toEqual(["b", "a"]);
  });

  it("runs dependencies first even if listed later", () => {
    expect(
      sortPluginsByDependsOn(
        [{ id: "b", dependsOn: ["a"] }, { id: "a" }],
        "plugin",
      ).map((plugin) => plugin.id),
    ).toEqual(["a", "b"]);
  });

  it("rejects a missing dependency", () => {
    expect(() =>
      sortPluginsByDependsOn(
        [{ id: "files", dependsOn: ["storage"] }],
        "plugin",
      ),
    ).toThrow(/plugin "files" depends on "storage", which is not installed/);
  });

  it("rejects a self-dependency", () => {
    expect(() =>
      sortPluginsByDependsOn([{ id: "a", dependsOn: ["a"] }], "plugin"),
    ).toThrow(/cannot depend on itself/);
  });

  it("rejects a cycle", () => {
    expect(() =>
      sortPluginsByDependsOn(
        [
          { id: "a", dependsOn: ["b"] },
          { id: "b", dependsOn: ["a"] },
        ],
        "client plugin",
      ),
    ).toThrow(/client plugin cycle involving "a", "b"/);
  });
});

import { FORM_ERROR_CODES, type ErrorCodeCatalog } from "../error-codes";

type PluginWithCodes = {
  readonly id: string;
  readonly $ERROR_CODES?: ErrorCodeCatalog;
};

/**
 * Core catalog plus plugin catalogs. Plugins cannot shadow a core code or
 * another plugin's code. Returns the core object identity when nothing merges.
 */
export function mergeErrorCodes(
  plugins: readonly PluginWithCodes[],
  label: "plugin" | "client plugin",
): ErrorCodeCatalog {
  const merged: ErrorCodeCatalog = { ...FORM_ERROR_CODES };
  const owner = new Map<string, string>();
  for (const code of Object.keys(FORM_ERROR_CODES)) {
    owner.set(code, "core");
  }

  let extra = 0;
  for (const plugin of plugins) {
    const catalog = plugin.$ERROR_CODES;
    if (!catalog) continue;
    for (const [code, entry] of Object.entries(catalog)) {
      const existing = owner.get(code);
      if (existing === "core") {
        throw new Error(
          `Duplicate dimah-form error code "${code}". ${capitalize(label)} "${plugin.id}" conflicts with a core code.`,
        );
      }
      if (existing) {
        throw new Error(
          `Duplicate dimah-form error code "${code}". ${capitalize(label)} "${plugin.id}" conflicts with ${label} "${existing}".`,
        );
      }
      owner.set(code, plugin.id);
      merged[code] = entry;
      extra += 1;
    }
  }

  return extra === 0 ? FORM_ERROR_CODES : merged;
}

function capitalize(label: "plugin" | "client plugin") {
  return label === "plugin" ? "Plugin" : "Client plugin";
}

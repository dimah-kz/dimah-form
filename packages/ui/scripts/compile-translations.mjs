import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { compileAndWrite } from "fuma-translate/cli";

/**
 * Scan UI sources (Fuma only associates keys with `useTranslations()` call
 * sites). Write the generated `Translations` type into `src/` for tsc.
 *
 * Headless `@dimah-form/react` stays English `code` + `message`. Copy lives here.
 */
const uiRoot = fileURLToPath(new URL("..", import.meta.url));
const uiSrc = join(uiRoot, "src");
const outDir = join(uiRoot, ".translations");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path, acc);
      continue;
    }
    if (/\.(?:tsx|ts)$/.test(name) && !name.endsWith(".d.ts")) {
      acc.push(relative(uiRoot, path).replaceAll("\\", "/"));
    }
  }
  return acc;
}

const input = walk(uiSrc).filter(
  (path) => !path.endsWith("src/lib/dimah-form-translations.ts"),
);

const { keyCount } = await compileAndWrite({
  input,
  out: outDir,
});

writeFileSync(
  join(uiSrc, "lib/dimah-form-translations.ts"),
  `${readFileSync(join(outDir, "index.ts"), "utf8").trimEnd()}\n`,
);

console.log(`Compiled ${keyCount} translation keys from ${input.length} files`);

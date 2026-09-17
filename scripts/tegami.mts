import { execFileSync } from "node:child_process";
import { tegami, type TegamiPlugin } from "tegami";
import { runCli } from "tegami/cli";
import { github } from "tegami/plugins/github";

/** Build each package (and its deps) via Turbo right before npm publish. */
function buildOnPublish(): TegamiPlugin {
  return {
    name: "build-on-publish",
    willPublish({ pkg }) {
      execFileSync(
        "pnpm",
        ["exec", "turbo", "run", "build", "--filter", pkg.name],
        {
          cwd: this.cwd,
          stdio: "inherit",
          shell: true,
        },
      );
    },
  };
}

const paper = tegami({
  groups: {
    "dimah-form": {
      syncBump: true,
      syncGitTag: true,
    },
  },
  packages: () => ({ group: "dimah-form" }),
  ignore: [
    "dimah-form",
    "@dimah-form/example-next",
    "@workspace/eslint-config",
    "@workspace/tsup-config",
    "@workspace/typescript-config",
    "@workspace/vitest-config",
  ],
  npm: {
    client: "pnpm",
    updateLockFile: true,
    bumpDep: () => false,
    trustedPublish: {
      provider: "github",
      workflow: "publish.yml",
    },
  },
  plugins: [
    buildOnPublish(),
    github({
      repo: "dimah-kz/dimah-form",
      versionPr: {
        base: "main",
        create() {
          const version = this.graph.get("npm:@dimah-form/core")?.version;
          return {
            title: version
              ? `chore: version packages (${version})`
              : "chore: version packages",
          };
        },
      },
    }),
  ],
});

await runCli(paper);

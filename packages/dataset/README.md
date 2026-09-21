# @dimah-form/dataset

Official dataset plugin. Project stored responses into a versioned **JSON Lines + codebook** interchange. CSV is a convenience encoding. HTTP stays paged; a full-file zip belongs in the consumer app.

Derived data only. The plugin does not add tables or a `meta` namespace. Records are built from the **response definition snapshot**, never the live questionnaire.

## Install

```bash
pnpm add @dimah-form/dataset
```

Peer-depends on `@dimah-form/core`. The server entry also needs `@dimah-form/server`. Scoring columns need `@dimah-form/scoring` (optional peer). Browser modules should import from `@dimah-form/dataset/client` so the server package stays off the client bundle.

```ts
import { datasetPlugin } from "@dimah-form/dataset";
import {
  datasetClientPlugin,
  createDatasetReader,
  toJsonl,
} from "@dimah-form/dataset/client";

export const form = dimahForm({
  database,
  plugins: [datasetPlugin()],
});

const clientPlugins = [datasetClientPlugin()] as const;
export const formClient = createFormClient<Form, typeof clientPlugins>({
  plugins: clientPlugins,
});
```

Guard operations for `GET /dataset/responses` and `GET /dataset/codebook` are `getDatasetPage` and `getLiveCodebook`. Treat them like `listResponses` (admin).

`getLiveCodebook` is the **live** form. Historical labels come from `getDatasetPage` / `createDatasetReader`.

## Interchange

`spec: "dimah.dataset/v1"` on every JSON object. Canonical file is `responses.jsonl` plus `codebook.json`. `toDataPackage()` returns a filename → contents map (not a zip).

## License

MIT

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
  plugins: [
    datasetPlugin({
      onProject: async ({ record }) => {
        await warehouse.upsert(record.id, record);
      },
    }),
  ],
});

const clientPlugins = [datasetClientPlugin()] as const;
export const formClient = createFormClient<Form, typeof clientPlugins>({
  plugins: clientPlugins,
});
```

Guard operations for `GET /dataset/responses`, `GET /dataset/codebook/history`, and `GET /dataset/codebook` are `getDatasetPage`, `getDatasetCodebook`, and `getLiveCodebook`. Treat them like `listResponses` (admin).

`getLiveCodebook` is the **live** form. `snapshots[0].n` is 0; `snapshots[0].key` is the live instrument hash. Historical views come from `getDatasetCodebook` / `createDatasetReader`. Page codebooks are that page only. Newest `lastSeenAt` is canonical. An earlier snapshot whose field, score variable, band, or formula differs is one `history` entry (full view, keyed by `snapshotKey`). Walks are capped (default 10_000). Query `maxRows` can lower that cap, not raise it. The result includes `truncated`, and `readCodebook()` returns it.

`onProject` runs after submit. Upsert by `record.id` — reopen then submit runs it again.

## Interchange

`spec: "dimah.dataset/v1"` on every JSON object. Canonical file is `responses.jsonl` plus `codebook.json`. `toDataPackage()` returns a filename → contents map (`profile: "data-package"`). The table schema, with `missingValues: [""]`, is on `responses.csv` only.

A field id that is an identity column (`id`, `formId`, `status`, `submittedAt`, `createdAt`, `updatedAt`, `snapshotKey`, `respondentId`) or starts with `score.` is written as `field.<id>`. If that name is also a field id, encoding throws. Score columns are `score.<id>.raw`, `.band`, `.complete`, and `.missing` (unanswered item count). Variable `missing` policy (`zero` / `omit` / `incomplete`) stays on the codebook; when the form omits it, scoring's default is `incomplete`.

## License

MIT

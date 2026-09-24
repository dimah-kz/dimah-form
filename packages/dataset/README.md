# @dimah-form/dataset

Official dataset plugin. It projects stored response snapshots into versioned
JSON Lines plus a historical codebook. CSV and Frictionless data-package
encoders are included; archives and object storage remain application-owned.

The plugin adds no tables or metadata namespace.

**Documentation:** [Dataset](https://form.dimah.dev/docs/plugins/dataset)

## Install

```bash
pnpm add @dimah-form/dataset
```

```ts
import { datasetPlugin } from "@dimah-form/dataset";

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
```

```ts
import {
  createDatasetReader,
  datasetClientPlugin,
  toJsonl,
} from "@dimah-form/dataset/client";

const plugins = [datasetClientPlugin()] as const;
export const formClient = createFormClient<Form, typeof plugins>({
  plugins,
});
```

Dataset queries default to submitted rows. Guard `getDatasetPage`,
`getDatasetCodebook`, and `getLiveCodebook` like administrative
`listResponses` access. Historical codebook walks default to a 10,000-row cap;
query `maxRows` may lower it, not raise it, and results expose `truncated`.

`onProject` runs after submit. Upsert by `record.id` — reopen then submit runs it again.

## Interchange

Every object uses `spec: "dimah.dataset/v1"`. `snapshotKey` is the RFC 8785
SHA-256 fingerprint of the instrument that produced the record. Join records
to historical codebook entries by that key instead of flattening against the
live form.

The canonical pair is `responses.jsonl` plus `codebook.json`.
`toDataPackage()` returns files, not a zip. Encoders omit `respondentId` by
default. Reserved field ids are escaped as `field.<id>`; score columns use the
`score.<id>.*` namespace.

## License

MIT

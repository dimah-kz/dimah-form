---
packages:
  group:dimah-form: major
---

### Export and insights plugins

`listResponses` accepts `submittedFrom` / `submittedTo` (inclusive) and `updatedAfter` (exclusive). The store adds required `countResponses`. List HTTP returns `total`.

`@dimah-form/dataset` is the export surface: historical `getDatasetCodebook`, `onProject`, `updatedAt` / attachment metadata on records, codebook `required` / `showWhen` / constraints, streaming `createDatasetReader`, encode allowlists, and optional scoring via dynamic import.

New `@dimah-form/insights` is the read-side summary plugin (`GET /insights/summary`) — status totals, visible-required completion, categorical counts, and score bands from **response snapshots**. No tables.

Custom `ResponseStore` implementations must add `countResponses`. After versioning, run `pnpm tegami npm pretrust` so npm Trusted Publisher OIDC can attach for the new package (see [release.md](docs/agents/release.md)).

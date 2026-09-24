# @dimah-form/core

Protocol, field types, error catalogs, typed fetch client, and framework-neutral
fill session for dimah-form.

**Documentation:** [Introduction](https://form.dimah.dev/docs) ·
[Protocol](https://form.dimah.dev/docs/protocol) ·
[Custom fields](https://form.dimah.dev/docs/custom-fields)

## Install

```bash
pnpm add @dimah-form/core
```

Most applications should install `@dimah-form/server` and
`@dimah-form/react` instead; they re-export the app-facing protocol. Install
Core directly for shared isomorphic field-type modules, non-React sessions, or
plugin/protocol tooling.

```ts
import { defineFieldType } from "@dimah-form/core";

export const ratingField = defineFieldType({
  type: "rating",
  validate: (value) =>
    typeof value === "number" ? undefined : "Expected a number",
  $Infer: 0 as number,
});
```

`$Infer` is type-only. Pass the same `fieldTypes` or client plugins at runtime
when the local fill session must validate custom values. Use
`createDefineForm({ fieldTypes, plugins })` for typed authoring without sending
the catalog to the browser.

## License

MIT

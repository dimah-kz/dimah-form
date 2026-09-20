# @dimah-form/core

Protocol, error catalog, typed fetch client, and headless fill session for dimah-form.

## Install

```bash
pnpm add @dimah-form/core
```

Most apps should install `@dimah-form/server` and/or `@dimah-form/react` instead. This package is for protocol and plugin authors, and for shared isomorphic modules such as `defineFieldType` catalogs used on both the server and the browser.

`createFormClient<typeof form>({ fieldTypes })` copies server `$Infer` onto the client. `$Infer` is type-only — pass `fieldTypes` or `defineClientPlugin({ fieldTypes })` for local session validation. `$Infer.answers` matches stored payloads: required keys present, optional keys omitted (including required fields with `showWhen`). `createFormClient({ plugins })` merges `defineClientPlugin` endpoints and field types. Pass `forms` / `fieldTypes` only when you do not have the server instance type.

## License

MIT

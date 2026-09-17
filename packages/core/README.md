# @dimah-form/core

Protocol, error catalog, typed fetch client, and headless fill session for dimah-form.

## Install

```bash
pnpm add @dimah-form/core
```

Most apps should install `@dimah-form/server` and/or `@dimah-form/react` instead. This package is for protocol and plugin authors.

`createFormClient<typeof form>()` copies server `$Infer` onto the client. `$Infer.answers` matches stored payloads: required keys present, optional keys omitted. `createFormClient({ plugins })` merges `defineClientPlugin` endpoints. Pass `forms` / `fieldTypes` only when you do not have the server instance type. `fieldTypes` is also kept at runtime for `createFormResponseSession`.

## License

MIT

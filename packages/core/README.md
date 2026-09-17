# @dimah-form/core

Protocol, error catalog, typed fetch client, and headless fill session for dimah-form.

`createFormClient<typeof form>()` copies server `$Infer` onto the client. `createFormClient({ plugins })` merges `defineClientPlugin` endpoints. Pass `forms` / `fieldTypes` only when you do not have the server instance type. `fieldTypes` is also kept at runtime for `createFormResponseSession`.

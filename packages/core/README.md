# @dimah-form/core

Protocol, error catalog, and typed fetch client for dimah-form.

`createFormClient<typeof form>()` copies server `$Infer` onto the client. `createFormClient({ plugins })` merges `defineClientPlugin` endpoints. Pass `forms` / `fieldTypes` only when you do not have the server instance type.

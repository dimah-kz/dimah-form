# UI & shadcn registry

Source of truth: `packages/ui/src/`. Optional package — `core` / `server` / `react` stay headless.

This is a [source registry](https://ui.shadcn.com/docs/registry/getting-started): root `registry.json` includes `packages/ui/registry.json`. Do not copy or rewrite UI sources for install.

## Contract

Wired UI takes a `useFormResponse` return as `form` and `form.field(id)` as `binding`. It does **not** call the hook. Do not fork `createFormResponseSession`.

Custom field types: `defineFieldType` on the server, a widget on `FieldWidgetRegistry` (`type` string). Do not put widgets in `react`.

## Do not edit stock shadcn

`packages/ui/src/components/ui/*` are vendor primitives. Do not hand-edit them. Own product UI under `components/dimah-form/`, `hooks/`, and `lib/`.

Refresh primitives with `pnpm --filter @dimah-form/ui sync:shadcn` (overwrite). Compose on top — never fork a stock file.

## Changing a component

1. Edit only `components/dimah-form/`, `hooks/`, or `lib/`.
2. Imports: short `@/` alias only. The shadcn CLI rewrites these on install.
3. If the item’s file list or shadcn primitive deps changed → update `packages/ui/scripts/registry-items.ts`.
4. `pnpm registry:validate` regenerates `packages/ui/registry.json` and checks completeness. Commit that file if it changed.
5. `pnpm registry:build` writes `apps/docs/public/r/` (docs `build` depends on this).

Do not hand-edit `packages/ui/registry.json` or `apps/docs/public/r/`.

User-visible copy: `@fuma-translate/react` (do not re-export). After string changes, `pnpm --filter @dimah-form/ui compile:translations`. Localize field errors from `errorCode` + `errorParams`, not from English `message`.

## Registry item rules

Match existing items in `registry-items.ts`. Landmines:

- List every file the installer needs in `files[]` (hooks included). `registry:check` fails if a local `@/` import is missing.
- `registryDependencies`: shadcn primitives only — not other `@dimah-form` items.
- **No basename collision** with those primitives. `form-field.tsx` is the product Field; never `field.tsx`. Widgets: `text-field.tsx`, not `input.tsx`.
- `dependencies`: every npm import the copied source uses. Import `cn` from `"cn"` and list `cn` here.
- `cssVars.theme`: `--color-dimah-form-*` so registry-only apps get utilities without `@dimah-form/ui`.
- `files[].target` uses shadcn placeholders (`@components/`, `@hooks/`, `@lib/`).

## Serve vs GitHub

- HTTP registry: `shadcn build` → `apps/docs/public/r/{name}.json` (`https://form.dimah.dev/r/{name}.json`). Prefer this over app routes.
- GitHub registry: root `registry.json` is the catalog. Keep `packages/ui/registry.json` committed so GitHub installs stay in sync.

## UI conventions

- Dimah-owned colors: `*-dimah-form-*` utilities (`bg-dimah-form-primary`, …) via `packages/ui/css/shadcn.css`. Do not use bare `bg-primary` in `components/dimah-form/` — those classes are for stock `components/ui/` only.
- Direction-safe CSS from day one (LTR default, RTL-ready): logical utilities (`text-start` / `text-end`, `ms-*` / `me-*`, `ps-*` / `pe-*`, `start-*` / `end-*`, `justify-start` / `justify-end` on row flex) unless the physical side is required by behavior. `components.json` has `"rtl": true`.
- `gap-*` on flex, not `space-x-*` / `space-y-*`. Equal sides: `size-*`.
- Long errors: `[overflow-wrap:anywhere]`.
- Form layout: shadcn `FieldGroup` + `Field`. Validation: `data-invalid` on `Field`, `aria-invalid` on the control.

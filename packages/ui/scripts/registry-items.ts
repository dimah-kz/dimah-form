import type { Registry } from "shadcn/schema";

type RegistryItem = Registry["items"][number];

const formFiles = [
  {
    path: "components/dimah-form/form-provider.tsx",
    type: "registry:component",
    target: "@components/dimah-form/form-provider.tsx",
  },
  {
    path: "components/dimah-form/form-view.tsx",
    type: "registry:component",
    target: "@components/dimah-form/form-view.tsx",
  },
  {
    path: "components/dimah-form/form-field.tsx",
    type: "registry:component",
    target: "@components/dimah-form/form-field.tsx",
  },
  {
    path: "components/dimah-form/widgets/unknown-field.tsx",
    type: "registry:component",
    target: "@components/dimah-form/widgets/unknown-field.tsx",
  },
  {
    path: "hooks/use-form-ui.ts",
    type: "registry:hook",
    target: "@hooks/use-form-ui.ts",
  },
  {
    path: "hooks/use-field-issue.ts",
    type: "registry:hook",
    target: "@hooks/use-field-issue.ts",
  },
  {
    path: "lib/widget-registry.ts",
    type: "registry:lib",
    target: "@lib/widget-registry.ts",
  },
  {
    path: "lib/dimah-form-translations.ts",
    type: "registry:lib",
    target: "@lib/dimah-form-translations.ts",
  },
] as const satisfies RegistryItem["files"];

const componentDependencies = [
  "@dimah-form/react",
  "@fuma-translate/react",
  "cn",
] as const;

/** Maps `*-dimah-form-*` utilities to the host shadcn theme (Tailwind v4 `@theme`). */
export const componentCssVars = {
  theme: {
    "color-dimah-form-background": "var(--background)",
    "color-dimah-form-foreground": "var(--foreground)",
    "color-dimah-form-card": "var(--card)",
    "color-dimah-form-card-foreground": "var(--card-foreground)",
    "color-dimah-form-primary": "var(--primary)",
    "color-dimah-form-primary-foreground": "var(--primary-foreground)",
    "color-dimah-form-secondary": "var(--secondary)",
    "color-dimah-form-secondary-foreground": "var(--secondary-foreground)",
    "color-dimah-form-muted": "var(--muted)",
    "color-dimah-form-muted-foreground": "var(--muted-foreground)",
    "color-dimah-form-accent": "var(--accent)",
    "color-dimah-form-accent-foreground": "var(--accent-foreground)",
    "color-dimah-form-destructive": "var(--destructive)",
    "color-dimah-form-border": "var(--border)",
    "color-dimah-form-ring": "var(--ring)",
  },
} as const satisfies RegistryItem["cssVars"];

export const components = [
  {
    name: "form",
    type: "registry:component",
    title: "Form",
    description:
      "Optional questionnaire renderer. Pass a useFormResponse return as `form`. Built-in field widgets come later; unknown types render a fallback.",
    dependencies: [...componentDependencies],
    devDependencies: [] as const,
    cssVars: componentCssVars,
    registryDependencies: ["alert", "button", "field", "spinner"],
    files: [...formFiles],
  },
] as const satisfies Registry["items"];

import type { Registry } from "shadcn/schema";

type RegistryItem = Registry["items"][number];
type RegistryFile = NonNullable<RegistryItem["files"]>[number];

function srcFile(path: string, type: RegistryFile["type"]): RegistryFile {
  return {
    path,
    type,
    target: `@${path}`,
  };
}

const formFiles = [
  srcFile("components/dimah-form/form-provider.tsx", "registry:component"),
  srcFile("components/dimah-form/form-context.tsx", "registry:component"),
  srcFile("components/dimah-form/form-ui-components.tsx", "registry:component"),
  srcFile("components/dimah-form/form-root.tsx", "registry:component"),
  srcFile("components/dimah-form/form-view.tsx", "registry:component"),
  srcFile("components/dimah-form/form-field.tsx", "registry:component"),
  srcFile("components/dimah-form/form-field-frame.tsx", "registry:component"),
  srcFile("components/dimah-form/form-fields.tsx", "registry:component"),
  srcFile("components/dimah-form/form-header.tsx", "registry:component"),
  srcFile("components/dimah-form/form-status.tsx", "registry:component"),
  srcFile("components/dimah-form/form-error.tsx", "registry:component"),
  srcFile("components/dimah-form/form-actions.tsx", "registry:component"),
  srcFile("components/dimah-form/form-inactive.tsx", "registry:component"),
  srcFile("components/dimah-form/form-progress.tsx", "registry:component"),
  srcFile("components/dimah-form/form-save-state.tsx", "registry:component"),
  srcFile("components/dimah-form/form-review.tsx", "registry:component"),
  srcFile("components/dimah-form/form-section.tsx", "registry:component"),
  srcFile("components/dimah-form/form-steps.tsx", "registry:component"),
  srcFile(
    "components/dimah-form/widgets/unknown-field.tsx",
    "registry:component",
  ),
  srcFile(
    "components/dimah-form/widgets/string-field.tsx",
    "registry:component",
  ),
  srcFile("components/dimah-form/widgets/text-field.tsx", "registry:component"),
  srcFile(
    "components/dimah-form/widgets/email-field.tsx",
    "registry:component",
  ),
  srcFile("components/dimah-form/widgets/date-field.tsx", "registry:component"),
  srcFile(
    "components/dimah-form/widgets/number-field.tsx",
    "registry:component",
  ),
  srcFile(
    "components/dimah-form/widgets/boolean-field.tsx",
    "registry:component",
  ),
  srcFile(
    "components/dimah-form/widgets/select-field.tsx",
    "registry:component",
  ),
  srcFile(
    "components/dimah-form/widgets/multi-select-field.tsx",
    "registry:component",
  ),
  srcFile("hooks/use-form-ui.ts", "registry:hook"),
  srcFile("hooks/use-field-issue.ts", "registry:hook"),
  srcFile("lib/widget-registry.ts", "registry:lib"),
  srcFile("lib/default-field-widgets.ts", "registry:lib"),
  srcFile("lib/field-attr.ts", "registry:lib"),
  srcFile("lib/field-groups.ts", "registry:lib"),
  srcFile("lib/focus-invalid.ts", "registry:lib"),
  srcFile("lib/form-slot.ts", "registry:lib"),
  srcFile("lib/dimah-form-translations.ts", "registry:lib"),
] as const satisfies RegistryItem["files"];

const componentDependencies = [
  "@dimah-form/react",
  "@fuma-translate/react",
  "cn",
  "lucide-react",
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
      "Optional questionnaire renderer. Pass a useFormResponse return as `form`. Built-in field widgets are included; custom types register once on FormUiProvider.",
    dependencies: [...componentDependencies],
    devDependencies: [] as const,
    cssVars: componentCssVars,
    registryDependencies: [
      "alert",
      "button",
      "checkbox",
      "field",
      "input",
      "radio-group",
      "select",
      "spinner",
      "switch",
      "textarea",
      "toggle",
      "toggle-group",
    ],
    files: [...formFiles],
  },
] as const satisfies Registry["items"];

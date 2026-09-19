import defaultMdxComponents from "fumadocs-ui/mdx";
import * as AccordionComponents from "fumadocs-ui/components/accordion";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import * as CardComponents from "fumadocs-ui/components/card";
import * as FilesComponents from "fumadocs-ui/components/files";
import * as StepsComponents from "fumadocs-ui/components/steps";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { Flow } from "@/components/flow";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ArchitectureDiagram,
    Flow,
    ...AccordionComponents,
    ...TabsComponents,
    ...CardComponents,
    ...FilesComponents,
    ...StepsComponents,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

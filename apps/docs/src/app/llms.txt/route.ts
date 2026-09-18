import { orderPagesForLlms, source } from "@/lib/source";
import { getSiteUrl } from "@/lib/site-url";
import {
  llmDecisionSheet,
  llmFileLists,
  llmMarkdownHeaders,
} from "@/lib/llm-intro";

export const revalidate = false;

/** `/llms.txt` — decision sheet + docs index, for coding agents. */
export function GET() {
  const origin = getSiteUrl().origin;
  const catalog = orderPagesForLlms(source.getPages())
    .map((page) => {
      const desc = page.data.description ? `: ${page.data.description}` : "";
      return `- [${page.data.title}](${origin}${page.url}.md)${desc}`;
    })
    .join("\n");

  return new Response(
    `${llmDecisionSheet()}\n## Docs\n\n${catalog}\n\n${llmFileLists(origin)}`,
    { headers: llmMarkdownHeaders },
  );
}

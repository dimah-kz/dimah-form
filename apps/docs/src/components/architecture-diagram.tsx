import { cn } from "@/lib/cn";

function Box({
  title,
  note,
  accent,
}: {
  title: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-16 min-w-0 flex-col justify-center gap-1 rounded-lg px-3.5 py-3 ring-1 ring-fd-foreground/8",
        accent ? "bg-fd-primary/12" : "bg-fd-card",
      )}
    >
      <span
        className={cn(
          "text-sm leading-tight",
          accent
            ? "font-mono text-fd-foreground"
            : "font-medium text-fd-foreground",
        )}
      >
        {title}
      </span>
      <span className="text-[11px] leading-tight text-fd-muted-foreground">
        {note}
      </span>
    </div>
  );
}

function ArrowDown() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="mx-auto my-1 size-4 shrink-0 text-fd-muted-foreground/45"
    >
      <path
        d="M12 4v14M7 14l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Theme-aware flowchart for the architecture page.
 * Mermaid is not configured in this docs app; this is the rendered equivalent.
 */
export function ArchitectureDiagram() {
  return (
    <figure className="not-prose my-6 rounded-xl border bg-fd-muted/40 p-4">
      <figcaption className="mb-3 text-xs font-medium text-fd-muted-foreground">
        Request and data flow
      </figcaption>
      <div className="flex flex-col gap-0">
        <div className="grid gap-2 sm:grid-cols-2">
          <Box
            title="Widgets"
            note="Yours, or optional @dimah-form/ui on FormFieldBinding."
          />
          <Box
            title="createFormClient"
            note="Typed protocol. useFormResponse binds fields."
            accent
          />
        </div>
        <ArrowDown />
        <div className="grid gap-2 sm:grid-cols-3">
          <Box title="guard" note="Your auth and policy" />
          <Box
            title="dimahForm()"
            note="Validate against the response snapshot"
            accent
          />
          <Box title="database" note="memoryAdapter() or db()" />
        </div>
        <ArrowDown />
        <Box
          title="Response"
          note="definition snapshot + answers. Submit never consults the live form."
          accent
        />
      </div>
    </figure>
  );
}

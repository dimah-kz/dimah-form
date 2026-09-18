import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/lib/cn";
import { docsRoute } from "@/lib/shared";

export function HomeAnnouncement({ className }: { className?: string }) {
  return (
    <Link
      href={docsRoute}
      className={cn(
        "group focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-full border border-fd-border/80 bg-fd-background/70 py-1 ps-1 pe-3 text-sm font-medium tracking-wide text-fd-muted-foreground shadow-sm backdrop-blur-sm transition-[border-color,color,transform] hover:-translate-y-0.5 hover:border-fd-foreground/20 hover:text-fd-foreground focus-visible:ring-3 focus-visible:outline-none motion-reduce:transform-none",
        className,
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-full border border-fd-border/80 bg-fd-muted/70 text-fd-primary">
        <Layers className="size-3.5" aria-hidden />
      </span>
      You own the widgets. The library owns{" "}
      <code className="font-mono text-[0.8125rem] font-semibold tracking-normal text-fd-foreground">
        snapshots
      </code>
    </Link>
  );
}

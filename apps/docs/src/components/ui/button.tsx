import { cn } from "@/lib/cn";

type Variant = "default" | "outline";

export function buttonVariants({
  variant = "default",
  className,
}: {
  variant?: Variant;
  className?: string;
} = {}) {
  return cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors",
    variant === "default" &&
      "bg-fd-primary text-fd-primary-foreground shadow-lg shadow-fd-primary/10 hover:bg-fd-primary/90",
    variant === "outline" &&
      "border border-fd-border bg-fd-background/70 backdrop-blur-sm hover:bg-fd-muted/60",
    className,
  );
}

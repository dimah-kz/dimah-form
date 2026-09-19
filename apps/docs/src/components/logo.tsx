import { cn } from "@/lib/cn";

/** Keep path geometry in sync with `src/assets/logo.svg`. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
    >
      <rect x="14" y="4.5" width="13" height="13" rx="3.25" />
      <path
        d="M8.5 16.25V24.5H17"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { cn } from "@/lib/cn";

/** Keep path geometry in sync with `public/logo.svg`. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={cn("size-5 shrink-0", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M6 4h14c5.523 0 10 4.477 10 10v4c0 5.523-4.477 10-10 10H6A4 4 0 0 1 2 24V8a4 4 0 0 1 4-4zm10.5 8h5a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-2.5 2.5h-5a2.5 2.5 0 0 1-2.5-2.5v-3a2.5 2.5 0 0 1 2.5-2.5z"
      />
    </svg>
  );
}

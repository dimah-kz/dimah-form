"use client";

import { cn } from "cn";
import { StarIcon } from "lucide-react";
import { useState } from "react";

const LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"] as const;

export function StarRating({
  id,
  value,
  max = 5,
  disabled,
  invalid,
  required,
  onChange,
}: {
  id: string;
  value: unknown;
  max?: number;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  onChange: (value: number) => void;
}) {
  const selected = typeof value === "number" ? value : 0;
  const [hovered, setHovered] = useState<number | null>(null);
  const preview = hovered ?? selected;
  const label =
    preview > 0
      ? ((max === LABELS.length ? LABELS[preview - 1] : undefined) ??
        `${preview} of ${max}`)
      : "Select a rating";

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: max }, (_, index) => {
          const score = index + 1;
          const filled = score <= preview;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected === score}
              aria-label={`${score} star${score === 1 ? "" : "s"}`}
              disabled={disabled}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-md transition-transform",
                "hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
              onMouseEnter={() => {
                if (!disabled) setHovered(score);
              }}
              onClick={() => onChange(score)}
            >
              <StarIcon
                aria-hidden
                strokeWidth={1.4}
                className={cn(
                  "size-7 transition-[color,fill] duration-150",
                  filled
                    ? "fill-foreground text-foreground"
                    : "fill-transparent text-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

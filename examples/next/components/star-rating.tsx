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
        aria-labelledby={`${id}-label`}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(null)}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && event.currentTarget.contains(next)) {
            return;
          }
          setHovered(null);
        }}
      >
        {Array.from({ length: max }, (_, index) => {
          const score = index + 1;
          const filled = score <= preview;
          return (
            <label
              key={score}
              className={cn(
                "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-md transition-transform",
                "hover:scale-110 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50",
              )}
              onMouseEnter={() => {
                if (!disabled) setHovered(score);
              }}
            >
              <input
                type="radio"
                name={id}
                value={score}
                checked={selected === score}
                disabled={disabled}
                aria-label={`${score} star${score === 1 ? "" : "s"}`}
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                onChange={() => onChange(score)}
                onFocus={() => {
                  if (!disabled) setHovered(score);
                }}
              />
              <StarIcon
                aria-hidden
                strokeWidth={1.4}
                className={cn(
                  "pointer-events-none size-9 transition-[color,fill,filter] duration-150",
                  filled
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_6px_rgba(251,191,36,0.45)]"
                    : "fill-transparent text-muted-foreground/50",
                )}
              />
            </label>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

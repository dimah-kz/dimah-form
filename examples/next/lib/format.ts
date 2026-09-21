const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTime.format(date);
}

export function scoreShare(raw: number | null, max?: number) {
  if (raw == null || max == null || !(max > 0)) return 0;
  return Math.min(1, Math.max(0, raw / max));
}

export function scoreLabel(raw: number | null, max?: number) {
  if (raw == null) return null;
  return max != null ? `${raw} / ${max}` : String(raw);
}

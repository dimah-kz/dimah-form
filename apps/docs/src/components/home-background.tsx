export function HomeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-fd-background" />
      <div className="absolute -top-64 left-1/2 h-120 w-208 -translate-x-1/2 rounded-full bg-fd-primary/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-144 bg-[linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent)] bg-size-[48px_48px] opacity-[0.14]" />
      <div className="absolute inset-x-0 top-0 h-160 bg-[linear-gradient(to_bottom,transparent_20%,var(--color-fd-background)_100%)]" />
    </div>
  );
}

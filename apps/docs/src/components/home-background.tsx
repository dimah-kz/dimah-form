export function HomeBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-fd-background" />

      {/* Top Ambient Glow */}
      <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-fd-primary/10 blur-[120px]" />

      {/* Subtle secondary glow */}
      <div className="absolute top-[40%] right-[-10%] h-[400px] w-[500px] rounded-full bg-sky-500/8 blur-[100px]" />
      <div className="absolute top-[75%] left-[-10%] h-[400px] w-[500px] rounded-full bg-fd-primary/5 blur-[100px]" />

      {/* Precision Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-fd-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-fd-border)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,transparent,black_5%,black_90%,transparent)] bg-size-[48px_48px] opacity-25" />

      {/* Radial vignette fade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-fd-background)_90%)]" />
    </div>
  );
}

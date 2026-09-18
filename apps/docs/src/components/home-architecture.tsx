const packages = [
  {
    name: "@dimah-form/react",
    role: "Headless fill session",
  },
  {
    name: "@dimah-form/server",
    role: "dimahForm() handler + api",
  },
  {
    name: "@dimah-form/core",
    role: "Protocol and field types",
  },
  {
    name: "@dimah-form/db",
    role: "FumaDB persistence",
  },
] as const;

export function HomeArchitecture() {
  return (
    <div className="relative rounded-[1.75rem] border border-fd-border/80 bg-fd-card/75 p-3 shadow-2xl shadow-fd-foreground/5 backdrop-blur-xl sm:p-4">
      <div className="flex h-8 items-center justify-end px-2">
        <span className="-mt-2 inline-flex items-center gap-1.5 rounded-full border border-fd-border/70 bg-fd-background/60 px-2 py-0.5 font-mono text-[0.625rem] font-medium tracking-wider text-fd-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-fd-primary" />
          packages
        </span>
      </div>

      <div className="relative rounded-[1.25rem] border border-fd-border/80 bg-fd-background/80 p-4 sm:p-5">
        <p className="mb-4 text-xs font-medium tracking-wide text-fd-muted-foreground uppercase">
          You render. The protocol stays typed.
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {packages.map((item) => (
            <li
              key={item.name}
              className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-fd-border/70 bg-fd-card/80 px-3.5 py-3"
            >
              <span className="font-mono text-sm font-medium text-fd-foreground">
                {item.name}
              </span>
              <span className="text-xs text-fd-muted-foreground">
                {item.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", match: (path: string) => path === "/" },
  {
    href: "/f/pulse",
    label: "Check-in",
    match: (path: string) => path.startsWith("/f/") || path.startsWith("/r/"),
  },
  {
    href: "/responses",
    label: "Responses",
    match: (path: string) => path.startsWith("/responses"),
  },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="text-sm font-medium tracking-tight">
        dimah-form
      </Link>
      <div className="flex items-center gap-1">
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors",
                  "hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

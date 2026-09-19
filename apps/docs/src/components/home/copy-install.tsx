"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/cn";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const commands: Record<PackageManager, string> = {
  pnpm: "pnpm add @dimah-form/server @dimah-form/react",
  npm: "npm i @dimah-form/server @dimah-form/react",
  yarn: "yarn add @dimah-form/server @dimah-form/react",
  bun: "bun add @dimah-form/server @dimah-form/react",
};

export function CopyInstall({ className }: { className?: string }) {
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);

  const command = commands[packageManager];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 sm:flex-row sm:gap-3",
        className,
      )}
    >
      {/* Package manager pill tabs */}
      <div className="flex items-center rounded-lg border border-fd-border/70 bg-fd-muted/50 p-0.5 backdrop-blur-sm">
        {(["pnpm", "npm", "yarn", "bun"] as const).map((pm) => (
          <button
            key={pm}
            type="button"
            onClick={() => setPackageManager(pm)}
            className={cn(
              "rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-all",
              packageManager === pm
                ? "bg-fd-background text-fd-foreground shadow-xs"
                : "text-fd-muted-foreground hover:text-fd-foreground",
            )}
          >
            {pm}
          </button>
        ))}
      </div>

      {/* Copyable code box */}
      <div className="group flex h-9 items-center gap-2.5 rounded-lg border border-fd-border/80 bg-fd-card/80 px-3 py-1 font-mono text-xs text-fd-foreground/90 backdrop-blur-sm transition-all hover:border-fd-foreground/25">
        <Terminal className="size-3.5 text-fd-muted-foreground" />
        <span className="select-all">{command}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? "Copied" : "Copy install command"}
          className="ms-1 flex size-6 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
        >
          {copied ? (
            <Check className="size-3.5 scale-110 text-emerald-500 transition-transform" />
          ) : (
            <Copy className="size-3.5 opacity-70 group-hover:opacity-100" />
          )}
        </button>
      </div>
    </div>
  );
}

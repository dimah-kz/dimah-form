"use client";

import { formClient } from "@/lib/client";
import { ThemeProvider } from "@/components/theme-provider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <formClient.Provider>{children}</formClient.Provider>
    </ThemeProvider>
  );
}

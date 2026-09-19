"use client";

import { FormUiProvider } from "@dimah-form/ui";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { StarRatingField } from "@/components/fields/star-rating-field";
import { formClient } from "@/lib/client";

const widgets = { rating: StarRatingField };

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <formClient.Provider>
        <FormUiProvider widgets={widgets}>{children}</FormUiProvider>
      </formClient.Provider>
    </ThemeProvider>
  );
}

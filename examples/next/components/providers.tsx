"use client";

import { FormUiProvider } from "@dimah-form/ui";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { StarRatingField } from "@/components/fields/star-rating-field";

const widgets = { rating: StarRatingField };

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <FormUiProvider widgets={widgets}>{children}</FormUiProvider>
    </ThemeProvider>
  );
}

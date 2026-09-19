"use client";

import { FormUiProvider } from "@dimah-form/ui";
import type { ReactNode } from "react";

import { StarRatingField } from "@/components/star-rating-field";
import { ThemeProvider } from "@/components/theme-provider";
import { formClient } from "@/lib/client";

const widgets = { rating: StarRatingField };

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <formClient.Provider>
        <FormUiProvider widgets={widgets}>{children}</FormUiProvider>
      </formClient.Provider>
    </ThemeProvider>
  );
}

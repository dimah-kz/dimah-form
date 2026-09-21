import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "dimah-form",
    template: "%s · dimah-form",
  },
  description:
    "Workspace demo: one scored check-in on a headless fill session.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", fontMono.variable, inter.variable)}
    >
      <body>
        <Providers>
          <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-10 px-6 py-8">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <footer className="border-t pt-6 text-sm text-muted-foreground">
              Workspace demo of{" "}
              <code className="font-mono text-xs">@dimah-form</code>. UI is
              optional — this app wraps{" "}
              <code className="font-mono text-xs">useFormResponse</code> with{" "}
              <code className="font-mono text-xs">FormView</code>.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

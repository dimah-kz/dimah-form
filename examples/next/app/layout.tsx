import type { ReactNode } from "react";
import { Geist_Mono, Inter } from "next/font/google";
import Link from "next/link";

import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const dynamic = "force-dynamic";

export const metadata = {
  title: "dimah-form",
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
          <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 p-6">
            <header className="flex items-center justify-between text-sm">
              <Link href="/" className="font-medium">
                dimah-form
              </Link>
              <nav className="flex gap-3 text-muted-foreground">
                <Link href="/">Forms</Link>
                <Link href="/responses">Responses</Link>
              </nav>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

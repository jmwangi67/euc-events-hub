import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  title: "EUC Events Hub — Foundation",
  description:
    "Development foundation for engineering event discovery. All example data is synthetic.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:block focus:bg-surface focus:p-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="mx-auto max-w-5xl border-t border-border px-5 py-6 text-sm text-foreground-muted sm:px-8">
          Student-led development prototype. No official events or university
          endorsement.
        </footer>
      </body>
    </html>
  );
}

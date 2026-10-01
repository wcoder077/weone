import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "we1", template: "%s · we1" },
  description: "Odamlarni toping. Birga yarating. Birga o'sing.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08070d" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6fa" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-theme before first paint, so React must accept the DOM value.
    <html lang="uz" data-theme="dark" suppressHydrationWarning className={`${inter.variable} antialiased`}>
      <head>
        {/* Static script from our own constant (no user input). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

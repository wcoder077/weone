import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ContextMenuGuard } from "@/components/layout/context-menu-guard";
import { Toaster } from "@/components/ui/sonner";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const DESCRIPTION = "Maqsaddoshlar tarmog'i: toping, bog'laning, birga quring.";

// Absolute URLs for link previews (Telegram, etc.). On Vercel the production domain is
// provided at build time; NEXT_PUBLIC_SITE_URL overrides it for a custom domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "we1", template: "%s · we1" },
  description: DESCRIPTION,
  // Link previews always show the app (logo from app/opengraph-image.png), even for pages
  // a signed-out preview bot is redirected away from.
  openGraph: {
    type: "website",
    siteName: "we1",
    title: "we1 — Maqsaddoshlarni toping. Birga yarating. Birga o'sing.",
    description: DESCRIPTION,
    locale: "uz_UZ",
  },
  twitter: {
    card: "summary_large_image",
    title: "we1 — Maqsaddoshlarni toping. Birga yarating. Birga o'sing.",
    description: DESCRIPTION,
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  // Installed on iOS: full-screen, content draws under a translucent status bar
  // (bars pad themselves with env(safe-area-inset-top)).
  appleWebApp: { capable: true, title: "we1", statusBarStyle: "black-translucent" },
  // Next emits only `mobile-web-app-capable`; older iOS still reads the Apple name.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  // Lets the docked mobile tab bar pad itself for the home indicator.
  viewportFit: "cover",
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
        <ContextMenuGuard />
      </body>
    </html>
  );
}

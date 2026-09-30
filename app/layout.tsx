import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  themeColor: "#08070D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} antialiased`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

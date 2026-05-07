import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";

import { Providers } from "@/components/layout/Providers";
import { env } from "@/lib/env";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "Prompt Manager",
    template: "%s | Prompt Manager",
  },
  description: "Gestión profesional de prompts para equipos cerrados",
  openGraph: {
    title: "Prompt Manager",
    description: "Gestión profesional de prompts para equipos cerrados",
    url: "/",
    siteName: "Prompt Manager",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Manager",
    description: "Gestión profesional de prompts para equipos cerrados",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[--surface] font-sans text-[--ink] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { inter, robotoMono, monda } from "./fonts";
import "./globals.css";
// import Navigation from '@/components/Navigation'; // Replaced by GlobalNavigationWrapper
import GlobalNavigationWrapper from "@/components/layout/GlobalNavigationWrapper";
import QueryProvider from "@/components/providers/QueryProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import ErrorBoundary from "@/components/layout/ErrorBoundary";


export const metadata: Metadata = {
  title: "Arceus - Pokémon Card Collection Manager",
  description: "Organize, track, and manage your Pokémon card collection with AI-powered card identification and smart search features.",
  keywords: ["Pokémon cards", "collection", "trading cards", "TCG", "card manager", "AI card identification"],
  authors: [{ name: "Arceus Team" }],
  openGraph: {
    title: "Arceus - Pokémon Card Collection Manager",
    description: "Organize, track, and manage your Pokémon card collection with AI-powered card identification and smart search features.",
    type: "website",
    locale: "en_US",
    url: "https://rotomi.app",
    siteName: "Arceus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arceus - Pokémon Card Collection Manager",
    description: "Organize, track, and manage your Pokémon card collection with AI-powered card identification and smart search features.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // For iPhone notch support
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${inter.variable} ${robotoMono.variable} ${monda.variable}`}
    >
      <head>
        <meta name="theme-color" content="#1A4A47" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <ToastProvider />
          <ErrorBoundary>
            {children}
            <div id="modal-root" />
          </ErrorBoundary>
        </QueryProvider>

      </body>
    </html>
  );
}

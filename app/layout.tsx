import type { Metadata } from "next";
import { inter, robotoMono, monda } from "./fonts";
import "./globals.css";
import './styles/circuit.css';
import './styles/button.css';
import './styles/form.css';
import './styles/trading-card.css';
import './styles/navigation.css';
import './styles/metric-card.css';
import '../components/ui/AppNavigation.css';
// import Navigation from '@/components/Navigation'; // Replaced by GlobalNavigationWrapper
import GlobalNavigationWrapper from "@/components/layout/GlobalNavigationWrapper";
import QueryProvider from "@/components/providers/QueryProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

export const metadata: Metadata = {
  title: "Project Arceus",
  description: "Manage your Pokémon card collection with ease",
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

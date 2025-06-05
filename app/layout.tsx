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
        <div className="app-layout">
          <GlobalNavigationWrapper />
          <main id="main-content" className="app-content">
            {children}
          </main>
        </div>
        <div id="modal-root" />
      </body>
    </html>
  );
}

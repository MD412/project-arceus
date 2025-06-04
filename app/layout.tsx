import type { Metadata } from "next";
import { inter, robotoMono, monda } from "./fonts";
import "./globals.css";

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
      className={`${inter.variable} ${robotoMono.variable} ${monda.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

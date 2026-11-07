import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/providers";
import { AppHeader } from "./components/app-header";
import { GridBackground } from "./components/grid-background";

export const metadata: Metadata = {
  title: "AutoLoot // AI-Managed In-Game Economist",
  description:
    "Autonomous Solana DevNet inventory optimization protocol for tokenized gaming economies.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-mono dark">
      <body className="antialiased font-mono bg-[#03060f] text-zinc-100 min-h-screen">
        <Providers>
          <div className="relative min-h-screen bg-[#03060f] text-zinc-100 font-mono">
            <GridBackground />
            <div className="relative z-10 font-mono">
              <AppHeader />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

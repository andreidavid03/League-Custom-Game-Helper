import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoL Custom Game Helper | Team Randomizer & Match Organizer",
  description: "Professional League of Legends custom game organizer with team randomization, wheel spinner, player management, and match history tracking.",
  keywords: "League of Legends, LoL, custom games, team randomizer, esports, gaming",
  authors: [{ name: "David Demon" }],
  creator: "David Demon",
  openGraph: {
    title: "LoL Custom Game Helper",
    description: "Professional League of Legends custom game organizer",
    type: "website",
    locale: "en_US"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-slate-950 text-white min-h-screen font-sans`}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import { withBase } from '@/lib/basePath'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'LoL Custom Game Helper | 5v5 Team Randomizer',
  description:
    'Organize League of Legends custom 5v5 games: wheel spinner, case opening, captain draft, balanced teams, match history and player stats. Works offline — your data stays on your device.',
  keywords: 'League of Legends, LoL, custom games, team randomizer, 5v5, wheel spinner',
  authors: [{ name: 'David Demon' }],
  manifest: withBase('/manifest.webmanifest'),
  icons: { icon: withBase('/icon-128.png'), apple: withBase('/icon-128.png') },
  openGraph: {
    title: 'LoL Custom Game Helper',
    description: 'The fun way to build fair (or chaotic) custom 5v5 teams.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#010A13',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${cinzel.variable} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}

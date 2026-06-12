'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, useHydrated } from '@/lib/store'
import { setSoundEnabled } from '@/lib/sound'
import { withBase } from '@/lib/basePath'
import PlayTab from '@/components/tabs/PlayTab'
import PlayersTab from '@/components/tabs/PlayersTab'
import HistoryTab from '@/components/tabs/HistoryTab'
import StatsTab from '@/components/tabs/StatsTab'
import SettingsTab from '@/components/tabs/SettingsTab'

const TABS = [
  { id: 'play', label: 'Play', icon: '⚔️' },
  { id: 'players', label: 'Players', icon: '👥' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Home() {
  const hydrated = useHydrated()
  const [tab, setTab] = useState<TabId>('play')
  const soundOn = useAppStore((s) => s.settings.soundOn)
  const theme = useAppStore((s) => s.settings.theme)

  useEffect(() => {
    setSoundEnabled(soundOn)
  }, [soundOn])

  useEffect(() => {
    document.documentElement.dataset.theme = theme || 'HEXTECH'
  }, [theme])

  useEffect(() => {
    // PWA: register the offline service worker (production builds only).
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register(withBase('/sw.js')).catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gold-dark/30 bg-abyss/55 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase('/icon-128.png')}
              alt=""
              className="w-10 h-10 shrink-0 rounded-xl shadow-[0_0_18px_color-mix(in_srgb,var(--c-accent)_35%,transparent)]"
            />
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg sm:text-xl gold-shimmer tracking-wide truncate">
                LoL Custom Game Helper
              </h1>
              <p className="text-[11px] text-gold-light/40 hidden sm:block">by David Demon</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((t) => (
              <TabButton key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
        {!hydrated ? (
          <div className="text-center py-24 text-gold-light/40 font-display tracking-widest animate-pulse">
            SUMMONING…
          </div>
        ) : (
          <>
            {tab === 'play' && <PlayTab onGoToPlayers={() => setTab('players')} />}
            {tab === 'players' && <PlayersTab />}
            {tab === 'history' && <HistoryTab />}
            {tab === 'stats' && <StatsTab />}
            {tab === 'settings' && <SettingsTab />}
          </>
        )}
      </main>

      {/* Watermark */}
      <footer className="text-center pb-20 md:pb-6">
        <div className="gold-rule max-w-xs mx-auto mb-3" />
        <p className="text-xs tracking-widest uppercase text-gold-light/30">
          ⚔️ Made by <span className="text-gold/80 font-display">David Demon</span> ⚔️
        </p>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-abyss/80 backdrop-blur-xl border-t border-gold-dark/30 flex shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.5)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] uppercase tracking-wider transition-all duration-200 ${
              tab === t.id ? 'text-gold scale-105' : 'text-gold-light/40'
            }`}
          >
            <span
              className={`text-lg leading-none transition-all duration-200 ${
                tab === t.id ? 'drop-shadow-[0_0_8px_color-mix(in_srgb,var(--c-accent)_60%,transparent)]' : ''
              }`}
            >
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function TabButton({
  t,
  active,
  onClick,
}: {
  t: { id: string; label: string; icon: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm uppercase tracking-wider font-medium rounded-lg transition-colors duration-200 ${
        active ? 'text-gold' : 'text-gold-light/50 hover:text-gold-light hover:bg-white/[0.03]'
      }`}
    >
      <span className="mr-1.5">{t.icon}</span>
      {t.label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-gold shadow-[0_0_10px_color-mix(in_srgb,var(--c-accent)_80%,transparent)]"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      )}
    </button>
  )
}

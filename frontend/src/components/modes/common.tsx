'use client'

import { ReactNode, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Player, TeamSide } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { Avatar, HexButton } from '@/components/ui'

/**
 * Shared state machine for one-at-a-time modes (wheel, case, slots, cards):
 * players are assigned alternately BLUE, RED, BLUE, RED…
 */
export function useAssignment(players: Player[], onDone: (blue: Player[], red: Player[]) => void) {
  // State lives in a ref so `assign` is always correct even when called from
  // stale closures inside animation callbacks (rAF / setTimeout chains).
  const stateRef = useRef<{ remaining: Player[]; blue: Player[]; red: Player[] }>({
    remaining: players,
    blue: [],
    red: [],
  })
  const [, bump] = useState(0)
  const doneRef = useRef(false)

  const assign = (player: Player) => {
    const s = stateRef.current
    if (!s.remaining.some((p) => p.id === player.id)) return s
    const nextSide: TeamSide = s.blue.length <= s.red.length ? 'BLUE' : 'RED'
    const next = {
      blue: nextSide === 'BLUE' ? [...s.blue, player] : s.blue,
      red: nextSide === 'RED' ? [...s.red, player] : s.red,
      remaining: s.remaining.filter((p) => p.id !== player.id),
    }
    stateRef.current = next
    bump((n) => n + 1)
    if (next.remaining.length === 0 && !doneRef.current) {
      doneRef.current = true
      // Small pause so the last reveal lands before the ready screen.
      setTimeout(() => onDone(next.blue, next.red), 1200)
    }
    return next
  }

  /** Side the next assigned player will land on, read live (not from a stale render). */
  const peekNextSide = (): TeamSide =>
    stateRef.current.blue.length <= stateRef.current.red.length ? 'BLUE' : 'RED'

  const { remaining, blue, red } = stateRef.current
  const nextSide: TeamSide = blue.length <= red.length ? 'BLUE' : 'RED'
  return { remaining, blue, red, nextSide, assign, peekNextSide }
}

/** Banner state for "X → team!" announcements: side is frozen at win time. */
export interface WinnerBanner {
  player: Player
  side: TeamSide
}

export function bannerText(w: WinnerBanner): string {
  return `${w.player.name} → ${w.side === 'BLUE' ? '🔵 Blue' : '🔴 Red'}!`
}

/** Speed multiplier from settings: durations get divided by this. */
export function useAnimSpeed(): number {
  return useAppStore((s) => s.settings.animationSpeed) || 1
}

/**
 * Drive an animation by wall-clock time on an interval (not rAF): browsers
 * suspend rAF entirely in hidden tabs, which froze spins mid-way if the user
 * switched tabs. An interval keeps ticking (throttled) and progress is
 * computed from elapsed time, so the animation always completes.
 * Returns a cancel function.
 */
export function animate(
  duration: number,
  onFrame: (t: number) => void,
  onDone: () => void
): () => void {
  const t0 = performance.now()
  const id = setInterval(() => {
    const t = Math.min((performance.now() - t0) / duration, 1)
    onFrame(t)
    if (t >= 1) {
      clearInterval(id)
      onDone()
    }
  }, 25)
  return () => clearInterval(id)
}

export function ModeShell({
  title,
  subtitle,
  onCancel,
  children,
}: {
  title: string
  subtitle?: ReactNode
  onCancel: () => void
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto">
        <h2 className="font-display text-xl sm:text-2xl gold-shimmer uppercase tracking-wider">
          {title}
        </h2>
        <HexButton variant="ghost" onClick={onCancel}>
          ✕ Cancel
        </HexButton>
      </div>
      {subtitle && (
        <p className="text-sm text-gold-light/50 mb-4 max-w-4xl mx-auto">{subtitle}</p>
      )}
      {children}
    </div>
  )
}

/** Live view of the two teams filling up while a mode runs. */
export function TeamsProgress({
  blue,
  red,
  nextSide,
  totalPerTeam,
  stacked = false,
}: {
  blue: Player[]
  red: Player[]
  nextSide: TeamSide
  totalPerTeam: number
  /** Stack the two team panels vertically (used beside the big wheel). */
  stacked?: boolean
}) {
  const column = (side: TeamSide, list: Player[]) => {
    const isNext = nextSide === side && list.length < totalPerTeam
    const color = side === 'BLUE' ? 'text-team-blue' : 'text-team-red'
    return (
      <div
        className={`flex-1 hex-panel p-3 ${
          side === 'BLUE' ? 'border-team-blue/40' : 'border-team-red/40'
        } ${isNext ? 'animate-glow-pulse' : ''}`}
      >
        <p className={`font-display text-sm uppercase tracking-widest text-center mb-2 ${color}`}>
          {side === 'BLUE' ? '🔵 Blue' : '🔴 Red'} {isNext && '· picking…'}
        </p>
        <ul className="space-y-1 min-h-20">
          {list.map((p) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-sm text-gold-light bg-abyss/40 border border-gold-dark/30 rounded-md px-2 py-1"
            >
              <Avatar name={p.name} src={p.avatarUrl} size={20} />
              <span className="truncate">{p.name}</span>
            </motion.li>
          ))}
          {Array.from({ length: totalPerTeam - list.length }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="text-sm text-gold-light/20 border border-dashed border-gold-dark/20 rounded-md px-2 py-1"
            >
              —
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={stacked ? 'flex flex-col gap-3 w-full' : 'flex gap-3 max-w-2xl mx-auto mt-6'}>
      {column('BLUE', blue)}
      {column('RED', red)}
    </div>
  )
}

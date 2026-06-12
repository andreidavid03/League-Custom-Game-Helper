'use client'

import { ReactNode, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Player, TeamSide } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { HexButton } from '@/components/ui'

/**
 * Shared state machine for one-at-a-time modes (wheel, case, slots, cards):
 * players are assigned alternately BLUE, RED, BLUE, RED…
 */
export function useAssignment(players: Player[], onDone: (blue: Player[], red: Player[]) => void) {
  const [remaining, setRemaining] = useState<Player[]>(players)
  const [blue, setBlue] = useState<Player[]>([])
  const [red, setRed] = useState<Player[]>([])
  const nextSide: TeamSide = blue.length <= red.length ? 'BLUE' : 'RED'
  const doneRef = useRef(false)

  const assign = (player: Player) => {
    const newBlue = nextSide === 'BLUE' ? [...blue, player] : blue
    const newRed = nextSide === 'RED' ? [...red, player] : red
    const newRemaining = remaining.filter((p) => p.id !== player.id)
    setBlue(newBlue)
    setRed(newRed)
    setRemaining(newRemaining)
    if (newRemaining.length === 0 && !doneRef.current) {
      doneRef.current = true
      // Small pause so the last reveal lands before the ready screen.
      setTimeout(() => onDone(newBlue, newRed), 1200)
    }
    return { blue: newBlue, red: newRed, remaining: newRemaining }
  }

  return { remaining, blue, red, nextSide, assign }
}

/** Speed multiplier from settings: durations get divided by this. */
export function useAnimSpeed(): number {
  return useAppStore((s) => s.settings.animationSpeed) || 1
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
}: {
  blue: Player[]
  red: Player[]
  nextSide: TeamSide
  totalPerTeam: number
}) {
  const column = (side: TeamSide, list: Player[]) => {
    const isNext = nextSide === side && list.length < totalPerTeam
    const color = side === 'BLUE' ? 'team-blue' : 'team-red'
    return (
      <div
        className={`flex-1 hex-panel p-3 ${
          side === 'BLUE' ? 'border-team-blue/40' : 'border-team-red/40'
        } ${isNext ? 'animate-glow-pulse' : ''}`}
      >
        <p
          className={`font-display text-sm uppercase tracking-widest text-center mb-2 text-${color}`}
        >
          {side === 'BLUE' ? '🔵 Blue' : '🔴 Red'} {isNext && '· picking…'}
        </p>
        <ul className="space-y-1 min-h-20">
          {list.map((p) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-gold-light bg-abyss/40 border border-gold-dark/30 px-2 py-1 truncate"
            >
              {p.name}
            </motion.li>
          ))}
          {Array.from({ length: totalPerTeam - list.length }).map((_, i) => (
            <li key={`empty-${i}`} className="text-sm text-gold-light/20 border border-dashed border-gold-dark/20 px-2 py-1">
              —
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex gap-3 max-w-2xl mx-auto mt-6">
      {column('BLUE', blue)}
      {column('RED', red)}
    </div>
  )
}

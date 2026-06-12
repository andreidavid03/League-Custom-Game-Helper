'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rank,
  RANK_COLORS,
  Role,
  ROLE_ICONS,
  ROLE_LABELS,
  MatchPlayer,
  TeamSide,
} from '@/lib/types'

export function HexPanel({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div className={`hex-panel ${glow ? 'hex-panel-glow' : ''} ${className}`}>
      {children}
    </div>
  )
}

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'blue' | 'red'

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-gold to-gold-dark text-abyss font-semibold hover:from-gold-light hover:to-gold border-gold',
  ghost:
    'bg-transparent text-gold-light hover:bg-gold/10 border-gold-dark hover:border-gold',
  danger:
    'bg-transparent text-team-red hover:bg-team-red/10 border-team-red/40 hover:border-team-red',
  blue: 'bg-team-blue/15 text-team-blue hover:bg-team-blue/30 border-team-blue/50',
  red: 'bg-team-red/15 text-team-red hover:bg-team-red/30 border-team-red/50',
}

export function HexButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  big = false,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  className?: string
  big?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border transition-all duration-150 tracking-wide uppercase
        ${big ? 'px-8 py-3 text-base' : 'px-4 py-2 text-sm'}
        ${buttonStyles[variant]}
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
        [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)]
        ${className}`}
    >
      {children}
    </button>
  )
}

export function SectionTitle({
  children,
  sub,
}: {
  children: ReactNode
  sub?: string
}) {
  return (
    <div className="text-center mb-6">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold gold-shimmer tracking-wider uppercase">
        {children}
      </h2>
      {sub && <p className="text-gold-light/50 mt-1 text-sm">{sub}</p>}
      <div className="gold-rule mt-3 max-w-md mx-auto" />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="hex-panel hex-panel-glow w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
          >
            <h3 className="font-display text-xl text-gold tracking-wide uppercase mb-4 text-center">
              {title}
            </h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: string
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <p className="font-display text-lg text-gold-light/80">{title}</p>
      {hint && <p className="text-sm text-gold-light/40 mt-2 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function RankBadge({ rank }: { rank: Rank }) {
  return (
    <span
      className="text-[11px] font-semibold tracking-wider px-2 py-0.5 rounded-sm border"
      style={{
        color: RANK_COLORS[rank],
        borderColor: `${RANK_COLORS[rank]}55`,
        background: `${RANK_COLORS[rank]}14`,
      }}
    >
      {rank}
    </span>
  )
}

export function RolePill({ role, active = true }: { role: Role; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-sm border ${
        active
          ? 'text-teal border-teal/40 bg-teal/10'
          : 'text-gold-light/30 border-gold-dark/30'
      }`}
    >
      {ROLE_ICONS[role]} {ROLE_LABELS[role]}
    </span>
  )
}

const sideStyles: Record<TeamSide, { border: string; text: string; bg: string; label: string }> = {
  BLUE: {
    border: 'border-team-blue/50',
    text: 'text-team-blue',
    bg: 'from-team-blue/10',
    label: 'Blue Team',
  },
  RED: {
    border: 'border-team-red/50',
    text: 'text-team-red',
    bg: 'from-team-red/10',
    label: 'Red Team',
  },
}

export function TeamCard({
  side,
  players,
  championIcons,
  animate = false,
}: {
  side: TeamSide
  players: MatchPlayer[]
  championIcons?: (championName: string) => string | undefined
  animate?: boolean
}) {
  const s = sideStyles[side]
  return (
    <div className={`hex-panel p-4 border ${s.border} bg-gradient-to-b ${s.bg} to-transparent`}>
      <h3 className={`font-display text-lg uppercase tracking-widest text-center mb-3 ${s.text}`}>
        {s.label}
      </h3>
      <ul className="space-y-2">
        {players.map((p, i) => (
          <motion.li
            key={p.playerId}
            initial={animate ? { opacity: 0, x: side === 'BLUE' ? -24 : 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animate ? i * 0.12 : 0 }}
            className="flex items-center gap-2 bg-abyss/40 border border-gold-dark/30 px-3 py-2"
          >
            {p.role && <span title={ROLE_LABELS[p.role]}>{ROLE_ICONS[p.role]}</span>}
            <span className="flex-1 truncate font-medium text-gold-light">
              {p.isCaptain && <span title="Captain">👑 </span>}
              {p.name}
            </span>
            {p.champion && (
              <span className="flex items-center gap-1.5 text-xs text-gold-light/60">
                {championIcons?.(p.champion) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={championIcons(p.champion)}
                    alt={p.champion}
                    className="w-6 h-6 rounded-sm border border-gold-dark/50"
                  />
                )}
                {p.champion}
              </span>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

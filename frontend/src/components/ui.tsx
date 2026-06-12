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
  primary: `text-abyss font-semibold border-gold
    bg-gradient-to-b from-gold-light/90 via-gold to-gold-dark
    shadow-[0_4px_16px_-4px_color-mix(in_srgb,var(--c-accent)_55%,transparent),inset_0_1px_0_rgba(255,255,255,0.35)]
    hover:brightness-110`,
  ghost: `text-gold-light border-gold-dark/70 bg-white/[0.02]
    hover:bg-gold/10 hover:border-gold hover:text-gold-light
    shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`,
  danger: `text-team-red border-team-red/40 bg-team-red/5
    hover:bg-team-red/15 hover:border-team-red`,
  blue: `text-team-blue border-team-blue/50 bg-team-blue/10
    hover:bg-team-blue/25 shadow-[0_4px_16px_-6px_rgba(46,163,232,0.5)]`,
  red: `text-team-red border-team-red/50 bg-team-red/10
    hover:bg-team-red/25 shadow-[0_4px_16px_-6px_rgba(232,64,87,0.5)]`,
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
      className={`border tracking-wide uppercase font-medium
        transition-all duration-150 ease-out
        hover:-translate-y-px active:translate-y-0 active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50
        ${big ? 'px-8 py-3 text-base' : 'px-4 py-2 text-sm'}
        ${buttonStyles[variant]}
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:brightness-100
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
    <div className="text-center mb-7">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold gold-shimmer tracking-wider uppercase">
        {children}
      </h2>
      {sub && <p className="text-gold-light/50 mt-1.5 text-sm">{sub}</p>}
      <div className="gold-rule mt-4 max-w-md mx-auto" />
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 18, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
      <div className="text-5xl mb-4 opacity-60 drop-shadow-[0_0_20px_color-mix(in_srgb,var(--c-accent)_30%,transparent)]">
        {icon}
      </div>
      <p className="font-display text-lg text-gold-light/80">{title}</p>
      {hint && <p className="text-sm text-gold-light/40 mt-2 max-w-sm mx-auto leading-relaxed">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Deterministic gradient avatar from a player name. */
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  const h1 = hash % 360
  const h2 = (h1 + 45) % 360
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white/90 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.4)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${h1} 55% 42%), hsl(${h2} 60% 30%))`,
      }}
    >
      {initials}
    </span>
  )
}

export function RankBadge({ rank }: { rank: Rank }) {
  return (
    <span
      className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border"
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
      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
        active
          ? 'text-teal border-teal/40 bg-teal/10'
          : 'text-gold-light/30 border-gold-dark/30'
      }`}
    >
      {ROLE_ICONS[role]} {ROLE_LABELS[role]}
    </span>
  )
}

const sideStyles: Record<TeamSide, { border: string; text: string; grad: string; label: string }> = {
  BLUE: {
    border: 'border-team-blue/40',
    text: 'text-team-blue',
    grad: 'from-team-blue/20 via-team-blue/5 to-transparent',
    label: 'Blue Team',
  },
  RED: {
    border: 'border-team-red/40',
    text: 'text-team-red',
    grad: 'from-team-red/20 via-team-red/5 to-transparent',
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
    <div className={`hex-panel overflow-hidden border ${s.border}`}>
      <div className={`bg-gradient-to-b ${s.grad} px-4 pt-3 pb-2`}>
        <h3 className={`font-display text-lg uppercase tracking-widest text-center ${s.text}`}>
          {s.label}
        </h3>
      </div>
      <ul className="space-y-1.5 p-3">
        {players.map((p, i) => (
          <motion.li
            key={p.playerId}
            initial={animate ? { opacity: 0, x: side === 'BLUE' ? -24 : 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animate ? i * 0.12 : 0, type: 'spring', stiffness: 300, damping: 26 }}
            className="flex items-center gap-2.5 rounded-lg bg-abyss/40 border border-white/[0.05] px-3 py-2"
          >
            <Avatar name={p.name} size={26} />
            {p.role && (
              <span className="text-sm" title={ROLE_LABELS[p.role]}>
                {ROLE_ICONS[p.role]}
              </span>
            )}
            <span className="flex-1 truncate font-medium text-gold-light text-sm">
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
                    className="w-6 h-6 rounded-md border border-gold-dark/50"
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

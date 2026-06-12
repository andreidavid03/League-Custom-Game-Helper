'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { Match, MODE_LABELS, Role, ROLE_ICONS, GameMode } from '@/lib/types'
import { HexPanel, SectionTitle, EmptyState } from '@/components/ui'

interface PlayerAgg {
  name: string
  games: number
  wins: number
  losses: number
  roles: Partial<Record<Role, number>>
  teammates: Record<string, number>
  captainGames: number
}

function aggregate(matches: Match[]) {
  const completed = matches.filter((m) => m.status === 'COMPLETED')
  const players = new Map<string, PlayerAgg>()
  let blueWins = 0
  const modeCounts: Partial<Record<GameMode, number>> = {}

  for (const m of completed) {
    modeCounts[m.mode] = (modeCounts[m.mode] || 0) + 1
    if (m.winner === 'BLUE') blueWins++

    for (const side of ['blue', 'red'] as const) {
      const team = m[side]
      const won = (side === 'blue') === (m.winner === 'BLUE')
      for (const p of team) {
        const agg = players.get(p.playerId) || {
          name: p.name,
          games: 0,
          wins: 0,
          losses: 0,
          roles: {},
          teammates: {},
          captainGames: 0,
        }
        agg.games++
        if (won) agg.wins++
        else agg.losses++
        if (p.role) agg.roles[p.role] = (agg.roles[p.role] || 0) + 1
        if (p.isCaptain) agg.captainGames++
        for (const mate of team) {
          if (mate.playerId !== p.playerId) {
            agg.teammates[mate.name] = (agg.teammates[mate.name] || 0) + 1
          }
        }
        players.set(p.playerId, agg)
      }
    }
  }

  return { completed: completed.length, total: matches.length, blueWins, modeCounts, players }
}

export default function StatsTab() {
  const matches = useAppStore((s) => s.matches)
  const stats = useMemo(() => aggregate(matches), [matches])

  if (stats.completed === 0) {
    return (
      <div className="animate-float-up">
        <SectionTitle sub="Win rates, roles, and rivalries.">Player Statistics</SectionTitle>
        <EmptyState
          icon="📊"
          title="No completed matches yet"
          hint="Stats appear once you report a winner for at least one match (Play tab or History tab)."
        />
      </div>
    )
  }

  const redWins = stats.completed - stats.blueWins
  const sorted = [...stats.players.values()].sort(
    (a, b) => b.wins / Math.max(b.games, 1) - a.wins / Math.max(a.games, 1) || b.games - a.games
  )
  const favouriteMode = Object.entries(stats.modeCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="animate-float-up">
      <SectionTitle sub="Win rates, roles, and rivalries.">Player Statistics</SectionTitle>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto mb-8">
        <OverviewCard icon="🏟️" label="Completed games" value={String(stats.completed)} />
        <OverviewCard
          icon="🔵"
          label="Blue side wins"
          value={`${stats.blueWins} (${Math.round((stats.blueWins / stats.completed) * 100)}%)`}
        />
        <OverviewCard
          icon="🔴"
          label="Red side wins"
          value={`${redWins} (${Math.round((redWins / stats.completed) * 100)}%)`}
        />
        <OverviewCard
          icon="🎲"
          label="Favourite ritual"
          value={favouriteMode ? MODE_LABELS[favouriteMode[0] as GameMode] : '—'}
        />
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto space-y-2">
        {sorted.map((p, i) => {
          const winRate = Math.round((p.wins / Math.max(p.games, 1)) * 100)
          const topRole = Object.entries(p.roles).sort((a, b) => b[1] - a[1])[0]
          const topMate = Object.entries(p.teammates).sort((a, b) => b[1] - a[1])[0]
          return (
            <HexPanel key={p.name} className="p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-display text-lg text-gold w-8 text-center shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div className="min-w-32 flex-1">
                  <p className="font-semibold text-gold-light truncate">{p.name}</p>
                  <p className="text-xs text-gold-light/40">
                    {p.games} games · {p.wins}W {p.losses}L
                    {p.captainGames > 0 && ` · 👑×${p.captainGames}`}
                  </p>
                </div>

                {/* Win-rate bar */}
                <div className="flex items-center gap-2 w-44">
                  <div className="flex-1 h-2 rounded-full bg-abyss/80 border border-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        winRate >= 50
                          ? 'bg-gradient-to-r from-teal/60 to-teal'
                          : 'bg-gradient-to-r from-team-red/60 to-team-red'
                      }`}
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-semibold w-10 text-right ${
                      winRate >= 50 ? 'text-teal' : 'text-team-red'
                    }`}
                  >
                    {winRate}%
                  </span>
                </div>

                <div className="text-xs text-gold-light/50 hidden sm:block w-40 truncate">
                  {topRole && (
                    <span title="Most played role">
                      {ROLE_ICONS[topRole[0] as Role]} ×{topRole[1]}{' '}
                    </span>
                  )}
                  {topMate && <span title="Most frequent teammate">· 🤝 {topMate[0]}</span>}
                </div>
              </div>
            </HexPanel>
          )
        })}
      </div>
    </div>
  )
}

function OverviewCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <HexPanel className="p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="font-display text-lg text-gold">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-gold-light/40 mt-0.5">{label}</p>
    </HexPanel>
  )
}

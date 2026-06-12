'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Match, MODE_LABELS, TeamSide } from '@/lib/types'
import { HexButton, HexPanel, Modal, SectionTitle, EmptyState, TeamCard } from '@/components/ui'

export default function HistoryTab() {
  const matches = useAppStore((s) => s.matches)
  const completeMatch = useAppStore((s) => s.completeMatch)
  const deleteMatch = useAppStore((s) => s.deleteMatch)
  const clearMatches = useAppStore((s) => s.clearMatches)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="animate-float-up">
      <SectionTitle sub="Every game night, remembered.">Match History</SectionTitle>

      {matches.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No matches yet"
          hint="Play your first game from the Play tab — finished matches land here automatically."
        />
      ) : (
        <>
          <div className="space-y-3 max-w-3xl mx-auto">
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                expanded={expanded === m.id}
                onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
                onReport={(winner) => completeMatch(m.id, winner)}
                onDelete={() => deleteMatch(m.id)}
              />
            ))}
          </div>
          <div className="text-center mt-8">
            <HexButton variant="danger" onClick={() => setConfirmClear(true)}>
              Clear all history
            </HexButton>
          </div>
        </>
      )}

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear Match History">
        <p className="text-sm text-gold-light/70 mb-6">
          This permanently deletes all {matches.length} matches and resets every player&apos;s
          stats. Consider exporting a backup from Settings first.
        </p>
        <div className="flex justify-end gap-2">
          <HexButton variant="ghost" onClick={() => setConfirmClear(false)}>
            Keep history
          </HexButton>
          <HexButton
            variant="danger"
            onClick={() => {
              clearMatches()
              setConfirmClear(false)
            }}
          >
            Delete everything
          </HexButton>
        </div>
      </Modal>
    </div>
  )
}

function MatchRow({
  match,
  expanded,
  onToggle,
  onReport,
  onDelete,
}: {
  match: Match
  expanded: boolean
  onToggle: () => void
  onReport: (winner: TeamSide) => void
  onDelete: () => void
}) {
  const date = new Date(match.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <HexPanel className="p-0 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3 text-left">
        <span className="text-2xl shrink-0">
          {match.status === 'COMPLETED' ? (match.winner === 'BLUE' ? '🔵' : '🔴') : '⏳'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-gold-light font-medium truncate">
            {match.status === 'COMPLETED'
              ? `${match.winner === 'BLUE' ? 'Blue' : 'Red'} Team victory`
              : 'In progress — result not reported'}
          </p>
          <p className="text-xs text-gold-light/40">
            {MODE_LABELS[match.mode]} · {match.blue.length}v{match.red.length} · {date}
          </p>
        </div>
        <span className="text-gold-light/40">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gold-dark/30 pt-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <TeamCard side="BLUE" players={match.blue} />
            <TeamCard side="RED" players={match.red} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            {match.status === 'IN_PROGRESS' ? (
              <div className="flex gap-2">
                <HexButton variant="blue" onClick={() => onReport('BLUE')}>
                  Blue won
                </HexButton>
                <HexButton variant="red" onClick={() => onReport('RED')}>
                  Red won
                </HexButton>
              </div>
            ) : (
              <span className="text-xs text-gold-light/40">
                Completed {match.completedAt && new Date(match.completedAt).toLocaleString()}
              </span>
            )}
            <HexButton variant="danger" onClick={onDelete}>
              Delete
            </HexButton>
          </div>
        </div>
      )}
    </HexPanel>
  )
}

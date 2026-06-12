'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { GameMode, MODE_LABELS, Match, MatchPlayer, Player, TeamSide } from '@/lib/types'
import { assignRoles, matchToText, toMatchPlayers, shuffle } from '@/lib/teams'
import { getChampions, championIconUrl, Champion } from '@/lib/ddragon'
import { playFanfare } from '@/lib/sound'
import { Avatar, HexButton, HexPanel, SectionTitle, EmptyState, RankBadge, TeamCard } from '@/components/ui'
import WheelMode from '@/components/modes/WheelMode'
import CaseMode from '@/components/modes/CaseMode'
import SlotsMode from '@/components/modes/SlotsMode'
import CardsMode from '@/components/modes/CardsMode'
import DraftMode from '@/components/modes/DraftMode'
import RevealMode from '@/components/modes/RevealMode'

export interface ModeResult {
  blue: Player[]
  red: Player[]
  blueCaptain?: string
  redCaptain?: string
}

export interface ModeProps {
  players: Player[]
  onComplete: (result: ModeResult) => void
  onCancel: () => void
}

const MODES: { id: GameMode; icon: string; desc: string; tag?: string }[] = [
  { id: 'WHEEL', icon: '🎡', desc: 'Spin the wheel of fate — each spin sends a summoner to a team.' },
  { id: 'CASE', icon: '📦', desc: 'CS:GO-style case opening. Unbox your teammates one by one.', tag: 'Fan favorite' },
  { id: 'SLOTS', icon: '🎰', desc: 'Pull the lever — the reel decides who joins next.' },
  { id: 'CARDS', icon: '🃏', desc: 'Shuffled face-down cards. Flip to reveal who you drew.' },
  { id: 'DRAFT', icon: '👑', desc: 'Two captains, coin flip, snake-order picks. Pure strategy.' },
  { id: 'BALANCED', icon: '⚖️', desc: 'Fair teams weighted by rank, revealed with drama.' },
  { id: 'INSTANT', icon: '⚡', desc: 'No ceremony. Random teams right now.' },
]

type Step = 'pick' | 'mode' | 'run' | 'ready'

export default function PlayTab({ onGoToPlayers }: { onGoToPlayers: () => void }) {
  const roster = useAppStore((s) => s.players)
  const settings = useAppStore((s) => s.settings)
  const addMatch = useAppStore((s) => s.addMatch)
  const completeMatch = useAppStore((s) => s.completeMatch)

  const [step, setStep] = useState<Step>('pick')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<GameMode>('WHEEL')
  const [withRoles, setWithRoles] = useState(true)
  const [withChampions, setWithChampions] = useState(false)
  const [match, setMatch] = useState<Match | null>(null)
  const [champPool, setChampPool] = useState<{ version: string; champions: Champion[] } | null>(null)
  const [champError, setChampError] = useState<string | null>(null)
  const [rerolls, setRerolls] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)
  const [reported, setReported] = useState<TeamSide | null>(null)

  const selected = useMemo(
    () => roster.filter((p) => selectedIds.has(p.id)),
    [roster, selectedIds]
  )

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const evenCount = selected.length >= 2 && selected.length % 2 === 0

  const startMode = async () => {
    if (withChampions) {
      try {
        setChampPool(await getChampions())
        setChampError(null)
      } catch (e) {
        setChampError(e instanceof Error ? e.message : 'Could not load champions.')
        setChampPool(null)
      }
    }
    setStep('run')
  }

  const handleModeComplete = (result: ModeResult) => {
    let blueRoles, redRoles
    if (withRoles) {
      blueRoles = assignRoles(result.blue, settings.respectPreferredRoles)
      redRoles = assignRoles(result.red, settings.respectPreferredRoles)
    }
    let blue = toMatchPlayers(result.blue, blueRoles, result.blueCaptain)
    let red = toMatchPlayers(result.red, redRoles, result.redCaptain)

    if (withChampions && champPool) {
      const champs = shuffle(champPool.champions)
      const all = [...blue, ...red]
      all.forEach((p, i) => {
        p.champion = champs[i].name
      })
      blue = [...blue]
      red = [...red]
    }

    const saved = addMatch({ mode, blue, red })
    setMatch(saved)
    setRerolls({})
    setReported(null)
    setCopied(false)
    playFanfare()
    setStep('ready')
  }

  const rerollChampion = (playerId: string) => {
    if (!match || !champPool) return
    const used = new Set(
      [...match.blue, ...match.red].map((p) => p.champion).filter(Boolean)
    )
    const available = champPool.champions.filter((c) => !used.has(c.name))
    if (available.length === 0) return
    const next = shuffle(available)[0].name
    const update = (list: MatchPlayer[]) =>
      list.map((p) => (p.playerId === playerId ? { ...p, champion: next } : p))
    setMatch({ ...match, blue: update(match.blue), red: update(match.red) })
    setRerolls((r) => ({ ...r, [playerId]: (r[playerId] || 0) + 1 }))
  }

  const copyTeams = async () => {
    if (!match) return
    await navigator.clipboard.writeText(matchToText(match.blue, match.red))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const report = (winner: TeamSide) => {
    if (!match) return
    completeMatch(match.id, winner)
    setReported(winner)
  }

  const resetFlow = () => {
    setStep('pick')
    setMatch(null)
  }

  const iconFor = (championName: string) => {
    if (!champPool) return undefined
    const champ = champPool.champions.find((c) => c.name === championName)
    return champ ? championIconUrl(champPool.version, champ.id) : undefined
  }

  // ---------- Step 1: pick players ----------
  if (step === 'pick') {
    return (
      <div className="animate-float-up">
        <SectionTitle sub="Who answered the call tonight?">Choose Your Summoners</SectionTitle>

        {roster.length === 0 ? (
          <EmptyState
            icon="⚔️"
            title="Your roster is empty"
            hint="Add your friends to the roster first — then come back here to build teams."
            action={<HexButton onClick={onGoToPlayers}>Go to Players</HexButton>}
          />
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-4">
              <HexButton variant="ghost" onClick={() => setSelectedIds(new Set(roster.map((p) => p.id)))}>
                Select all
              </HexButton>
              <HexButton variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </HexButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-w-4xl mx-auto">
              {[...roster]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => {
                  const on = selectedIds.has(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={`hex-panel p-3 text-left transition-all ${
                        on ? 'border-gold animate-glow-pulse' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} src={p.avatarUrl} size={30} />
                        <p className="font-medium text-gold-light truncate flex-1">{p.name}</p>
                        {on && <span>✅</span>}
                      </div>
                      <div className="mt-1.5">
                        <RankBadge rank={p.rank} />
                      </div>
                    </button>
                  )
                })}
            </div>

            <div className="text-center mt-8">
              <p className={`mb-3 text-sm ${evenCount ? 'text-teal' : 'text-gold-light/50'}`}>
                {selected.length} selected
                {selected.length === 10 && ' — perfect 5v5! 🏆'}
                {!evenCount && selected.length > 0 && ' (need an even number)'}
              </p>
              <HexButton big disabled={!evenCount} onClick={() => setStep('mode')}>
                Continue →
              </HexButton>
            </div>
          </>
        )}
      </div>
    )
  }

  // ---------- Step 2: pick mode + options ----------
  if (step === 'mode') {
    return (
      <div className="animate-float-up">
        <SectionTitle sub={`${selected.length} summoners ready — how should fate decide?`}>
          Choose Your Ritual
        </SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`hex-panel p-4 text-left transition-all relative ${
                mode === m.id ? 'border-gold animate-glow-pulse' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {m.tag && (
                <span className="absolute top-2 right-3 text-[10px] uppercase tracking-wider text-teal">
                  {m.tag}
                </span>
              )}
              <div className="text-3xl mb-2">{m.icon}</div>
              <p className="font-display text-gold tracking-wide">{MODE_LABELS[m.id]}</p>
              <p className="text-xs text-gold-light/50 mt-1">{m.desc}</p>
            </button>
          ))}
        </div>

        <HexPanel className="max-w-xl mx-auto mt-6 p-4">
          <ToggleRow
            label="Assign roles"
            hint="Top / Jungle / Mid / ADC / Support per team"
            value={withRoles}
            onChange={setWithRoles}
          />
          <ToggleRow
            label="Random champions"
            hint="Everyone gets a random champion (ARAM-style, 2 rerolls each)"
            value={withChampions}
            onChange={setWithChampions}
          />
        </HexPanel>

        <div className="flex justify-center gap-3 mt-8">
          <HexButton variant="ghost" onClick={() => setStep('pick')}>
            ← Back
          </HexButton>
          <HexButton big onClick={startMode}>
            {MODES.find((m) => m.id === mode)?.icon} Begin {MODE_LABELS[mode]}
          </HexButton>
        </div>
        {champError && (
          <p className="text-center text-team-red text-sm mt-3">{champError}</p>
        )}
      </div>
    )
  }

  // ---------- Step 3: run the chosen mode ----------
  if (step === 'run') {
    const props: ModeProps = {
      players: selected,
      onComplete: handleModeComplete,
      onCancel: () => setStep('mode'),
    }
    return (
      <div className="animate-float-up">
        {mode === 'WHEEL' && <WheelMode {...props} />}
        {mode === 'CASE' && <CaseMode {...props} />}
        {mode === 'SLOTS' && <SlotsMode {...props} />}
        {mode === 'CARDS' && <CardsMode {...props} />}
        {mode === 'DRAFT' && <DraftMode {...props} />}
        {mode === 'BALANCED' && <RevealMode {...props} balanced />}
        {mode === 'INSTANT' && <RevealMode {...props} balanced={false} instant />}
      </div>
    )
  }

  // ---------- Step 4: match ready ----------
  if (step === 'ready' && match) {
    return (
      <div className="animate-float-up">
        <SectionTitle sub={`Decided by ${MODE_LABELS[match.mode]}`}>⚔️ Match Ready</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <TeamCard side="BLUE" players={match.blue} championIcons={iconFor} animate />
          <TeamCard side="RED" players={match.red} championIcons={iconFor} animate />
        </div>

        {withChampions && champPool && (
          <div className="max-w-4xl mx-auto mt-4">
            <p className="text-xs text-gold-light/40 text-center mb-2">
              Champion rerolls (2 per player):
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[...match.blue, ...match.red].map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => rerollChampion(p.playerId)}
                  disabled={(rerolls[p.playerId] || 0) >= 2}
                  className="text-xs px-2 py-1 border border-gold-dark/40 text-gold-light/60 hover:text-gold hover:border-gold disabled:opacity-30 disabled:hover:text-gold-light/60"
                >
                  🎲 {p.name} ({2 - (rerolls[p.playerId] || 0)})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <HexButton onClick={copyTeams}>{copied ? '✓ Copied!' : '📋 Copy for Discord'}</HexButton>
          <HexButton variant="ghost" onClick={resetFlow}>
            🔄 New Game
          </HexButton>
        </div>

        <div className="max-w-md mx-auto mt-10">
          <div className="gold-rule mb-4" />
          {reported ? (
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center font-display text-lg text-gold"
            >
              🏆 {reported === 'BLUE' ? 'Blue' : 'Red'} Team victory recorded!
            </motion.p>
          ) : (
            <>
              <p className="text-center text-sm text-gold-light/50 mb-3">
                After the game, report the result (or do it later from History):
              </p>
              <div className="flex justify-center gap-3">
                <HexButton variant="blue" onClick={() => report('BLUE')}>
                  Blue Won
                </HexButton>
                <HexButton variant="red" onClick={() => report('RED')}>
                  Red Won
                </HexButton>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-4 py-2.5 text-left group"
    >
      <div>
        <p className="text-gold-light font-medium">{label}</p>
        <p className="text-xs text-gold-light/40">{hint}</p>
      </div>
      <div
        className={`w-12 h-6 rounded-full border transition-all shrink-0 relative ${
          value ? 'bg-gold/30 border-gold' : 'bg-abyss border-gold-dark/50'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
            value ? 'left-6 bg-gold' : 'left-0.5 bg-gold-dark'
          }`}
        />
      </div>
    </button>
  )
}

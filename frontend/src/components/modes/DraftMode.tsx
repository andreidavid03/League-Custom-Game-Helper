'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Player, TeamSide } from '@/lib/types'
import { playLockIn, playFanfare } from '@/lib/sound'
import { HexButton, HexPanel } from '@/components/ui'
import { ModeShell, useAnimSpeed } from './common'
import { shuffle, snakeOrder } from '@/lib/teams'
import type { ModeProps } from '@/components/tabs/PlayTab'

type Stage = 'captains' | 'coin' | 'picking'

export default function DraftMode({ players, onComplete, onCancel }: ModeProps) {
  const speed = useAnimSpeed()
  const [stage, setStage] = useState<Stage>('captains')
  const [captains, setCaptains] = useState<Player[]>([])
  const [coinResult, setCoinResult] = useState<TeamSide | null>(null)
  const [coinSpinning, setCoinSpinning] = useState(false)
  const [pool, setPool] = useState<Player[]>([])
  const [blue, setBlue] = useState<Player[]>([])
  const [red, setRed] = useState<Player[]>([])
  const [order, setOrder] = useState<TeamSide[]>([])
  const [pickIndex, setPickIndex] = useState(0)

  const toggleCaptain = (p: Player) =>
    setCaptains((cs) =>
      cs.some((c) => c.id === p.id)
        ? cs.filter((c) => c.id !== p.id)
        : cs.length < 2
          ? [...cs, p]
          : cs
    )

  const randomCaptains = () => setCaptains(shuffle(players).slice(0, 2))

  const confirmCaptains = () => {
    if (captains.length !== 2) return
    setStage('coin')
  }

  const flipCoin = () => {
    if (coinSpinning) return
    setCoinSpinning(true)
    const result: TeamSide = Math.random() < 0.5 ? 'BLUE' : 'RED'
    setTimeout(() => {
      setCoinResult(result)
      setCoinSpinning(false)
      playLockIn()
      setTimeout(() => {
        // Captain 1 is always Blue's captain; coin decides who picks first.
        const remaining = players.filter((p) => !captains.some((c) => c.id === p.id))
        setBlue([captains[0]])
        setRed([captains[1]])
        setPool(remaining)
        setOrder(snakeOrder(remaining.length, result))
        setStage('picking')
      }, 1300 / speed)
    }, 1600 / speed)
  }

  const currentSide = order[pickIndex]
  const currentCaptain = currentSide === 'BLUE' ? captains[0] : captains[1]

  const pick = (p: Player) => {
    if (stage !== 'picking') return
    const newPool = pool.filter((x) => x.id !== p.id)
    let newBlue = blue
    let newRed = red
    if (currentSide === 'BLUE') {
      newBlue = [...blue, p]
      setBlue(newBlue)
    } else {
      newRed = [...red, p]
      setRed(newRed)
    }
    playLockIn()
    setPool(newPool)
    setPickIndex((i) => i + 1)

    // Last player goes automatically to whoever picks next.
    if (newPool.length === 1) {
      const lastSide = order[pickIndex + 1]
      const finalBlue = lastSide === 'BLUE' ? [...newBlue, newPool[0]] : newBlue
      const finalRed = lastSide === 'RED' ? [...newRed, newPool[0]] : newRed
      setTimeout(() => {
        setBlue(finalBlue)
        setRed(finalRed)
        setPool([])
        playFanfare()
        setTimeout(
          () =>
            onComplete({
              blue: finalBlue,
              red: finalRed,
              blueCaptain: captains[0].id,
              redCaptain: captains[1].id,
            }),
          1000
        )
      }, 600)
    } else if (newPool.length === 0) {
      onComplete({
        blue: newBlue,
        red: newRed,
        blueCaptain: captains[0].id,
        redCaptain: captains[1].id,
      })
    }
  }

  // ---------- Stage 1: choose captains ----------
  if (stage === 'captains') {
    return (
      <ModeShell
        title="👑 Captain Draft"
        subtitle="Pick two captains — first selected leads Blue, second leads Red. Or let fate decide."
        onCancel={onCancel}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-w-3xl mx-auto">
          {players.map((p) => {
            const idx = captains.findIndex((c) => c.id === p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggleCaptain(p)}
                className={`hex-panel p-3 text-left transition-all ${
                  idx === 0
                    ? 'border-team-blue animate-glow-pulse'
                    : idx === 1
                      ? 'border-team-red animate-glow-pulse'
                      : 'opacity-60 hover:opacity-100'
                }`}
              >
                <p className="font-medium text-gold-light truncate">
                  {idx === 0 && '🔵👑 '}
                  {idx === 1 && '🔴👑 '}
                  {p.name}
                </p>
              </button>
            )
          })}
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <HexButton variant="ghost" onClick={randomCaptains}>
            🎲 Random captains
          </HexButton>
          <HexButton big disabled={captains.length !== 2} onClick={confirmCaptains}>
            Continue →
          </HexButton>
        </div>
      </ModeShell>
    )
  }

  // ---------- Stage 2: coin flip ----------
  if (stage === 'coin') {
    return (
      <ModeShell title="👑 Captain Draft" subtitle="The coin decides who picks first." onCancel={onCancel}>
        <div className="flex flex-col items-center py-8">
          <motion.div
            animate={
              coinSpinning
                ? { rotateX: 1800, transition: { duration: 1.6 / speed, ease: 'easeInOut' } }
                : coinResult
                  ? { rotateX: 0 }
                  : {}
            }
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-display ${
              coinResult === 'BLUE'
                ? 'border-team-blue bg-team-blue/20 text-team-blue'
                : coinResult === 'RED'
                  ? 'border-team-red bg-team-red/20 text-team-red'
                  : 'border-gold bg-gold/10 text-gold'
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {coinResult ? (coinResult === 'BLUE' ? '🔵' : '🔴') : '⚜️'}
          </motion.div>

          <div className="mt-6 text-center h-16">
            {coinResult ? (
              <p className="font-display text-xl text-gold animate-float-up">
                {coinResult === 'BLUE'
                  ? `🔵 ${captains[0].name} picks first!`
                  : `🔴 ${captains[1].name} picks first!`}
              </p>
            ) : (
              <HexButton big onClick={flipCoin} disabled={coinSpinning}>
                {coinSpinning ? 'Flipping…' : '🪙 Flip the Coin'}
              </HexButton>
            )}
          </div>
        </div>
      </ModeShell>
    )
  }

  // ---------- Stage 3: snake picks ----------
  return (
    <ModeShell
      title="👑 Captain Draft"
      subtitle={
        pool.length > 0 && currentCaptain ? (
          <span>
            Snake order ({order.slice(0, 6).map((s) => (s === 'BLUE' ? '🔵' : '🔴')).join(' ')}…) —{' '}
            <strong className={currentSide === 'BLUE' ? 'text-team-blue' : 'text-team-red'}>
              {currentCaptain.name}
            </strong>{' '}
            picks now.
          </span>
        ) : (
          'Draft complete!'
        )
      }
      onCancel={onCancel}
    >
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <TeamColumn side="BLUE" captain={captains[0]} team={blue} active={currentSide === 'BLUE'} />

        <HexPanel className="p-3 order-first md:order-none">
          <p className="font-display text-sm uppercase tracking-widest text-center text-gold mb-2">
            Available
          </p>
          {pool.length === 0 ? (
            <p className="text-center text-gold-light/30 py-6 text-sm">Everyone picked!</p>
          ) : (
            <ul className="space-y-1.5">
              {pool.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => pick(p)}
                    className="w-full text-left text-sm text-gold-light bg-abyss/40 border border-gold-dark/40 hover:border-gold hover:bg-gold/10 px-2 py-1.5 transition-colors truncate"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </HexPanel>

        <TeamColumn side="RED" captain={captains[1]} team={red} active={currentSide === 'RED'} />
      </div>
    </ModeShell>
  )
}

function TeamColumn({
  side,
  captain,
  team,
  active,
}: {
  side: TeamSide
  captain: Player
  team: Player[]
  active: boolean
}) {
  const color = side === 'BLUE' ? 'border-team-blue/50' : 'border-team-red/50'
  const text = side === 'BLUE' ? 'text-team-blue' : 'text-team-red'
  return (
    <div className={`hex-panel p-3 ${color} ${active ? 'animate-glow-pulse' : ''}`}>
      <p className={`font-display text-sm uppercase tracking-widest text-center mb-2 ${text}`}>
        {side === 'BLUE' ? '🔵 Blue' : '🔴 Red'}
      </p>
      <ul className="space-y-1.5">
        {team.map((p) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-gold-light bg-abyss/40 border border-gold-dark/30 px-2 py-1.5 truncate"
          >
            {p.id === captain.id && '👑 '}
            {p.name}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

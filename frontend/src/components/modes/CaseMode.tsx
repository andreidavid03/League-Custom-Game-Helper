'use client'

import { useEffect, useRef, useState } from 'react'
import { Player } from '@/lib/types'
import { playCaseOpen, stopCaseOpen, playLockIn } from '@/lib/sound'
import { HexButton } from '@/components/ui'
import { ModeShell, TeamsProgress, useAssignment, useAnimSpeed } from './common'
import { pickRandom } from '@/lib/teams'
import type { ModeProps } from '@/components/tabs/PlayTab'

const CARD_W = 128 // px, includes margin
const WINNER_INDEX = 34
const STRIP_LEN = 42

export default function CaseMode({ players, onComplete, onCancel }: ModeProps) {
  const speed = useAnimSpeed()
  const { remaining, blue, red, nextSide, assign } = useAssignment(players, (b, r) =>
    onComplete({ blue: b, red: r })
  )
  const [strip, setStrip] = useState<Player[]>([])
  const [offset, setOffset] = useState(0)
  const [opening, setOpening] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const rafRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const open = () => {
    if (opening || remaining.length === 0) return
    const picked = pickRandom(remaining)

    // Build a long strip of random names with the winner planted near the end.
    const filler: Player[] = Array.from({ length: STRIP_LEN }, () => pickRandom(remaining))
    // Avoid the winner appearing right next to the planted slot (looks like a miss).
    const stripArr = filler.map((p, i) =>
      i === WINNER_INDEX ? picked : Math.abs(i - WINNER_INDEX) <= 2 && p.id === picked.id
        ? pickRandom(remaining.filter((x) => x.id !== picked.id)) ?? p
        : p
    )
    setStrip(stripArr)
    setWinner(null)
    setOpening(true)
    playCaseOpen()

    const containerW = containerRef.current?.clientWidth ?? 640
    // Land the winner card under the center marker, with a little jitter.
    const jitter = (Math.random() - 0.5) * CARD_W * 0.6
    const target = WINNER_INDEX * CARD_W + CARD_W / 2 - containerW / 2 + jitter
    const duration = 5000 / speed
    const t0 = performance.now()

    const frame = (now: number) => {
      const t = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setOffset(target * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        stopCaseOpen()
        playLockIn()
        setWinner(picked)
        setOpening(false)
        setTimeout(() => {
          const after = assign(picked)
          if (after.remaining.length === 1) {
            const last = after.remaining[0]
            setTimeout(() => {
              setWinner(last)
              playLockIn()
              setTimeout(() => assign(last), 800)
            }, 600)
          } else {
            setWinner(null)
            setOffset(0)
            setStrip([])
          }
        }, 1500 / speed)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current)
      stopCaseOpen()
    },
    []
  )

  return (
    <ModeShell title="📦 Case Opening" onCancel={onCancel}>
      <div className="max-w-3xl mx-auto">
        {/* The case strip */}
        <div
          ref={containerRef}
          className="relative overflow-hidden hex-panel hex-panel-glow h-36"
        >
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gold z-10 shadow-[0_0_12px_rgba(200,155,60,0.9)]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 text-gold text-xs z-10">▼</div>

          {strip.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gold-light/30 font-display tracking-widest uppercase">
              {remaining.length} summoners in the case
            </div>
          ) : (
            <div
              className="flex items-center h-full will-change-transform"
              style={{ transform: `translateX(${-offset}px)` }}
            >
              {strip.map((p, i) => {
                const isWinner = winner && i === WINNER_INDEX
                return (
                  <div
                    key={i}
                    className={`shrink-0 w-28 h-24 mx-1 flex flex-col items-center justify-center border text-center px-1 transition-colors ${
                      isWinner
                        ? 'border-gold bg-gold/15 animate-glow-pulse'
                        : 'border-gold-dark/40 bg-abyss/60'
                    }`}
                  >
                    <span className="text-2xl mb-1">{isWinner ? '🌟' : '🗡️'}</span>
                    <span className="text-xs font-medium text-gold-light truncate w-full">
                      {p.name}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="h-12 mt-4 text-center">
          {winner ? (
            <p className="font-display text-xl text-gold animate-float-up">
              🌟 {winner.name} unboxed → {nextSide === 'BLUE' ? '🔵 Blue' : '🔴 Red'}!
            </p>
          ) : (
            <HexButton big onClick={open} disabled={opening || remaining.length === 0}>
              {opening ? 'Opening…' : '🔑 Open Case'}
            </HexButton>
          )}
        </div>

        <TeamsProgress
          blue={blue}
          red={red}
          nextSide={nextSide}
          totalPerTeam={players.length / 2}
        />
      </div>
    </ModeShell>
  )
}

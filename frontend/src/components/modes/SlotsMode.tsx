'use client'

import { useEffect, useRef, useState } from 'react'
import { Player } from '@/lib/types'
import { playTick, playLockIn } from '@/lib/sound'
import { HexButton } from '@/components/ui'
import { animate, bannerText, ModeShell, TeamsProgress, useAssignment, useAnimSpeed, WinnerBanner } from './common'
import { pickRandom } from '@/lib/teams'
import type { ModeProps } from '@/components/tabs/PlayTab'

const ROW_H = 56 // px per reel row
const REEL_LEN = 28
const WINNER_ROW = 24

export default function SlotsMode({ players, onComplete, onCancel }: ModeProps) {
  const speed = useAnimSpeed()
  const { remaining, blue, red, nextSide, assign, peekNextSide } = useAssignment(players, (b, r) =>
    onComplete({ blue: b, red: r })
  )
  const [reel, setReel] = useState<Player[]>([])
  const [offset, setOffset] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [winner, setWinner] = useState<WinnerBanner | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const pull = () => {
    if (rolling || remaining.length === 0) return
    const picked = pickRandom(remaining)
    const reelArr = Array.from({ length: REEL_LEN }, (_, i) =>
      i === WINNER_ROW ? picked : pickRandom(remaining)
    )
    setReel(reelArr)
    setWinner(null)
    setRolling(true)

    // Land the winner row in the middle of the 3-row window.
    const target = (WINNER_ROW - 1) * ROW_H
    const duration = 2600 / speed
    let lastRow = 0

    cancelRef.current = animate(
      duration,
      (t) => {
        const eased = 1 - Math.pow(1 - t, 3)
        const y = target * eased
        setOffset(y)
        const row = Math.floor(y / ROW_H)
        if (row !== lastRow) {
          playTick(0.8)
          lastRow = row
        }
      },
      () => {
        playLockIn()
        setWinner({ player: picked, side: peekNextSide() })
        setRolling(false)
        setTimeout(() => {
          const after = assign(picked)
          if (after.remaining.length === 1) {
            const last = after.remaining[0]
            setTimeout(() => {
              setWinner({ player: last, side: peekNextSide() })
              playLockIn()
              setTimeout(() => assign(last), 800)
            }, 600)
          } else {
            setWinner(null)
            setReel([])
            setOffset(0)
          }
        }, 1400 / speed)
      }
    )
  }

  useEffect(() => () => cancelRef.current?.(), [])

  return (
    <ModeShell title="🎰 Slot Machine" onCancel={onCancel}>
      <div className="max-w-md mx-auto">
        <div className="relative hex-panel hex-panel-glow overflow-hidden" style={{ height: ROW_H * 3 }}>
          {/* Middle-row highlight */}
          <div
            className="absolute inset-x-0 border-y border-gold bg-gold/5 z-10 pointer-events-none"
            style={{ top: ROW_H, height: ROW_H }}
          />
          {reel.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gold-light/30 font-display tracking-widest uppercase">
              {remaining.length} summoners loaded
            </div>
          ) : (
            <div
              className="will-change-transform"
              style={{
                transform: `translateY(${-offset}px)`,
                filter: rolling ? 'blur(1px)' : 'none',
              }}
            >
              {reel.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center font-display text-lg tracking-wide ${
                    winner && i === WINNER_ROW ? 'text-gold' : 'text-gold-light/80'
                  }`}
                  style={{ height: ROW_H }}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-12 mt-4 text-center">
          {winner ? (
            <p className="font-display text-xl text-gold animate-float-up">
              💰 {bannerText(winner)}
            </p>
          ) : (
            <HexButton big onClick={pull} disabled={rolling || remaining.length === 0}>
              {rolling ? 'Rolling…' : '🎰 Pull the Lever'}
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

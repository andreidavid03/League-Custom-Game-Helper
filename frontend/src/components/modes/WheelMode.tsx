'use client'

import { useEffect, useRef, useState } from 'react'
import { Player } from '@/lib/types'
import { playTick, playLockIn } from '@/lib/sound'
import { HexButton } from '@/components/ui'
import { animate, bannerText, ModeShell, TeamsProgress, useAssignment, useAnimSpeed, WinnerBanner } from './common'
import type { ModeProps } from '@/components/tabs/PlayTab'

const SEGMENT_COLORS = [
  '#0a323c', '#1e2328', '#3c3c41', '#0f2138', '#1a1a2e',
  '#2a2138', '#10282a', '#231a10', '#101f33', '#291423',
]

// SVG geometry — the wheel is drawn in a 520x520 viewBox and scales to fill
// its column, so it renders big on desktop and shrinks gracefully on mobile.
const SIZE = 520
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 240

export default function WheelMode({ players, onComplete, onCancel }: ModeProps) {
  const speed = useAnimSpeed()
  const { remaining, blue, red, nextSide, assign, peekNextSide } = useAssignment(players, (b, r) =>
    onComplete({ blue: b, red: r })
  )
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<WinnerBanner | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  const n = remaining.length
  const seg = 360 / Math.max(n, 1)

  // Index of the segment currently under the top pointer for a given rotation.
  const indexAtPointer = (rot: number) => {
    const angle = ((270 - rot) % 360 + 360) % 360
    return Math.floor(angle / seg) % n
  }

  const spin = () => {
    if (spinning || n === 0) return
    setSpinning(true)
    setWinner(null)

    const start = rotation
    const target = start + (4 + Math.random() * 3) * 360 + Math.random() * 360
    const duration = 4200 / speed
    let lastIdx = indexAtPointer(start)

    cancelRef.current = animate(
      duration,
      (t) => {
        const eased = 1 - Math.pow(1 - t, 3)
        const rot = start + (target - start) * eased
        setRotation(rot)
        const idx = indexAtPointer(rot)
        if (idx !== lastIdx) {
          playTick()
          lastIdx = idx
        }
      },
      () => {
        const picked = remaining[indexAtPointer(target)]
        setWinner({ player: picked, side: peekNextSide() })
        playLockIn()
        setSpinning(false)
        setTimeout(() => {
          const after = assign(picked)
          // Last player left? Spin is pointless — assign automatically.
          if (after.remaining.length === 1) {
            const last = after.remaining[0]
            setTimeout(() => {
              playLockIn()
              setWinner({ player: last, side: peekNextSide() })
              setTimeout(() => assign(last), 800)
            }, 600)
          } else {
            setWinner(null)
          }
        }, 1400 / speed)
      }
    )
  }

  useEffect(() => () => cancelRef.current?.(), [])

  const segmentPath = (i: number) => {
    const a0 = (i * seg * Math.PI) / 180
    const a1 = ((i + 1) * seg * Math.PI) / 180
    const x0 = CX + RADIUS * Math.cos(a0)
    const y0 = CY + RADIUS * Math.sin(a0)
    const x1 = CX + RADIUS * Math.cos(a1)
    const y1 = CY + RADIUS * Math.sin(a1)
    const large = seg > 180 ? 1 : 0
    return `M ${CX} ${CY} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x1} ${y1} Z`
  }

  return (
    <ModeShell title="🎡 Wheel of Fate" onCancel={onCancel}>
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start max-w-5xl mx-auto">
        {/* Big centered wheel */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[520px]">
            {/* Pointer */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 text-gold text-3xl drop-shadow-[0_0_8px_color-mix(in_srgb,var(--c-accent)_80%,transparent)]">
              ▼
            </div>
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full h-auto drop-shadow-[0_0_36px_color-mix(in_srgb,var(--c-accent)_18%,transparent)]"
            >
              <circle cx={CX} cy={CY} r={RADIUS + 8} fill="none" stroke="var(--c-accent-dark)" strokeWidth={6} />
              <g transform={`rotate(${rotation} ${CX} ${CY})`}>
                {n === 0 ? null : n === 1 ? (
                  <circle cx={CX} cy={CY} r={RADIUS} fill={SEGMENT_COLORS[0]} stroke="var(--c-accent-dark)" />
                ) : (
                  remaining.map((p, i) => (
                    <path
                      key={p.id}
                      d={segmentPath(i)}
                      fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                      stroke="var(--c-accent-dark)"
                      strokeWidth={1.5}
                    />
                  ))
                )}
                {remaining.map((p, i) => {
                  const mid = ((i + 0.5) * seg * Math.PI) / 180
                  const tx = CX + RADIUS * 0.62 * Math.cos(mid)
                  const ty = CY + RADIUS * 0.62 * Math.sin(mid)
                  return (
                    <text
                      key={`t-${p.id}`}
                      x={tx}
                      y={ty}
                      fill="var(--c-accent-light)"
                      fontSize={n > 8 ? 17 : 20}
                      fontWeight={600}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${(i + 0.5) * seg} ${tx} ${ty})`}
                    >
                      {p.name.length > 11 ? p.name.slice(0, 10) + '…' : p.name}
                    </text>
                  )
                })}
              </g>
              <circle cx={CX} cy={CY} r={42} fill="var(--c-panel)" stroke="var(--c-accent)" strokeWidth={3} />
              <text x={CX} y={CY + 2} fontSize={26} textAnchor="middle" dominantBaseline="middle">
                ⚔️
              </text>
            </svg>
          </div>

          <div className="h-12 mt-3 text-center">
            {winner ? (
              <p className="font-display text-2xl text-gold animate-float-up">
                ✨ {bannerText(winner)}
              </p>
            ) : (
              <HexButton big onClick={spin} disabled={spinning || n === 0}>
                {spinning ? 'Spinning…' : n === players.length ? 'Spin!' : 'Spin again'}
              </HexButton>
            )}
          </div>
        </div>

        {/* Teams build up on the right */}
        <TeamsProgress
          blue={blue}
          red={red}
          nextSide={nextSide}
          totalPerTeam={players.length / 2}
          stacked
        />
      </div>
    </ModeShell>
  )
}

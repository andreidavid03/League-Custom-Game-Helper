'use client'

import { useEffect, useRef, useState } from 'react'
import { Player } from '@/lib/types'
import { playTick, playLockIn } from '@/lib/sound'
import { HexButton } from '@/components/ui'
import { ModeShell, TeamsProgress, useAssignment, useAnimSpeed } from './common'
import type { ModeProps } from '@/components/tabs/PlayTab'

const SEGMENT_COLORS = [
  '#0a323c', '#1e2328', '#3c3c41', '#0f2138', '#1a1a2e',
  '#2a2138', '#10282a', '#231a10', '#101f33', '#291423',
]

export default function WheelMode({ players, onComplete, onCancel }: ModeProps) {
  const speed = useAnimSpeed()
  const { remaining, blue, red, nextSide, assign } = useAssignment(players, (b, r) =>
    onComplete({ blue: b, red: r })
  )
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const rafRef = useRef(0)

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
    const t0 = performance.now()
    let lastIdx = indexAtPointer(start)

    const frame = (now: number) => {
      const t = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const rot = start + (target - start) * eased
      setRotation(rot)

      const idx = indexAtPointer(rot)
      if (idx !== lastIdx) {
        playTick()
        lastIdx = idx
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        const picked = remaining[indexAtPointer(target)]
        setWinner(picked)
        playLockIn()
        setSpinning(false)
        setTimeout(() => {
          const after = assign(picked)
          // Last player left? Spin is pointless — assign automatically.
          if (after.remaining.length === 1) {
            setTimeout(() => {
              playLockIn()
              setWinner(after.remaining[0])
              setTimeout(() => assign(after.remaining[0]), 800)
            }, 600)
          }
          setWinner(null)
        }, 1400 / speed)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const radius = 150
  const cx = 160
  const cy = 160

  const segmentPath = (i: number) => {
    const a0 = (i * seg * Math.PI) / 180
    const a1 = ((i + 1) * seg * Math.PI) / 180
    const x0 = cx + radius * Math.cos(a0)
    const y0 = cy + radius * Math.sin(a0)
    const x1 = cx + radius * Math.cos(a1)
    const y1 = cy + radius * Math.sin(a1)
    const large = seg > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`
  }

  return (
    <ModeShell title="🎡 Wheel of Fate" onCancel={onCancel}>
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 text-gold text-2xl drop-shadow-[0_0_6px_rgba(200,155,60,0.8)]">
            ▼
          </div>
          <svg width={320} height={320} viewBox="0 0 320 320" className="drop-shadow-[0_0_24px_rgba(3,151,171,0.25)]">
            <circle cx={cx} cy={cy} r={radius + 6} fill="none" stroke="#785a28" strokeWidth={4} />
            <g transform={`rotate(${rotation} ${cx} ${cy})`}>
              {n === 0 ? null : n === 1 ? (
                <circle cx={cx} cy={cy} r={radius} fill={SEGMENT_COLORS[0]} stroke="#785a28" />
              ) : (
                remaining.map((p, i) => (
                  <g key={p.id}>
                    <path
                      d={segmentPath(i)}
                      fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                      stroke="#785a28"
                      strokeWidth={1}
                    />
                  </g>
                ))
              )}
              {remaining.map((p, i) => {
                const mid = ((i + 0.5) * seg * Math.PI) / 180
                const tx = cx + radius * 0.6 * Math.cos(mid)
                const ty = cy + radius * 0.6 * Math.sin(mid)
                return (
                  <text
                    key={`t-${p.id}`}
                    x={tx}
                    y={ty}
                    fill="#f0e6d2"
                    fontSize={n > 8 ? 11 : 13}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${(i + 0.5) * seg} ${tx} ${ty})`}
                  >
                    {p.name.length > 10 ? p.name.slice(0, 9) + '…' : p.name}
                  </text>
                )
              })}
            </g>
            <circle cx={cx} cy={cy} r={26} fill="#0a1428" stroke="#c89b3c" strokeWidth={2} />
            <text x={cx} y={cy + 1} fill="#c89b3c" fontSize={16} textAnchor="middle" dominantBaseline="middle">
              ⚔️
            </text>
          </svg>
        </div>

        <div className="h-10 mt-2 text-center">
          {winner ? (
            <p className="font-display text-xl text-gold animate-float-up">
              ✨ {winner.name} → {nextSide === 'BLUE' ? '🔵 Blue' : '🔴 Red'}!
            </p>
          ) : (
            <HexButton big onClick={spin} disabled={spinning || n === 0}>
              {spinning ? 'Spinning…' : n === players.length ? 'Spin!' : 'Spin again'}
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { playTick } from '@/lib/sound'
import { splitBalanced, splitRandom } from '@/lib/teams'
import { ModeShell, useAnimSpeed } from './common'
import type { ModeProps } from '@/components/tabs/PlayTab'

/**
 * Balanced Teams & Instant Random share this: compute the split, then either
 * jump straight to the result (instant) or build suspense first (balanced).
 */
export default function RevealMode({
  players,
  onComplete,
  onCancel,
  balanced,
  instant = false,
}: ModeProps & { balanced: boolean; instant?: boolean }) {
  const speed = useAnimSpeed()
  const [phase, setPhase] = useState<'weighing' | 'done'>('weighing')
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const result = balanced ? splitBalanced(players) : splitRandom(players)

    if (instant) {
      onComplete(result)
      return
    }

    // Suspense: scale ticking while "the scales weigh the teams".
    const duration = 2400 / speed
    const interval = setInterval(() => playTick(0.6), 180)
    const timer = setTimeout(() => {
      clearInterval(interval)
      setPhase('done')
      setTimeout(() => onComplete(result), 400)
    }, duration)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [players, balanced, instant, onComplete, speed])

  if (instant) return null

  return (
    <ModeShell title="⚖️ Balanced Teams" onCancel={onCancel}>
      <div className="flex flex-col items-center py-16">
        <motion.div
          animate={phase === 'weighing' ? { rotate: [-8, 8, -8] } : { rotate: 0 }}
          transition={
            phase === 'weighing'
              ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
          className="text-7xl"
        >
          ⚖️
        </motion.div>
        <p className="font-display text-lg text-gold-light/60 mt-6 tracking-widest uppercase animate-pulse">
          {phase === 'weighing' ? 'Weighing ranks…' : 'Balance achieved'}
        </p>
      </div>
    </ModeShell>
  )
}

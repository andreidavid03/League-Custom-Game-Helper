'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Player } from '@/lib/types'
import { playLockIn } from '@/lib/sound'
import { ModeShell, TeamsProgress, useAssignment } from './common'
import { shuffle } from '@/lib/teams'
import type { ModeProps } from '@/components/tabs/PlayTab'

interface Card {
  player: Player
  flipped: boolean
}

export default function CardsMode({ players, onComplete, onCancel }: ModeProps) {
  const { blue, red, nextSide, assign } = useAssignment(players, (b, r) =>
    onComplete({ blue: b, red: r })
  )
  // Players are shuffled into card positions once, at mount.
  const [cards, setCards] = useState<Card[]>(() =>
    shuffle(players).map((p) => ({ player: p, flipped: false }))
  )
  const [busy, setBusy] = useState(false)

  const flip = (index: number) => {
    if (busy || cards[index].flipped) return
    setBusy(true)
    setCards((cs) => cs.map((c, i) => (i === index ? { ...c, flipped: true } : c)))
    playLockIn()
    setTimeout(() => {
      assign(cards[index].player)
      setBusy(false)
    }, 900)
  }

  return (
    <ModeShell
      title="🃏 Card Draw"
      subtitle={`Flip a card to assign the next summoner — picking for ${
        nextSide === 'BLUE' ? '🔵 Blue' : '🔴 Red'
      }.`}
      onCancel={onCancel}
    >
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-2xl mx-auto" style={{ perspective: 1000 }}>
        {cards.map((card, i) => (
          <button
            key={card.player.id}
            onClick={() => flip(i)}
            disabled={card.flipped || busy}
            className="relative h-28 sm:h-32 [transform-style:preserve-3d]"
          >
            <motion.div
              animate={{ rotateY: card.flipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 [transform-style:preserve-3d]"
            >
              {/* Back */}
              <div className="absolute inset-0 [backface-visibility:hidden] hex-panel flex items-center justify-center text-3xl cursor-pointer hover:border-gold transition-colors">
                ⚜️
              </div>
              {/* Face */}
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] hex-panel border-gold bg-gold/10 flex flex-col items-center justify-center px-1">
                <span className="text-2xl mb-1">🌟</span>
                <span className="text-xs sm:text-sm font-semibold text-gold text-center break-words w-full">
                  {card.player.name}
                </span>
              </div>
            </motion.div>
          </button>
        ))}
      </div>

      <TeamsProgress
        blue={blue}
        red={red}
        nextSide={nextSide}
        totalPerTeam={players.length / 2}
      />
    </ModeShell>
  )
}

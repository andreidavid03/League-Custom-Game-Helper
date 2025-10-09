'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface MatchCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  blueTeam: Array<{ id: string; name: string }>
  redTeam: Array<{ id: string; name: string }>
  onComplete: (data: { winner: 'BLUE' | 'RED'; duration?: number; notes?: string }) => Promise<void>
}

export default function MatchCompletionModal({
  isOpen,
  onClose,
  blueTeam,
  redTeam,
  onComplete
}: MatchCompletionModalProps) {
  const [winner, setWinner] = useState<'BLUE' | 'RED' | null>(null)
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    if (!winner) return

    console.log('Starting match completion...', { winner, duration, notes })
    setIsCompleting(true)
    try {
      console.log('Calling onComplete function...')
      await onComplete({
        winner,
        duration: duration ? parseInt(duration) : undefined,
        notes: notes || undefined
      })
      console.log('Match completion successful!')
      onClose()
    } catch (error) {
      console.error('Failed to complete match:', error)
      alert('Failed to complete match. Please try again.')
    } finally {
      console.log('Match completion finished, resetting state')
      setIsCompleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-gold-500/30 rounded-lg p-6 max-w-md w-full mx-4 backdrop-blur-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gold-400">
          Complete Match
        </h2>

        {/* Team Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gold-300">Select Winner</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Blue Team */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWinner('BLUE')}
              className={`p-4 rounded-lg border-2 transition-all ${
                winner === 'BLUE'
                  ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                  : 'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:border-blue-400'
              }`}
            >
              <div className="font-bold mb-2">Blue Team</div>
              <div className="text-sm space-y-1">
                {blueTeam.map(player => (
                  <div key={player.id}>{player.name}</div>
                ))}
              </div>
            </motion.button>

            {/* Red Team */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWinner('RED')}
              className={`p-4 rounded-lg border-2 transition-all ${
                winner === 'RED'
                  ? 'border-red-400 bg-red-500/20 text-red-300'
                  : 'border-red-500/50 bg-red-500/10 text-red-400 hover:border-red-400'
              }`}
            >
              <div className="font-bold mb-2">Red Team</div>
              <div className="text-sm space-y-1">
                {redTeam.map(player => (
                  <div key={player.id}>{player.name}</div>
                ))}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Duration Input */}
        <div className="mb-4">
          <label className="block text-gold-300 text-sm font-medium mb-2">
            Match Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 bg-blue-900/30 border border-gold-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-400"
            min="1"
            max="180"
          />
        </div>

        {/* Notes Input */}
        <div className="mb-6">
          <label className="block text-gold-300 text-sm font-medium mb-2">
            Match Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about the match..."
            className="w-full px-3 py-2 bg-blue-900/30 border border-gold-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-400 resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
            disabled={!winner || isCompleting}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              !winner || isCompleting
                ? 'bg-gray-600/50 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-gold-600 to-gold-500 text-black hover:from-gold-500 hover:to-gold-400'
            }`}
          >
            {isCompleting ? 'Completing...' : 'Complete Match'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
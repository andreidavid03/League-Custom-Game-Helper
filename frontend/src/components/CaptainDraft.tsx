'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Player } from '@/lib/api'

interface CaptainDraftProps {
  players: Player[]
  onComplete: (teams: {
    blueTeam: { players: Player[] }
    redTeam: { players: Player[] }
    blueCaptain: Player
    redCaptain: Player
  }) => Promise<void>
  onCancel: () => void
}

type DraftPhase = 'select_captains' | 'coin_flip' | 'drafting' | 'complete'

export default function CaptainDraft({ players, onComplete, onCancel }: CaptainDraftProps) {
  const [phase, setPhase] = useState<DraftPhase>('select_captains')
  const [blueCaptain, setBlueCaptain] = useState<Player | null>(null)
  const [redCaptain, setRedCaptain] = useState<Player | null>(null)
  const [currentPicker, setCurrentPicker] = useState<'blue' | 'red'>('blue')
  const [blueTeam, setBlueTeam] = useState<Player[]>([])
  const [redTeam, setRedTeam] = useState<Player[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [pickOrder, setPickOrder] = useState<('blue' | 'red')[]>([])
  const [currentPickIndex, setCurrentPickIndex] = useState(0)
  const [coinFlipResult, setCoinFlipResult] = useState<'blue' | 'red' | null>(null)
  const [showCoinFlip, setShowCoinFlip] = useState(false)

  useEffect(() => {
    if (phase === 'drafting' && blueCaptain && redCaptain) {
      // Initialize available players (excluding captains)
      const remaining = players.filter(p => p.id !== blueCaptain.id && p.id !== redCaptain.id)
      setAvailablePlayers(remaining)
      
      // Set up initial teams with captains
      setBlueTeam([blueCaptain])
      setRedTeam([redCaptain])
      
      // Set up pick order: 1-2-2-2-2-1 (blue picks first)
      const order: ('blue' | 'red')[] = ['blue', 'red', 'red', 'blue', 'blue', 'red', 'red', 'blue']
      setPickOrder(order)
      setCurrentPickIndex(0)
      setCurrentPicker(order[0])
    }
  }, [phase, blueCaptain, redCaptain, players])

  const handleCaptainSelection = (player: Player, team: 'blue' | 'red') => {
    if (team === 'blue') {
      setBlueCaptain(player)
    } else {
      setRedCaptain(player)
    }
  }

  const proceedToCoinFlip = () => {
    if (blueCaptain && redCaptain) {
      setPhase('coin_flip')
      setShowCoinFlip(true)
      
      // Simulate coin flip after a delay
      setTimeout(() => {
        const result = Math.random() < 0.5 ? 'blue' : 'red'
        setCoinFlipResult(result)
        setCurrentPicker(result)
        
        setTimeout(() => {
          setShowCoinFlip(false)
          setPhase('drafting')
        }, 2000)
      }, 2000)
    }
  }

  const handlePlayerPick = (player: Player) => {
    if (currentPicker === 'blue') {
      setBlueTeam(prev => [...prev, player])
    } else {
      setRedTeam(prev => [...prev, player])
    }
    
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id))
    
    const nextIndex = currentPickIndex + 1
    if (nextIndex < pickOrder.length) {
      setCurrentPickIndex(nextIndex)
      setCurrentPicker(pickOrder[nextIndex])
    } else {
      setPhase('complete')
    }
  }

  const handleDraftComplete = async () => {
    if (blueCaptain && redCaptain) {
      await onComplete({
        blueTeam: { players: blueTeam },
        redTeam: { players: redTeam },
        blueCaptain,
        redCaptain,
      })
    }
  }

  const getCurrentPickNumber = () => {
    const blueCount = blueTeam.length
    const redCount = redTeam.length
    return blueCount + redCount
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-gold-500/30 rounded-lg p-6 max-w-4xl w-full mx-4 backdrop-blur-sm max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gold-400">Captain Draft</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </motion.button>
        </div>

        {/* Captain Selection Phase */}
        {phase === 'select_captains' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-2">Select Team Captains</h3>
              <p className="text-gray-400">Choose one captain for each team</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Blue Captain Selection */}
              <div className="border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-3 text-center">Blue Team Captain</h4>
                {blueCaptain ? (
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center">
                    <div className="text-blue-300 font-medium">{blueCaptain.name}</div>
                    <div className="text-sm text-gray-400">{blueCaptain.rank || 'Unranked'}</div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBlueCaptain(null)}
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                    >
                      Change Captain
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {players.filter(p => p.id !== redCaptain?.id).map(player => (
                      <motion.button
                        key={player.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCaptainSelection(player, 'blue')}
                        className="w-full p-2 text-left bg-blue-900/30 border border-blue-500/30 rounded hover:bg-blue-900/50 transition-colors"
                      >
                        <div className="text-blue-300">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.rank || 'Unranked'}</div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Red Captain Selection */}
              <div className="border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-300 font-semibold mb-3 text-center">Red Team Captain</h4>
                {redCaptain ? (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
                    <div className="text-red-300 font-medium">{redCaptain.name}</div>
                    <div className="text-sm text-gray-400">{redCaptain.rank || 'Unranked'}</div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRedCaptain(null)}
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                    >
                      Change Captain
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {players.filter(p => p.id !== blueCaptain?.id).map(player => (
                      <motion.button
                        key={player.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCaptainSelection(player, 'red')}
                        className="w-full p-2 text-left bg-red-900/30 border border-red-500/30 rounded hover:bg-red-900/50 transition-colors"
                      >
                        <div className="text-red-300">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.rank || 'Unranked'}</div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {blueCaptain && redCaptain && (
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={proceedToCoinFlip}
                  className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold rounded-lg hover:from-gold-500 hover:to-gold-400"
                >
                  Start Draft
                </motion.button>
              </div>
            )}
          </div>
        )}

        {/* Coin Flip Phase */}
        {phase === 'coin_flip' && (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gold-300 mb-6">Determining Pick Order...</h3>
            
            <AnimatePresence>
              {showCoinFlip && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotateY: 1080 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="inline-block w-24 h-24 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-2xl font-bold text-black mb-6"
                >
                  🪙
                </motion.div>
              )}
            </AnimatePresence>

            {coinFlipResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-semibold"
              >
                <span className={coinFlipResult === 'blue' ? 'text-blue-300' : 'text-red-300'}>
                  {coinFlipResult === 'blue' ? blueCaptain?.name : redCaptain?.name}
                </span>
                <span className="text-gold-300"> gets first pick!</span>
              </motion.div>
            )}
          </div>
        )}

        {/* Drafting Phase */}
        {phase === 'drafting' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-2">
                Pick #{getCurrentPickNumber()} - {' '}
                <span className={currentPicker === 'blue' ? 'text-blue-300' : 'text-red-300'}>
                  {currentPicker === 'blue' ? blueCaptain?.name : redCaptain?.name}
                </span>
                &apos;s turn
              </h3>
              <p className="text-gray-400">Select a player for your team</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Blue Team */}
              <div className="border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-3 text-center">Blue Team</h4>
                <div className="space-y-2">
                  {blueTeam.map((player, index) => (
                    <div key={player.id} className="bg-blue-500/20 border border-blue-500/50 rounded p-2 text-center">
                      <div className="text-blue-300 font-medium">
                        {player.name} {index === 0 && '👑'}
                      </div>
                      <div className="text-xs text-gray-400">{player.rank || 'Unranked'}</div>
                    </div>
                  ))}
                  {Array.from({ length: 5 - blueTeam.length }).map((_, index) => (
                    <div key={`empty-blue-${index}`} className="border border-blue-500/30 border-dashed rounded p-2 text-center text-gray-500">
                      Waiting...
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Players */}
              <div className="border border-gold-500/30 rounded-lg p-4">
                <h4 className="text-gold-300 font-semibold mb-3 text-center">Available Players</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availablePlayers.map(player => (
                    <motion.button
                      key={player.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePlayerPick(player)}
                      className="w-full p-2 text-left bg-gray-800/50 border border-gold-500/30 rounded hover:bg-gold-500/20 transition-colors"
                    >
                      <div className="text-white">{player.name}</div>
                      <div className="text-xs text-gray-400">
                        {player.preferredRole && `${player.preferredRole} • `}
                        {player.rank || 'Unranked'}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Red Team */}
              <div className="border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-300 font-semibold mb-3 text-center">Red Team</h4>
                <div className="space-y-2">
                  {redTeam.map((player, index) => (
                    <div key={player.id} className="bg-red-500/20 border border-red-500/50 rounded p-2 text-center">
                      <div className="text-red-300 font-medium">
                        {player.name} {index === 0 && '👑'}
                      </div>
                      <div className="text-xs text-gray-400">{player.rank || 'Unranked'}</div>
                    </div>
                  ))}
                  {Array.from({ length: 5 - redTeam.length }).map((_, index) => (
                    <div key={`empty-red-${index}`} className="border border-red-500/30 border-dashed rounded p-2 text-center text-gray-500">
                      Waiting...
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pick Order Visualization */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-400 mb-2">Pick Order:</div>
              <div className="flex justify-center gap-2">
                {pickOrder.map((team, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === currentPickIndex
                        ? team === 'blue'
                          ? 'bg-blue-500 text-white'
                          : 'bg-red-500 text-white'
                        : index < currentPickIndex
                        ? 'bg-gray-600 text-gray-300'
                        : team === 'blue'
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <div className="space-y-6 text-center">
            <h3 className="text-2xl font-bold text-gold-300 mb-6">Draft Complete!</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Final Blue Team */}
              <div className="border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-3 text-center">Blue Team</h4>
                <div className="space-y-2">
                  {blueTeam.map((player, index) => (
                    <div key={player.id} className="bg-blue-500/20 border border-blue-500/50 rounded p-2 text-center">
                      <div className="text-blue-300 font-medium">
                        {player.name} {index === 0 && '👑'}
                      </div>
                      <div className="text-xs text-gray-400">{player.rank || 'Unranked'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Red Team */}
              <div className="border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-300 font-semibold mb-3 text-center">Red Team</h4>
                <div className="space-y-2">
                  {redTeam.map((player, index) => (
                    <div key={player.id} className="bg-red-500/20 border border-red-500/50 rounded p-2 text-center">
                      <div className="text-red-300 font-medium">
                        {player.name} {index === 0 && '👑'}
                      </div>
                      <div className="text-xs text-gray-400">{player.rank || 'Unranked'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDraftComplete}
              className="px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-black font-semibold rounded-lg hover:from-gold-500 hover:to-gold-400"
            >
              Start Game with These Teams
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
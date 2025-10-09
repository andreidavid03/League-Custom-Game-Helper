'use client'

import { useState } from 'react'
import { Player } from '@/lib/api'
import { motion } from 'framer-motion'
import { Crown, Play, Trophy, RotateCcw } from 'lucide-react'
import CaptainDraft from '@/components/CaptainDraft'
import MatchCompletionModal from '@/components/MatchCompletionModal'

interface CaptainDraftPageProps {
  players: Player[]
}

export default function CaptainDraftPage({ players }: CaptainDraftPageProps) {
  const [showCaptainDraft, setShowCaptainDraft] = useState(false)
  const [currentTeams, setCurrentTeams] = useState<{
    blueTeam: { players: Player[] }
    redTeam: { players: Player[] }
    blueCaptain: Player
    redCaptain: Player
  } | null>(null)
  const [showMatchCompletion, setShowMatchCompletion] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null)

  const startCaptainDraft = () => {
    if (players.length < 10) {
      alert('You need exactly 10 players for captain draft!')
      return
    }
    setShowCaptainDraft(true)
  }

  const handleCaptainDraftComplete = async (teams: {
    blueTeam: { players: Player[] }
    redTeam: { players: Player[] }
    blueCaptain: Player
    redCaptain: Player
  }) => {
    try {
      // Create match in database
      const response = await fetch('http://localhost:3001/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameMode: 'CAPTAIN',
          blueTeam: teams.blueTeam,
          redTeam: teams.redTeam,
          blueCaptain: teams.blueCaptain,
          redCaptain: teams.redCaptain,
        })
      })

      if (response.ok) {
        const match = await response.json()
        setCurrentMatchId(match.id)
        setCurrentTeams(teams)
        setShowCaptainDraft(false)
      }
    } catch (error) {
      console.error('Failed to create captain draft match:', error)
      alert('Failed to create match. Please try again.')
    }
  }

  const handleStartGame = async () => {
    if (currentTeams && currentMatchId) {
      alert('Game started! Enjoy your match!')
    }
  }

  const handleCompleteGame = () => {
    if (!currentTeams) return
    
    if (!currentMatchId) {
      alert('Please start the game first by clicking the "Start Game" button before completing it.')
      return
    }
    
    setShowMatchCompletion(true)
  }

  const handleMatchComplete = async (data: { winner: 'BLUE' | 'RED'; duration?: number; notes?: string }) => {
    if (!currentMatchId) {
      throw new Error('No current match ID')
    }

    try {
      const response = await fetch(`http://localhost:3001/api/matches/${currentMatchId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        alert(`${data.winner} team wins! Match completed successfully.`)
        setShowMatchCompletion(false)
        resetTeams()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete match')
      }
    } catch (error) {
      console.error('Failed to complete match:', error)
      throw error // Re-throw to let MatchCompletionModal handle it
    }
  }

  const resetTeams = () => {
    setCurrentTeams(null)
    setCurrentMatchId(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Captain Draft Mode
            </h1>
            <p className="text-slate-400 text-lg">Let captains draft their dream teams turn by turn</p>
          </div>
        </div>
      </motion.div>

      {/* Player Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className={`text-center p-6 rounded-lg border-2 ${
          players.length === 10 
            ? 'border-green-500 bg-green-500/10' 
            : 'border-yellow-500 bg-yellow-500/10'
        }`}>
          <div className="text-2xl font-bold mb-2">
            {players.length === 10 ? '✓ Ready for Captain Draft!' : `${players.length}/10 Players`}
          </div>
          <div className="text-slate-300">
            {players.length === 10 
              ? 'All players are ready for captain selection and drafting'
              : players.length < 10 
                ? `Need ${10 - players.length} more players for captain draft`
                : `Remove ${players.length - 10} players for optimal draft`
            }
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
      >
        {currentTeams ? (
          /* Teams Display */
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">Draft Complete!</h2>
              <p className="text-slate-400">Teams have been drafted by their captains</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Blue Team */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-500/30 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  Blue Team
                </h3>
                <div className="space-y-3">
                  {currentTeams.blueTeam.players.map((player, i) => (
                    <div key={player.id} className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="font-medium text-blue-200">{player.name}</span>
                          {player.id === currentTeams.blueCaptain.id && (
                            <Crown className="w-4 h-4 text-yellow-400 ml-2" />
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                          {player.preferredRole || (['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][i])}
                        </span>
                      </div>
                      {player.rank && (
                        <div className="text-xs text-blue-400 mt-1">{player.rank}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Red Team */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-red-900/50 to-red-800/50 border border-red-500/30 rounded-lg p-6"
              >
                <h3 className="text-xl font-semibold text-red-300 mb-4 flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  Red Team
                </h3>
                <div className="space-y-3">
                  {currentTeams.redTeam.players.map((player, i) => (
                    <div key={player.id} className="bg-red-500/10 border border-red-500/20 rounded p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="font-medium text-red-200">{player.name}</span>
                          {player.id === currentTeams.redCaptain.id && (
                            <Crown className="w-4 h-4 text-yellow-400 ml-2" />
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                          {player.preferredRole || (['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][i])}
                        </span>
                      </div>
                      {player.rank && (
                        <div className="text-xs text-red-400 mt-1">{player.rank}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <button
                onClick={handleStartGame}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Start Game</span>
              </button>

              <button
                onClick={handleCompleteGame}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center space-x-2 text-black"
              >
                <Trophy className="w-5 h-5" />
                <span>Complete Game</span>
              </button>

              <button
                onClick={resetTeams}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>New Draft</span>
              </button>
            </motion.div>
          </div>
        ) : (
          /* Start Draft Interface */
          <div className="text-center py-12">
            {players.length === 10 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-8">
                  <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-white mb-2">Ready for Captain Draft</h2>
                  <p className="text-slate-400">Select captains and start the strategic team building</p>
                </div>
                
                <button
                  onClick={startCaptainDraft}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center space-x-3 mx-auto text-black"
                >
                  <Crown className="w-6 h-6" />
                  <span>Start Captain Draft</span>
                </button>

                <div className="mt-8 text-sm text-slate-400">
                  <p className="mb-2">How Captain Draft Works:</p>
                  <div className="space-y-1 text-xs">
                    <p>1. Select team captains from available players</p>
                    <p>2. Coin flip determines first pick</p>
                    <p>3. Captains alternate picking players (1-2-2-2-2-1 order)</p>
                    <p>4. Teams are finalized and ready to play</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-slate-400">
                <Crown className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">
                  {players.length < 10 ? 'Not Enough Players' : 'Too Many Players'}
                </h2>
                <p className="mb-4">
                  {players.length < 10 
                    ? `Add ${10 - players.length} more players for captain draft`
                    : `Remove ${players.length - 10} players for optimal draft`
                  }
                </p>
                <p className="text-sm">Navigate to the Players page to manage your roster</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Captain Draft Modal */}
      {showCaptainDraft && (
        <CaptainDraft
          players={players}
          onComplete={handleCaptainDraftComplete}
          onCancel={() => setShowCaptainDraft(false)}
        />
      )}

      {/* Match Completion Modal */}
      {showMatchCompletion && currentTeams && (
        <MatchCompletionModal
          isOpen={showMatchCompletion}
          onClose={() => setShowMatchCompletion(false)}
          blueTeam={currentTeams.blueTeam.players}
          redTeam={currentTeams.redTeam.players}
          onComplete={handleMatchComplete}
        />
      )}
    </div>
  )
}
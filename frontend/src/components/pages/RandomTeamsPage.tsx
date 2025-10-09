'use client'

import { useState } from 'react'
import { Player, Team, api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Shuffle, Play, RotateCcw, Trophy } from 'lucide-react'
import MatchCompletionModal from '@/components/MatchCompletionModal'

interface RandomTeamsPageProps {
  players: Player[]
}

export default function RandomTeamsPage({ players }: RandomTeamsPageProps) {
  const [currentTeams, setCurrentTeams] = useState<{ blueTeam: Team; redTeam: Team } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showMatchCompletion, setShowMatchCompletion] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null)

  const generateRandomTeams = async () => {
    if (players.length !== 10) {
      alert('Please add or remove players to have exactly 10 players for a 5v5 match.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await api.generateRandomTeams(players, true)
      if (response.success) {
        setCurrentTeams({
          blueTeam: response.data.blueTeam,
          redTeam: response.data.redTeam
        })
      }
    } catch (error) {
      console.error('Failed to generate teams:', error)
      alert('Failed to generate teams. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartGame = async () => {
    if (!currentTeams) return

    try {
      const response = await fetch('http://localhost:3001/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameMode: 'RANDOM',
          blueTeam: currentTeams.blueTeam,
          redTeam: currentTeams.redTeam,
        })
      })

      if (response.ok) {
        const match = await response.json()
        setCurrentMatchId(match.id)
        alert('Game started! Enjoy your match!')
      }
    } catch (error) {
      console.error('Failed to start game:', error)
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

    console.log('Starting handleMatchComplete with:', { data, currentMatchId })

    try {
      console.log('Making PATCH request to:', `http://localhost:3001/api/matches/${currentMatchId}/complete`)
      const response = await fetch(`http://localhost:3001/api/matches/${currentMatchId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      console.log('Response received:', { status: response.status, ok: response.ok })

      if (response.ok) {
        alert(`${data.winner} team wins! Match completed successfully.`)
        setShowMatchCompletion(false)
        resetTeams()
      } else {
        const errorData = await response.json()
        console.error('Server error:', errorData)
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
            <Shuffle className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Random Team Generator
            </h1>
            <p className="text-slate-400 text-lg">Automatically create balanced teams for fair matches</p>
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
            {players.length === 10 ? '✓ Ready to Generate Teams!' : `${players.length}/10 Players`}
          </div>
          <div className="text-slate-300">
            {players.length === 10 
              ? 'All players are ready for a 5v5 match'
              : players.length < 10 
                ? `Need ${10 - players.length} more players for a full match`
                : `Remove ${players.length - 10} players for optimal balance`
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
              <h2 className="text-2xl font-semibold text-white mb-2">Teams Generated!</h2>
              <p className="text-slate-400">
                {currentMatchId 
                  ? '🎮 Game started! You can now complete the match when finished.' 
                  : 'Review the teams and start your match'
                }
              </p>
              {currentMatchId && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ Match ID: {currentMatchId.slice(0, 8)}...
                </p>
              )}
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
                        <span className="font-medium text-blue-200">{player.name}</span>
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
                        <span className="font-medium text-red-200">{player.name}</span>
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
                onClick={generateRandomTeams}
                disabled={isGenerating || players.length !== 10}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center space-x-2"
              >
                <Shuffle className="w-5 h-5" />
                <span>{isGenerating ? 'Generating...' : 'Generate New Teams'}</span>
              </button>

              <button
                onClick={handleStartGame}
                disabled={!!currentMatchId}
                className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center space-x-2 ${
                  currentMatchId
                    ? 'bg-green-700 cursor-default opacity-75'
                    : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                }`}
              >
                <Play className="w-5 h-5" />
                <span>{currentMatchId ? 'Game Started ✓' : 'Start Game'}</span>
              </button>

              <button
                onClick={handleCompleteGame}
                disabled={!currentMatchId}
                className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center space-x-2 text-black ${
                  currentMatchId 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600' 
                    : 'bg-gray-500 cursor-not-allowed opacity-50'
                }`}
                title={!currentMatchId ? 'Start the game first' : 'Complete the match'}
              >
                <Trophy className="w-5 h-5" />
                <span>Complete Game</span>
              </button>

              <button
                onClick={resetTeams}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Clear Teams</span>
              </button>
            </motion.div>
          </div>
        ) : (
          /* Generate Teams Interface */
          <div className="text-center py-12">
            {players.length === 10 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-8">
                  <Shuffle className="w-24 h-24 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-white mb-2">Ready to Generate Teams</h2>
                  <p className="text-slate-400">Click the button below to create balanced teams</p>
                </div>
                
                <button
                  onClick={generateRandomTeams}
                  disabled={isGenerating}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center space-x-3 mx-auto"
                >
                  <Shuffle className="w-6 h-6" />
                  <span>{isGenerating ? 'Generating Teams...' : 'Generate Random Teams'}</span>
                </button>
              </motion.div>
            ) : (
              <div className="text-slate-400">
                <Shuffle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">
                  {players.length < 10 ? 'Not Enough Players' : 'Too Many Players'}
                </h2>
                <p className="mb-4">
                  {players.length < 10 
                    ? `Add ${10 - players.length} more players to generate teams`
                    : `Remove ${players.length - 10} players for optimal balance`
                  }
                </p>
                <p className="text-sm">Navigate to the Players page to manage your roster</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

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
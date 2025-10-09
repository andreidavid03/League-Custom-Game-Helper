'use client'

import { useState } from 'react'
import { Player, Team } from '@/lib/api'
import { motion } from 'framer-motion'
import { Target, Play, Trophy, RotateCcw } from 'lucide-react'
import DragWheelSpinner from '../DragWheelSpinner'
import SliderSelector from '../SliderSelector'
import MatchCompletionModal from '../MatchCompletionModal'

interface WheelSpinnerPageProps {
  players: Player[]
}

export default function WheelSpinnerPage({ players }: WheelSpinnerPageProps) {
  const [selectorType, setSelectorType] = useState<'wheel' | 'slider'>('wheel')
  const [currentTeams, setCurrentTeams] = useState<{ blueTeam: Team; redTeam: Team } | null>(null)
  const [showMatchCompletion, setShowMatchCompletion] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null)

  const handleWheelSpinComplete = (selectedPlayers: Player[]) => {
    console.log('Players selected via wheel:', selectedPlayers)
    // This callback is called when player selection phase is complete
    // The role assignment phase will handle the actual team creation
  }

  const handleAllRolesAssigned = async (playersWithRoles: { player: Player; role: string }[]) => {
    console.log('All roles assigned:', playersWithRoles)
    
    // Create teams from players with assigned roles
    const blueTeam: Team = {
      name: 'Blue Team',
      players: playersWithRoles.slice(0, Math.ceil(playersWithRoles.length / 2)).map(pr => ({
        ...pr.player,
        preferredRole: pr.role.toUpperCase() as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
      }))
    }
    
    const redTeam: Team = {
      name: 'Red Team', 
      players: playersWithRoles.slice(Math.ceil(playersWithRoles.length / 2)).map(pr => ({
        ...pr.player,
        preferredRole: pr.role.toUpperCase() as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
      }))
    }

    setCurrentTeams({ blueTeam, redTeam })
  }

  const handleStartGame = async () => {
    if (!currentTeams) return

    try {
      const response = await fetch('http://localhost:3001/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameMode: 'WHEEL',
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
            <Target className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Team Selector
            </h1>
            <p className="text-slate-400 text-lg">Interactive player selection with role assignment</p>
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
          players.length >= 10 
            ? 'border-green-500 bg-green-500/10' 
            : players.length > 0
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-red-500 bg-red-500/10'
        }`}>
          <div className="text-2xl font-bold mb-2">
            {players.length === 0 ? 'No Players Available' : `${players.length} Players in Pool`}
          </div>
          <div className="text-slate-300">
            {players.length === 0 
              ? 'Add players to start spinning the wheel'
              : players.length >= 10 
                ? 'Ready to spin for 10 lucky players!'
                : 'Spin to select from available players'
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
              <h2 className="text-2xl font-semibold text-white mb-2">Wheel Results!</h2>
              <p className="text-slate-400">The wheel has chosen these teams</p>
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
                  {currentTeams.blueTeam.players.map((player) => (
                    <div key={player.id} className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-200">{player.name}</span>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                          {player.preferredRole}
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
                  {currentTeams.redTeam.players.map((player) => (
                    <div key={player.id} className="bg-red-500/10 border border-red-500/20 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-200">{player.name}</span>
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                          {player.preferredRole}
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
                <span>Spin Again</span>
              </button>
            </motion.div>
          </div>
        ) : (
          /* Selection Interface */
          <div className="flex flex-col items-center">
            {players.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full"
              >
                {/* Tab Selector */}
                <div className="flex justify-center mb-8">
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-1 flex">
                    <button
                      onClick={() => setSelectorType('wheel')}
                      className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                        selectorType === 'wheel'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      🎯 Drag Wheel
                    </button>
                    <button
                      onClick={() => setSelectorType('slider')}
                      className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                        selectorType === 'slider'
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      🎰 CS:GO Slider
                    </button>
                  </div>
                </div>
                
                {selectorType === 'wheel' ? (
                  <DragWheelSpinner
                    players={players}
                    onSpinComplete={handleWheelSpinComplete}
                    onRoleAssignmentComplete={handleAllRolesAssigned}
                    spinCount={10}
                  />
                ) : (
                  <SliderSelector
                    players={players}
                    onSpinComplete={handleWheelSpinComplete}
                    onRoleAssignmentComplete={handleAllRolesAssigned}
                    spinCount={10}
                    gameMode="5v5"
                  />
                )}
              </motion.div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">No Players Available</h2>
                <p className="mb-4">Add players to start team selection</p>
                <p className="text-sm">Navigate to the Players page to add your roster</p>
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
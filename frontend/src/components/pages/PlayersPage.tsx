'use client'

import { Player } from '@/lib/api'
import PlayerManager from '@/components/PlayerManager'
import { motion } from 'framer-motion'
import { Users, UserPlus } from 'lucide-react'

interface PlayersPageProps {
  players: Player[]
  setPlayers: (players: Player[]) => void
}

export default function PlayersPage({ players, setPlayers }: PlayersPageProps) {
  // Players are loaded by parent component, no need to load here
  // This prevents duplicate API calls and infinite loops

  const handlePlayersChange = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers)
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Player Management
            </h1>
            <p className="text-slate-400 text-lg">Add, edit, and organize your gaming squad</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-500/30 rounded-lg p-6 text-center">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-3xl font-bold text-white">{players.length}</div>
          <div className="text-blue-300">Total Players</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 border border-green-500/30 rounded-lg p-6 text-center">
          <UserPlus className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-3xl font-bold text-white">{Math.floor(players.length / 10)}</div>
          <div className="text-green-300">Full Teams Possible</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-500/30 rounded-lg p-6 text-center">
          <div className="text-2xl mb-2">🎮</div>
          <div className="text-3xl font-bold text-white">{players.length >= 10 ? '✓' : '✗'}</div>
          <div className="text-purple-300">Ready for 5v5</div>
        </div>
      </motion.div>

      {/* Player Manager */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Player Roster</h2>
          <div className="text-sm text-slate-400">
            {players.length < 10 ? (
              <span className="text-yellow-400">Need {10 - players.length} more players for a full match</span>
            ) : players.length === 10 ? (
              <span className="text-green-400">Perfect! Ready for 5v5</span>
            ) : (
              <span className="text-blue-400">{players.length - 10} extra players available</span>
            )}
          </div>
        </div>
        
        <PlayerManager 
          players={players} 
          onPlayersChange={handlePlayersChange} 
        />
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-indigo-300 mb-4">💡 Quick Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-white font-medium">Set Preferred Roles</div>
              <div className="text-slate-400">Help the system create more balanced teams</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-white font-medium">Add Player Ranks</div>
              <div className="text-slate-400">Better team balancing with skill information</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-white font-medium">Minimum 10 Players</div>
              <div className="text-slate-400">Required for all game modes except wheel spinner</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-white font-medium">Bulk Import</div>
              <div className="text-slate-400">Use the bulk add feature for quick setup</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
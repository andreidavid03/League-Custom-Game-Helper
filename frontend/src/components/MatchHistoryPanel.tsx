'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Match {
  id: string
  gameMode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  winner: 'BLUE' | 'RED' | null
  duration: number | null
  notes: string | null
  opggScore: string | null // Added op.gg score field
  createdAt: string
  completedAt: string | null
  participants: Array<{
    id: string
    playerId: string
    team: 'BLUE' | 'RED'
    role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
    isCaptain: boolean
    playerName?: string
  }>
}

interface PlayerStats {
  id: string
  playerId: string
  playerName?: string
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  gamesAsTop: number
  gamesAsJungle: number
  gamesAsMid: number
  gamesAsAdc: number
  gamesAsSupport: number
  gamesAsCaptain: number
}

interface OverviewStats {
  totalMatches: number
  completedMatches: number
  gameModeCounts: Record<string, number>
  averageDuration: number
  winDistribution: { blue: number; red: number }
}

export default function MatchHistoryPanel() {
  const [matches, setMatches] = useState<Match[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'matches' | 'players' | 'overview'>('matches')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [editForm, setEditForm] = useState({ opggScore: '', notes: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch matches
      const matchesResponse = await fetch('http://localhost:3001/api/matches')
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData.matches || [])
      }

      // Fetch player statistics
      const statsResponse = await fetch('http://localhost:3001/api/matches/statistics')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setPlayerStats(statsData || [])
      }

      // Fetch overview statistics
      const overviewResponse = await fetch('http://localhost:3001/api/matches/statistics/overview')
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json()
        setOverviewStats(overviewData)
      }
    } catch (error) {
      console.error('Failed to fetch match history data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone and will update player statistics.')) {
      return
    }

    try {
      setDeletingMatchId(matchId)
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the match from local state
        setMatches(prev => prev.filter(match => match.id !== matchId))
        // Refresh stats to show updated player statistics
        await fetchData()
      } else {
        console.error('Failed to delete match')
        alert('Failed to delete match. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('Failed to delete match. Please try again.')
    } finally {
      setDeletingMatchId(null)
    }
  }

  const clearAllMatches = async () => {
    if (!confirm('Are you sure you want to delete ALL matches? This will reset all player statistics and cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/matches', {
        method: 'DELETE'
      })

      if (response.ok) {
        // Clear local state
        setMatches([])
        // Refresh all data to show reset statistics
        await fetchData()
        alert('All matches deleted and player statistics reset successfully!')
      } else {
        console.error('Failed to clear all matches')
        alert('Failed to clear all matches. Please try again.')
      }
    } catch (error) {
      console.error('Error clearing all matches:', error)
      alert('Failed to clear all matches. Please try again.')
    }
  }

  const openEditModal = (match: Match) => {
    setEditingMatch(match)
    setEditForm({
      opggScore: match.opggScore || '',
      notes: match.notes || ''
    })
  }

  const closeEditModal = () => {
    setEditingMatch(null)
    setEditForm({ opggScore: '', notes: '' })
  }

  const updateMatch = async () => {
    if (!editingMatch) return

    try {
      const response = await fetch(`http://localhost:3001/api/matches/${editingMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        // Update local state
        setMatches(prev => prev.map(match => 
          match.id === editingMatch.id 
            ? { ...match, ...editForm }
            : match
        ))
        closeEditModal()
      } else {
        alert('Failed to update match. Please try again.')
      }
    } catch (error) {
      console.error('Error updating match:', error)
      alert('Failed to update match. Please try again.')
    }
  }

  const exportPlayerHistory = async (playerId: string, format: 'json' | 'csv' = 'csv') => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches/export/${playerId}?format=${format}`)
      if (response.ok) {
        const playerName = playerStats.find(p => p.playerId === playerId)?.playerName || 'player'
        
        if (format === 'csv') {
          const csvContent = await response.text()
          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${playerName}_match_history.csv`
          a.click()
          window.URL.revokeObjectURL(url)
        } else {
          const jsonData = await response.json()
          const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${playerName}_match_history.json`
          a.click()
          window.URL.revokeObjectURL(url)
        }
      }
    } catch (error) {
      console.error('Failed to export player history:', error)
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    
    // If within last hour, show minutes
    if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes)
      if (minutes < 1) return 'Just now'
      return `${minutes} min${minutes !== 1 ? 's' : ''} ago`
    }
    
    // If within last 24 hours, show hours and minutes
    if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60)
      const mins = Math.floor(diffInMinutes % 60)
      if (mins === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`
      }
      return `${hours}h ${mins}m ago`
    }
    
    // If within last week, show day and time
    if (diffInMinutes < 7 * 24 * 60) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
    
    // Otherwise show full date and time
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-gold-500/30 rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gold-400">Loading match history...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-gold-500/30 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gold-400">Match History & Statistics</h2>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-blue-900/30 rounded-lg p-1">
        {(['matches', 'players', 'overview'] as const).map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-all ${
              selectedTab === tab
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      {/* Matches Tab */}
      {selectedTab === 'matches' && (
        <div className="space-y-4">
          {/* Matches Header with Clear All Button */}
          {matches.length > 0 && (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gold-300">Match History ({matches.length} matches)</h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearAllMatches}
                className="px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
              >
                🗑️ Clear All Matches
              </motion.button>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No matches played yet. Start a game to build your history!
            </div>
          ) : (
            matches.map((match) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      match.gameMode === 'RANDOM' ? 'bg-green-500/20 text-green-300' :
                      match.gameMode === 'CAPTAIN' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {match.gameMode}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300' :
                      match.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {match.status}
                    </span>
                    {match.winner && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        match.winner === 'BLUE' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {match.winner} VICTORY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-400">
                      {formatDate(match.createdAt)}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openEditModal(match)}
                      className="text-gold-400 hover:text-gold-300 p-1 rounded hover:bg-gold-500/20 transition-colors"
                      title="Edit match details"
                    >
                      ✏️
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteMatch(match.id)}
                      disabled={deletingMatchId === match.id}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      title="Delete match"
                    >
                      {deletingMatchId === match.id ? '⏳' : '🗑️'}
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  {/* Blue Team */}
                  <div className="border border-blue-500/30 rounded p-3">
                    <h4 className="font-semibold text-blue-300 mb-2">Blue Team</h4>
                    <div className="space-y-1">
                      {match.participants
                        .filter(p => p.team === 'BLUE')
                        .map(p => (
                          <div key={p.id} className="text-sm flex justify-between">
                            <span className={p.isCaptain ? 'text-gold-300 font-medium' : 'text-blue-200'}>
                              {p.playerName} {p.isCaptain && '👑'}
                            </span>
                            <span className="text-gray-400">{p.role}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Red Team */}
                  <div className="border border-red-500/30 rounded p-3">
                    <h4 className="font-semibold text-red-300 mb-2">Red Team</h4>
                    <div className="space-y-1">
                      {match.participants
                        .filter(p => p.team === 'RED')
                        .map(p => (
                          <div key={p.id} className="text-sm flex justify-between">
                            <span className={p.isCaptain ? 'text-gold-300 font-medium' : 'text-red-200'}>
                              {p.playerName} {p.isCaptain && '👑'}
                            </span>
                            <span className="text-gray-400">{p.role}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {(match.duration || match.notes || match.opggScore) && (
                  <div className="text-sm text-gray-400 space-y-1 pt-3 border-t border-gold-500/20">
                    {match.duration && <div>⏱️ Duration: {formatDuration(match.duration)}</div>}
                    {match.opggScore && (
                      <div className="flex items-center gap-2">
                        <span>🏆 OP.GG/Rank:</span>
                        <span className="text-gold-400 font-medium">{match.opggScore}</span>
                      </div>
                    )}
                    {match.notes && <div>📝 Notes: {match.notes}</div>}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Players Tab */}
      {selectedTab === 'players' && (
        <div className="space-y-4">
          {playerStats.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No player statistics available yet.
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gold-300">Player Statistics</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    className="bg-blue-900/30 border border-gold-500/30 rounded-lg px-3 py-1 text-white text-sm"
                  >
                    <option value="">Select player to export</option>
                    {playerStats.map(stat => (
                      <option key={stat.playerId} value={stat.playerId}>
                        {stat.playerName}
                      </option>
                    ))}
                  </select>
                  {selectedPlayer && (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => exportPlayerHistory(selectedPlayer, 'csv')}
                        className="px-3 py-1 bg-green-600/20 text-green-300 border border-green-500/30 rounded text-sm hover:bg-green-600/30"
                      >
                        Export CSV
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => exportPlayerHistory(selectedPlayer, 'json')}
                        className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded text-sm hover:bg-blue-600/30"
                      >
                        Export JSON
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {playerStats.map((stat) => (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gold-300">{stat.playerName}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{stat.winRate}%</div>
                        <div className="text-sm text-gray-400">Win Rate</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{stat.totalMatches}</div>
                        <div className="text-sm text-gray-400">Total Games</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">{stat.wins}</div>
                        <div className="text-sm text-gray-400">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-400">{stat.losses}</div>
                        <div className="text-sm text-gray-400">Losses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gold-400">{stat.gamesAsCaptain}</div>
                        <div className="text-sm text-gray-400">As Captain</div>
                      </div>
                    </div>

                    <div className="border-t border-gold-500/20 pt-3">
                      <div className="text-sm text-gray-400 mb-2">Role Distribution:</div>
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-white">{stat.gamesAsTop}</div>
                          <div className="text-gray-400">TOP</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-white">{stat.gamesAsJungle}</div>
                          <div className="text-gray-400">JGL</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-white">{stat.gamesAsMid}</div>
                          <div className="text-gray-400">MID</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-white">{stat.gamesAsAdc}</div>
                          <div className="text-gray-400">ADC</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-white">{stat.gamesAsSupport}</div>
                          <div className="text-gray-400">SUP</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {selectedTab === 'overview' && overviewStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{overviewStats.totalMatches}</div>
              <div className="text-sm text-gray-400">Total Matches</div>
            </div>
            <div className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{overviewStats.completedMatches}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gold-400">{overviewStats.averageDuration}m</div>
              <div className="text-sm text-gray-400">Avg Duration</div>
            </div>
            <div className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {overviewStats.winDistribution.blue + overviewStats.winDistribution.red}
              </div>
              <div className="text-sm text-gray-400">Total Wins</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game Mode Distribution */}
            <div className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gold-300 mb-4">Game Modes</h4>
              <div className="space-y-3">
                {Object.entries(overviewStats.gameModeCounts).map(([mode, count]) => (
                  <div key={mode} className="flex justify-between items-center">
                    <span className="text-white">{mode}</span>
                    <span className="text-gold-400 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Win Distribution */}
            <div className="bg-blue-900/30 border border-gold-500/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gold-300 mb-4">Team Wins</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-300">Blue Team</span>
                  <span className="text-blue-400 font-medium">{overviewStats.winDistribution.blue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-300">Red Team</span>
                  <span className="text-red-400 font-medium">{overviewStats.winDistribution.red}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-gold-500/30 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-gold-400 mb-4">Edit Match Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OP.GG Score / Rank
                </label>
                <input
                  type="text"
                  value={editForm.opggScore}
                  onChange={(e) => setEditForm(prev => ({ ...prev, opggScore: e.target.value }))}
                  placeholder="e.g., Gold II, Diamond IV, 1250 LP"
                  className="w-full px-3 py-2 bg-blue-900/30 border border-gold-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this match..."
                  rows={3}
                  className="w-full px-3 py-2 bg-blue-900/30 border border-gold-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={updateMatch}
                className="flex-1 px-4 py-2 bg-gold-600/20 text-gold-300 border border-gold-500/30 rounded-lg hover:bg-gold-600/30 transition-colors"
              >
                Save Changes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-300 border border-gray-500/30 rounded-lg hover:bg-gray-600/30 transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
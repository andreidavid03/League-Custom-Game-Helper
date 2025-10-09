'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Download, Eye } from 'lucide-react'

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
  updatedAt: string
}

interface MatchData {
  id: string
  gameMode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  status: 'COMPLETED'
  winner: 'BLUE' | 'RED'
  duration: number | null
  createdAt: string
  participants: Array<{
    playerId: string
    team: 'BLUE' | 'RED'
    role: string
    isCaptain: boolean
  }>
}

interface RecentMatch {
  id: string
  gameMode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  status: 'COMPLETED'
  winner: 'BLUE' | 'RED'
  duration: number | null
  createdAt: string
  playerTeam: 'BLUE' | 'RED'
  playerRole: string
  isWin: boolean
  isCaptain: boolean
}

export default function PlayerStatisticsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null)
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'winRate' | 'totalMatches' | 'wins'>('winRate')

  useEffect(() => {
    fetchPlayerStats()
  }, [])

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerMatches(selectedPlayer.playerId)
    }
  }, [selectedPlayer])

  const fetchPlayerStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/matches/statistics')
      if (response.ok) {
        const data = await response.json()
        setPlayerStats(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch player statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayerMatches = async (playerId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches?playerId=${playerId}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        // Transform matches to show player-specific info
        const playerMatches: RecentMatch[] = data.matches?.map((match: MatchData) => {
          const participant = match.participants.find((p) => p.playerId === playerId)
          return {
            id: match.id,
            gameMode: match.gameMode,
            status: match.status,
            winner: match.winner,
            duration: match.duration,
            createdAt: match.createdAt,
            playerTeam: participant?.team,
            playerRole: participant?.role,
            isWin: match.winner === participant?.team,
            isCaptain: participant?.isCaptain
          }
        }).filter((match: RecentMatch) => match.status === 'COMPLETED') || []
        
        setRecentMatches(playerMatches)
      }
    } catch (error) {
      console.error('Failed to fetch player matches:', error)
    }
  }

  const exportPlayerStats = (format: 'csv' | 'json' = 'csv') => {
    if (!selectedPlayer) return

    if (format === 'csv') {
      const csvHeaders = [
        'Player Name',
        'Total Matches',
        'Wins',
        'Losses',
        'Win Rate %',
        'Games as Top',
        'Games as Jungle',
        'Games as Mid',
        'Games as ADC',
        'Games as Support',
        'Games as Captain'
      ]
      
      const csvRow = [
        selectedPlayer.playerName || 'Unknown',
        selectedPlayer.totalMatches,
        selectedPlayer.wins,
        selectedPlayer.losses,
        selectedPlayer.winRate,
        selectedPlayer.gamesAsTop,
        selectedPlayer.gamesAsJungle,
        selectedPlayer.gamesAsMid,
        selectedPlayer.gamesAsAdc,
        selectedPlayer.gamesAsSupport,
        selectedPlayer.gamesAsCaptain
      ]
      
      const csvContent = [csvHeaders, csvRow]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedPlayer.playerName}_statistics.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const getRoleIcon = (role: string) => {
    const roleMap: Record<string, string> = {
      'TOP': '🛡️',
      'JUNGLE': '🌲',
      'MID': '⚡',
      'ADC': '🏹',
      'SUPPORT': '❤️'
    }
    return roleMap[role] || '❓'
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-400'
    if (winRate >= 60) return 'text-blue-400'
    if (winRate >= 50) return 'text-yellow-400'
    if (winRate >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const sortedStats = [...playerStats].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return b.winRate - a.winRate
      case 'totalMatches':
        return b.totalMatches - a.totalMatches
      case 'wins':
        return b.wins - a.wins
      default:
        return 0
    }
  })

  const getMostPlayedRole = (stats: PlayerStats) => {
    const roles = [
      { name: 'TOP', count: stats.gamesAsTop },
      { name: 'JUNGLE', count: stats.gamesAsJungle },
      { name: 'MID', count: stats.gamesAsMid },
      { name: 'ADC', count: stats.gamesAsAdc },
      { name: 'SUPPORT', count: stats.gamesAsSupport }
    ]
    return roles.reduce((max, role) => role.count > max.count ? role : max, roles[0])
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-slate-400">Loading player statistics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Player Statistics
            </h1>
            <p className="text-slate-400 text-lg">Detailed performance analytics for every player</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Player Rankings</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'winRate' | 'totalMatches' | 'wins')}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
              >
                <option value="winRate">Win Rate</option>
                <option value="totalMatches">Total Matches</option>
                <option value="wins">Total Wins</option>
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedStats.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No player statistics available yet.
                </div>
              ) : (
                sortedStats.map((stats, index) => (
                  <motion.div
                    key={stats.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedPlayer(stats)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedPlayer?.id === stats.id
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-slate-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-white truncate">
                          {stats.playerName || 'Unknown Player'}
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${getWinRateColor(stats.winRate)}`}>
                        {stats.winRate}%
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>{stats.totalMatches} games</span>
                      <span>{stats.wins}W / {stats.losses}L</span>
                    </div>
                    
                    <div className="flex items-center mt-2 text-xs">
                      <span className="text-slate-500">Main:</span>
                      <span className="ml-1 flex items-center">
                        {getRoleIcon(getMostPlayedRole(stats).name)}
                        <span className="ml-1 text-slate-400">{getMostPlayedRole(stats).name}</span>
                      </span>
                      {stats.gamesAsCaptain > 0 && (
                        <Crown className="w-3 h-3 text-yellow-400 ml-2" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Player Details */}
        <div className="lg:col-span-2">
          {selectedPlayer ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Player Header */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {selectedPlayer.playerName || 'Unknown Player'}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${getWinRateColor(selectedPlayer.winRate)}`}>
                        {selectedPlayer.winRate}% Win Rate
                      </div>
                      {selectedPlayer.gamesAsCaptain > 0 && (
                        <div className="flex items-center text-yellow-400">
                          <Crown className="w-5 h-5 mr-1" />
                          <span className="text-sm">Captain</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => exportPlayerStats('csv')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{selectedPlayer.totalMatches}</div>
                    <div className="text-sm text-slate-400">Total Games</div>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{selectedPlayer.wins}</div>
                    <div className="text-sm text-slate-400">Wins</div>
                  </div>
                  <div className="bg-red-900/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{selectedPlayer.losses}</div>
                    <div className="text-sm text-slate-400">Losses</div>
                  </div>
                  <div className="bg-yellow-900/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{selectedPlayer.gamesAsCaptain}</div>
                    <div className="text-sm text-slate-400">As Captain</div>
                  </div>
                </div>
              </div>

              {/* Role Distribution */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Role Distribution</h3>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { name: 'TOP', count: selectedPlayer.gamesAsTop, icon: '🛡️' },
                    { name: 'JUNGLE', count: selectedPlayer.gamesAsJungle, icon: '🌲' },
                    { name: 'MID', count: selectedPlayer.gamesAsMid, icon: '⚡' },
                    { name: 'ADC', count: selectedPlayer.gamesAsAdc, icon: '🏹' },
                    { name: 'SUPPORT', count: selectedPlayer.gamesAsSupport, icon: '❤️' }
                  ].map((role) => {
                    const percentage = selectedPlayer.totalMatches > 0 
                      ? Math.round((role.count / selectedPlayer.totalMatches) * 100)
                      : 0
                    
                    return (
                      <div key={role.name} className="text-center">
                        <div className="text-2xl mb-2">{role.icon}</div>
                        <div className="text-lg font-bold text-white">{role.count}</div>
                        <div className="text-sm text-slate-400">{role.name}</div>
                        <div className="text-xs text-slate-500">{percentage}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Matches */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Recent Matches</h3>
                <div className="space-y-3">
                  {recentMatches.length === 0 ? (
                    <div className="text-center text-slate-400 py-4">
                      No recent matches found.
                    </div>
                  ) : (
                    recentMatches.slice(0, 5).map((match) => (
                      <div
                        key={match.id}
                        className={`p-3 rounded-lg border ${
                          match.isWin 
                            ? 'border-green-500/30 bg-green-500/10' 
                            : 'border-red-500/30 bg-red-500/10'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              match.isWin ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {match.isWin ? 'WIN' : 'LOSS'}
                            </div>
                            <span className="text-sm text-slate-300">{match.gameMode}</span>
                            <div className="flex items-center text-sm text-slate-400">
                              {getRoleIcon(match.playerRole)}
                              <span className="ml-1">{match.playerRole}</span>
                              {match.isCaptain && <Crown className="w-3 h-3 text-yellow-400 ml-1" />}
                            </div>
                          </div>
                          <div className="text-sm text-slate-400">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
              <Eye className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Player</h3>
              <p className="text-slate-400">Choose a player from the list to view detailed statistics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
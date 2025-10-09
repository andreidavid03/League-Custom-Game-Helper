'use client'

import { useState } from 'react'
import { User, Plus, X, Edit3, Save, UserX, Upload, Download } from 'lucide-react'
import { Player, api } from '@/lib/api'

interface PlayerManagerProps {
  players: Player[]
  onPlayersChange: (players: Player[]) => void
}

export default function PlayerManager({ players, onPlayersChange }: PlayerManagerProps) {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    preferredRole: undefined as Player['preferredRole'],
    rank: ''
  })
  const [editData, setEditData] = useState({
    name: '',
    preferredRole: undefined as Player['preferredRole'],
    rank: ''
  })
  const [bulkImportText, setBulkImportText] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)

  const roles: Array<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'> = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

  // Players are loaded by parent component, no need to load here
  // useEffect removed to prevent infinite API calls

  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim()) return

    try {
      const playerData = {
        name: newPlayer.name.trim(),
        preferredRole: newPlayer.preferredRole || undefined,
        rank: newPlayer.rank.trim() || undefined,
        isActive: true
      }

      const response = await api.addPlayer(playerData)
      if (response.success) {
        onPlayersChange([...players, response.data])
        setNewPlayer({ name: '', preferredRole: undefined, rank: '' })
        setIsAddingPlayer(false)
      }
    } catch (error) {
      console.error('Failed to add player:', error)
      alert('Failed to add player. Please try again.')
    }
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player.id)
    setEditData({
      name: player.name,
      preferredRole: player.preferredRole,
      rank: player.rank || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingPlayer || !editData.name.trim()) return

    try {
      const updates = {
        name: editData.name.trim(),
        preferredRole: editData.preferredRole || undefined,
        rank: editData.rank.trim() || undefined
      }

      const response = await api.updatePlayer(editingPlayer, updates)
      if (response.success) {
        const updatedPlayers = players.map(p => 
          p.id === editingPlayer ? response.data : p
        )
        onPlayersChange(updatedPlayers)
        setEditingPlayer(null)
      }
    } catch (error) {
      console.error('Failed to update player:', error)
      alert('Failed to update player. Please try again.')
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player?')) return

    try {
      const response = await api.deletePlayer(playerId)
      if (response.success) {
        const updatedPlayers = players.filter(p => p.id !== playerId)
        onPlayersChange(updatedPlayers)
      }
    } catch (error) {
      console.error('Failed to delete player:', error)
      alert('Failed to remove player. Please try again.')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove ALL players? This cannot be undone.')) return

    try {
      const response = await api.clearAllPlayers()
      if (response.success) {
        onPlayersChange([])
      }
    } catch (error) {
      console.error('Failed to clear players:', error)
      alert('Failed to clear players. Please try again.')
    }
  }

  const handleBulkImport = async () => {
    const lines = bulkImportText.trim().split('\n').filter(line => line.trim())
    if (lines.length === 0) return

    try {
      const newPlayers = lines.map(line => {
        const parts = line.split(',').map(part => part.trim())
        return {
          name: parts[0],
          preferredRole: (roles.includes(parts[1] as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT') ? parts[1] : undefined) as Player['preferredRole'],
          rank: parts[2] || undefined,
          isActive: true
        }
      }).filter(p => p.name)

      const response = await api.addPlayersInBulk(newPlayers)
      if (response.success) {
        onPlayersChange([...players, ...response.data])
        setBulkImportText('')
        setShowBulkImport(false)
        if (response.skipped > 0) {
          alert(`Added ${response.data.length} players. ${response.skipped} duplicates were skipped.`)
        }
      }
    } catch (error) {
      console.error('Failed to import players:', error)
      alert('Failed to import players. Please check the format and try again.')
    }
  }

  const handleCsvFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      const newPlayers = lines.map(line => {
        const parts = line.split(',').map(part => part.trim())
        return {
          name: parts[0],
          preferredRole: (roles.includes(parts[1] as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT') ? parts[1] : undefined) as Player['preferredRole'],
          rank: parts[2] || undefined,
          isActive: true
        }
      }).filter(p => p.name)

      const response = await api.addPlayersInBulk(newPlayers)
      if (response.success) {
        onPlayersChange([...players, ...response.data])
        event.target.value = '' // Reset file input
        if (response.skipped > 0) {
          alert(`Added ${response.data.length} players from CSV. ${response.skipped} duplicates were skipped.`)
        } else {
          alert(`Successfully imported ${response.data.length} players from CSV!`)
        }
      }
    } catch (error) {
      console.error('Failed to import CSV:', error)
      alert('Failed to import CSV file. Please check the format and try again.')
    }
  }

  const handleExportPlayers = () => {
    const exportData = players.map(p => 
      [p.name, p.preferredRole || '', p.rank || ''].join(',')
    ).join('\n')
    
    const blob = new Blob([exportData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lol-players.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRoleColor = (role?: string) => {
    const colors = {
      'TOP': 'bg-blue-500',
      'JUNGLE': 'bg-green-500', 
      'MID': 'bg-yellow-500',
      'ADC': 'bg-red-500',
      'SUPPORT': 'bg-purple-500'
    }
    return colors[role as keyof typeof colors] || 'bg-slate-500'
  }

  const getRoleShort = (role?: string) => {
    const shorts = {
      'TOP': 'TOP',
      'JUNGLE': 'JG',
      'MID': 'MID', 
      'ADC': 'ADC',
      'SUPPORT': 'SUP'
    }
    return shorts[role as keyof typeof shorts] || role
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <User className="w-5 h-5 mr-2" />
          Players ({players.length})
        </h3>
        <button
          onClick={() => setIsAddingPlayer(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Player</span>
        </button>
      </div>

      {/* Add Player Form */}
      {isAddingPlayer && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Player name"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
            />
            <select
              value={newPlayer.preferredRole}
              onChange={(e) => setNewPlayer({ ...newPlayer, preferredRole: e.target.value as Player['preferredRole'] })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">No role preference</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Rank (optional)"
              value={newPlayer.rank}
              onChange={(e) => setNewPlayer({ ...newPlayer, rank: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayer.name.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
            >
              Add Player
            </button>
            <button
              onClick={() => {
                setIsAddingPlayer(false)
                setNewPlayer({ name: '', preferredRole: undefined, rank: '' })
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {players.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No players added yet</p>
            <p className="text-sm">Add players to start organizing games!</p>
          </div>
        ) : (
          players.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors">
              {editingPlayer === player.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={editData.preferredRole}
                    onChange={(e) => setEditData({ ...editData, preferredRole: e.target.value as Player['preferredRole'] })}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No role</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editData.rank}
                    onChange={(e) => setEditData({ ...editData, rank: e.target.value })}
                    placeholder="Rank"
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    {player.rank && (
                      <div className="text-xs text-slate-400">{player.rank}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {editingPlayer === player.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="text-green-400 hover:text-green-300 p-1"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingPlayer(null)}
                      className="text-slate-400 hover:text-slate-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {player.preferredRole && (
                      <span className={`text-xs text-white px-2 py-1 rounded ${getRoleColor(player.preferredRole)}`}>
                        {getRoleShort(player.preferredRole)}
                      </span>
                    )}
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 p-3 bg-slate-900/30 rounded-lg">
        <div className="text-sm text-slate-400 mb-2">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearAll}
            disabled={players.length === 0}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded text-xs transition-colors flex items-center space-x-1"
          >
            <UserX className="w-3 h-3" />
            <span>Clear All</span>
          </button>
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors flex items-center space-x-1"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>
          <label className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors flex items-center space-x-1 cursor-pointer">
            <Upload className="w-3 h-3" />
            <span>CSV</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportPlayers}
            disabled={players.length === 0}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed rounded text-xs transition-colors flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Bulk Import */}
      {showBulkImport && (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
          <div className="mb-2">
            <div className="text-sm font-medium mb-1">Bulk Import Players</div>
            <div className="text-xs text-slate-400 mb-2">
              Format: Name, Role (optional), Rank (optional) - one per line
              <br />
              Example: John Doe, TOP, Gold II
            </div>
          </div>
          <textarea
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder="Player Name 1, TOP, Gold II&#10;Player Name 2, JUNGLE&#10;Player Name 3"
            className="w-full h-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleBulkImport}
              disabled={!bulkImportText.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
            >
              Import Players
            </button>
            <button
              onClick={() => {
                setShowBulkImport(false)
                setBulkImportText('')
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
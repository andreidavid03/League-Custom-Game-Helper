import { Hono } from 'hono'
import { z } from 'zod'

const matchHistoryRouter = new Hono()

// Types for match history
interface Player {
  id: string
  name: string
  role?: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
}

interface Team {
  name: string
  players: Player[]
  captain?: Player
}

interface MatchRecord {
  id: string
  gameId: string
  mode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  blueTeam: Team
  redTeam: Team
  winner?: 'BLUE' | 'RED'
  duration?: number // in seconds
  notes?: string
  createdAt: Date
  completedAt?: Date
}

interface PlayerStats {
  playerId: string
  playerName: string
  totalGames: number
  wins: number
  losses: number
  winRate: number
  favoriteRole?: string
  gamesPerRole: Record<string, number>
  teammateFrequency: Record<string, number>
}

// In-memory storage
let matchHistory: MatchRecord[] = []

// Validation schemas
const completeMatchSchema = z.object({
  gameId: z.string(),
  winner: z.enum(['BLUE', 'RED']),
  duration: z.number().optional(),
  notes: z.string().optional()
})

// Get all match history
matchHistoryRouter.get('/', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const mode = c.req.query('mode')
  
  let filtered = matchHistory
  
  if (mode) {
    filtered = matchHistory.filter(match => match.mode === mode.toUpperCase())
  }
  
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  
  const paginatedMatches = filtered
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(startIndex, endIndex)
  
  return c.json({
    success: true,
    data: {
      matches: paginatedMatches,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit)
      }
    }
  })
})

// Get match by ID
matchHistoryRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  const match = matchHistory.find(m => m.id === id)
  
  if (!match) {
    return c.json({ error: 'Match not found' }, 404)
  }
  
  return c.json({
    success: true,
    data: match
  })
})

// Record match result
matchHistoryRouter.post('/:gameId/complete', async (c) => {
  try {
    const gameId = c.req.param('gameId')
    const body = await c.req.json()
    
    // Validate input
    const validatedData = completeMatchSchema.parse(body)
    
    // Find existing match or create new one
    let match = matchHistory.find(m => m.gameId === gameId)
    
    if (match) {
      // Update existing match
      match.winner = validatedData.winner
      if (validatedData.duration !== undefined) {
        match.duration = validatedData.duration
      }
      if (validatedData.notes !== undefined) {
        match.notes = validatedData.notes
      }
      match.completedAt = new Date()
    } else {
      return c.json({ error: 'Game not found in history' }, 404)
    }
    
    return c.json({
      success: true,
      data: match,
      message: 'Match result recorded successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Add game to match history
matchHistoryRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { gameId, mode, blueTeam, redTeam } = body
    
    if (!gameId || !mode || !blueTeam || !redTeam) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    const matchRecord: MatchRecord = {
      id: crypto.randomUUID(),
      gameId,
      mode,
      blueTeam,
      redTeam,
      createdAt: new Date()
    }
    
    matchHistory.push(matchRecord)
    
    return c.json({
      success: true,
      data: matchRecord,
      message: 'Match added to history'
    })
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get player statistics
matchHistoryRouter.get('/stats/players', (c) => {
  const playerStatsMap = new Map<string, PlayerStats>()
  
  // Calculate stats for each player
  matchHistory.forEach(match => {
    const allPlayers = [...match.blueTeam.players, ...match.redTeam.players]
    
    allPlayers.forEach(player => {
      if (!playerStatsMap.has(player.id)) {
        playerStatsMap.set(player.id, {
          playerId: player.id,
          playerName: player.name,
          totalGames: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          gamesPerRole: {},
          teammateFrequency: {}
        })
      }
      
      const stats = playerStatsMap.get(player.id)!
      stats.totalGames++
      
      // Count role frequency
      if (player.role) {
        stats.gamesPerRole[player.role] = (stats.gamesPerRole[player.role] || 0) + 1
      }
      
      // Count wins/losses if match is completed
      if (match.winner) {
        const isBlueTeam = match.blueTeam.players.some(p => p.id === player.id)
        const won = (isBlueTeam && match.winner === 'BLUE') || 
                   (!isBlueTeam && match.winner === 'RED')
        
        if (won) {
          stats.wins++
        } else {
          stats.losses++
        }
      }
      
      // Count teammate frequency
      allPlayers.forEach(teammate => {
        if (teammate.id !== player.id) {
          stats.teammateFrequency[teammate.name] = 
            (stats.teammateFrequency[teammate.name] || 0) + 1
        }
      })
    })
  })
  
  // Calculate win rates and favorite roles
  const playerStats = Array.from(playerStatsMap.values()).map(stats => {
    stats.winRate = stats.totalGames > 0 ? 
      Math.round((stats.wins / (stats.wins + stats.losses)) * 100) : 0
    
    // Find favorite role
    const roleEntries = Object.entries(stats.gamesPerRole)
    if (roleEntries.length > 0) {
      stats.favoriteRole = roleEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
    }
    
    return stats
  })
  
  return c.json({
    success: true,
    data: playerStats.sort((a, b) => b.totalGames - a.totalGames)
  })
})

// Get overall statistics
matchHistoryRouter.get('/stats/overview', (c) => {
  const totalMatches = matchHistory.length
  const completedMatches = matchHistory.filter(m => m.winner).length
  const gameModeCounts = matchHistory.reduce((acc, match) => {
    acc[match.mode] = (acc[match.mode] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const averageDuration = matchHistory
    .filter(m => m.duration)
    .reduce((sum, match) => sum + (match.duration || 0), 0) / 
    matchHistory.filter(m => m.duration).length || 0
  
  return c.json({
    success: true,
    data: {
      totalMatches,
      completedMatches,
      gameModeCounts,
      averageDuration: Math.round(averageDuration),
      winDistribution: {
        blue: matchHistory.filter(m => m.winner === 'BLUE').length,
        red: matchHistory.filter(m => m.winner === 'RED').length
      }
    }
  })
})

// Delete match from history
matchHistoryRouter.delete('/:id', (c) => {
  const id = c.req.param('id')
  const index = matchHistory.findIndex(m => m.id === id)
  
  if (index === -1) {
    return c.json({ error: 'Match not found' }, 404)
  }
  
  const deletedMatch = matchHistory.splice(index, 1)[0]
  
  return c.json({
    success: true,
    data: deletedMatch,
    message: 'Match deleted successfully'
  })
})

// Clear all match history
matchHistoryRouter.delete('/', (c) => {
  const count = matchHistory.length
  matchHistory = []
  
  return c.json({
    success: true,
    message: `${count} matches cleared successfully`
  })
})

export default matchHistoryRouter
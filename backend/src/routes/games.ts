import { Hono } from 'hono'
import { z } from 'zod'

const gamesRouter = new Hono()

// Types for game data
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

interface GameResult {
  id: string
  mode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  blueTeam: Team
  redTeam: Team
  createdAt: Date
}

// In-memory storage
let gameResults: GameResult[] = []

// Generate random teams
gamesRouter.post('/random', async (c) => {
  const body = await c.req.json()
  const { players, assignRoles = false } = body
  
  if (!players || !Array.isArray(players) || players.length !== 10) {
    return c.json({ error: 'Exactly 10 players required' }, 400)
  }
  
  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  
  const roles: Array<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'> = 
    ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
  
  const blueTeam: Team = {
    name: 'Blue Team',
    players: shuffled.slice(0, 5).map((player, index) => ({
      ...player,
      role: assignRoles ? roles[index] : undefined
    }))
  }
  
  const redTeam: Team = {
    name: 'Red Team', 
    players: shuffled.slice(5, 10).map((player, index) => ({
      ...player,
      role: assignRoles ? roles[index] : undefined
    }))
  }
  
  const gameResult: GameResult = {
    id: crypto.randomUUID(),
    mode: 'RANDOM',
    blueTeam,
    redTeam,
    createdAt: new Date()
  }
  
  gameResults.push(gameResult)
  
  return c.json({
    success: true,
    data: gameResult,
    message: 'Random teams generated successfully'
  })
})

// Captain draft mode
gamesRouter.post('/captain', async (c) => {
  const body = await c.req.json()
  const { players, blueCaptain, redCaptain, teamAssignments } = body
  
  if (!players || !blueCaptain || !redCaptain) {
    return c.json({ error: 'Players and captains required' }, 400)
  }
  
  const blueTeam: Team = {
    name: 'Blue Team',
    captain: blueCaptain,
    players: [blueCaptain, ...teamAssignments.blue]
  }
  
  const redTeam: Team = {
    name: 'Red Team',
    captain: redCaptain,
    players: [redCaptain, ...teamAssignments.red]
  }
  
  const gameResult: GameResult = {
    id: crypto.randomUUID(),
    mode: 'CAPTAIN',
    blueTeam,
    redTeam,
    createdAt: new Date()
  }
  
  gameResults.push(gameResult)
  
  return c.json({
    success: true,
    data: gameResult,
    message: 'Captain draft completed successfully'
  })
})

// Wheel mode
gamesRouter.post('/wheel', async (c) => {
  const body = await c.req.json()
  const { players, wheelResults } = body
  
  if (!players || !wheelResults) {
    return c.json({ error: 'Players and wheel results required' }, 400)
  }
  
  const gameResult: GameResult = {
    id: crypto.randomUUID(),
    mode: 'WHEEL',
    blueTeam: wheelResults.blueTeam,
    redTeam: wheelResults.redTeam,
    createdAt: new Date()
  }
  
  gameResults.push(gameResult)
  
  return c.json({
    success: true,
    data: gameResult,
    message: 'Wheel teams created successfully'
  })
})

// Get all game results
gamesRouter.get('/', (c) => {
  return c.json({
    success: true,
    data: gameResults.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    count: gameResults.length
  })
})

// Get game by ID
gamesRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  const game = gameResults.find(g => g.id === id)
  
  if (!game) {
    return c.json({ error: 'Game not found' }, 404)
  }
  
  return c.json({
    success: true,
    data: game
  })
})

// Clear game history
gamesRouter.delete('/', (c) => {
  const count = gameResults.length
  gameResults = []
  
  return c.json({
    success: true,
    message: `${count} games cleared successfully`
  })
})

export default gamesRouter
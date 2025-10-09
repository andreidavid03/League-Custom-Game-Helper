import { Hono } from 'hono'
import { z } from 'zod'
import { dbService } from '../db/service.js'

const playersRouter = new Hono()

// Validation schemas
const playerSchema = z.object({
  name: z.string().min(1).max(50),
  preferredRole: z.enum(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']).optional(),
  rank: z.string().optional(),
  isActive: z.boolean().optional(),
})

const playersArraySchema = z.array(playerSchema)

// Get all players
playersRouter.get('/', async (c) => {
  try {
    const includeInactive = c.req.query('includeInactive') === 'true'
    const players = includeInactive ? await dbService.getAllPlayers() : await dbService.getPlayers()
    return c.json({
      success: true,
      data: players,
      count: players.length
    })
  } catch (error) {
    console.error('Error fetching players:', error)
    return c.json({ error: 'Failed to fetch players' }, 500)
  }
})

// Get inactive players only
playersRouter.get('/inactive', async (c) => {
  try {
    const players = await dbService.getInactivePlayers()
    return c.json({
      success: true,
      data: players,
      count: players.length
    })
  } catch (error) {
    console.error('Error fetching inactive players:', error)
    return c.json({ error: 'Failed to fetch inactive players' }, 500)
  }
})

// Add single player
playersRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const playerData = playerSchema.parse(body)
    
    // Check if player already exists
    const existingPlayers = await dbService.getPlayers()
    const existingPlayer = existingPlayers.find(p => p.name.toLowerCase() === playerData.name.toLowerCase())
    if (existingPlayer) {
      return c.json({ error: 'Player already exists' }, 400)
    }
    
    // Create database player data with proper typing
    const dbPlayerData: { name: string; preferredRole?: string; rank?: string; isActive?: boolean } = {
      name: playerData.name
    }
    
    if (playerData.preferredRole) {
      dbPlayerData.preferredRole = playerData.preferredRole
    }
    
    if (playerData.rank) {
      dbPlayerData.rank = playerData.rank
    }
    
    if (playerData.isActive !== undefined) {
      dbPlayerData.isActive = playerData.isActive
    }
    
    const newPlayer = await dbService.createPlayer(dbPlayerData)
    
    return c.json({
      success: true,
      data: newPlayer,
      message: 'Player added successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating player:', error)
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    return c.json({ error: 'Failed to create player' }, 500)
  }
})

// Add multiple players
playersRouter.post('/bulk', async (c) => {
  try {
    const body = await c.req.json()
    const playersData = playersArraySchema.parse(body)
    
    const existingPlayers = await dbService.getPlayers()
    const newPlayers = []
    let skipped = 0
    
    for (const playerData of playersData) {
      const existingPlayer = existingPlayers.find(p => p.name.toLowerCase() === playerData.name.toLowerCase())
      if (!existingPlayer) {
        const dbPlayerData: { name: string; preferredRole?: string; rank?: string; isActive?: boolean } = {
          name: playerData.name
        }
        
        if (playerData.preferredRole) {
          dbPlayerData.preferredRole = playerData.preferredRole
        }
        
        if (playerData.rank) {
          dbPlayerData.rank = playerData.rank
        }
        
        if (playerData.isActive !== undefined) {
          dbPlayerData.isActive = playerData.isActive
        }
        
        const newPlayer = await dbService.createPlayer(dbPlayerData)
        newPlayers.push(newPlayer)
      } else {
        skipped++
      }
    }
    
    return c.json({
      success: true,
      data: newPlayers,
      message: `${newPlayers.length} players added successfully`,
      skipped: skipped
    }, 201)
  } catch (error) {
    console.error('Error creating players:', error)
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    return c.json({ error: 'Failed to create players' }, 500)
  }
})

// Update player
playersRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const updateData = playerSchema.partial().parse(body)
    
    // Check if player exists
    const existingPlayer = await dbService.getPlayerById(id)
    if (!existingPlayer) {
      return c.json({ error: 'Player not found' }, 404)
    }
    
    // Create database update data with proper typing
    const dbUpdateData: { name?: string; preferredRole?: string; rank?: string; isActive?: boolean } = {}
    
    if (updateData.name !== undefined) {
      dbUpdateData.name = updateData.name
    }
    
    if (updateData.preferredRole !== undefined) {
      dbUpdateData.preferredRole = updateData.preferredRole
    }
    
    if (updateData.rank !== undefined) {
      dbUpdateData.rank = updateData.rank
    }
    
    if (updateData.isActive !== undefined) {
      dbUpdateData.isActive = updateData.isActive
    }
    
    const updatedPlayer = await dbService.updatePlayer(id, dbUpdateData)
    
    return c.json({
      success: true,
      data: updatedPlayer,
      message: 'Player updated successfully'
    })
  } catch (error) {
    console.error('Error updating player:', error)
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, 400)
    }
    return c.json({ error: 'Failed to update player' }, 500)
  }
})

// Delete player
playersRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if player exists
    const existingPlayer = await dbService.getPlayerById(id)
    if (!existingPlayer) {
      return c.json({ error: 'Player not found' }, 404)
    }
    
    await dbService.deletePlayer(id)
    
    return c.json({
      success: true,
      data: existingPlayer,
      message: 'Player deactivated successfully (match history preserved)'
    })
  } catch (error) {
    console.error('Error deactivating player:', error)
    return c.json({ error: 'Failed to deactivate player' }, 500)
  }
})

// Reactivate player
playersRouter.patch('/:id/reactivate', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if player exists
    const existingPlayer = await dbService.getPlayerById(id)
    if (!existingPlayer) {
      return c.json({ error: 'Player not found' }, 404)
    }
    
    const reactivatedPlayer = await dbService.reactivatePlayer(id)
    
    return c.json({
      success: true,
      data: reactivatedPlayer,
      message: 'Player reactivated successfully'
    })
  } catch (error) {
    console.error('Error reactivating player:', error)
    return c.json({ error: 'Failed to reactivate player' }, 500)
  }
})

// Clear all players
playersRouter.delete('/', async (c) => {
  try {
    const players = await dbService.getPlayers()
    const count = players.length
    
    // Delete all players
    for (const player of players) {
      await dbService.deletePlayer(player.id)
    }
    
    return c.json({
      success: true,
      message: `${count} players cleared successfully`
    })
  } catch (error) {
    console.error('Error clearing players:', error)
    return c.json({ error: 'Failed to clear players' }, 500)
  }
})

export default playersRouter
import { Hono } from 'hono'
import { dbService } from '../db/service.js'

const app = new Hono()

// Get all matches with pagination
app.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = parseInt(c.req.query('offset') || '0')
    
    const result = await dbService.getMatches(limit, offset)
    return c.json(result)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return c.json({ error: 'Failed to fetch matches' }, 500)
  }
})

// Create a new match
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { gameMode, blueTeam, redTeam, blueCaptain, redCaptain } = body

    const match = await dbService.createMatch({
      gameMode,
      blueTeam,
      redTeam,
      blueCaptain,
      redCaptain,
    })

    return c.json(match, 201)
  } catch (error) {
    console.error('Error creating match:', error)
    return c.json({ error: 'Failed to create match' }, 500)
  }
})

// Complete a match and update player stats
app.patch('/:id/complete', async (c) => {
  try {
    const matchId = c.req.param('id')
    const body = await c.req.json()
    const { winner, duration, notes } = body

    if (!winner || !['BLUE', 'RED'].includes(winner)) {
      return c.json({ error: 'Invalid winner. Must be BLUE or RED' }, 400)
    }

    const match = await dbService.completeMatch(matchId, {
      winner,
      duration,
      notes,
    })

    return c.json(match)
  } catch (error) {
    console.error('Error completing match:', error)
    return c.json({ error: 'Failed to complete match' }, 500)
  }
})

// Get player statistics
app.get('/statistics', async (c) => {
  try {
    const playerId = c.req.query('playerId')
    const statistics = await dbService.getPlayerStatistics(playerId)
    return c.json(statistics)
  } catch (error) {
    console.error('Error fetching player statistics:', error)
    return c.json({ error: 'Failed to fetch player statistics' }, 500)
  }
})

// Get overview statistics
app.get('/statistics/overview', async (c) => {
  try {
    const overview = await dbService.getOverviewStatistics()
    return c.json(overview)
  } catch (error) {
    console.error('Error fetching overview statistics:', error)
    return c.json({ error: 'Failed to fetch overview statistics' }, 500)
  }
})

// Update match details (PATCH)
app.patch('/:id', async (c) => {
  try {
    const matchId = c.req.param('id')
    const body = await c.req.json()
    
    const updatedMatch = await dbService.updateMatch(matchId, body)
    return c.json(updatedMatch)
  } catch (error) {
    console.error('Error updating match:', error)
    return c.json({ error: 'Failed to update match' }, 500)
  }
})

// Delete a match
app.delete('/:id', async (c) => {
  try {
    const matchId = c.req.param('id')
    await dbService.deleteMatch(matchId)
    return c.json({ success: true, message: 'Match and player statistics updated successfully' })
  } catch (error) {
    console.error('Error deleting match:', error)
    return c.json({ error: 'Failed to delete match' }, 500)
  }
})

// Delete all matches and reset player statistics
app.delete('/', async (c) => {
  try {
    await dbService.deleteAllMatches()
    return c.json({ success: true, message: 'All matches deleted and player statistics reset successfully' })
  } catch (error) {
    console.error('Error deleting all matches:', error)
    return c.json({ error: 'Failed to delete all matches' }, 500)
  }
})

// Export player history
app.get('/export/:playerId', async (c) => {
  try {
    const playerId = c.req.param('playerId')
    const format = c.req.query('format') || 'json'
    
    const history = await dbService.exportPlayerHistory(playerId)
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Match Date',
        'Game Mode',
        'Team',
        'Role',
        'Is Captain',
        'Result',
        'Duration (minutes)',
        'Notes'
      ]
      
      const csvRows = history.matches.map(match => {
        const participant = match.participants.find(p => p.playerId === playerId)
        const result = match.winner === participant?.team ? 'WIN' : 'LOSS'
        const duration = match.duration ? Math.round(match.duration / 60) : 'N/A'
        
        return [
          match.createdAt.toISOString().split('T')[0],
          match.gameMode,
          participant?.team || '',
          participant?.role || '',
          participant?.isCaptain ? 'Yes' : 'No',
          result,
          duration,
          match.notes || ''
        ]
      })
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      
      c.header('Content-Type', 'text/csv')
      c.header('Content-Disposition', `attachment; filename="${history.player.name}_match_history.csv"`)
      return c.text(csvContent)
    }
    
    return c.json(history)
  } catch (error) {
    console.error('Error exporting player history:', error)
    return c.json({ error: 'Failed to export player history' }, 500)
  }
})

export default app
import { eq, desc, count, sql, and } from 'drizzle-orm'
import { db } from './index.js'
import { players, matches, matchParticipants, playerStats } from './schema.js'
import type { 
  Player as PlayerType, 
  Match as MatchType, 
  MatchParticipant as MatchParticipantType, 
  PlayerStats as PlayerStatsType 
} from './schema.js'

export class DatabaseService {
  // Initialize database tables
  async initialize() {
    try {
      // Create tables if they don't exist (libsql handles this automatically)
      console.log('✅ Database initialized successfully')
    } catch (error) {
      console.error('❌ Database initialization failed:', error)
      throw error
    }
  }

  // Players CRUD operations
  async createPlayer(data: { name: string; preferredRole?: string; rank?: string; isActive?: boolean }): Promise<PlayerType> {
    const playerId = crypto.randomUUID()
    
    const insertResult = await db.insert(players).values({
      id: playerId,
      name: data.name,
      preferredRole: data.preferredRole as any || null,
      rank: data.rank || null,
      isActive: data.isActive ?? true,
    }).returning()

    const player = insertResult[0]
    if (!player) throw new Error('Failed to create player')

    // Initialize player stats
    await db.insert(playerStats).values({
      id: crypto.randomUUID(),
      playerId: playerId,
    })

    return player
  }

  async getPlayers(): Promise<PlayerType[]> {
    return await db.select().from(players).where(eq(players.isActive, true)).orderBy(players.name)
  }

  async getAllPlayers(): Promise<PlayerType[]> {
    // Include inactive players for history purposes
    return await db.select().from(players).orderBy(players.name)
  }

  async getInactivePlayers(): Promise<PlayerType[]> {
    return await db.select().from(players).where(eq(players.isActive, false)).orderBy(players.name)
  }

  async getPlayerById(id: string): Promise<PlayerType | null> {
    const result = await db.select().from(players).where(eq(players.id, id))
    return result[0] || null
  }

  async updatePlayer(id: string, data: Partial<{ name: string; preferredRole?: string; rank?: string; isActive?: boolean }>): Promise<PlayerType> {
    const result = await db.update(players)
      .set({
        ...data,
        preferredRole: data.preferredRole as any,
        updatedAt: new Date(),
      })
      .where(eq(players.id, id))
      .returning()

    const player = result[0]
    if (!player) throw new Error('Failed to update player')
    return player
  }

  async deletePlayer(id: string): Promise<PlayerType> {
    // Instead of deleting, mark player as inactive to preserve match history
    const result = await db.update(players)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(players.id, id))
      .returning()

    const player = result[0]
    if (!player) throw new Error('Failed to deactivate player')
    return player
  }

  async reactivatePlayer(id: string): Promise<PlayerType> {
    const result = await db.update(players)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(players.id, id))
      .returning()

    const player = result[0]
    if (!player) throw new Error('Failed to reactivate player')
    return player
  }

  async deleteAllPlayers(): Promise<void> {
    await db.delete(players)
  }

  // Match operations
  async createMatch(data: {
    gameMode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
    blueTeam: { players: Array<{ id: string; name: string; preferredRole?: string }> }
    redTeam: { players: Array<{ id: string; name: string; preferredRole?: string }> }
    blueCaptain?: { id: string }
    redCaptain?: { id: string }
  }): Promise<MatchType> {
    const matchId = crypto.randomUUID()

    // Create the match
    const matchResult = await db.insert(matches).values({
      id: matchId,
      gameMode: data.gameMode,
      status: 'IN_PROGRESS',
    }).returning()

    const match = matchResult[0]
    if (!match) throw new Error('Failed to create match')

    // Add blue team participants
    for (const [index, player] of data.blueTeam.players.entries()) {
      const role = player.preferredRole || (['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][index])
      const isCaptain = data.blueCaptain?.id === player.id

      await db.insert(matchParticipants).values({
        id: crypto.randomUUID(),
        matchId,
        playerId: player.id,
        team: 'BLUE',
        role: role as any,
        isCaptain,
      })
    }

    // Add red team participants
    for (const [index, player] of data.redTeam.players.entries()) {
      const role = player.preferredRole || (['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][index])
      const isCaptain = data.redCaptain?.id === player.id

      await db.insert(matchParticipants).values({
        id: crypto.randomUUID(),
        matchId,
        playerId: player.id,
        team: 'RED',
        role: role as any,
        isCaptain,
      })
    }

    return match
  }

  async completeMatch(matchId: string, data: {
    winner: 'BLUE' | 'RED'
    duration?: number
    notes?: string
  }): Promise<MatchType> {
    const result = await db.update(matches)
      .set({
        status: 'COMPLETED',
        winner: data.winner,
        duration: data.duration || null,
        notes: data.notes || null,
        completedAt: new Date(),
      })
      .where(eq(matches.id, matchId))
      .returning()

    const match = result[0]
    if (!match) throw new Error('Failed to complete match')

    // Update player statistics
    await this.updatePlayerStatistics(matchId, data.winner)

    return match
  }

  async updateMatch(matchId: string, data: {
    opggScore?: string
    notes?: string
  }): Promise<MatchType> {
    const result = await db.update(matches)
      .set({
        opggScore: data.opggScore || null,
        notes: data.notes || null,
      })
      .where(eq(matches.id, matchId))
      .returning()

    const match = result[0]
    if (!match) throw new Error('Failed to update match')
    return match
  }

  async deleteMatch(matchId: string): Promise<void> {
    // First, get the match data and participants before deletion to update statistics
    const matchData = await db.select().from(matches).where(eq(matches.id, matchId))
    if (matchData.length === 0) {
      throw new Error('Match not found')
    }
    
    const match = matchData[0]!
    const participants = await db.select()
      .from(matchParticipants)
      .where(eq(matchParticipants.matchId, matchId))

    // Update player statistics by removing this match's contribution
    if (match.status === 'COMPLETED' && match.winner) {
      await this.removeMatchFromPlayerStatistics(matchId, match.winner, participants)
    }

    // Delete participants first (cascade should handle this, but being explicit)
    await db.delete(matchParticipants).where(eq(matchParticipants.matchId, matchId))
    
    // Delete the match
    const result = await db.delete(matches).where(eq(matches.id, matchId)).returning()
    
    if (result.length === 0) {
      throw new Error('Match not found')
    }
  }

  async deleteAllMatches(): Promise<void> {
    // Delete all participants first
    await db.delete(matchParticipants)
    
    // Delete all matches
    await db.delete(matches)
    
    // Reset all player statistics to zero
    await this.resetAllPlayerStatistics()
  }

  private async resetAllPlayerStatistics(): Promise<void> {
    await db.update(playerStats)
      .set({
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesAsTop: 0,
        gamesAsJungle: 0,
        gamesAsMid: 0,
        gamesAsAdc: 0,
        gamesAsSupport: 0,
        gamesAsCaptain: 0,
        updatedAt: new Date(),
      })
  }

  async getMatches(limit = 10, offset = 0): Promise<{
    matches: Array<MatchType & { participants: Array<MatchParticipantType & { playerName?: string }> }>
    total: number
  }> {
    const matchesData = await db.select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit)
      .offset(offset)

    const totalResult = await db.select({ total: count() }).from(matches)
    const total = totalResult[0]?.total || 0

    const matchesWithParticipants = await Promise.all(
      matchesData.map(async (match) => {
        const rawParticipants = await db.select({
          id: matchParticipants.id,
          matchId: matchParticipants.matchId,
          playerId: matchParticipants.playerId,
          team: matchParticipants.team,
          role: matchParticipants.role,
          isCaptain: matchParticipants.isCaptain,
          playerName: players.name,
        })
        .from(matchParticipants)
        .leftJoin(players, eq(matchParticipants.playerId, players.id))
        .where(eq(matchParticipants.matchId, match.id))

        // Convert playerName: null to undefined (or omit)
        const participants = rawParticipants.map(p => {
          const { playerName, ...rest } = p
          return playerName !== null
            ? { ...rest, playerName }
            : { ...rest }
        })

        return {
          ...match,
          participants
        }
      })
    )

    return { matches: matchesWithParticipants, total }
  }

  async getPlayerStatistics(playerId?: string): Promise<Array<PlayerStatsType & { playerName?: string }>> {
    const rawResults = await db.select({
      id: playerStats.id,
      playerId: playerStats.playerId,
      playerName: players.name,
      totalMatches: playerStats.totalMatches,
      wins: playerStats.wins,
      losses: playerStats.losses,
      winRate: playerStats.winRate,
      gamesAsTop: playerStats.gamesAsTop,
      gamesAsJungle: playerStats.gamesAsJungle,
      gamesAsMid: playerStats.gamesAsMid,
      gamesAsAdc: playerStats.gamesAsAdc,
      gamesAsSupport: playerStats.gamesAsSupport,
      gamesAsCaptain: playerStats.gamesAsCaptain,
      updatedAt: playerStats.updatedAt,
    })
    .from(playerStats)
    .leftJoin(players, eq(playerStats.playerId, players.id))
    .where(playerId ? eq(playerStats.playerId, playerId) : undefined)
    .orderBy(desc(playerStats.totalMatches))

    // Convert null playerName to undefined
    return rawResults.map(result => {
      const { playerName, ...rest } = result
      return playerName !== null 
        ? { ...rest, playerName }
        : { ...rest }
    })
  }

  async getOverviewStatistics(): Promise<{
    totalMatches: number
    completedMatches: number
    gameModeCounts: Record<string, number>
    averageDuration: number
    winDistribution: { blue: number; red: number }
  }> {
    const totalMatchesResult = await db.select({ count: count() }).from(matches)
    const completedMatchesResult = await db.select({ count: count() })
      .from(matches)
      .where(eq(matches.status, 'COMPLETED'))

    const gameModes = await db.select({
      gameMode: matches.gameMode,
      count: count(),
    })
    .from(matches)
    .groupBy(matches.gameMode)

    const gameModeCounts = gameModes.reduce((acc, { gameMode, count }) => {
      acc[gameMode] = count
      return acc
    }, {} as Record<string, number>)

    const avgDurationResult = await db.select({
      avg: sql<number>`AVG(${matches.duration})`,
    })
    .from(matches)
    .where(and(eq(matches.status, 'COMPLETED'), sql`${matches.duration} IS NOT NULL`))

    const winDistribution = await db.select({
      winner: matches.winner,
      count: count(),
    })
    .from(matches)
    .where(eq(matches.status, 'COMPLETED'))
    .groupBy(matches.winner)

    const wins = winDistribution.reduce((acc, { winner, count }) => {
      if (winner === 'BLUE') acc.blue = count
      if (winner === 'RED') acc.red = count
      return acc
    }, { blue: 0, red: 0 })

    return {
      totalMatches: totalMatchesResult[0]?.count || 0,
      completedMatches: completedMatchesResult[0]?.count || 0,
      gameModeCounts,
      averageDuration: Math.round(avgDurationResult[0]?.avg || 0),
      winDistribution: wins,
    }
  }

  private async updatePlayerStatistics(matchId: string, winner: 'BLUE' | 'RED'): Promise<void> {
    const participants = await db.select()
      .from(matchParticipants)
      .where(eq(matchParticipants.matchId, matchId))

    for (const participant of participants) {
      const isWinner = participant.team === winner
      const roleField = this.getRoleFieldName(participant.role!)

      // Get current stats
      const currentStatsResult = await db.select()
        .from(playerStats)
        .where(eq(playerStats.playerId, participant.playerId))

      const currentStats = currentStatsResult[0]
      if (!currentStats) continue

      const newTotalMatches = currentStats.totalMatches + 1
      const newWins = currentStats.wins + (isWinner ? 1 : 0)
      const newLosses = currentStats.losses + (isWinner ? 0 : 1)
      const newWinRate = Math.round((newWins / newTotalMatches) * 100)

      const updateData: any = {
        totalMatches: newTotalMatches,
        wins: newWins,
        losses: newLosses,
        winRate: newWinRate,
        updatedAt: new Date(),
      }

      if (roleField) {
        updateData[roleField] = (currentStats as any)[roleField] + 1
      }

      if (participant.isCaptain) {
        updateData.gamesAsCaptain = currentStats.gamesAsCaptain + 1
      }

      await db.update(playerStats)
        .set(updateData)
        .where(eq(playerStats.playerId, participant.playerId))
    }
  }

  private async removeMatchFromPlayerStatistics(matchId: string, winner: 'BLUE' | 'RED', participants: MatchParticipantType[]): Promise<void> {
    for (const participant of participants) {
      const isWinner = participant.team === winner
      const roleField = this.getRoleFieldName(participant.role!)

      // Get current stats
      const currentStatsResult = await db.select()
        .from(playerStats)
        .where(eq(playerStats.playerId, participant.playerId))

      const currentStats = currentStatsResult[0]
      if (!currentStats) continue

      // Subtract this match's contribution from the stats
      const newTotalMatches = Math.max(0, currentStats.totalMatches - 1)
      const newWins = Math.max(0, currentStats.wins - (isWinner ? 1 : 0))
      const newLosses = Math.max(0, currentStats.losses - (isWinner ? 0 : 1))
      const newWinRate = newTotalMatches > 0 ? Math.round((newWins / newTotalMatches) * 100) : 0

      const updateData: any = {
        totalMatches: newTotalMatches,
        wins: newWins,
        losses: newLosses,
        winRate: newWinRate,
        updatedAt: new Date(),
      }

      if (roleField) {
        updateData[roleField] = Math.max(0, (currentStats as any)[roleField] - 1)
      }

      if (participant.isCaptain) {
        updateData.gamesAsCaptain = Math.max(0, currentStats.gamesAsCaptain - 1)
      }

      await db.update(playerStats)
        .set(updateData)
        .where(eq(playerStats.playerId, participant.playerId))
    }
  }

  private getRoleFieldName(role: string): string | null {
    const roleMap = {
      'TOP': 'gamesAsTop',
      'JUNGLE': 'gamesAsJungle',
      'MID': 'gamesAsMid',
      'ADC': 'gamesAsAdc',
      'SUPPORT': 'gamesAsSupport',
    }
    return roleMap[role as keyof typeof roleMap] || null
  }

  async exportPlayerHistory(playerId: string): Promise<{
    player: PlayerType
    statistics: PlayerStatsType & { playerName?: string }
    matches: Array<MatchType & { participants: Array<MatchParticipantType & { playerName?: string }> }>
  }> {
    const player = await this.getPlayerById(playerId)
    if (!player) throw new Error('Player not found')

    const statisticsResult = await this.getPlayerStatistics(playerId)
    const statistics = statisticsResult[0]
    if (!statistics) throw new Error('Player statistics not found')
    
    const playerMatchesResult = await db.select({
      match: matches,
      participant: matchParticipants,
    })
    .from(matchParticipants)
    .leftJoin(matches, eq(matchParticipants.matchId, matches.id))
    .where(eq(matchParticipants.playerId, playerId))
    .orderBy(desc(matches.createdAt))

    const matchesWithParticipants = await Promise.all(
      playerMatchesResult
        .filter(({ match }) => match !== null)
        .map(async ({ match }) => {
          if (!match) throw new Error('Match should not be null after filter')
          
          const rawParticipants = await db.select({
            id: matchParticipants.id,
            matchId: matchParticipants.matchId,
            playerId: matchParticipants.playerId,
            team: matchParticipants.team,
            role: matchParticipants.role,
            isCaptain: matchParticipants.isCaptain,
            playerName: players.name,
          })
          .from(matchParticipants)
          .leftJoin(players, eq(matchParticipants.playerId, players.id))
          .where(eq(matchParticipants.matchId, match.id))

          // Convert null playerName to undefined
          const participants = rawParticipants.map(p => {
            const { playerName, ...rest } = p
            return playerName !== null
              ? { ...rest, playerName }
              : { ...rest }
          })

          return {
            ...match,
            participants
          }
        })
    )

    return {
      player,
      statistics,
      matches: matchesWithParticipants,
    }
  }
}

export const dbService = new DatabaseService()
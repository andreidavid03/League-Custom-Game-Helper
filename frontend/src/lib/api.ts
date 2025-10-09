const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface Player {
  id: string
  name: string
  preferredRole?: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  rank?: string
  isActive: boolean
  createdAt: Date
}

export interface Team {
  name: string
  players: Player[]
  captain?: Player
}

export interface GameResult {
  id: string
  mode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  blueTeam: Team
  redTeam: Team
  createdAt: Date
}

export interface MatchRecord {
  id: string
  gameId: string
  mode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
  blueTeam: Team
  redTeam: Team
  winner?: 'BLUE' | 'RED'
  duration?: number
  notes?: string
  createdAt: Date
  completedAt?: Date
}

export interface PlayerStats {
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

export interface OverviewStats {
  totalMatches: number
  completedMatches: number
  gameModeCounts: Record<string, number>
  averageDuration: number
  winDistribution: {
    blue: number
    red: number
  }
}

class ApiService {
  private isBackendAvailable = true

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      this.isBackendAvailable = false
      
      // Return mock data for development/demo purposes
      if (endpoint === '/api/players') {
        return { success: true, data: [], count: 0 } as T
      }
      
      throw new Error(error instanceof Error ? error.message : 'Unknown API error')
    }
  }

  // Players API
  async getPlayers(): Promise<{ success: boolean; data: Player[]; count: number }> {
    return this.request('/api/players')
  }

  async addPlayer(player: Omit<Player, 'id' | 'createdAt'>): Promise<{ success: boolean; data: Player }> {
    return this.request('/api/players', {
      method: 'POST',
      body: JSON.stringify(player),
    })
  }

  async addPlayersInBulk(players: Omit<Player, 'id' | 'createdAt'>[]): Promise<{ success: boolean; data: Player[]; skipped: number }> {
    return this.request('/api/players/bulk', {
      method: 'POST',
      body: JSON.stringify(players),
    })
  }

  async updatePlayer(id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>): Promise<{ success: boolean; data: Player }> {
    return this.request(`/api/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deletePlayer(id: string): Promise<{ success: boolean; data: Player }> {
    return this.request(`/api/players/${id}`, {
      method: 'DELETE',
    })
  }

  async clearAllPlayers(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/players', {
      method: 'DELETE',
    })
  }

  // Games API
  async generateRandomTeams(players: Player[], assignRoles = true): Promise<{ success: boolean; data: GameResult }> {
    return this.request('/api/games/random', {
      method: 'POST',
      body: JSON.stringify({ players, assignRoles }),
    })
  }

  async createCaptainDraft(data: {
    players: Player[]
    blueCaptain: Player
    redCaptain: Player
    teamAssignments: { blue: Player[]; red: Player[] }
  }): Promise<{ success: boolean; data: GameResult }> {
    return this.request('/api/games/captain', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createWheelTeams(data: {
    players: Player[]
    wheelResults: { blueTeam: Team; redTeam: Team }
  }): Promise<{ success: boolean; data: GameResult }> {
    return this.request('/api/games/wheel', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getGameResults(): Promise<{ success: boolean; data: GameResult[]; count: number }> {
    return this.request('/api/games')
  }

  async getGameById(id: string): Promise<{ success: boolean; data: GameResult }> {
    return this.request(`/api/games/${id}`)
  }

  async clearGameHistory(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/games', {
      method: 'DELETE',
    })
  }

  // Match History API
  async getMatchHistory(page = 1, limit = 10, mode?: string): Promise<{
    success: boolean
    data: {
      matches: MatchRecord[]
      pagination: { page: number; limit: number; total: number; pages: number }
    }
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    if (mode) {
      params.append('mode', mode)
    }

    return this.request(`/api/match-history?${params}`)
  }

  async addMatchToHistory(match: {
    gameId: string
    mode: 'RANDOM' | 'CAPTAIN' | 'WHEEL'
    blueTeam: Team
    redTeam: Team
  }): Promise<{ success: boolean; data: MatchRecord }> {
    return this.request('/api/match-history', {
      method: 'POST',
      body: JSON.stringify(match),
    })
  }

  async completeMatch(gameId: string, data: {
    winner: 'BLUE' | 'RED'
    duration?: number
    notes?: string
  }): Promise<{ success: boolean; data: MatchRecord }> {
    return this.request(`/api/match-history/${gameId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPlayerStats(): Promise<{ success: boolean; data: PlayerStats[] }> {
    return this.request('/api/match-history/stats/players')
  }

  async getOverviewStats(): Promise<{ success: boolean; data: OverviewStats }> {
    return this.request('/api/match-history/stats/overview')
  }

  async deleteMatch(id: string): Promise<{ success: boolean; data: MatchRecord }> {
    return this.request(`/api/match-history/${id}`, {
      method: 'DELETE',
    })
  }

  async clearMatchHistory(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/match-history', {
      method: 'DELETE',
    })
  }
}

export const api = new ApiService()
export default api
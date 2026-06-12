export const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MID: 'Mid',
  ADC: 'ADC',
  SUPPORT: 'Support',
}

export const ROLE_ICONS: Record<Role, string> = {
  TOP: '🛡️',
  JUNGLE: '🌲',
  MID: '⚡',
  ADC: '🏹',
  SUPPORT: '💎',
}

export const RANKS = [
  'UNRANKED',
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
] as const
export type Rank = (typeof RANKS)[number]

/** Weight used by the balanced-teams algorithm. */
export const RANK_WEIGHTS: Record<Rank, number> = {
  UNRANKED: 4,
  IRON: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  PLATINUM: 5,
  EMERALD: 6,
  DIAMOND: 7,
  MASTER: 8,
  GRANDMASTER: 9,
  CHALLENGER: 10,
}

export const RANK_COLORS: Record<Rank, string> = {
  UNRANKED: '#9aa4af',
  IRON: '#8d8377',
  BRONZE: '#a46628',
  SILVER: '#95a1a8',
  GOLD: '#e8b659',
  PLATINUM: '#4f9e8f',
  EMERALD: '#2ec77a',
  DIAMOND: '#5b9ee8',
  MASTER: '#b06bd8',
  GRANDMASTER: '#d8403f',
  CHALLENGER: '#f4c874',
}

export interface Player {
  id: string
  name: string
  rank: Rank
  preferredRoles: Role[]
  createdAt: number
}

export type GameMode =
  | 'WHEEL'
  | 'CASE'
  | 'SLOTS'
  | 'CARDS'
  | 'DRAFT'
  | 'BALANCED'
  | 'INSTANT'

export const MODE_LABELS: Record<GameMode, string> = {
  WHEEL: 'Wheel of Fate',
  CASE: 'Case Opening',
  SLOTS: 'Slot Machine',
  CARDS: 'Card Draw',
  DRAFT: 'Captain Draft',
  BALANCED: 'Balanced Teams',
  INSTANT: 'Instant Random',
}

export type TeamSide = 'BLUE' | 'RED'

export interface MatchPlayer {
  playerId: string
  name: string
  role?: Role
  champion?: string
  isCaptain?: boolean
}

export interface Match {
  id: string
  mode: GameMode
  blue: MatchPlayer[]
  red: MatchPlayer[]
  status: 'IN_PROGRESS' | 'COMPLETED'
  winner?: TeamSide
  notes?: string
  createdAt: number
  completedAt?: number
}

export interface Settings {
  soundOn: boolean
  /** 0.5 = slow & dramatic, 1 = normal, 2 = fast */
  animationSpeed: number
  respectPreferredRoles: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  soundOn: true,
  animationSpeed: 1,
  respectPreferredRoles: true,
}

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  )
}

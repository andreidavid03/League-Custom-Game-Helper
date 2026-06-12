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

export const THEMES = ['HEXTECH', 'BLOODMOON', 'FRELJORD', 'SHADOWISLES', 'PROJECT'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  HEXTECH: 'Hextech',
  BLOODMOON: 'Blood Moon',
  FRELJORD: 'Freljord',
  SHADOWISLES: 'Shadow Isles',
  PROJECT: 'PROJECT',
}

/** Swatch colors for the theme picker: [background, accent, accent2]. */
export const THEME_SWATCHES: Record<Theme, [string, string, string]> = {
  HEXTECH: ['#0a1428', '#c89b3c', '#0ac8b9'],
  BLOODMOON: ['#1a0710', '#d8403f', '#ff8a5c'],
  FRELJORD: ['#071a2e', '#8fd6f7', '#cdeeff'],
  SHADOWISLES: ['#06231b', '#3ddc97', '#9ef0c9'],
  PROJECT: ['#0c0c20', '#00e5ff', '#ff3df0'],
}

export interface Settings {
  soundOn: boolean
  /** 0.5 = slow & dramatic, 1 = normal, 2 = fast */
  animationSpeed: number
  respectPreferredRoles: boolean
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = {
  soundOn: true,
  animationSpeed: 1,
  respectPreferredRoles: true,
  theme: 'HEXTECH',
}

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  )
}

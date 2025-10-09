import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Players table
export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  preferredRole: text('preferred_role', { enum: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] }),
  rank: text('rank'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
})

// Matches table
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  gameMode: text('game_mode', { enum: ['RANDOM', 'CAPTAIN', 'WHEEL'] }).notNull(),
  status: text('status', { enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }).notNull().default('IN_PROGRESS'),
  winner: text('winner', { enum: ['BLUE', 'RED'] }),
  duration: integer('duration'), // in seconds
  notes: text('notes'),
  opggScore: text('opgg_score'), // Field for op.gg scores or placements
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

// Match participants table (stores which players were in which match)
export const matchParticipants = sqliteTable('match_participants', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  team: text('team', { enum: ['BLUE', 'RED'] }).notNull(),
  role: text('role', { enum: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] }),
  isCaptain: integer('is_captain', { mode: 'boolean' }).default(false),
})

// Player statistics table (aggregated stats)
export const playerStats = sqliteTable('player_stats', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }).unique(),
  totalMatches: integer('total_matches').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  winRate: real('win_rate').notNull().default(0),
  gamesAsTop: integer('games_as_top').notNull().default(0),
  gamesAsJungle: integer('games_as_jungle').notNull().default(0),
  gamesAsMid: integer('games_as_mid').notNull().default(0),
  gamesAsAdc: integer('games_as_adc').notNull().default(0),
  gamesAsSupport: integer('games_as_support').notNull().default(0),
  gamesAsCaptain: integer('games_as_captain').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
})

// Types for TypeScript
export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
export type MatchParticipant = typeof matchParticipants.$inferSelect
export type NewMatchParticipant = typeof matchParticipants.$inferInsert
export type PlayerStats = typeof playerStats.$inferSelect
export type NewPlayerStats = typeof playerStats.$inferInsert
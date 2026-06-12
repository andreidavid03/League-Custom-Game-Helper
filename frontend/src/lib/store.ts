'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  Player,
  Match,
  Settings,
  DEFAULT_SETTINGS,
  Rank,
  Role,
  TeamSide,
  uid,
} from './types'

export interface AppState {
  players: Player[]
  matches: Match[]
  settings: Settings

  addPlayer: (name: string, rank?: Rank, preferredRoles?: Role[]) => Player | null
  addPlayersBulk: (names: string[]) => number
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id' | 'createdAt'>>) => void
  removePlayer: (id: string) => void

  addMatch: (match: Omit<Match, 'id' | 'createdAt' | 'status'>) => Match
  completeMatch: (id: string, winner: TeamSide, notes?: string) => void
  deleteMatch: (id: string) => void
  clearMatches: () => void

  updateSettings: (updates: Partial<Settings>) => void

  exportData: () => string
  importData: (json: string) => { ok: boolean; error?: string }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      players: [],
      matches: [],
      settings: DEFAULT_SETTINGS,

      addPlayer: (name, rank = 'UNRANKED', preferredRoles = []) => {
        const trimmed = name.trim()
        if (!trimmed) return null
        const exists = get().players.some(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase()
        )
        if (exists) return null
        const player: Player = {
          id: uid(),
          name: trimmed,
          rank,
          preferredRoles,
          createdAt: Date.now(),
        }
        set((s) => ({ players: [...s.players, player] }))
        return player
      },

      addPlayersBulk: (names) => {
        let added = 0
        for (const name of names) {
          if (get().addPlayer(name)) added++
        }
        return added
      },

      updatePlayer: (id, updates) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      removePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      addMatch: (match) => {
        const full: Match = {
          ...match,
          id: uid(),
          status: 'IN_PROGRESS',
          createdAt: Date.now(),
        }
        set((s) => ({ matches: [full, ...s.matches] }))
        return full
      },

      completeMatch: (id, winner, notes) =>
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: 'COMPLETED' as const,
                  winner,
                  notes: notes || m.notes,
                  completedAt: Date.now(),
                }
              : m
          ),
        })),

      deleteMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),

      clearMatches: () => set({ matches: [] }),

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      exportData: () => {
        const { players, matches, settings } = get()
        return JSON.stringify(
          { app: 'lol-custom-game-helper', version: 2, exportedAt: new Date().toISOString(), players, matches, settings },
          null,
          2
        )
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (!Array.isArray(data.players) || !Array.isArray(data.matches)) {
            return { ok: false, error: 'File does not look like a valid export.' }
          }
          set({
            players: data.players,
            matches: data.matches,
            settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
          })
          return { ok: true }
        } catch {
          return { ok: false, error: 'Could not parse the file as JSON.' }
        }
      },
    }),
    {
      name: 'lol-cgh-data',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Gate UI on store hydration to avoid SSR/localStorage mismatch flashes. */
import { useEffect, useState } from 'react'
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}

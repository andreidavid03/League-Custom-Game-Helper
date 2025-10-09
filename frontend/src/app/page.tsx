'use client'

import { useState, useEffect } from 'react'
import { Target, Settings } from 'lucide-react'
import { Player, api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import PlayersPage from '@/components/pages/PlayersPage'
import RandomTeamsPage from '@/components/pages/RandomTeamsPage'
import CaptainDraftPage from '@/components/pages/CaptainDraftPage'
import WheelSpinnerPage from '@/components/pages/WheelSpinnerPage'
import MatchHistoryPage from '@/components/pages/MatchHistoryPage'
import PlayerStatisticsPage from '@/components/pages/PlayerStatisticsPage'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'players' | 'random' | 'captain' | 'wheel' | 'history' | 'stats'>('players')
  const [players, setPlayers] = useState<Player[]>([])

  // Load initial data
  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const response = await api.getPlayers()
      if (response.success) {
        setPlayers(response.data)
      }
    } catch (error) {
      console.error('Failed to load players:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                <Target className="w-8 h-8 text-slate-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  LoL Custom Game Helper
                </h1>
                <p className="text-slate-400">Made by David Demon</p>
              </div>
            </div>
            <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto p-6">
        <Navigation
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page as typeof currentPage)}
          playerCount={players.length}
        />
      </div>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-6 pb-6">
        {currentPage === 'players' && (
          <PlayersPage 
            players={players}
            setPlayers={setPlayers}
          />
        )}
        
        {currentPage === 'random' && (
          <RandomTeamsPage 
            players={players}
          />
        )}
        
        {currentPage === 'captain' && (
          <CaptainDraftPage 
            players={players}
          />
        )}
        
        {currentPage === 'wheel' && (
          <WheelSpinnerPage 
            players={players}
          />
        )}
        
        {currentPage === 'history' && (
          <MatchHistoryPage />
        )}
        
        {currentPage === 'stats' && (
          <PlayerStatisticsPage />
        )}
      </main>
    </div>
  )
}

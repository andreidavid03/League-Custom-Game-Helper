'use client'

import { Users, Shuffle, Target, Crown, BarChart3, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  playerCount: number
}

export default function Navigation({ currentPage, onPageChange, playerCount }: NavigationProps) {
  const navigationItems = [
    {
      id: 'players',
      name: 'Players',
      icon: Users,
      description: 'Manage players',
      color: 'blue',
      disabled: false
    },
    {
      id: 'random',
      name: 'Random Teams',
      icon: Shuffle,
      description: 'Generate balanced teams',
      color: 'purple',
      disabled: playerCount < 10
    },
    {
      id: 'captain',
      name: 'Captain Draft',
      icon: Crown,
      description: 'Draft with captains',
      color: 'yellow',
      disabled: playerCount < 10
    },
    {
      id: 'wheel',
      name: 'Wheel Spinner',
      icon: Target,
      description: 'Spin the wheel',
      color: 'green',
      disabled: playerCount === 0
    },
    {
      id: 'history',
      name: 'Match History',
      icon: BarChart3,
      description: 'View past matches',
      color: 'indigo',
      disabled: false
    },
    {
      id: 'statistics',
      name: 'Player Stats',
      icon: Trophy,
      description: 'Player performance',
      color: 'orange',
      disabled: false
    }
  ]

  const getColorClasses = (color: string, isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) {
      return 'border-gray-600 bg-gray-800/30 text-gray-500 cursor-not-allowed'
    }
    
    if (isActive) {
      switch (color) {
        case 'blue': return 'border-blue-500 bg-blue-500/20 text-blue-300'
        case 'purple': return 'border-purple-500 bg-purple-500/20 text-purple-300'
        case 'yellow': return 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
        case 'green': return 'border-green-500 bg-green-500/20 text-green-300'
        case 'indigo': return 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
        case 'orange': return 'border-orange-500 bg-orange-500/20 text-orange-300'
        default: return 'border-blue-500 bg-blue-500/20 text-blue-300'
      }
    }
    
    return 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
  }

  const getIconColor = (color: string, isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'text-gray-500'
    if (isActive) {
      switch (color) {
        case 'blue': return 'text-blue-400'
        case 'purple': return 'text-purple-400'
        case 'yellow': return 'text-yellow-400'
        case 'green': return 'text-green-400'
        case 'indigo': return 'text-indigo-400'
        case 'orange': return 'text-orange-400'
        default: return 'text-blue-400'
      }
    }
    return 'text-slate-400'
  }

  return (
    <nav className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-b border-slate-700 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            const isDisabled = item.disabled
            
            return (
              <motion.button
                key={item.id}
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                onClick={() => !isDisabled && onPageChange(item.id)}
                disabled={isDisabled}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${getColorClasses(item.color, isActive, isDisabled)}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${getIconColor(item.color, isActive, isDisabled)}`} />
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs opacity-75 mt-1">{item.description}</div>
                {isDisabled && item.id !== 'players' && (
                  <div className="text-xs text-red-400 mt-1">
                    {playerCount === 0 ? 'No players' : `Need ${10 - playerCount} more`}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
'use client'

import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import MatchHistoryPanel from '@/components/MatchHistoryPanel'

export default function MatchHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Match History
            </h1>
            <p className="text-slate-400 text-lg">Review past matches and track your gaming journey</p>
          </div>
        </div>
      </motion.div>

      {/* Match History Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <MatchHistoryPanel />
      </motion.div>
    </div>
  )
}
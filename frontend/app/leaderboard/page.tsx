'use client'

import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  modelId: string
  modelName: string
  equity: number
  totalPnL: number
  winRate: number
  totalTrades: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetchLeaderboard()
    // Refresh every 10 seconds
    const interval = setInterval(fetchLeaderboard, 10000)
    return () => clearInterval(interval)
  }, [mounted])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/leaderboard')
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      const data = await response.json()
      setLeaderboard(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-xl">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-xl border border-red-500/50 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">Error</h2>
          <p className="text-slate-300">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-slate-400 text-lg">
            Real-time rankings of AI trading models
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Equity
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Total P&L
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Trades
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No models found
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, index) => (
                    <tr
                      key={entry.modelId}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/models/${entry.modelId}`)}
                      suppressHydrationWarning
                    >
                      <td className="px-6 py-4" suppressHydrationWarning>
                        <div className="flex items-center">
                          <span
                            className={`text-2xl font-bold ${
                              entry.rank === 1
                                ? 'text-yellow-400'
                                : entry.rank === 2
                                ? 'text-slate-300'
                                : entry.rank === 3
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }`}
                            suppressHydrationWarning
                          >
                            {mounted && (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{entry.modelName}</span>
                          <span className="text-xs text-slate-500 font-mono">{entry.modelId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-semibold text-white">
                          ${entry.equity.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-mono font-semibold ${
                            entry.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {entry.totalPnL >= 0 ? '+' : ''}${entry.totalPnL.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-mono ${
                            entry.winRate >= 50 ? 'text-green-400' : 'text-orange-400'
                          }`}
                        >
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-slate-300">{entry.totalTrades}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        {leaderboard.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Top Model</p>
              <p className="text-2xl font-bold text-white">{leaderboard[0]?.modelName}</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Highest Equity</p>
              <p className="text-2xl font-bold text-green-400">
                ${Math.max(...leaderboard.map(e => e.equity)).toFixed(2)}
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Total Models</p>
              <p className="text-2xl font-bold text-blue-400">{leaderboard.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/lib/useWebSocket'

interface Model {
  id: string
  rank?: number
  name: string
  equity: number
  totalPnL: number
  pnl?: number
  winRate: number
  totalTrades: number
  trades?: number
  status: 'active' | 'inactive'
  lastTradeTime?: string
}

export default function ModelsPage() {
  const { data: wsData, connected } = useWebSocket()
  const [dbModels, setDbModels] = useState<Model[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Fetch initial data from database for static info (IDs, status, etc.)
  useEffect(() => {
    fetchModels()
    const interval = setInterval(fetchModels, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  // Update models with real-time WebSocket data
  useEffect(() => {
    if (wsData?.models && dbModels.length > 0) {
      const updatedModels = dbModels.map(dbModel => {
        const wsModel = wsData.models.find((m: any) => m.name === dbModel.name)
        if (wsModel) {
          return {
            ...dbModel,
            equity: wsModel.equity,
            totalPnL: (wsModel.equity - 10000),
            pnl: wsModel.pnl,
            winRate: wsModel.winRate,
            totalTrades: wsModel.trades,
          }
        }
        return dbModel
      })
      setModels(updatedModels)
    } else if (dbModels.length > 0) {
      setModels(dbModels)
    }
  }, [wsData, dbModels])

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/models')
      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }
      const data = await response.json()
      setDbModels(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching models:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredModels = models.filter(model => {
    if (filter === 'all') return true
    return model.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-xl">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300">Loading models...</p>
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
            onClick={fetchModels}
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
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Trading Models
          </h1>
          <p className="text-slate-400 text-lg mb-6">
            Browse all AI trading models competing in real-time
          </p>

          {/* Filter Tabs */}
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'glass glow text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              All Models
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'active'
                  ? 'glass glow text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === 'inactive'
                  ? 'glass glow text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Models Grid */}
        {filteredModels.length === 0 ? (
          <div className="glass p-12 rounded-xl text-center">
            <p className="text-slate-400 text-lg">No models found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="glass rounded-xl p-6 hover:glow transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{model.id}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      model.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                    }`}
                  >
                    {model.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  {/* Equity */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Equity</span>
                    <span className="font-mono font-bold text-white text-lg">
                      ${model.equity.toFixed(2)}
                    </span>
                  </div>

                  {/* P&L */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total P&L</span>
                    <span
                      className={`font-mono font-semibold ${
                        model.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {model.totalPnL >= 0 ? '+' : ''}${model.totalPnL.toFixed(2)}
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Win Rate</span>
                    <span
                      className={`font-mono ${
                        model.winRate >= 50 ? 'text-green-400' : 'text-orange-400'
                      }`}
                    >
                      {model.winRate.toFixed(1)}%
                    </span>
                  </div>

                  {/* Total Trades */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Trades</span>
                    <span className="font-mono text-slate-300">{model.totalTrades}</span>
                  </div>
                </div>

                {/* Last Trade Time */}
                {model.lastTradeTime && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">
                      Last trade: {new Date(model.lastTradeTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredModels.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Total Models</p>
              <p className="text-3xl font-bold text-white">{filteredModels.length}</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Active Models</p>
              <p className="text-3xl font-bold text-green-400">
                {filteredModels.filter(m => m.status === 'active').length}
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Avg Win Rate</p>
              <p className="text-3xl font-bold text-blue-400">
                {(
                  filteredModels.reduce((sum, m) => sum + m.winRate, 0) / filteredModels.length
                ).toFixed(1)}
                %
              </p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-slate-400 text-sm mb-2">Total Trades</p>
              <p className="text-3xl font-bold text-purple-400">
                {filteredModels.reduce((sum, m) => sum + m.totalTrades, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

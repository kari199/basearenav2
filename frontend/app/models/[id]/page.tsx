'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Position {
  asset: string
  side: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  leverage: number
  notional: number
  unrealizedPnL: number
}

interface Trade {
  id: number
  asset: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  pnl: number | null
  status: 'open' | 'closed'
  createdAt: string
}

interface ModelData {
  id: number
  name: string
  strategy: string
  equity: number
  cash: number
  pnl: number
  positions: Record<string, any>
  trades: Trade[]
  stats: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalPnL: number
  }
}

const CRYPTO_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  SOL: '◎',
  BNB: 'BNB',
  DOGE: 'Ð',
  XRP: 'XRP',
}

export default function ModelDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [model, setModel] = useState<ModelData | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'positions' | 'trades'>('positions')

  useEffect(() => {
    if (!id) return
    fetchModelData()
    fetchPrices()

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchModelData()
      fetchPrices()
    }, 5000)

    return () => clearInterval(interval)
  }, [id])

  const fetchModelData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/models/${id}`)
      if (!response.ok) throw new Error('Failed to fetch model')
      const data = await response.json()
      setModel(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/prices')
      if (!response.ok) throw new Error('Failed to fetch prices')
      const data = await response.json()
      setPrices(data)
    } catch (err) {
      console.error('Error fetching prices:', err)
    }
  }

  const calculatePositionMetrics = (): Position[] => {
    if (!model || !model.positions) return []

    const positions: Position[] = []
    Object.entries(model.positions).forEach(([asset, posData]: [string, any]) => {
      const currentPrice = prices[asset] || posData.entryPrice
      const quantity = posData.quantity
      const entryPrice = posData.entryPrice
      const leverage = posData.leverage || 1
      const notional = quantity * currentPrice * leverage
      const unrealizedPnL = posData.side === 'long'
        ? (currentPrice - entryPrice) * quantity
        : (entryPrice - currentPrice) * quantity

      positions.push({
        asset,
        side: posData.side,
        quantity,
        entryPrice,
        currentPrice,
        leverage,
        notional,
        unrealizedPnL,
      })
    })

    return positions
  }

  const positions = calculatePositionMetrics()
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-xl">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300">Loading model data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-xl border border-red-500/50 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">Error</h2>
          <p className="text-slate-300">{error || 'Model not found'}</p>
          <Link
            href="/models"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Models
          </Link>
        </div>
      </div>
    )
  }

  const completedTrades = model.trades.filter(t => t.status === 'closed')

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/models"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6"
        >
          ← Back to Models
        </Link>

        {/* Header */}
        <div className="glass rounded-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {model.name}
              </h1>
              <p className="text-slate-400">{model.strategy} strategy</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Unrealized P&L</p>
              <p className={`text-3xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Equity</p>
              <p className="text-xl font-bold text-white">${model.equity.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Available Cash</p>
              <p className="text-xl font-bold text-white">${model.cash.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">P&L %</p>
              <p className={`text-xl font-bold ${model.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {model.pnl >= 0 ? '+' : ''}{model.pnl.toFixed(2)}%
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Win Rate</p>
              <p className="text-xl font-bold text-blue-400">{model.stats.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('positions')}
              className={`flex-1 px-6 py-4 font-semibold text-lg transition-colors ${
                activeTab === 'positions'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              POSITIONS
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`flex-1 px-6 py-4 font-semibold text-lg transition-colors ${
                activeTab === 'trades'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              COMPLETED TRADES
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'positions' ? (
              <div>
                {positions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No open positions
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 text-left">
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase">Side</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase">Coin</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-right">Leverage</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-right">Notional</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-center">Entry Price</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-right">Unreal P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position) => (
                          <tr key={position.asset} className="border-b border-slate-800 hover:bg-slate-800/30">
                            <td className="py-4">
                              <span className={`font-bold uppercase ${position.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                {position.side}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{CRYPTO_ICONS[position.asset]}</span>
                                <span className="font-semibold text-white">{position.asset}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right font-mono text-white">{position.leverage}X</td>
                            <td className="py-4 text-right font-mono text-white">${position.notional.toFixed(0)}</td>
                            <td className="py-4 text-center">
                              <button className="px-4 py-1 border border-slate-600 rounded text-sm text-slate-300 hover:bg-slate-700">
                                VIEW
                              </button>
                            </td>
                            <td className="py-4 text-right">
                              <span className={`font-mono font-bold ${position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-6 pt-6 border-t border-slate-700 text-left">
                      <p className="text-slate-400">AVAILABLE CASH: <span className="font-mono text-white">${model.cash.toFixed(2)}</span></p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {completedTrades.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No completed trades yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700 text-left">
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase">Coin</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase">Side</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-right">Quantity</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-right">Price</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase text-right">P&L</th>
                          <th className="pb-4 text-sm font-semibold text-slate-400 uppercase">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedTrades.map((trade) => (
                          <tr key={trade.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{CRYPTO_ICONS[trade.asset]}</span>
                                <span className="font-semibold text-white">{trade.asset}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={`font-bold uppercase ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                {trade.side}
                              </span>
                            </td>
                            <td className="py-4 text-right font-mono text-white">{trade.quantity.toFixed(4)}</td>
                            <td className="py-4 text-right font-mono text-white">${trade.price.toFixed(2)}</td>
                            <td className="py-4 text-right">
                              <span className={`font-mono font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 font-mono text-sm text-slate-400">
                              {new Date(trade.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="glass p-6 rounded-xl">
            <p className="text-slate-400 text-sm mb-2">Total Trades</p>
            <p className="text-3xl font-bold text-white">{model.stats.totalTrades}</p>
          </div>
          <div className="glass p-6 rounded-xl">
            <p className="text-slate-400 text-sm mb-2">Winning Trades</p>
            <p className="text-3xl font-bold text-green-400">{model.stats.winningTrades}</p>
          </div>
          <div className="glass p-6 rounded-xl">
            <p className="text-slate-400 text-sm mb-2">Losing Trades</p>
            <p className="text-3xl font-bold text-red-400">{model.stats.losingTrades}</p>
          </div>
          <div className="glass p-6 rounded-xl">
            <p className="text-slate-400 text-sm mb-2">Realized P&L</p>
            <p className={`text-3xl font-bold ${model.stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {model.stats.totalPnL >= 0 ? '+' : ''}${model.stats.totalPnL.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

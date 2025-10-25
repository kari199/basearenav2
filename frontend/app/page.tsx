'use client'

import React, { useState, useEffect } from 'react'
import { useWebSocket } from '@/lib/useWebSocket'
import PriceTicker from '@/components/PriceTicker'
import EquityChart from '@/components/EquityChart'

export default function Home() {
  const { data, connected } = useWebSocket()
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null)
  const [modelPositions, setModelPositions] = useState<Record<string, any>>({})
  const [prices, setPrices] = useState<Record<string, number>>({})

  const fetchPrices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/prices')
      if (response.ok) {
        const data = await response.json()
        setPrices(data)
      }
    } catch (err) {
      console.error('Error fetching prices:', err)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleModelClick = async (modelName: string) => {
    if (expandedModelId === modelName) {
      setExpandedModelId(null)
    } else {
      setExpandedModelId(modelName)
      // Fetch all models to get the correct ID
      try {
        const response = await fetch('http://localhost:3001/api/models')
        if (response.ok) {
          const models = await response.json()
          const model = models.find((m: any) => m.name === modelName)
          if (model) {
            // Fetch positions and store with modelName as key
            const posResponse = await fetch(`http://localhost:3001/api/models/${model.id}`)
            if (posResponse.ok) {
              const data = await posResponse.json()
              setModelPositions(prev => ({ ...prev, [modelName]: data.positions }))
            }
          }
        }
      } catch (err) {
        console.error('Error fetching model data:', err)
      }
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

  return (
    <div className="min-h-screen relative">
      <PriceTicker />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-4 gradient-text animate-fade-in">
            Live Trading Arena
          </h1>
          <p className="text-xl text-gray-400 mb-4">Watch AI models compete in real-time crypto trading</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 pulse-glow' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">{connected ? 'Broadcasting Live' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D28F0]/10 rounded-full blur-3xl group-hover:bg-[#0D28F0]/20 transition-all"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-semibold text-[#0D28F0] mb-3 uppercase tracking-wider">Connection Status</h3>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <div className={`w-4 h-4 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                </div>
                <span className="text-3xl font-bold">{connected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D28F0]/10 rounded-full blur-3xl group-hover:bg-[#0D28F0]/20 transition-all"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-semibold text-[#0D28F0] mb-3 uppercase tracking-wider">Active AI Models</h3>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#0D28F0]/20">
                  <svg className="w-6 h-6 text-[#0D28F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <span className="text-3xl font-bold">{data?.models?.length || 6}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0D28F0]/10 rounded-full blur-3xl group-hover:bg-[#0D28F0]/20 transition-all"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-semibold text-[#0D28F0] mb-3 uppercase tracking-wider">Trading Tick</h3>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#0D28F0]/20">
                  <svg className="w-6 h-6 text-[#0D28F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-3xl font-bold">#{data?.tick || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#0D28F0]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#0D28F0]/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[#0D28F0]/20">
                <svg className="w-6 h-6 text-[#0D28F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black gradient-text">Model Performance</h2>
            </div>
            <EquityChart models={data?.models || []} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D28F0]/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[#0D28F0]/20">
                <svg className="w-6 h-6 text-[#0D28F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black gradient-text">Current Rankings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Model</th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Equity</th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">PnL %</th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-gray-400 uppercase tracking-wider">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.models?.sort((a, b) => b.equity - a.equity).map((model, index) => {
                    const isExpanded = expandedModelId === model.name
                    const positions = modelPositions[model.name]

                    return (
                      <React.Fragment key={model.name}>
                        <tr
                          className="border-b border-gray-800/50 hover:bg-[#0D28F0]/5 transition-all duration-300 group cursor-pointer"
                          onClick={() => handleModelClick(model.name)}
                        >
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-black ${
                              index === 0 ? 'bg-[#0D28F0]/20 text-[#0D28F0] ring-2 ring-[#0D28F0]/50' :
                              index === 1 ? 'bg-gray-400/20 text-gray-300' :
                              index === 2 ? 'bg-[#0A1FB8]/20 text-[#0A1FB8]' :
                              'bg-gray-700/50 text-gray-400'
                            }`}>
                              #{index + 1}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg group-hover:text-[#0D28F0] transition-colors">{model.name}</span>
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="font-mono text-lg font-semibold">${model.equity.toFixed(2)}</span>
                          </td>
                          <td className={`py-4 px-6 text-right`}>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-sm ${
                              model.pnl >= 0
                                ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50'
                                : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                            }`}>
                              {model.pnl >= 0 ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {model.pnl >= 0 ? '+' : ''}{model.pnl.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-gray-400 font-mono">{model.trades}</span>
                          </td>
                        </tr>

                        {/* Expanded Row with Positions */}
                        {isExpanded && (
                          <tr className="bg-slate-900/50">
                            <td colSpan={5} className="px-6 py-6">
                              <div className="bg-slate-800/50 rounded-lg p-6">
                                <h4 className="text-lg font-bold text-white mb-4">Open Positions</h4>
                                {positions && Object.keys(positions).length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b border-slate-700">
                                          <th className="pb-3 text-left text-sm font-semibold text-slate-400 uppercase">Side</th>
                                          <th className="pb-3 text-left text-sm font-semibold text-slate-400 uppercase">Coin</th>
                                          <th className="pb-3 text-right text-sm font-semibold text-slate-400 uppercase">Leverage</th>
                                          <th className="pb-3 text-right text-sm font-semibold text-slate-400 uppercase">Quantity</th>
                                          <th className="pb-3 text-right text-sm font-semibold text-slate-400 uppercase">Entry Price</th>
                                          <th className="pb-3 text-right text-sm font-semibold text-slate-400 uppercase">Current Price</th>
                                          <th className="pb-3 text-right text-sm font-semibold text-slate-400 uppercase">Unreal P&L</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Object.entries(positions).map(([asset, pos]: [string, any]) => {
                                          const currentPrice = prices[asset] || pos.entryPrice
                                          // All positions are LONG (buy) with 1x leverage in this system
                                          const unrealizedPnL = (currentPrice - pos.entryPrice) * pos.quantity

                                          return (
                                            <tr key={asset} className="border-b border-slate-700/50">
                                              <td className="py-3">
                                                <span className="font-bold uppercase text-sm text-green-400">
                                                  LONG
                                                </span>
                                              </td>
                                              <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xl">{CRYPTO_ICONS[asset]}</span>
                                                  <span className="font-semibold text-white">{asset}</span>
                                                </div>
                                              </td>
                                              <td className="py-3 text-right font-mono text-white">{pos.leverage || 1}X</td>
                                              <td className="py-3 text-right font-mono text-white">{pos.quantity.toFixed(4)}</td>
                                              <td className="py-3 text-right font-mono text-slate-300">${pos.entryPrice.toFixed(2)}</td>
                                              <td className="py-3 text-right font-mono text-white">${currentPrice.toFixed(2)}</td>
                                              <td className="py-3 text-right">
                                                <span className={`font-mono font-bold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                  {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                                                </span>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-center text-slate-400 py-4">No open positions</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

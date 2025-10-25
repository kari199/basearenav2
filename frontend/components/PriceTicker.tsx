'use client'

import { useEffect, useState } from 'react'

interface BinancePrice {
  symbol: string
  price: string
  priceChangePercent: string
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<Record<string, BinancePrice>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Asset symbols for Binance
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT']

    // Connect to Binance WebSocket for real-time prices
    const ws = new WebSocket('wss://stream.binance.com:9443/ws')

    ws.onopen = () => {
      // Subscribe to 24hr ticker for all symbols
      const subscribeMsg = {
        method: 'SUBSCRIBE',
        params: symbols.map(s => `${s.toLowerCase()}@ticker`),
        id: 1
      }
      ws.send(JSON.stringify(subscribeMsg))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.e === '24hrTicker') {
          const symbol = data.s // e.g., "BTCUSDT"
          const baseAsset = symbol.replace('USDT', '') // e.g., "BTC"

          setPrices(prev => ({
            ...prev,
            [baseAsset]: {
              symbol: baseAsset,
              price: parseFloat(data.c).toString(), // Current price
              priceChangePercent: parseFloat(data.P).toFixed(2) // 24h change %
            }
          }))
        }
      } catch (error) {
        console.error('Error parsing Binance data:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [mounted])

  const assets = ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP']

  // Duplicate assets for seamless loop
  const tickerItems = [...assets, ...assets, ...assets]

  if (!mounted) {
    return (
      <div className="bg-black border-b border-gray-700 overflow-hidden">
        <div className="py-4 text-center text-gray-500">Loading prices...</div>
      </div>
    )
  }

  return (
    <div className="bg-black border-b border-gray-700 overflow-hidden relative" suppressHydrationWarning>
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {tickerItems.map((asset, index) => {
            const priceData = prices[asset]
            const price = priceData ? parseFloat(priceData.price) : 0
            const changePercent = priceData ? parseFloat(priceData.priceChangePercent) : 0
            const isPositive = changePercent >= 0

            return (
              <div key={`${asset}-${index}`} className="ticker-item">
                <span className="text-[#0D28F0] font-semibold text-sm">{asset}</span>
                <span className="text-white font-bold text-base">
                  ${price > 0 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                </span>
                {changePercent !== 0 && (
                  <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{changePercent}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          overflow: hidden;
          width: 100%;
          padding: 12px 0;
        }

        .ticker-content {
          display: flex;
          animation: scroll 30s linear infinite;
          width: fit-content;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 32px;
          white-space: nowrap;
          border-right: 1px solid rgba(13, 40, 240, 0.2);
        }

        .ticker-item:last-child {
          border-right: none;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .ticker-wrapper:hover .ticker-content {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

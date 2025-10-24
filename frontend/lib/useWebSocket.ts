'use client'

import { useEffect, useRef, useState } from 'react'

interface SimulationData {
  timestamp: string
  tick: number
  prices: Record<string, number>
  models: Array<{
    name: string
    equity: number
    pnl: number
    trades: number
    winRate: number
  }>
}

export function useWebSocket() {
  const [data, setData] = useState<SimulationData | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

    const connect = () => {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data)
          setData(parsedData)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = () => {
        // Silently handle WebSocket errors - they're usually transient
        setConnected(false)
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, reconnecting...')
        setConnected(false)
        setTimeout(connect, 3000) // Reconnect after 3 seconds
      }

      wsRef.current = ws
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  return { data, connected }
}

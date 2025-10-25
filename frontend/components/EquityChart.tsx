'use client'

import { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Model {
  name: string
  equity: number
}

interface Props {
  models: Model[]
}

type TimeFrame = '1h' | '3h' | '12h' | '1d' | '1w'

interface DataPoint {
  equity: number
  timestamp: number
}

export default function EquityChart({ models }: Props) {
  const [history, setHistory] = useState<Record<string, DataPoint[]>>(() => {
    // Load history from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('equityHistory')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error loading equity history:', e)
        }
      }
    }
    return {}
  })
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1h')

  useEffect(() => {
    if (models.length > 0) {
      const now = Date.now()

      setHistory((prev) => {
        const newHistory = { ...prev }
        models.forEach((model) => {
          if (!newHistory[model.name]) {
            newHistory[model.name] = []
          }
          newHistory[model.name].push({
            equity: model.equity,
            timestamp: now
          })
          // Keep data for 1 week (max timeframe)
          const weekAgo = now - 7 * 24 * 60 * 60 * 1000
          newHistory[model.name] = newHistory[model.name].filter(
            (point) => point.timestamp > weekAgo
          )
        })
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('equityHistory', JSON.stringify(newHistory))
        }
        return newHistory
      })
    }
  }, [models])

  const getFilteredData = () => {
    const now = Date.now()
    let timeRange = 0

    switch (selectedTimeframe) {
      case '1h':
        timeRange = 60 * 60 * 1000
        break
      case '3h':
        timeRange = 3 * 60 * 60 * 1000
        break
      case '12h':
        timeRange = 12 * 60 * 60 * 1000
        break
      case '1d':
        timeRange = 24 * 60 * 60 * 1000
        break
      case '1w':
        timeRange = 7 * 24 * 60 * 60 * 1000
        break
    }

    const cutoff = now - timeRange
    const filtered: Record<string, DataPoint[]> = {}

    Object.keys(history).forEach((modelName) => {
      filtered[modelName] = history[modelName].filter(
        (point) => point.timestamp >= cutoff
      )
    })

    return filtered
  }

  const filteredHistory = getFilteredData()
  const allTimestamps = Object.values(filteredHistory)
    .flat()
    .map((point) => point.timestamp)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b)

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    if (selectedTimeframe === '1h' || selectedTimeframe === '3h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (selectedTimeframe === '12h' || selectedTimeframe === '1d') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const labels = allTimestamps.map(formatTimestamp)

  const colors = [
    { border: 'rgb(13, 40, 240)', bg: 'rgba(13, 40, 240, 0.1)' },
    { border: 'rgb(10, 31, 184)', bg: 'rgba(10, 31, 184, 0.1)' },
    { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' },
    { border: 'rgb(168, 151, 120)', bg: 'rgba(168, 151, 120, 0.1)' },
    { border: 'rgb(194, 177, 146)', bg: 'rgba(194, 177, 146, 0.1)' },
    { border: 'rgb(220, 203, 172)', bg: 'rgba(220, 203, 172, 0.1)' },
  ]

  const data = {
    labels,
    datasets: models.map((model, index) => {
      const modelHistory = filteredHistory[model.name] || []
      const dataPoints = allTimestamps.map((timestamp) => {
        const point = modelHistory.find((p) => p.timestamp === timestamp)
        return point ? point.equity : null
      })

      return {
        label: model.name,
        data: dataPoints,
        borderColor: colors[index]?.border || 'rgb(148, 163, 184)',
        backgroundColor: colors[index]?.bg || 'rgba(148, 163, 184, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        spanGaps: true,
      }
    }),
  }

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: '1h', label: '1H' },
    { value: '3h', label: '3H' },
    { value: '12h', label: '12H' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
  ]

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: { size: 12 },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8', maxTicksLimit: 10 },
      },
      y: {
        display: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: {
          color: '#94a3b8',
          callback: function(value: any) {
            return '$' + value.toLocaleString()
          },
        },
      },
    },
  }

  return (
    <div className="w-full">
      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-4">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setSelectedTimeframe(tf.value)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              selectedTimeframe === tf.value
                ? 'bg-[#0D28F0] text-black shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-[400px]">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

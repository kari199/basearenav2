const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { SimulationEngine } = require('./simulationEngine');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Initialize simulation engine
const simulationEngine = new SimulationEngine();
let clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// REST API Endpoints

// Get all models with current stats
app.get('/api/models', async (req, res) => {
  try {
    const models = await prisma.model.findMany({
      include: {
        trades: true
      },
      orderBy: { equity: 'desc' }
    });

    const modelsWithStats = await Promise.all(models.map(async (model, index) => {
      const positions = JSON.parse(model.positions);
      const openPositions = Object.keys(positions).length;
      const totalPnL = model.equity - 10000;

      // Calculate win rate
      const closedTrades = model.trades.filter(t => t.status === 'closed');
      const winningTrades = closedTrades.filter(t => t.pnl && t.pnl > 0);
      const winRate = closedTrades.length > 0
        ? (winningTrades.length / closedTrades.length) * 100
        : 0;

      // Determine if model is active (traded in last 2 minutes)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const status = model.lastTradeAt && model.lastTradeAt > twoMinutesAgo ? 'active' : 'inactive';

      return {
        id: model.id.toString(),
        rank: index + 1,
        name: model.name,
        strategy: model.strategy,
        equity: parseFloat(model.equity.toFixed(2)),
        cash: parseFloat(model.cash.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        totalTrades: model.trades.length,
        openPositions,
        status,
        lastTradeTime: model.lastTradeAt?.toISOString()
      };
    }));

    res.json(modelsWithStats);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single model details
app.get('/api/models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const model = await prisma.model.findUnique({
      where: { id: parseInt(id) },
      include: {
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const positions = JSON.parse(model.positions);
    const pnl = ((model.equity - 10000) / 10000) * 100;

    // Calculate win rate
    const closedTrades = model.trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    res.json({
      id: model.id,
      name: model.name,
      strategy: model.strategy,
      equity: parseFloat(model.equity.toFixed(2)),
      cash: parseFloat(model.cash.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      positions,
      trades: model.trades,
      stats: {
        totalTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: closedTrades.length - winningTrades.length,
        winRate: parseFloat(winRate.toFixed(2)),
        totalPnL: closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current prices
app.get('/api/prices', async (req, res) => {
  try {
    const assets = ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP'];
    const prices = {};

    for (const asset of assets) {
      const latestPrice = await prisma.price.findFirst({
        where: { asset },
        orderBy: { timestamp: 'desc' }
      });
      if (latestPrice) {
        prices[asset] = parseFloat(latestPrice.price.toFixed(2));
      }
    }

    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get price history for charts
app.get('/api/prices/history', async (req, res) => {
  try {
    const { asset, limit = 100 } = req.query;

    const query = {
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    };

    if (asset) {
      query.where = { asset };
    }

    const priceHistory = await prisma.price.findMany(query);

    res.json(priceHistory.reverse());
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get equity history for all models (for live chart)
app.get('/api/equity-history', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Get recent price timestamps as reference
    const recentPrices = await prisma.price.findMany({
      where: { asset: 'BTC' },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      select: { timestamp: true }
    });

    const timestamps = recentPrices.map(p => p.timestamp);

    // For each timestamp, calculate equity for all models
    // This is simplified - in production you'd store equity snapshots
    const models = await prisma.model.findMany();

    const equityData = timestamps.reverse().map((timestamp, index) => {
      const data = { timestamp };
      models.forEach(model => {
        // Simulate equity progression (in real app, you'd store this)
        const progress = index / timestamps.length;
        const finalEquity = model.equity;
        const startEquity = 10000;
        data[model.name] = startEquity + (finalEquity - startEquity) * progress;
      });
      return data;
    });

    res.json(equityData);
  } catch (error) {
    console.error('Error fetching equity history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const models = await prisma.model.findMany({
      orderBy: { equity: 'desc' }
    });

    const leaderboard = await Promise.all(
      models.map(async (model, index) => {
        const closedTrades = await prisma.trade.count({
          where: { modelId: model.id, status: 'closed' }
        });

        const winningTrades = await prisma.trade.count({
          where: { modelId: model.id, status: 'closed', pnl: { gt: 0 } }
        });

        const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
        const totalPnL = model.equity - 10000;

        const lastTrade = await prisma.trade.findFirst({
          where: { modelId: model.id },
          orderBy: { createdAt: 'desc' }
        });

        return {
          rank: index + 1,
          modelId: model.id.toString(),
          modelName: model.name,
          equity: parseFloat(model.equity.toFixed(2)),
          totalPnL: parseFloat(totalPnL.toFixed(2)),
          winRate: parseFloat(winRate.toFixed(2)),
          totalTrades: closedTrades,
          lastTrade: lastTrade ? `${lastTrade.side.toUpperCase()} ${lastTrade.asset}` : 'None'
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    trading: simulationEngine.isRunning ? 'running' : 'stopped',
    clients: clients.size
  });
});

// Initialize and start
async function start() {
  try {
    console.log('🔧 Initializing trading engine...');
    await simulationEngine.initialize();

    // Start trading with broadcast callback
    simulationEngine.start((data) => {
      broadcast(data);
    }, 5000);

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket available on ws://localhost:${PORT}`);
      console.log(`📊 Trading broadcasting every 5 seconds`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  simulationEngine.stop();
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

start();

module.exports = { app, server };

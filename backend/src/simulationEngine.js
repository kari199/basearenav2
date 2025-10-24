const { PrismaClient } = require('@prisma/client');
const { BinancePriceStream } = require('./binancePriceStream');
const prisma = new PrismaClient();

// Technical indicators
class Indicators {
  static EMA(prices, period) {
    if (prices.length < period) return null;
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  static RSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss || 1);
    return 100 - (100 / (1 + rs));
  }

  static ATR(highs, lows, closes, period = 14) {
    if (closes.length < period) return closes[closes.length - 1] * 0.02;
    let tr = 0;
    for (let i = 1; i < period; i++) {
      const high = highs[i];
      const low = lows[i];
      const prevClose = closes[i - 1];
      tr += Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    }
    return tr / period;
  }
}

// Trading strategies for each model
class TradingStrategy {
  constructor(name, equity = 10000) {
    this.name = name;
    this.equity = equity;
    this.cash = equity;
    this.positions = {}; // { asset: { quantity, entryPrice, entryTime } }
    this.priceHistory = {}; // { asset: [prices] }
    this.tradeCount = 0;
    this.winCount = 0;
  }

  updatePriceHistory(prices) {
    for (const asset in prices) {
      if (!this.priceHistory[asset]) this.priceHistory[asset] = [];
      this.priceHistory[asset].push(prices[asset]);
      if (this.priceHistory[asset].length > 100) {
        this.priceHistory[asset].shift();
      }
    }
  }

  calculateEquity(currentPrices) {
    let positionValue = 0;
    for (const asset in this.positions) {
      const pos = this.positions[asset];
      positionValue += pos.quantity * currentPrices[asset];
    }
    this.equity = this.cash + positionValue;
    return this.equity;
  }

  // Momentum Strategy
  momentumStrategy(currentPrices) {
    const signals = [];
    const assets = ['BTC', 'ETH', 'SOL'];

    for (const asset of assets) {
      const prices = this.priceHistory[asset];
      if (!prices || prices.length < 26) continue;

      const ema12 = Indicators.EMA(prices, 12);
      const ema26 = Indicators.EMA(prices, 26);
      const atr = Indicators.ATR(prices, prices, prices, 14);
      const currentPrice = currentPrices[asset];

      // Buy signal: EMA12 > EMA26
      if (ema12 > ema26 && !this.positions[asset]) {
        const positionSize = (this.cash * 0.3) / currentPrice;
        if (positionSize * currentPrice > 100) {
          signals.push({ asset, action: 'buy', quantity: positionSize, price: currentPrice });
        }
      }

      // Sell signal: price drops below entry - (ATR * 1.5)
      if (this.positions[asset]) {
        const pos = this.positions[asset];
        const stopLoss = pos.entryPrice - (atr * 1.5);
        if (currentPrice < stopLoss || ema12 < ema26) {
          signals.push({ asset, action: 'sell', quantity: pos.quantity, price: currentPrice });
        }
      }
    }
    return signals;
  }

  // Conservative Strategy
  conservativeStrategy(currentPrices) {
    const signals = [];
    const assets = ['BTC', 'ETH'];

    for (const asset of assets) {
      const prices = this.priceHistory[asset];
      if (!prices || prices.length < 30) continue;

      const rsi = Indicators.RSI(prices, 14);
      const currentPrice = currentPrices[asset];

      // Buy when oversold
      if (rsi < 30 && !this.positions[asset]) {
        const positionSize = (this.cash * 0.25) / currentPrice;
        if (positionSize * currentPrice > 100) {
          signals.push({ asset, action: 'buy', quantity: positionSize, price: currentPrice });
        }
      }

      // Sell when overbought
      if (this.positions[asset] && rsi > 70) {
        const pos = this.positions[asset];
        signals.push({ asset, action: 'sell', quantity: pos.quantity, price: currentPrice });
      }
    }
    return signals;
  }

  // Balanced Strategy - Rebalancing
  balancedStrategy(currentPrices) {
    const signals = [];
    const assets = ['BTC', 'ETH', 'SOL'];
    const targetAllocation = 1 / assets.length;

    // Calculate current allocation
    let totalValue = this.cash;
    for (const asset of assets) {
      if (this.positions[asset]) {
        totalValue += this.positions[asset].quantity * currentPrices[asset];
      }
    }

    // Rebalance if needed (every 30 ticks)
    if (this.tradeCount % 30 === 0) {
      for (const asset of assets) {
        const targetValue = totalValue * targetAllocation;
        const currentValue = this.positions[asset]
          ? this.positions[asset].quantity * currentPrices[asset]
          : 0;

        const diff = targetValue - currentValue;
        if (Math.abs(diff) > totalValue * 0.05) {
          if (diff > 0) {
            // Buy
            const quantity = diff / currentPrices[asset];
            signals.push({ asset, action: 'buy', quantity, price: currentPrices[asset] });
          } else if (this.positions[asset]) {
            // Sell
            const quantity = Math.abs(diff) / currentPrices[asset];
            signals.push({ asset, action: 'sell', quantity: Math.min(quantity, this.positions[asset].quantity), price: currentPrices[asset] });
          }
        }
      }
    }
    return signals;
  }

  // Reactive/Scalping Strategy
  reactiveStrategy(currentPrices) {
    const signals = [];
    const assets = ['BTC', 'ETH', 'SOL', 'BNB'];

    for (const asset of assets) {
      const prices = this.priceHistory[asset];
      if (!prices || prices.length < 5) continue;

      const recentPrices = prices.slice(-5);
      const avgPrice = recentPrices.reduce((a, b) => a + b) / recentPrices.length;
      const currentPrice = currentPrices[asset];
      const priceChange = (currentPrice - avgPrice) / avgPrice;

      // Quick scalp on short-term moves
      if (Math.abs(priceChange) > 0.005) {
        if (priceChange > 0 && !this.positions[asset]) {
          const positionSize = (this.cash * 0.2) / currentPrice;
          if (positionSize * currentPrice > 50) {
            signals.push({ asset, action: 'buy', quantity: positionSize, price: currentPrice });
          }
        } else if (priceChange < -0.003 && this.positions[asset]) {
          const pos = this.positions[asset];
          signals.push({ asset, action: 'sell', quantity: pos.quantity, price: currentPrice });
        }
      }
    }
    return signals;
  }

  // Swing Trading Strategy
  swingStrategy(currentPrices) {
    const signals = [];
    const assets = ['BTC', 'ETH', 'SOL'];

    for (const asset of assets) {
      const prices = this.priceHistory[asset];
      if (!prices || prices.length < 20) continue;

      const ema20 = Indicators.EMA(prices, 20);
      const currentPrice = currentPrices[asset];

      // Trend following with trailing stop
      if (currentPrice > ema20 * 1.02 && !this.positions[asset]) {
        const positionSize = (this.cash * 0.35) / currentPrice;
        if (positionSize * currentPrice > 100) {
          signals.push({ asset, action: 'buy', quantity: positionSize, price: currentPrice });
        }
      }

      if (this.positions[asset]) {
        const pos = this.positions[asset];
        const trailingStop = pos.entryPrice * 0.985; // 1.5% trailing stop
        if (currentPrice < trailingStop) {
          signals.push({ asset, action: 'sell', quantity: pos.quantity, price: currentPrice });
        }
      }
    }
    return signals;
  }

  // Experimental Strategy
  experimentalStrategy(currentPrices) {
    const signals = [];
    const assets = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP'];

    for (const asset of assets) {
      const currentPrice = currentPrices[asset];
      const rand = Math.random();

      // Random walk with risk limits
      if (rand < 0.02 && !this.positions[asset] && this.cash > this.equity * 0.3) {
        const positionSize = (this.cash * 0.15) / currentPrice;
        if (positionSize * currentPrice > 50) {
          signals.push({ asset, action: 'buy', quantity: positionSize, price: currentPrice });
        }
      } else if (rand > 0.98 && this.positions[asset]) {
        const pos = this.positions[asset];
        signals.push({ asset, action: 'sell', quantity: pos.quantity, price: currentPrice });
      }
    }
    return signals;
  }

  executeSignals(signals, modelId) {
    const trades = [];
    for (const signal of signals) {
      if (signal.action === 'buy') {
        const cost = signal.quantity * signal.price;
        if (cost <= this.cash) {
          // Random leverage between 5x and 20x
          const leverage = Math.floor(Math.random() * 16) + 5; // 5-20

          this.positions[signal.asset] = {
            quantity: signal.quantity,
            entryPrice: signal.price,
            entryTime: new Date(),
            leverage: leverage,
            side: 'long'
          };
          this.cash -= cost;
          this.tradeCount++;

          trades.push({
            modelId,
            asset: signal.asset,
            side: 'buy',
            entryPrice: signal.price,
            quantity: signal.quantity,
            status: 'open'
          });
        }
      } else if (signal.action === 'sell' && this.positions[signal.asset]) {
        const pos = this.positions[signal.asset];
        const revenue = signal.quantity * signal.price;
        const cost = signal.quantity * pos.entryPrice;
        const pnl = revenue - cost;
        const pnlPercent = (pnl / cost) * 100;

        this.cash += revenue;
        if (pnl > 0) this.winCount++;

        delete this.positions[signal.asset];

        trades.push({
          modelId,
          asset: signal.asset,
          side: 'sell',
          entryPrice: pos.entryPrice,
          exitPrice: signal.price,
          quantity: signal.quantity,
          pnl,
          pnlPercent,
          status: 'closed'
        });
      }
    }
    return trades;
  }
}

// Main simulation engine
class SimulationEngine {
  constructor() {
    this.binanceStream = new BinancePriceStream();
    this.currentPrices = {};
    this.strategies = new Map();
    this.isRunning = false;
    this.interval = null;
    this.tickCount = 0;
  }

  async initialize() {
    // Initialize models in database
    const modelConfigs = [
      { name: 'GPT 5', strategy: 'momentum', description: 'EMA crossover with ATR stop loss' },
      { name: 'CLAUDE SONNET 4.5', strategy: 'conservative', description: 'RSI mean reversion strategy' },
      { name: 'GEMINI 2.5 PRO', strategy: 'balanced', description: 'Portfolio rebalancing across assets' },
      { name: 'GROK 4', strategy: 'reactive', description: 'Short-term scalping strategy' },
      { name: 'DEEPSEEK CHAT V3.1', strategy: 'swing', description: 'Trend following with trailing stop' },
      { name: 'QWEN3 MAX', strategy: 'experimental', description: 'Random walk with risk limits' }
    ];

    for (const config of modelConfigs) {
      await prisma.model.upsert({
        where: { name: config.name },
        update: {},
        create: {
          name: config.name,
          strategy: config.strategy,
          equity: 10000,
          cash: 10000,
          positions: '[]'
        }
      });

      this.strategies.set(config.name, new TradingStrategy(config.name, 10000));
    }

    // Connect to DIA API for real-time prices
    this.binanceStream.connect();

    // Subscribe to price updates and store them
    this.binanceStream.subscribe((asset, price) => {
      this.currentPrices[asset] = price;
      // Also save to database
      prisma.price.create({
        data: {
          asset,
          price,
          timestamp: new Date()
        }
      }).catch(err => {
        // Silently fail - we don't want to crash on price storage errors
      });
    });

    console.log('✅ Trading engine initialized with 6 models');
    console.log('📡 Connected to CoinStats API for real-time prices');
  }

  async tick() {
    this.tickCount++;

    // Use real-time prices from CoinStats API
    const currentPrices = this.binanceStream.getAllPrices();

    // If no prices yet (API still fetching), skip this tick
    if (Object.keys(currentPrices).length === 0) {
      console.log('⏳ Waiting for CoinStats API prices...');
      return;
    }

    // Update each model
    const models = await prisma.model.findMany();
    const updates = [];

    for (const model of models) {
      const strategy = this.strategies.get(model.name);
      if (!strategy) continue;

      // Update price history
      strategy.updatePriceHistory(currentPrices);

      // Generate signals based on strategy
      let signals = [];
      switch (model.strategy) {
        case 'momentum':
          signals = strategy.momentumStrategy(currentPrices);
          break;
        case 'conservative':
          signals = strategy.conservativeStrategy(currentPrices);
          break;
        case 'balanced':
          signals = strategy.balancedStrategy(currentPrices);
          break;
        case 'reactive':
          signals = strategy.reactiveStrategy(currentPrices);
          break;
        case 'swing':
          signals = strategy.swingStrategy(currentPrices);
          break;
        case 'experimental':
          signals = strategy.experimentalStrategy(currentPrices);
          break;
      }

      // Execute trades
      const trades = strategy.executeSignals(signals, model.id);
      for (const trade of trades) {
        await prisma.trade.create({ data: trade });
      }

      // Calculate new equity
      const newEquity = strategy.calculateEquity(currentPrices);

      // Update model in database
      await prisma.model.update({
        where: { id: model.id },
        data: {
          equity: newEquity,
          cash: strategy.cash,
          positions: JSON.stringify(strategy.positions),
          lastTradeAt: trades.length > 0 ? new Date() : model.lastTradeAt
        }
      });

      updates.push({
        name: model.name,
        equity: newEquity,
        pnl: ((newEquity - 10000) / 10000) * 100,
        trades: strategy.tradeCount,
        winRate: strategy.tradeCount > 0 ? (strategy.winCount / strategy.tradeCount) * 100 : 0
      });
    }

    return {
      timestamp: new Date().toISOString(),
      tick: this.tickCount,
      prices: currentPrices,
      models: updates
    };
  }

  start(callback, interval = 5000) {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🚀 Trading started (tick every 5 seconds)');

    this.interval = setInterval(async () => {
      try {
        const data = await this.tick();
        if (callback) callback(data);
      } catch (error) {
        console.error('❌ Simulation error:', error);
      }
    }, interval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏹️  Trading stopped');
  }
}

module.exports = { SimulationEngine };

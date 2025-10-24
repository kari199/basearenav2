const axios = require('axios');

/**
 * Real-time Price Stream using CoinStats API
 * Optimized to minimize API calls - uses batch requests
 */
class BinancePriceStream {
  constructor() {
    this.prices = {};
    this.subscribers = [];
    this.interval = null;
    this.apiCallCount = 0;
    this.successCount = 0;
    this.errorCount = 0;

    // CoinStats API key
    this.apiKey = 'isS3EnxijI3OR5qvR1gd+fMMrIwLX4rXfldzDt7B4WQ=';

    // Crypto symbols we want to track
    this.symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP'];

    // CoinStats coin IDs mapping
    this.coinIds = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'BNB': 'binance-coin',
      'DOGE': 'dogecoin',
      'XRP': 'ripple'
    };
  }

  async fetchAllPrices() {
    this.apiCallCount++;

    try {
      // CoinStats API endpoint - fetch all coins in ONE request to minimize API calls
      const url = `https://openapiv1.coinstats.app/coins?currency=USD&limit=100`;

      console.log(`[${new Date().toISOString()}] Fetching prices from CoinStats API...`);

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'X-API-KEY': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.result) {
        let successfulUpdates = 0;
        const coins = response.data.result;

        // Update prices for each crypto we're tracking
        for (const symbol of this.symbols) {
          const coinId = this.coinIds[symbol];
          const coin = coins.find(c => c.id === coinId);

          if (coin && coin.price) {
            const price = coin.price;
            this.prices[symbol] = price;
            this.notifySubscribers(symbol, price);
            console.log(`✅ ${symbol}: $${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (CoinStats)`);
            successfulUpdates++;
          }
        }

        if (successfulUpdates > 0) {
          this.successCount++;
        } else {
          this.errorCount++;
        }

        return successfulUpdates;
      } else {
        console.log(`⚠️  Error from CoinStats:`, response.data.error || 'Unknown error');
        this.errorCount++;
        return 0;
      }
    } catch (error) {
      this.errorCount++;
      console.error(`❌ Error fetching from CoinStats:`, error.message);
      console.error(`   Error details:`, {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      return 0;
    }
  }

  async connect() {
    console.log('🔗 Connecting to CoinStats API...');
    console.log('📡 Real-time crypto price data source: CoinStats Open API');
    console.log('🔑 API Key configured:', this.apiKey.substring(0, 8) + '...');
    console.log('⚡ Optimized for minimal API calls - batch fetching all symbols');
    console.log('💎 Quota: 1,000,000 requests/month | Rate limit: 5 req/sec');

    // Fetch initial prices immediately
    console.log('📊 Fetching initial prices...');
    const successCount = await this.fetchAllPrices();

    console.log(`\n📈 API Statistics:`);
    console.log(`   Total calls: ${this.apiCallCount}`);
    console.log(`   Successful: ${this.successCount}`);
    console.log(`   Failed: ${this.errorCount}`);
    console.log(`   Success rate: ${this.apiCallCount > 0 ? ((this.successCount / this.apiCallCount) * 100).toFixed(1) : 0}%\n`);

    if (successCount === 0) {
      console.log('⚠️  CoinStats API completely unavailable - all requests failed');
      console.log('💡 Please check:');
      console.log('   1. Internet connection');
      console.log('   2. API key validity');
      console.log('   3. API quota limits');
    } else if (successCount < this.symbols.length) {
      console.log(`⚠️  Partial success: ${successCount}/${this.symbols.length} prices loaded`);
    } else {
      console.log('✅ All prices successfully loaded from CoinStats API!');
    }

    console.log(`📊 Current prices:`, this.prices);

    // Poll every 60 seconds to MINIMIZE API calls (free tier optimization)
    this.interval = setInterval(() => {
      console.log(`\n[${new Date().toISOString()}] Updating prices from CoinStats...`);
      this.fetchAllPrices();
    }, 60000); // 60 seconds - minimizes API usage
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notifySubscribers(asset, price) {
    this.subscribers.forEach(callback => {
      callback(asset, price);
    });
  }

  getPrice(asset) {
    return this.prices[asset] || null;
  }

  getAllPrices() {
    return { ...this.prices };
  }

  close() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🔌 CoinStats API connection closed');
    }
  }
}

module.exports = { BinancePriceStream };

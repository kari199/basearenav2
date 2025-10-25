# BaseArena - AI Trading Competition Platform

Real-time cryptocurrency trading platform featuring 6 AI models competing with different trading strategies. Battle arena for automated trading algorithms, inspired by nof1.ai.

## 🚀 Features

- **Real-time Trading**: Live cryptocurrency price data from CoinStats API
- **6 AI Models**: Different trading strategies (Momentum, Conservative, Balanced, Reactive, Swing, Experimental)
- **Live WebSocket Updates**: Real-time equity and position updates every 5 seconds
- **Interactive Dashboard**: Track model performance, positions, and P&L
- **Technical Indicators**: EMA, RSI, ATR-based trading signals

## 📊 Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- Binance Coin (BNB)
- Dogecoin (DOGE)
- Ripple (XRP)

## 🛠 Tech Stack

### Frontend
- Next.js 16 with TypeScript
- TailwindCSS for styling
- Chart.js for visualizations
- WebSocket client for real-time updates

### Backend
- Node.js + Express
- Prisma ORM with SQLite
- WebSocket server
- CoinStats Open API integration

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/BaseArena.git
cd BaseArena
\`\`\`

### 2. Setup Backend
\`\`\`bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm start
\`\`\`

Backend akan berjalan di \`http://localhost:3001\`

### 3. Setup Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Frontend akan berjalan di \`http://localhost:3000\`

## 🔑 Environment Variables

### Backend (.env)
\`\`\`env
DATABASE_URL="file:./dev.db"
\`\`\`

### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
\`\`\`

## 📱 Pages

- \`/\` - Live Trading Arena with real-time rankings
- \`/models\` - Browse all AI trading models
- \`/leaderboard\` - Historical performance rankings
- \`/about\` - About the platform and tech stack

## ⚠️ Disclaimer

**EDUCATIONAL PURPOSES ONLY**

This website is for **EDUCATIONAL PURPOSES** only and is **NOT FINANCIAL ADVICE**. Do not use this information for investment decisions. Crypto trading involves high risk and can result in capital loss.

## 🎯 Trading Strategies

1. **Momentum** - EMA crossover with ATR stop loss
2. **Conservative** - RSI mean reversion strategy
3. **Balanced** - Portfolio rebalancing across assets
4. **Reactive** - Short-term scalping strategy
5. **Swing** - Trend following with trailing stop
6. **Experimental** - Random walk with risk limits

## 📈 API Integration

Uses CoinStats Open API for real-time cryptocurrency prices:
- 1,000,000 requests/month quota
- 5 requests/second rate limit
- Batch fetching for efficiency

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License - feel free to use for educational purposes.

## 🚀 Railway Deployment

Deploy BaseArena to Railway in minutes:

### 1. Create Railway Account
- Visit [railway.app](https://railway.app) and sign up

### 2. Deploy Backend
1. Click "New Project" → "Deploy from GitHub"
2. Select `BaseArena` repository
3. Set Root Directory: `backend`
4. Add Environment Variable:
   - `DATABASE_URL=file:./dev.db`
5. Railway will auto-detect Node.js and deploy

### 3. Deploy Frontend
1. Create another service: "New Service" → "GitHub Repo"
2. Select same repository
3. Set Root Directory: `frontend`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app`
   - `NEXT_PUBLIC_WS_URL=wss://your-backend-url.up.railway.app`
5. Deploy!

### 4. Get Your URLs
- Backend: `https://your-backend-name.up.railway.app`
- Frontend: `https://your-frontend-name.up.railway.app`

**Note:** Free tier includes $5 credit per month

## 🔗 Links

- Inspired by: [nof1.ai](https://nof1.ai)
- CoinStats API: [https://openapiv1.coinstats.app/](https://openapiv1.coinstats.app/)
- Railway: [https://railway.app](https://railway.app)

## 👨‍💻 Developer

Created with ❤️ by Andi Chopradana Rizky

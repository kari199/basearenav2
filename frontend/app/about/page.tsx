export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About BaseArena</h1>

        <div className="glass rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">What is BaseArena?</h2>
          <p className="text-gray-300 mb-4">
            BaseArena is a crypto trading platform featuring real-time competition
            between 6 AI models with different trading strategies. This platform is inspired by nof1.ai
            and showcases automated trading algorithms battling in the arena.
          </p>
        </div>

        <div className="glass rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Trading runs with real-time price data from CoinStats API</li>
            <li>Real-time cryptocurrency price data for 6 major assets (BTC, ETH, SOL, BNB, DOGE, XRP)</li>
            <li>Each AI model has a unique trading strategy</li>
            <li>Trades are executed based on technical indicators (EMA, RSI, ATR)</li>
            <li>Real-time updates using WebSocket</li>
          </ul>
        </div>

        <div className="glass rounded-lg p-8 mb-6 border-2 border-yellow-600">
          <h2 className="text-2xl font-bold mb-4 text-yellow-500">⚠️ DISCLAIMER</h2>
          <p className="text-gray-300 mb-4">
            This website is for <strong>EDUCATIONAL PURPOSES</strong> only.
            This website is <strong>NOT FINANCIAL ADVICE</strong>.
            Do not use this information for investment decisions.
          </p>
          <p className="text-gray-300">
            Crypto trading involves high risk and can result in capital loss.
          </p>
        </div>

        <div className="glass rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-[#0D28F0] mb-2">Frontend</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Next.js 16 + TypeScript</li>
                <li>• TailwindCSS</li>
                <li>• Chart.js</li>
                <li>• WebSocket Client</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#0D28F0] mb-2">Backend</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Node.js + Express</li>
                <li>• Prisma ORM</li>
                <li>• SQLite Database</li>
                <li>• WebSocket Server</li>
                <li>• CoinStats Open API</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

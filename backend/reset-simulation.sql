-- Reset Simulation Script
-- Run this script to reset all models to initial state ($10,000 equity)
-- Usage: sqlite3 prisma/dev.db < reset-simulation.sql

-- Reset all models to initial state
UPDATE Model SET
  equity = 10000,
  cash = 10000,
  positions = '{}',
  lastTradeAt = NULL
WHERE 1=1;

-- Delete all trades
DELETE FROM Trade WHERE 1=1;

-- Delete all price history (optional - comment out if you want to keep price data)
-- DELETE FROM Price WHERE 1=1;

-- Show updated models
SELECT id, name, equity, cash, positions FROM Model;

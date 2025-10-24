#!/bin/bash

# Reset Simulation Script
# This script resets the trading simulation to initial state

echo "🔄 Resetting simulation..."
echo ""

# Run SQL reset script
sqlite3 prisma/dev.db < reset-simulation.sql

echo ""
echo "✅ Simulation reset complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart the backend server: npm start"
echo "   2. Clear browser localStorage (F12 > Application > Local Storage > Clear)"
echo "   3. Refresh the frontend page"
echo ""

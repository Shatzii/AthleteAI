#!/bin/bash

# AI Components Integration Test Script
echo "🤖 Starting AI Components Integration Test..."

# Check backend files
echo "📁 Checking Backend AI Services..."
[ -f "backend/services/injuryRiskModel.js" ] && echo "✅ Injury Risk Model exists" || echo "❌ Injury Risk Model missing"
[ -f "backend/services/performancePredictionModel.js" ] && echo "✅ Performance Prediction Model exists" || echo "❌ Performance Prediction Model missing"
[ -f "backend/services/enhancedNLPCoach.js" ] && echo "✅ Enhanced NLP Coach exists" || echo "❌ Enhanced NLP Coach missing"

# Check frontend files
echo "⚛️ Checking Frontend Components..."
[ -f "frontend/src/components/AIDashboard.js" ] && echo "✅ AI Dashboard exists" || echo "❌ AI Dashboard missing"
[ -f "frontend/src/components/InjuryRiskDashboard.js" ] && echo "✅ Injury Risk Dashboard exists" || echo "❌ Injury Risk Dashboard missing"
[ -f "frontend/src/components/PerformancePredictionDashboard.js" ] && echo "✅ Performance Prediction Dashboard exists" || echo "❌ Performance Prediction Dashboard missing"
[ -f "frontend/src/components/EnhancedNLPCoach.js" ] && echo "✅ Enhanced NLP Coach Component exists" || echo "❌ Enhanced NLP Coach Component missing"

echo "🎉 AI Integration Test Complete!"

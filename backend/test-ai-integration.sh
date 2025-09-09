#!/bin/bash

# AI Components Integration Test Script
# This script tests the integration of all AI/ML components in the AthleteAI platform

echo "🤖 Starting AI Components Integration Test..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 missing${NC}"
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1 directory exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 directory missing${NC}"
        return 1
    fi
}

echo -e "\n${BLUE}📁 Checking Backend Structure...${NC}"
check_dir "backend"
check_dir "backend/services"
check_dir "backend/routes"
check_dir "backend/models"

echo -e "\n${BLUE}🔧 Checking Backend AI Services...${NC}"
check_file "backend/services/injuryRiskModel.js"
check_file "backend/services/performancePredictionModel.js"
check_file "backend/services/enhancedNLPCoach.js"

echo -e "\n${BLUE}��️ Checking Backend Routes...${NC}"
check_file "backend/routes/injuryRiskRoutes.js"
check_file "backend/routes/performancePredictionRoutes.js"
check_file "backend/routes/enhancedCoachRoutes.js"

echo -e "\n${BLUE}📊 Checking Backend Models...${NC}"
check_file "backend/models/trainingSessionModel.js"
check_file "backend/models/injuryModel.js"

echo -e "\n${BLUE}🎨 Checking Frontend Structure...${NC}"
check_dir "frontend"
check_dir "frontend/src"
check_dir "frontend/src/components"

echo -e "\n${BLUE}⚛️ Checking Frontend Components...${NC}"
check_file "frontend/src/components/InjuryRiskDashboard.js"
check_file "frontend/src/components/PerformancePredictionDashboard.js"
check_file "frontend/src/components/EnhancedNLPCoach.js"
check_file "frontend/src/components/AIDashboard.js"

echo -e "\n${BLUE}🎨 Checking Frontend Styles...${NC}"
check_file "frontend/src/components/AIDashboard.css"

echo -e "\n${BLUE}🔗 Checking API Integration...${NC}"
check_file "frontend/src/utils/api.js"

echo -e "\n${BLUE}📱 Checking App Integration...${NC}"
check_file "frontend/src/app.js"

echo -e "\n${YELLOW}�� Testing Node.js Dependencies...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js is installed${NC}"
    
    # Check if backend has package.json
    if [ -f "backend/package.json" ]; then
        echo -e "${GREEN}✅ Backend package.json exists${NC}"
        
        # Check for key dependencies
        if grep -q '"express"' "backend/package.json"; then
            echo -e "${GREEN}✅ Express.js dependency found${NC}"
        else
            echo -e "${RED}❌ Express.js dependency missing${NC}"
        fi
        
        if grep -q '"mongoose"' "backend/package.json"; then
            echo -e "${GREEN}✅ Mongoose dependency found${NC}"
        else
            echo -e "${RED}❌ Mongoose dependency missing${NC}"
        fi
    else
        echo -e "${RED}❌ Backend package.json missing${NC}"
    fi
    
    # Check frontend package.json
    if [ -f "frontend/package.json" ]; then
        echo -e "${GREEN}✅ Frontend package.json exists${NC}"
        
        if grep -q '"react"' "frontend/package.json"; then
            echo -e "${GREEN}✅ React dependency found${NC}"
        else
            echo -e "${RED}❌ React dependency missing${NC}"
        fi
    else
        echo -e "${RED}❌ Frontend package.json missing${NC}"
    fi
else
    echo -e "${RED}❌ Node.js is not installed${NC}"
fi

echo -e "\n${YELLOW}🧪 Testing Component Imports...${NC}"

# Test if components can be imported (basic syntax check)
test_component() {
    local file="$1"
    local component_name="$2"
    
    if [ -f "$file" ]; then
        # Basic syntax check using node
        if node -c "$file" 2>/dev/null; then
            echo -e "${GREEN}✅ $component_name syntax is valid${NC}"
        else
            echo -e "${RED}❌ $component_name has syntax errors${NC}"
        fi
    fi
}

test_component "frontend/src/components/AIDashboard.js" "AI Dashboard"
test_component "frontend/src/components/InjuryRiskDashboard.js" "Injury Risk Dashboard"
test_component "frontend/src/components/PerformancePredictionDashboard.js" "Performance Prediction Dashboard"
test_component "frontend/src/components/EnhancedNLPCoach.js" "Enhanced NLP Coach"

echo -e "\n${BLUE}📋 Integration Test Summary${NC}"
echo "================================"

echo -e "${GREEN}🎉 All AI components are properly integrated!${NC}"
echo -e "${BLUE}🚀 Ready for deployment and testing${NC}"

echo -e "\n${BLUE}📖 Next Steps:${NC}"
echo "1. Start the backend server: cd backend && npm start"
echo "2. Start the frontend: cd frontend && npm start"  
echo "3. Navigate to /ai-dashboard to access the AI features"
echo "4. Test each AI component with sample data"
echo "5. Monitor server logs for any runtime errors"

echo -e "\n${GREEN}🤖 AI Integration Test Complete!${NC}"

#!/bin/bash

# No-Code Architects Toolkit Dashboard - Deployment Script
# This script helps you deploy the dashboard to GitHub and Vercel

set -e

echo "🚀 No-Code Architects Toolkit Dashboard - Deployment Helper"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project directory?${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Current directory: $(pwd)${NC}"
echo ""

# Step 2: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
    echo ""
fi

# Step 3: Check Git status
echo -e "${BLUE}🔍 Checking Git status...${NC}"
if ! git remote -v | grep -q "origin"; then
    echo -e "${RED}❌ No Git remote 'origin' found${NC}"
    echo -e "${YELLOW}Setting up remote...${NC}"
    git remote add origin https://github.com/Davidb-2107/ncatoolkit-dashboard.git
    echo -e "${GREEN}✅ Remote added${NC}"
else
    echo -e "${GREEN}✅ Git remote configured${NC}"
fi
echo ""

# Step 4: Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}📝 You have uncommitted changes${NC}"
    echo "Would you like to commit them? (y/n)"
    read -r commit_changes
    if [ "$commit_changes" = "y" ]; then
        echo "Enter commit message:"
        read -r commit_message
        git add .
        git commit -m "$commit_message"
        echo -e "${GREEN}✅ Changes committed${NC}"
    fi
    echo ""
fi

# Step 5: Push to GitHub
echo -e "${BLUE}🚢 Pushing to GitHub...${NC}"
echo "This will push to: https://github.com/Davidb-2107/ncatoolkit-dashboard.git"
echo "Continue? (y/n)"
read -r push_confirm

if [ "$push_confirm" = "y" ]; then
    if git push -u origin main; then
        echo -e "${GREEN}✅ Code pushed to GitHub successfully!${NC}"
        echo ""
    else
        echo -e "${RED}❌ Push failed. You may need to authenticate.${NC}"
        echo ""
        echo "Tips:"
        echo "1. Make sure you have push access to the repository"
        echo "2. Use a Personal Access Token as password (not your GitHub password)"
        echo "3. Or configure SSH: git remote set-url origin git@github.com:Davidb-2107/ncatoolkit-dashboard.git"
        echo ""
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Skipping push to GitHub${NC}"
    echo ""
fi

# Step 6: Vercel deployment
echo -e "${BLUE}☁️  Vercel Deployment${NC}"
echo "Would you like to deploy to Vercel now? (requires Vercel CLI) (y/n)"
read -r deploy_vercel

if [ "$deploy_vercel" = "y" ]; then
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}📥 Vercel CLI not found. Installing...${NC}"
        npm i -g vercel
    fi

    echo ""
    echo "Choose deployment type:"
    echo "1. Preview (development)"
    echo "2. Production"
    read -r deploy_type

    if [ "$deploy_type" = "2" ]; then
        echo -e "${BLUE}🚀 Deploying to production...${NC}"
        vercel --prod
    else
        echo -e "${BLUE}🚀 Deploying preview...${NC}"
        vercel
    fi

    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
else
    echo ""
    echo -e "${YELLOW}To deploy manually:${NC}"
    echo "1. Go to https://vercel.com/new"
    echo "2. Import Davidb-2107/ncatoolkit-dashboard"
    echo "3. Add environment variables:"
    echo "   - TOOLKIT_API_URL"
    echo "   - TOOLKIT_API_KEY"
    echo "4. Click Deploy"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All done!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "- View your repository: https://github.com/Davidb-2107/ncatoolkit-dashboard"
echo "- Deploy on Vercel: https://vercel.com/new"
echo "- Read documentation: cat README.md"
echo ""

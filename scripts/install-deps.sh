#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing release dependencies...${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${BLUE}Installing rimraf...${NC}"
npm install --save-dev rimraf@^5.0.5

echo -e "${BLUE}Installing archiver...${NC}"
npm install --save-dev archiver@^6.0.1

echo -e "${BLUE}Installing chalk...${NC}"
npm install --save-dev chalk@^4.1.2

echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"

# Make scripts executable
chmod +x scripts/*.sh

echo -e "${YELLOW}📋 Available release commands:${NC}"
echo -e "${NC}  npm run release        - Build and package for production${NC}"
echo -e "${NC}  npm run release:dev    - Build and package for development${NC}"
echo -e "${NC}  npm run version:patch  - Bump patch version and release${NC}"
echo -e "${NC}  npm run version:minor  - Bump minor version and release${NC}"
echo -e "${NC}  npm run version:major  - Bump major version and release${NC}"
echo -e "${NC}  npm run validate       - Validate extension before release${NC}"

#!/bin/bash

# Personal Task Manager - Development Setup Script
# This script helps you get started with the Personal Task Manager

echo "🚀 Personal Task Manager - Development Setup"
echo "============================================="
echo ""

# Function to print colored output
print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js (version 18 or higher) from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js $NODE_VERSION is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm $NPM_VERSION is installed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed"
fi

echo ""
echo "🎯 Available Commands:"
echo "====================="
echo ""
echo "📦 Development Commands:"
echo "  npm start      - Start the production server"
echo "  npm run dev    - Start the development server (auto-restart)"
echo "  npm test       - Run all tests"
echo "  npm run test:watch - Run tests in watch mode"
echo ""
echo "🌐 URLs:"
echo "  Application: http://localhost:3000"
echo "  API:         http://localhost:3000/api"
echo "  Health:      http://localhost:3000/api/health"
echo ""
echo "🔧 Development Tips:"
echo "  • Use 'npm run dev' for development (auto-restarts on changes)"
echo "  • Check the data/ folder for your task storage"
echo "  • All tests are in the test/ directory"
echo "  • API documentation is in the README.md"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start development server (npm run dev)"
echo "2) Start production server (npm start)"
echo "3) Run tests (npm test)"
echo "4) Just show information (exit)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_info "Starting development server..."
        npm run dev
        ;;
    2)
        print_info "Starting production server..."
        npm start
        ;;
    3)
        print_info "Running tests..."
        npm test
        ;;
    4)
        print_info "Setup complete! Use the commands above to get started."
        echo ""
        print_success "Happy coding! 🎉"
        ;;
    *)
        print_warning "Invalid choice. Please run the script again."
        ;;
esac

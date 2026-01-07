#!/bin/bash

# Deploy script for ChatBox v2
# This script will copy files to server and start the application

set -e  # Exit on error

SERVER_USER="root"
SERVER_IP="103.56.163.137"
SERVER_PORT="24700"
DEPLOY_PATH="/opt/chatbox"

echo "🚀 Starting deployment to $SERVER_IP..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found! Creating from template..."
    cp .env.production.template .env.production
    echo "❗ Please edit .env.production with your secure passwords before deploying!"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
tar czf chatbox-deploy.tar.gz \
    --exclude='backend/server/build' \
    --exclude='backend/server/cmake-build-*' \
    --exclude='backend/server/.vscode' \
    --exclude='frontend/node_modules' \
    --exclude='frontend/dist' \
    --exclude='frontend/.vite' \
    backend/ \
    frontend/ \
    docker-compose.prod.yml \
    .env.production

echo "📤 Uploading to server..."
scp -P $SERVER_PORT chatbox-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "🔧 Setting up on server..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Install Docker if not installed
    if ! command -v docker &> /dev/null; then
        echo "📥 Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi

    # Install Docker Compose if not installed
    if ! command -v docker-compose &> /dev/null; then
        echo "📥 Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    # Create deploy directory
    mkdir -p /opt/chatbox
    cd /opt/chatbox

    # Extract files
    echo "📂 Extracting files..."
    tar xzf /tmp/chatbox-deploy.tar.gz
    rm /tmp/chatbox-deploy.tar.gz

    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

    # Build and start containers
    echo "🏗️  Building containers..."
    docker-compose -f docker-compose.prod.yml build

    echo "▶️  Starting containers..."
    docker-compose -f docker-compose.prod.yml up -d

    echo "✅ Deployment complete!"
    echo ""
    echo "📊 Container status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://103.56.163.137"
    echo "   Backend:  ws://103.56.163.137:8080"
    echo ""
    echo "📝 View logs with:"
    echo "   docker-compose -f docker-compose.prod.yml logs -f"
ENDSSH

# Cleanup local tar file
rm chatbox-deploy.tar.gz

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🔒 Don't forget to:"
echo "   1. Configure firewall to allow ports 80 and 8080"
echo "   2. Set up SSL/HTTPS if needed"
echo "   3. Configure domain name if you have one"

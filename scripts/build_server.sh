#!/bin/bash

# ============================================================================
# Build Server Script
# ============================================================================

set -e

echo "=== Building ChatBox1 Server ==="
echo ""

cd ../backend/server

# Clean previous build
if [ -d "build" ]; then
    echo "Cleaning previous build..."
    rm -rf build
fi

mkdir build
cd build

echo "Running CMake..."
cmake .. -DCMAKE_BUILD_TYPE=Release

echo "Building..."
make -j$(nproc)

echo ""
echo "✓ Build complete!"
echo ""
echo "Executable: backend/server/build/chat_server"
echo "Size: $(ls -lh chat_server | awk '{print $5}')"
echo ""

# Test connection (optional)
read -p "Run connection test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "test_connection" ]; then
        echo "Running connection test..."
        ./test_connection
    else
        echo "test_connection not built"
    fi
fi

echo ""
echo "Next: ./deploy_to_ec2.sh"

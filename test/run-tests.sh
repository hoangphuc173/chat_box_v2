# Quick Start - Run Tests

echo "🧪 ChatBox Testing Suite"
echo "======================="
echo ""

# Check if backend is running
echo "Checking backend server..."
curl -s http://localhost:8080 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Backend server not detected on localhost:8080"
    echo "   Please start the backend server first"
fi

# Check if frontend is running  
echo "Checking frontend server..."
curl -s http://localhost:5173 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Frontend server not detected on localhost:5173"
    echo "   Please start the frontend server first"
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "📋 Available test commands:"
echo ""
echo "  npm test                  - Run all tests with coverage"
echo "  npm run test:integration  - Run WebSocket integration tests"
echo "  npm run test:features     - Run feature tests"
echo "  npm run test:e2e          - Run E2E browser tests"
echo "  npm run test:load         - Run load tests"
echo "  npm run test:stress       - Run stress tests"
echo "  npm run test:coverage     - Generate coverage report"
echo ""
echo "What would you like to run?"
echo ""
echo "1) All tests"
echo "2) Integration tests only"
echo "3) E2E tests only"
echo "4) Performance tests"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "Running all tests..."
        npm test
        ;;
    2)
        echo "Running integration tests..."
        npm run test:integration
        ;;
    3)
        echo "Running E2E tests..."
        npm run test:e2e
        ;;
    4)
        echo "Running performance tests..."
        echo "1) Load test (Artillery)"
        echo "2) Stress test (1000 connections)"
        read -p "Choose [1-2]: " perf_choice
        if [ "$perf_choice" = "1" ]; then
            npm run test:load
        else
            npm run test:stress
        fi
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Tests complete!"

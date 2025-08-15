#!/bin/bash

# Stepwright Examples Runner
echo "🚀 Stepwright Examples Runner"
echo "=============================="

# Check if node_modules exists
if [ ! -d "../node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd .. && npm install && cd examples
fi

# Check if dist folder exists
if [ ! -d "../dist" ]; then
    echo "🔨 Building project..."
    cd .. && npm run build && cd examples
fi

echo ""
echo "Choose an example to run:"
echo "1. Basic TypeScript example"
echo "2. Basic JavaScript example"
echo "3. Advanced TypeScript example"
echo "4. Advanced JavaScript example"
echo "5. Troubleshooting example (headless browser issues)"
echo "6. Run all examples"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "Running basic TypeScript example..."
        npx ts-node basic-usage.ts
        ;;
    2)
        echo "Running basic JavaScript example..."
        node basic-usage.js
        ;;
    3)
        echo "Running advanced TypeScript example..."
        npx ts-node advanced-usage.ts
        ;;
    4)
        echo "Running advanced JavaScript example..."
        node advanced-usage.js
        ;;
    5)
        echo "Running troubleshooting example..."
        node troubleshooting.js
        ;;
    6)
        echo "Running all examples..."
        echo ""
        echo "=== Basic TypeScript ==="
        npx ts-node basic-usage.ts
        echo ""
        echo "=== Basic JavaScript ==="
        node basic-usage.js
        echo ""
        echo "=== Advanced TypeScript ==="
        npx ts-node advanced-usage.ts
        echo ""
        echo "=== Advanced JavaScript ==="
        node advanced-usage.js
        echo ""
        echo "=== Troubleshooting ==="
        node troubleshooting.js
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

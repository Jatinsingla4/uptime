#!/bin/bash
# SitePulse — First-time setup script
set -e

echo "🚀 SitePulse Setup"
echo "========================="

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Create D1 database
echo "🗄️  Creating D1 database..."
wrangler d1 create sitepulse-db || echo "Database may already exist, continuing..."

echo "⚠️  Update D1 database_id in all wrangler.toml files with the ID above."
echo "   Files to update:"
echo "   - apps/workers/api/wrangler.toml"
echo "   - apps/workers/durable-objects/crawl-coordinator/wrangler.toml"
echo "   - apps/workers/durable-objects/uptime-monitor/wrangler.toml"
echo "   - apps/workers/scheduler/wrangler.toml"

# 3. Run migrations
echo ""
echo "🏗️  Running D1 migrations..."
wrangler d1 migrations apply sitepulse-db --local

# 4. Create R2 bucket
echo "🪣 Creating R2 bucket..."
wrangler r2 bucket create sitepulse-storage || echo "Bucket may exist, continuing..."

# 5. Create Queues
echo "📬 Creating CF Queues..."
wrangler queues create crawl-tasks || echo "Queue may exist..."
wrangler queues create crawl-tasks-dlq || echo "DLQ may exist..."

# 6. Set secrets
echo ""
echo "🔐 Setting Worker secrets..."
echo "Run these commands manually:"
echo "  wrangler secret put JWT_SECRET --name sitepulse-api"
echo "  wrangler secret put JWT_SECRET --name sitepulse-ws-gateway"

echo ""
echo "✅ Setup complete! Run 'pnpm dev' to start all services."

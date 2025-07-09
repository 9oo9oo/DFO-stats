#!/bin/bash
set -e

echo "Waiting for Postgres…"
until pg_isready -h localhost -p 5432; do sleep 2; done

# stay in the project root so dotenv finds .env there
cd /home/ec2-user/DFO-stats

echo "Restarting server via PM2…"
pm2 restart dist/server.js --name DFO-stats \
  || pm2 start dist/server.js --name DFO-stats

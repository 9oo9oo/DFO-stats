#!/bin/bash
set -e

echo "Waiting for Postgres to be ready…"
until pg_isready -h localhost -p 5432; do sleep 2; done

cd /home/ec2-user/DFO-stats/src
echo "Restarting server via PM2…"
pm2 restart server.ts --name DFO-stats \
  || pm2 start server.ts --name DFO-stats

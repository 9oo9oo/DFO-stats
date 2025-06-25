#!/bin/bash
set -e

cd /home/ec2-user/DFO-stats/src

echo "Restarting server via PM2…"
pm2 restart server.js --name DFO-stats \
  || pm2 start server.js --name DFO-stats

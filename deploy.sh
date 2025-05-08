#!/bin/bash
set -e

echo "Pulling..."
git pull origin main

cd src
echo "Rebuilding .env in $(pwd)..."

: > .env
declare -a VARS=(DFO_API_KEY PG_USER PG_PASSWORD PG_DB PG_HOST PORT PG_PORT)
for V in "${VARS[@]}"; do
  PARAM="/myApp/$V"
  echo -n "$V=" >> .env
  aws ssm get-parameter \
    --name "$PARAM" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text >> .env
  echo   >> .env
done

echo "Installing dependencies & Building Vue client..."
cd ../client
npm ci
npm run build

echo "Restarting server..."
cd ../src
pm2 restart server.js --name DFO-stats

echo "Deployed!"

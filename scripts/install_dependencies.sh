#!/bin/bash
set -e

cd /home/ec2-user/DFO-stats

echo "Rebuilding .env in src/…"
cd src
: > .env

declare -a VARS=(DFO_API_KEY PG_USER PG_PASSWORD PG_DB PG_HOST PORT PG_PORT)
for V in "${VARS[@]}"; do
  echo -n "$V=" >> .env
  aws ssm get-parameter --name "/myApp/$V" --with-decryption \
    --query "Parameter.Value" --output text >> .env
  echo >> .env
done

echo "Installing backend deps…"
npm ci

echo "Building Vue client…"
cd ../client
npm ci
npm run build

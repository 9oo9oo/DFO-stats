#!/bin/bash
set -e

cd /home/ec2-user/DFO-stats

echo "Pulling latest code…"
git pull origin main

echo "Rebuilding .env in src/…"
cd src
: > .env

# adjust names to your SSM parameters’ path
declare -a VARS=(DFO_API_KEY PG_USER PG_PASSWORD PG_DB PG_HOST PORT PG_PORT)

for V in "${VARS[@]}"; do
  PARAM="/myApp/$V"
  echo -n "$V=" >> .env
  aws ssm get-parameter \
    --name "$PARAM" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text >> .env
  echo >> .env
done

echo "Installing backend deps & running tests…"
npm ci
# optional: npm test

echo "Building Vue client…"
cd ../client
npm ci
npm run build
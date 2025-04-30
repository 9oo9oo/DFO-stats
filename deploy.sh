set -e

echo "Building Vue client..."
cd client
npm install
npm run build

echo "Restarting server..."
cd ../src
pm2 restart server.js --name DFO-stats

echo "Deployed!"

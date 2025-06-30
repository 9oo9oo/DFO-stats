#!/bin/bash
set -e
# wait up to 2 minutes for a 200 from your health endpoint
for i in {1..60}; do
  if curl -sSf http://localhost:3000/health; then
    exit 0
  fi
  sleep 2
done
echo "Health check failed" >&2
exit 1

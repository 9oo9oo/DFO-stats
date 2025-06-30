#!/bin/bash
set -e
pm2 stop DFO-stats || true
pm2 delete DFO-stats || true

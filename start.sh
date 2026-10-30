#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  US Phone Number Validation Platform (1M Scale Engine)"
echo "========================================================"
echo ""

cd "$(dirname "$0")/backend"
echo "Starting Backend Server on http://0.0.0.0:8000 ..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

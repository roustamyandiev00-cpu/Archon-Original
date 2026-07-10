#!/usr/bin/env bash
# Lokale Relay-workflow op Mac (zonder Linux VPS).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Controleren relay CLI..."
command -v relay >/dev/null || {
  echo "relay niet gevonden. Voer uit: source ~/.zshrc"
  exit 1
}

echo "→ Controleren relayd op localhost:8080..."
curl -sf http://127.0.0.1:8080/health >/dev/null || {
  echo "relayd draait niet. Start met:"
  echo "  docker start relayd"
  echo "Of zie README in scripts/relay-start-relayd.sh"
  exit 1
}

echo "→ .relay.json moet http://127.0.0.1:8080 zijn (niet jouw-server)"
grep -q '127.0.0.1:8080' .relay.json || {
  echo "Pas .relay.json aan: url = http://127.0.0.1:8080"
  exit 1
}

echo "→ Inloggen (browser opent automatisch)..."
relay login --url http://127.0.0.1:8080

echo "→ Deploy (Docker engine, poort 3001)..."
relay deploy --stream \
  --engine docker \
  --mode port \
  --host-port 3001 \
  --service-port 3000

echo ""
echo "App: http://localhost:3001"
echo "Dashboard: http://localhost:8080/dashboard/"

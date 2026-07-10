#!/usr/bin/env bash
# Start relayd lokaal op Mac (in Docker).
set -euo pipefail

DATA_DIR="${HOME}/.relay/data"
mkdir -p "$DATA_DIR"

if [[ ! -d /data ]]; then
  echo ""
  echo "Eenmalig nodig (Mac + Docker Desktop):"
  echo "  sudo mkdir -p /data && sudo chown $(whoami) /data"
  echo "  rsync -a \"${DATA_DIR}/\" /data/"
  echo "  Voeg /data toe in Docker Desktop → Settings → Resources → File sharing"
  echo ""
  echo "Zonder /data op de host faalt de edge-proxy bij deploy."
  echo ""
fi

docker rm -f relayd 2>/dev/null || true

docker run -d --name relayd \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "${DATA_DIR}:/data" \
  -e RELAY_DATA_DIR=/data \
  debian:bookworm-slim bash -c '
    apt-get update -qq && apt-get install -y -qq curl ca-certificates docker.io >/dev/null
    ARCH=$(uname -m); [ "$ARCH" = "aarch64" ] && F=relay-linux-arm64.tar.gz || F=relay-linux-amd64.tar.gz
    curl -fsSL "https://github.com/Relay-CI/Relay/releases/download/v0.1.101/$F" | tar xz relayd
    chmod +x relayd
    exec ./relayd --port 8080
  '

echo "→ Wachten op relayd..."
for _ in $(seq 1 30); do
  curl -sf http://127.0.0.1:8080/health >/dev/null && break
  sleep 2
done

curl -sf http://127.0.0.1:8080/health && echo "relayd OK op http://127.0.0.1:8080"

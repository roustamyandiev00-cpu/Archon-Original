#!/usr/bin/env bash
# Koppel je iPhone (USB) aan de lokale dev-server.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"

if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(ifconfig | awk '/inet / && $2 != "127.0.0.1" { print $2; exit }')"
fi

DASHBOARD_URL="http://${LAN_IP}:${PORT}/dashboard/command-center"
CONNECT_URL="http://${LAN_IP}:${PORT}/dev/mobile"
DEVICE_NAME=""
DEVICE_MODEL=""
DEVICE_STATE=""

if command -v xcrun >/dev/null 2>&1; then
  DEVICE_LINE="$(xcrun devicectl list devices 2>/dev/null | awk -F '   +' 'NR>2 && ($0 ~ /iPhone|iPad/) && ($0 ~ /available|paired|connected/) { print; exit }')"
  if [[ -n "$DEVICE_LINE" ]]; then
    DEVICE_NAME="$(echo "$DEVICE_LINE" | awk -F '   +' '{ print $1 }' | sed 's/[[:space:]]*$//')"
    DEVICE_MODEL="$(echo "$DEVICE_LINE" | awk -F '   +' '{ print $NF }' | sed 's/[[:space:]]*$//')"
    DEVICE_STATE="verbonden"
  fi
fi

if [[ -z "$DEVICE_NAME" ]] && ioreg -p IOUSB -l -w 0 2>/dev/null | grep -q '"USB Product Name" = "iPhone"'; then
  DEVICE_NAME="iPhone (USB)"
  DEVICE_STATE="verbonden"
fi

echo ""
echo "📱 Mobiele dev-koppeling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ -n "$DEVICE_NAME" ]]; then
  echo "Apparaat : $DEVICE_NAME"
  [[ -n "$DEVICE_MODEL" && "$DEVICE_MODEL" != "$DEVICE_NAME" ]] && echo "Model    : $DEVICE_MODEL"
  echo "Status   : ${DEVICE_STATE:-gedetecteerd}"
else
  echo "Apparaat : geen iPhone via USB gedetecteerd"
  echo "           Sluit je telefoon aan en ontgrendel het scherm."
fi
echo ""
echo "Dashboard op je telefoon:"
echo "  $DASHBOARD_URL"
echo ""
echo "QR-code pagina (open op Mac, scan met iPhone-camera):"
echo "  $CONNECT_URL"
echo ""

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$DASHBOARD_URL" | pbcopy
  echo "✓ Dashboard-URL gekopieerd naar klembord"
fi

echo ""
echo "Stappen op je iPhone:"
echo "  1. Zelfde WiFi als je Mac (USB alleen is niet genoeg voor http)"
echo "  2. Open Safari → plak de URL of scan de QR op $CONNECT_URL"
echo "  3. Blijf je terug naar login komen? Wis Safari-cache voor dit site-adres"
echo "     of gebruik een privé-tab, en log opnieuw in."
echo "  4. (Optioneel) Instellingen → Safari → Geavanceerd → Web Inspector aan"
echo "     Mac Safari → Ontwikkel → [jouw iPhone] → pagina inspecteren"
echo ""
echo "Start dev-server op alle netwerk-interfaces:"
echo "  npm run dev:mobile"
echo ""

if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "✓ Dev-server draait op poort ${PORT}"
  if command -v open >/dev/null 2>&1; then
    open "$CONNECT_URL"
  fi
else
  echo "⚠ Dev-server draait nog niet. Start eerst: npm run dev:mobile"
fi

echo ""

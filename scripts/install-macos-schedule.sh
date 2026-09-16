#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.nayrb.tennis-court-checker"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$ROOT/logs"
UID_NUM="$(id -u)"
NODE="$(command -v node)"
NODE_BIN="$(dirname "$NODE")"
CACHE_DIR="$HOME/.cache/puppeteer"

mkdir -p "$LOG_DIR" "$HOME/Library/LaunchAgents" "$CACHE_DIR"

if [ ! -d "$CACHE_DIR/chrome" ]; then
  echo "Installing Chrome for Puppeteer into ${CACHE_DIR}..."
  (cd "$ROOT" && PUPPETEER_CACHE_DIR="$CACHE_DIR" npx puppeteer browsers install chrome)
fi

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>${HOME}</string>
    <key>PATH</key>
    <string>${NODE_BIN}:/usr/bin:/bin</string>
    <key>PUPPETEER_CACHE_DIR</key>
    <string>${CACHE_DIR}</string>
  </dict>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE}</string>
    <string>${ROOT}/scripts/runScheduledCheck.js</string>
  </array>
  <key>StartInterval</key>
  <integer>1800</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/check.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/check.err.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/${UID_NUM}/${LABEL}" >/dev/null 2>&1 || true
launchctl bootstrap "gui/${UID_NUM}" "$PLIST"
echo "Installed ${LABEL} using ${NODE}."
echo "Runs about every 30 minutes while this Mac is awake, 6:00 a.m.–9:59 p.m. Peru time."
echo "Logs: ${LOG_DIR}"

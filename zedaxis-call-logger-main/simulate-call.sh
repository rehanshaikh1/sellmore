#!/usr/bin/env bash
# Pretends to be CallSwitch One: sends the same web hooks a real call would, to a logger
# you are running locally (node --env-file=.env server.js).
#
#   ./simulate-call.sh <number> [outbound|inbound] [extension] [talk_seconds] [answered|missed|voicemail]
#
#   ./simulate-call.sh +447700900123                      outbound call from ext 8007, 30 s talk
#   ./simulate-call.sh 07700900123 inbound 8001 45        inbound call answered by ext 8001
#   ./simulate-call.sh +447700900123 outbound 8007 0 missed
#
# The number must be on a Contact, open Lead or Account in the sandbox (Phone or Mobile field).
set -euo pipefail
cd "$(dirname "$0")"

NUM=${1:?usage: ./simulate-call.sh <number> [outbound|inbound] [extension] [talk_seconds] [answered|missed|voicemail]}
DIR=${2:-outbound}; EXT=${3:-8007}; TALK=${4:-30}; MODE=${5:-answered}

envval() { [ -f .env ] && grep -E "^$1=" .env | head -1 | cut -d= -f2- || true; }
TOKEN=${WEBHOOK_TOKEN:-$(envval WEBHOOK_TOKEN)}
PORT=${PORT:-$(envval PORT)}; PORT=${PORT:-5230}
[ -n "$TOKEN" ] || { echo "No WEBHOOK_TOKEN (set it in .env)"; exit 1; }
curl -sf "http://localhost:$PORT/ping" >/dev/null || { echo "Logger is not running on port $PORT. Start it: node --env-file=.env server.js"; exit 1; }

UUID="sim-$(date +%s)"
START=$(TZ=Europe/London date '+%Y-%m-%d %H:%M:%S')   # CallSwitch sends UK wall-clock time
OUR_LINE=+441614000000

if [ "$DIR" = inbound ]; then
  BODY="{\"uuid\":\"$UUID\",\"call_type\":\"inbound\",\"from\":\"$NUM\",\"to\":\"$OUR_LINE\",\"answer_type\":\"sipuser\",\"answered_by\":\"$EXT\",\"start\":\"$START\"}"
else
  BODY="{\"uuid\":\"$UUID\",\"call_type\":\"outbound\",\"from\":\"$EXT\",\"from_type\":\"sipuser\",\"to\":\"$NUM\",\"start\":\"$START\"}"
fi

hook() { curl -s -X POST "http://localhost:$PORT/hook/$1?token=$TOKEN" -H 'Content-Type: application/json' -d "$BODY" >/dev/null && echo "sent: $1"; }

echo "call $UUID  $DIR  $NUM  ext $EXT  $MODE"
hook new
case "$MODE" in
  answered)  hook answered; sleep "$TALK" ;;   # the logger times the call from when these hooks arrive
  voicemail) hook voicemail ;;
  missed)    : ;;
  *) echo "mode must be answered, missed or voicemail"; exit 1 ;;
esac
hook ended
echo "waiting 17 s (the logger waits 15 s after 'ended' in case a voicemail hook arrives)..."
sleep 17
echo "result:"
curl -s "http://localhost:$PORT/status?token=$TOKEN" | python3 -c 'import json,sys; [print(" ", r["at"], r["outcome"]) for r in json.load(sys.stdin)["recent"][:3]]'

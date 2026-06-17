#!/usr/bin/env bash
# PurpleDroid-CTF 서버 구동 (4-3부터 바로 플레이 가능하도록 unlock)
cd /home/dubu/droid/PurpleDroid-CTF/server || exit 1
export PURPLEDROID_UNLOCK_UNTIL=level4_3
exec /home/dubu/.local/share/mamba/envs/purple/bin/python -m uvicorn main:app \
  --host 0.0.0.0 --port 8001 > /home/dubu/droid/PurpleDroid-CTF/.server.log 2>&1

#!/usr/bin/env bash
# PurpleDroid-CTF 서버 구동 (기본 진행은 1-1부터 시작)
cd /home/dubu/droid/PurpleDroid-CTF/server || exit 1
exec /home/dubu/.local/share/mamba/envs/purple/bin/python -m uvicorn main:app \
  --host 0.0.0.0 --port 8001 > /tmp/purpledroid-server.log 2>&1

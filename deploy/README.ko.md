# PurpleDroid VPS 배포 준비 노트

이 폴더는 RackNerd 같은 Ubuntu VPS에 PurpleDroid를 테스트 배포하기 위한 템플릿 모음이다.

권장 구조:

```txt
Caddy :80 또는 HTTPS 도메인
  ├─ /          → /opt/purpledroid/current/web/dist 정적 파일
  └─ /api/*     → 127.0.0.1:8001 FastAPI
```

## 1. 서버 기본 패키지

Ubuntu 24.04 기준:

```bash
sudo apt update
sudo apt install -y git python3-venv python3-pip nodejs npm caddy
node -v
```

Vite 5는 Node 18 이상이 필요하다. `node -v`가 18보다 낮으면 NodeSource나 nvm으로 Node 20 LTS를 설치하는 편이 좋다.

## 2. 앱 사용자와 디렉터리

```bash
sudo adduser --system --group --home /opt/purpledroid purpledroid
sudo mkdir -p /opt/purpledroid/current /etc/purpledroid /var/lib/purpledroid
sudo chown -R purpledroid:purpledroid /opt/purpledroid /var/lib/purpledroid
```

## 3. 코드 업로드

Git remote가 있으면 clone을 쓰면 된다.

```bash
sudo -u purpledroid git clone <YOUR_REPO_URL> /opt/purpledroid/current
```

아직 remote가 애매하면 로컬 PC에서 `rsync` 또는 압축 파일로 `/opt/purpledroid/current`에 복사해도 된다. `node_modules`, `web/dist`, `.git`은 복사하지 않아도 된다.

## 4. 백엔드 가상환경

```bash
sudo -u purpledroid python3 -m venv /opt/purpledroid/venv
sudo -u purpledroid /opt/purpledroid/venv/bin/pip install --upgrade pip
sudo -u purpledroid /opt/purpledroid/venv/bin/pip install -r /opt/purpledroid/current/server/requirements.txt
```

## 5. 프론트 빌드

운영 빌드는 기본적으로 API를 `/api/v1`로 호출한다. 즉 같은 도메인에서 Caddy가 `/api/*`를 백엔드로 넘기면 된다.

```bash
cd /opt/purpledroid/current/web
sudo -u purpledroid npm ci
sudo -u purpledroid npm run build
```

## 6. 환경변수

```bash
sudo cp /opt/purpledroid/current/deploy/purpledroid.env.example /etc/purpledroid/purpledroid.env
sudo nano /etc/purpledroid/purpledroid.env
```

도메인이 아직 없고 IP로 테스트할 때는 임시로:

```txt
PURPLEDROID_CORS_ORIGINS=http://YOUR_SERVER_IP
```

도메인을 붙인 뒤에는:

```txt
PURPLEDROID_CORS_ORIGINS=https://YOUR_DOMAIN
```

## 7. systemd 서비스

```bash
sudo cp /opt/purpledroid/current/deploy/purpledroid-api.service /etc/systemd/system/purpledroid-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now purpledroid-api
sudo systemctl status purpledroid-api
```

헬스체크:

```bash
curl http://127.0.0.1:8001/api/v1/health
```

## 8. Caddy 설정

도메인 없이 IP로 먼저 테스트:

```bash
sudo cp /opt/purpledroid/current/deploy/Caddyfile.ip-test.example /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

접속:

```txt
http://YOUR_SERVER_IP/
```

도메인을 정한 뒤:

```bash
sudo cp /opt/purpledroid/current/deploy/Caddyfile.domain.example /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

DNS의 A record가 VPS IP를 가리키고 80/443 포트가 열려 있으면 Caddy가 HTTPS 인증서를 자동으로 발급한다.

루트(`/`)는 Caddy에서 `/campaign`으로 리다이렉트한다. SPA 내부에서도 `/campaign`을 기본 홈으로 사용하고, 클래식 보드는 `/classic` 직접 접근으로만 남겨둔다.

## 9. 운영 전 체크

- `PURPLEDROID_UNLOCK_ALL=0`
- `PURPLEDROID_UNLOCK_UNTIL=` 비어 있음
- `/api/v1/health` 정상 응답
- `/` 접속 시 `/campaign`으로 이동
- `/campaign` 새로고침 시 404 없이 유지
- 시작 화면에 `Classic Mission Board` 버튼이 보이지 않음
- 새 세션 생성 후 진행 키가 발급됨
- 서버 재시작 후 진행 키 복구가 됨

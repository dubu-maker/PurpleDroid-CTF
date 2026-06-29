# PurpleDroid CTF — 작업 정리 / 이어가기 노트

> Claude(루아)와의 MIRROR CITY 프론트/게임플레이 리디자인 진행 기록.
> 다른 PC(회사 노트북 등)에서 이어갈 때, 또는 Claude 연결이 안 될 때 이 문서만 보면 됨.

## 1. 지금 상태 (한 줄)
`main` 브랜치에 모든 작업 반영·푸시됨. 라이브: https://purpledroid.com/campaign

## 2. 로컬에서 띄우기

```bash
git clone https://github.com/dubu-maker/PurpleDroid-CTF.git   # 처음이면
cd PurpleDroid-CTF
git checkout main && git pull origin main

# 프론트
cd web && npm install
npm run dev -- --port 5300        # ⚠️ 5173이 윈도우 예약포트면 다른 포트(5300 등) 사용
#  → http://localhost:5300

# 백엔드 (로컬에 Python 없으면 Docker)
docker build -t purpledroid-server ./server
docker run -d --name purpledroid-server -p 8001:8000 purpledroid-server
#  재시작만:  docker start purpledroid-server
```
프론트 dev 기본 API 주소는 `localhost:8001/api/v1` 이라 백엔드를 8001로 띄우면 자동 연결됨.

## 3. VPS 배포 (purpledroid.com, RackNerd)
`/opt/purpledroid/current`에서:
```bash
git fetch origin && git reset --hard origin/main     # main과 정확히 일치
npm --prefix web ci && npm --prefix web run build     # 프론트 dist 갱신
sudo systemctl restart purpledroid-api                # ⚠️ 백엔드 바뀐 날만 필수
chown -R caddy:caddy /opt/purpledroid && chmod -R 755 /opt/purpledroid
```
- 프론트만 바뀐 날: 빌드만 (백엔드 재시작 불필요).
- **백엔드(server/) 바뀐 날: `purpledroid-api` 재시작 필수.**
- 확인: 빌드 로그 CSS 해시가 새로 찍히면 반영됨 → 브라우저 `Ctrl+Shift+R`.

## 4. 지금까지 한 것 (요약)

### A. MIRROR CITY 디자인 시스템 (프레젠테이션)
- 토큰: Pretendard + JetBrains Mono, OKLCH `--violet`(플레이어 VIOLET) / `--mira`(녹색) / `--danger`(AEGIS 크림슨) / `--ok` / `--blue`, 다크 중성 패널(#0f0f15), 14px radius, 그리드+스캔라인 텍스처. `web/src/styles.css` 끝부분 `.campaign-page`/`.campaign-home`/`.campaign-shell` 스코프.
- **랜딩**(`CampaignHome`): 상단 브랜드 네비, 2단 히어로, 터미널, entities/tracks/progress-key. "Start New Campaign"이 resume 불가 시 보라 솔리드로 승격.
- **인게임**(`.campaign-shell`): 헤더/에이전트레일/다이얼로그/콘솔/증거/컨테인먼트 리스타일. Objectives \| Field Intel 좌우(`.mission-duo`). 방어 코드는 잠김 시 `backdrop-filter: blur` + "LOCKED" 오버레이.
- MIRA = **녹색**, residue 찌꺼기 = **노랑**(`--mira`/`--residue`).

### B. 미션 디브리프
- 윗칸 summary = 교훈+세계관(봉인 스토리는 메모리 노트가 독점), 보라 "핵심 정리(01·02·03)" 블록, 닫는 **MIRA 녹색 보이스라인** (1-1~1-4 각성 아크), next-teaser 제거, 세로 압축(1440 한 페이지).

### C. 1-2 (DECOY STATIC) — Evidence Reasoning 게이트
- **진짜 버그였던 것**: 정답 카드 선택→바로 제출/클리어가 reasoning을 우회. 보드 여는 방식(grep vs -b all)을 막는 건 잘못된 접근(숙련자 페널티/경로강요)이라 **되돌림**.
- **올바른 해법**: `handleSubmitEvidence`에서 정답 값이어도 `level12ReasoningReady`(정답 근거 r4·r5 둘 다 + 디코이 0개) 아니면 차단. 보드는 `-d`/`-b all`/grep 뭐로든 열림.
- 정답 카드 phase `"login-success session"` → `"session"`로 중립화(temp도) → **로그의 성공 위치로 판단**해야 함. 게이트 차단 시 카드 verdict 노출 안 되게(`gate:true`).

### D. 1-3 (SPLIT TRACE) — 디코이 강화 + 조각 미세화
- DECOY-7 / OLD-2를 **4파트(1/4..4/4)** 로 (진짜 EV-031과 파트 수 동일 → shardId/source로만 구분).
- 진짜 플래그를 단어경계 깨서 잘게: `FLAG{SP | LIT_AN | D_STIT | CH}` → 어순 추측 불가, part index 필수.
- RECONSTRUCTION REASONING이 조각만 맞춰도 resolved로 노출되던 것 → **solved 후에만** 표시.
- 서버(`level1_3.py`) 로그 ↔ 스토리 cards(KO·EN) 일치. 정답값(FLAG{SPLIT_AND_STITCH})은 그대로.

### E. 서버 터미널 grep 개선
- `logcat_support.py` grep에 `-A`/`-B`/`-C`(context) 지원 추가 → `grep -A1 "Login success"` 같은 정당한 풀이가 Level 1 전체에서 동작.

## 5. 남은 것 / TODO
- [ ] CampaignHome 오프라인 상태: 백엔드 불가 시 raw "Failed to fetch" / 무한 "Synchronizing..." → 친절한 처리.
- [ ] 디브리프 MIRA 보이스라인 패턴을 작전 2~4 디브리프에도 확장(원하면).
- [ ] 1-2처럼 1-3에도 reasoning을 "게이트"로 만들지(지금은 사후 표시) — 필요 시.
- (결정됨) MIRA = 녹색, 보라 = VIOLET 전용.

## 6. Claude(루아)와 연결이 안 될 때 (회사 노트북/사내망)
증상: 메시지 보내면 "생각"은 하는데 2~3분 뒤 응답이 사라짐 = **사내 방화벽/프록시가 스트리밍 연결을 끊는 것**(가장 흔함).
- ✅ **휴대폰 핫스팟**이나 다른 망으로 바꿔서 시도 (대부분 해결).
- VPN 켜져 있으면 끄거나 반대로 켜보기.
- 답 안 오면 메시지 연달아 보내지 말 것(큐 꼬임). 1~2분 기다렸다 한 번만 재시도.
- 그래도 안 되면: 이 문서 + 코드가 GitHub에 다 있으니 **수동으로 이어가도 됨**. 위 2~5번 참고.
- 참고: 회사 노트북엔 로컬 작업물/Claude 메모리가 없음 → `git clone`부터. 코드/진행은 전부 `main`에 있음.

---
_업데이트: 작업 세션 종료 시 이 문서도 같이 갱신._

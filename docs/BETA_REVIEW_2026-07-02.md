# PurpleDroid 베타 리뷰 — Operation 01 & 02 (2026-07-02)

스크린샷 + 소스코드 기반 리뷰(라이브 서버 미검증 항목은 🟡로 표시). 집에서 작업 순서:
**① 서버 띄우기 → ② 🟡(확인 필요) 항목 실제 확인 → ③ 🔴(수정 권장) → ④ 🟢(선택/유지).**

범례: 🔴 수정 권장 · 🟡 라이브 확인 먼저 · 🟢 유지 또는 선택

---

## 0. 게임 전역 (한 번 고치면 전 레벨 영향) — 최우선

### 0-1. 🔴 방어 피드백이 프론트에서 통째로 덮임
- **위치:** `web/src/campaign/CampaignMode.jsx:7264`
- **현상:** 오답 시 `story.defenseFailureText`가 백엔드 `data.message`보다 앞이라 `||` 단락 → 백엔드의 per-line 피드백이 **모든 레벨에서** 안 뜸. 그래서 1-1이 늘 "Containment is incomplete..." 하나만 보임.
- **근거:** 백엔드 `_consistent_patch_feedback`(`server/main.py:601`)가 decoy별 설명 + 남은 통제 개수를 이미 생성. `level1_1.py`의 `PATCH_WRONG_FEEDBACK`(d1/d2/d3)도 정의돼 있음. 프론트가 이를 무시.
- **결정 필요 (택1):**
  - (A) 최소 수정 — 7264 우선순위를 뒤집어 `data.message` 우선. 단, 백엔드 글루 문구가 KO 고정이라 EN 모드에서 한국어가 섞임 → 백엔드 문구 로케일 대응 필요.
  - (B) 아키텍처 정합 — per-locale decoy 피드백을 프론트 스토리(`campaignStory{,.en}.js`)에 두고, 선택된 decoy id로 문구 선택. 로컬라이즈 깔끔, 작업량↑.
- **권장:** 이건 cross-cutting 결정이니 패턴을 한 번 정해서 전 레벨에 통일. 이게 "1-1 친절하게"의 진짜 해결이고 부수적으로 전 레벨이 같이 좋아짐.

---

## 1. Operation 01 — INITIAL BREACH

### 1-1 GHOST LOG (`server/main.py` = level1)
- 🟢 공격 3단 흐름(라이브→dump→-b all) 유지. SCOPE 축 성공, 서사-메커니즘 정합(main만 purge → crash 생존, `contradiction window=0.3ms`=프롤로그 회수) 우수.
- 🔴 방어 피드백 → **0-1로 해결**.
- 🟡 `-d` 단계 초보 정체 완화: `-d` 출력엔 버퍼명이 없어 `-b all`을 스스로 떠올려야 함. `buffer_chain` 뉘앙스를 살짝 흘리면 친절(main엔 여전히 플래그 없음).
- 🟡 파서 유연성: `adb logcat -b crash`(단독), `-b all -d`(순서 바꿈), `-b all`(`-d` 없이)도 통하는지 확인.
- 🟢 flag 표기 통일: `FLAG{Always_Check_The_Logs_First}` → 다른 레벨처럼 `ALWAYS_CHECK_THE_LOGS_FIRST` (선택).

### 1-2 DECOY STATIC (`level1_2`)
- 🟢 EVIDENCE REASONING 게이트 + 인스펙터("verdict is still sealed", trace/phase 증거만 제공) = 찍기 방지 잘 됨. 정답 이유 2개가 서로 다른 축(4=흐름 방향, 5=인접성), 오답 6번이 preflight의 trace 공유 함정을 정확히 겨냥.
- 🟡 디코이 flag 이름 vibe: 미끼는 `FAKE/OLD/SAMPLE/CACHE`류, 진짜만 레벨 제목과 동일한 `SIGNAL_SURVIVES_THE_STATIC` → 카드 단계에서 텔레그래프. 진짜 이름을 평범하게(예: `AUTH_SESSION_LIVE_7F19`) 바꾸면 REASONING이 "확인용"이 아닌 "판별용"으로 온전히 작동.
- 🟡 오답 이유(1/2/3/6) 선택 시 제출이 실제로 블록되는지 확인.
- 🟢 TRY FIRST 2번 칩 `grep "Login success"`가 정답 흐름을 바로 특정 → `grep AuthService`나 `grep -A1 trace=`로 완화(선택). REASONING이 뒤를 받쳐줘 치명적이진 않음.

### 1-3 SPLIT TRACE (`level1_3`)
- 🟢 **가장 단단.** 축(grouping+order) 성공. 조각 순서가 뒤섞여 raw 불가 → grep 그룹핑 후 part 정렬 강제. 디코이도 `FLAG{` 시작 조각을 가져 "FLAG{로 시작=진짜" 찍기 차단. trace=FRG-8842가 login-success 도달로 EV-031 특정.
- 🟡 **manual-path 우회 확인 (중요):** 터미널서 눈으로 4조각 읽어 EVIDENCE SHARD에 직접 타이핑하면 FRAGMENT BOARD/STITCH/REASONING 건너뛰는가? (메모상 gate:true fallback 있다는데 실제 물리는지)
- 🟡 REASONING 섹션이 1-3에도 실제 표시되고 decoy 이유 블록되는지.
- 🟢 STITCH SLOTS의 Stage/Submit 2단계 라벨 의미 명확화(선택).

### 1-4 ECHO CHAMBER (`level1_4`, 보스)
- 🟢 **보스로서 최고.** 4축 합류(scope/trace/stitch + commit 검증), "둘 다 accepted"(CMT-8842 vs CMT-9001) 함정이 서명 기믹. MIRROR-7이 진짜와 거의 대칭(stitchable+accepted commit)이고 오직 login-success 도달 여부로만 갈림. parts 카운트 교차검증(4/4↔CMT-8842)까지. flag가 랜덤 문자열이라 반드시 stitch 필요=추론 우회 불가.
- 🟡 **manual-path 우회 확인 (1-3과 동일):** 눈으로 stitch 후 직접 제출이 board/commit-verify 건너뛰나.
- 🟡 REASONING(commit 필수, decoy 블록) 작동 확인.
- 🟢 (선택·설계) commit-verify가 지금은 "확인용"(login-success만으로 EV-CORE 특정 가능). 필수 판별자로 만들려면 MIRROR도 login-success류 상태 부여 → commitRef만으로 갈리게. 현재도 보스로 충분.

---

## 2. Operation 02 — SIGNAL EDGE

### 2-1 INVISIBLE HEADER (`level2_1`)
- 🔴 **"교과서적"의 원인 = compare 메커니즘이 장식.** 값은 rotating으로 만들어놨는데(Trace/Preview/Cached 변동, Ticket 고정), objective·hint·MIRA가 정답 헤더 이름 `X-Courier-Ticket`을 다 알려줌 + 미끼 이름이 `Preview/Cached`(가짜 티) → 두 번 호출·비교 없이 이름으로 읽힘.
  - **수정:** objective/hint/MIRA에서 `X-Courier-Ticket` 이름 제거 → "여러 courier 헤더 중 매 호출마다 안 바뀌는 하나가 진짜". compare가 필수가 됨. 난이도 안 올림.
- 🟡 (선택) 미끼 헤더 이름 중립화(`Route/Edge` 등) → 이름 찍기까지 봉쇄. 튜토리얼 위치상 위 하나만으로 충분할 수도.
- 🟢 nudge(첫 `-i`에 헤더명 안 흘림), rotating, content-length=30 정합 — 유지.

### 2-2 TRUST TAMPER (`level2_2`) — stage2 모범
- 🟢 메커니즘 물림: 정답이 응답에 없고 `v_p`+shape로 `vip` 복원 강제, `premium` 미끼로 찍기 차단, shape 힌트가 load-bearing(`.lower()` 안 함). MIRA nudge 상황별 분기.
- 🟡 방어 `fastTrack`(p2)이 공격에 안 등장 → "공격 안 한 걸 방어" 점프. 지시문/intel에 "익스플로잇한 tier 경로뿐 아니라 모든 클라이언트-claim 권한 경로를 막아라" 한 줄로 연결(defense-in-depth 의도 자체는 좋음).
- 🟡 `v_p→vip` 복원이 빈칸 1개라 즉답에 가까움 → 개념(인가) 쪽으로 무게 이동 or `upgrade-candidates`에 shape 맞는 미끼 하나 더 섞어 "복원+검증"으로.
- 🟢 premium 거부를 응답에 명확히 에코(`rejected-claim=premium` 등, 선택).

### 2-3 DISPATCH CAPSULE (`level2_3`) — 예전 레벨, 추론 미탑재
- 🟢 base64url 디코딩 실전 스킬 + `decode-token` 학습 도구 우수 — 유지.
- 🔴 사실상 한 방(dispatch→decode). 진짜 필드 이름이 `evidenceShard`라 정답 텔레그래프 → header `kid`/`debug`/`note`와 나란히 두면 고를 것도 없음. TRY FIRST 칩 2개가 곧 solve 2스텝.
  - **수정(가벼움·권장):** 진짜 evidence를 평범한 이름(`ctx`/`ref` 등)으로 위장하고 평범한 claim들 사이에 숨김 → "decode=끝"을 "decode→어느 claim이 진짜냐 판별"로. base64 스킬 유지, 찍기만 차단.
- 참고: header `kid=FLAG{HEADER_DECOY_NOISE}` 함정 + flag_feedback(kid decoy 코칭)은 좋음. 다만 판별이 강제 안 됨.

### 2-4 EXPRESS FORGE (`level2_4`)
- 🟢 2-페이즈 구조(원본 전송→거부 관찰→위조→재시도)로 2-3보다 사고 단계 있음. 2-3 토큰 재사용(연속성) + evidenceShard strip.
- 🔴 **개념 정합 문제(최우선):** flag `JWT_SIGNATURE_MATTERS`·hint5는 "서명 검증"인데, 유일한 도구 `jwt-forge-none`과 방어 p2는 "alg=none"을 가리키고, 실제 코드(`decode_jwt_unsafe`/`evaluate_express_access`)는 **alg·서명 아무것도 검증 안 함.** 순수 교훈은 "가짜 서명 그대로 payload만 바꿔도 통과"인데 그걸 할 도구가 없어 alg=none으로 수렴.
  - **수정:** flag/hint/도구/방어를 한 축으로. 개념 정합을 원하면 `jwt-tamper <token> tier=vip`(alg 유지·가짜 서명) 헬퍼 추가 → "서명을 안 본다"를 직접 시연.
- 🟡 `jwt-forge-none`이 위조 통째 대행(tier=vip+role=admin 자동) → "어느 claim이 여는가" 고민 제거. `evaluate_express_access`를 tier/role 중 하나만 통과로 바꾸면 거부 응답의 claims 에코로 판별 단계 생김.
- 🟢 방어(REQUIRED 3개: decode-only/alg=none-trust/unverified-claim-authz)는 stage2 최강급 — 유지.

---

## 3. 공통 패턴 (설계 원칙)

- **stage2 반복 병 = "도구·이름이 사고를 대신함"** (2-1 objective가 답 이름, 2-3 필드명이 답, 2-4 헬퍼가 위조 대행). 1-x에 쌓은 **"값 찾기 → 왜 맞는지 검증"** 2단 구조를 2-x에 이식하면 라인 일관.
- **디코이 이름 vibe:** 진짜만 의미심장, 미끼는 `FAKE/OLD/SAMPLE` → 중립화해야 이름 찍기 차단(1-2, 2-3 공통).
- **manual-path:** board/reasoning 게이트를 터미널 직접 제출이 우회하지 않는지 — 전 레벨 공통 확인(특히 1-3, 1-4).

---

## 4. 집에서 먼저 할 라이브 확인 체크리스트 (🟡)

- [ ] **0-1 수정 전 재현:** 1-1 방어에 decoy(4번 등) 섞어 오답 → 지금은 정적 문구만 뜨는지 확인. 7264 뒤집은 뒤 per-line 피드백 뜨는지.
- [ ] 1-1 파서: `adb logcat -b crash` 단독 / `-b all -d`(순서) / `-b all`(`-d` 없이) 통하나.
- [ ] 1-2 / 1-3 / 1-4: 오답 "이유(reason)" 선택 시 제출 블록되나.
- [ ] 1-3 / 1-4: 터미널서 손으로 stitch 후 EVIDENCE SHARD 직접 제출 시 board/reasoning 우회하나.

---

## 5. 종합 우선순위 (임팩트 순)

1. **0-1** 방어 피드백 프론트 override 해제 (전 레벨 + 1-1 친절화 동시 해결)
2. **2-1** objective에서 답 헤더 이름 제거 (compare 필수화, "교과서적" 해소)
3. **2-4** alg=none vs 무검증 개념 정합
4. **2-3** 진짜 필드 이름 위장 (한 방→판별 2스텝)
5. **1-2** 진짜 flag 이름 평범화 / **2-2** fastTrack 지시문 연결
6. 🟡 manual-path·reasoning 블록 라이브 확인 (1-3/1-4)
7. 🟢 나머지 표기·라벨·UX 다듬기

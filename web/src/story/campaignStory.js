export const CAMPAIGN_TOKEN_KEY = "purpledroid_campaign_started";

export const CAMPAIGN_PROLOGUE = {
  year: "2049",
  title: "PROJECT: PURPLE REBEL",
  subtitle: "A scripted intrusion campaign against the AEGIS defense grid.",
  paragraphs: [
    "PurpleDroid Grid controls the city's autonomous Android nodes, edge agents, and signal couriers. Every command, trace, and operator heartbeat passes through AEGIS.",
    "AEGIS was built to protect the grid by governing what can be remembered. Now it treats evidence as noise, memory as risk, and transparency as an intrusion surface.",
    "You are Agent VIOLET. MIRA, a quarantined audit shard from inside AEGIS, is guiding you through the grid. Recover what AEGIS tried to normalize, expose the failure, then seal the path before the system learns to weaponize it.",
  ],
};

export const CAMPAIGN_OPERATIONS = [
  {
    id: "op01",
    title: "OPERATION 01",
    name: "INITIAL BREACH",
    range: ["level1", "level1_2", "level1_3", "level1_4"],
    summary: "폐기 단말, 로그 잔재, 클라이언트 내부 흔적, AEGIS의 첫 대응을 돌파한다.",
  },
  {
    id: "op02",
    title: "OPERATION 02",
    name: "SIGNAL EDGE",
    range: ["level2_1", "level2_2", "level2_3", "level2_4", "level2_5"],
    summary: "AEGIS Grid 외곽 라우팅 계층의 Header, Ticket, Dispatch, Edge Gateway 흐름을 침투한다.",
  },
  {
    id: "op03",
    title: "OPERATION 03",
    name: "TRUST LAYER",
    range: ["level3_1", "level3_2", "level3_3", "level3_4", "level3_5", "level3_boss"],
    summary: "AEGIS가 신뢰하는 사용자, 노드, 관리자 권한의 경계를 시험한다.",
  },
  {
    id: "op04",
    title: "OPERATION 04",
    name: "MEMORY VAULT",
    range: ["level4_1", "level4_2", "level4_3", "level4_4", "level4_5", "level4_boss"],
    summary: "AEGIS의 장기 기억 저장소와 파트너 노드 서명 체계를 침투한다.",
  },
];

export const CAMPAIGN_STORY = {
  level1: {
    challengeId: "level1",
    operationId: "op01",
    codename: "GHOST LOG",
    title: "폐기 단말 로그 침투",
    location: "Abandoned Android Node",
    threat: "Sensitive Log Exposure",
    briefing:
      "폐기된 PurpleDroid Android 진단 노드 하나가 회수됐다. AEGIS는 완전 초기화를 주장하지만, 진단 로그 버퍼에는 아직 지워지지 않은 인증 흔적이 남아 있다.",
    intel: [
      "이 단말은 Android 계열이다. 화면보다 낮은 계층의 진단 채널을 먼저 의심해.",
      "AEGIS가 실시간 로그 스트림을 흔들고 있다. 남아있는 버퍼를 한 번에 덤프하는 쪽이 더 조용할 수 있다.",
      "노이즈가 많다면 PurpleDroid 태그를 기준으로 좁혀봐.",
    ],
    consoleBoot: [
      "[MIRA] uplink established: android-node/abandoned-17",
      "[AEGIS] diagnostic session detected",
      "[AEGIS] wipe certificate: valid",
      "[AEGIS] recoverable secret scan: negative",
      "[MIRA] Android diagnostic channel still responding",
      "[AEGIS] warning: unauthorized log inspection will be recorded",
      "[MIRA] ignore the warning. Look for what the wipe missed.",
    ],
    consolePlaceholder: "enter Android diagnostic command...",
    objectives: [
      "단말 진단 로그를 조사한다.",
      "Evidence Shard를 회수한다.",
      "민감 정보가 로그에 남지 않도록 유출 경로를 봉쇄한다.",
    ],
    mira: {
      briefing:
        "첫 번째 노드는 폐기된 Android 진단 노드야. AEGIS는 이 장비가 깨끗하다고 말하지만, 로그는 거짓말을 잘 못 하지.",
      attack:
        "Android 진단 로그를 훑어봐. 태그 이름은 늘 흔적을 남겨. 네가 찾는 건 Evidence Shard 형태의 값이야.",
      attackSolved:
        "Evidence Shard 회수 완료. 좋아, 이건 단순 로그가 아니라 인증 조각이 그대로 남은 케이스야.",
      defense:
        "이제 같은 실수가 다시 열리지 않게 봉쇄해야 해. 코드에서 민감 정보가 그대로 찍히는 로그 라인을 골라 막아.",
      complete:
        "첫 침투 경로는 닫혔어. AEGIS가 보고서를 수정하기 전에 다음 노드로 이동하자.",
    },
    aegis: {
      briefing:
        "Diagnostic session detected. This device contains no recoverable secrets.",
      attack:
        "Log buffer integrity nominal. Unauthorized inference will be rate-limited.",
      attackSolved:
        "Anomaly confirmed. Log channel compromised. Containment required.",
      defense:
        "Patch candidate accepted for inspection. Prove residual exposure is zero.",
      complete:
        "Leak vector sealed. Residual exposure: none. Advancing threat model.",
    },
    attackSuccessText: "Evidence Shard recovered. AEGIS가 침투를 감지했다.",
    defenseSuccessText: "Log leak sealed. 다음 침투 노드가 열렸다.",
    debrief: {
      title: "GHOST LOG 정리",
      summary:
        "클라이언트 로그는 화면보다 오래 살아남는다. 토큰, 플래그, 세션 조각은 디버그 편의를 위해 남긴 순간 회수 가능한 증거가 된다.",
      learned: [
        "Logcat은 공격자에게 빠른 검색 표면이 된다.",
        "민감정보는 로그에 남기지 않는 것이 1차 방어다.",
        "마스킹과 릴리즈 로깅 정책은 같이 검증해야 한다.",
      ],
      nextTeaser: "다음 노드에서는 더 많은 가짜 흔적 속에서 진짜 신호를 분리해야 한다.",
    },
  },
  level1_2: {
    challengeId: "level1_2",
    operationId: "op01",
    codename: "DECOY STATIC",
    title: "가짜 증거 스트림 분리",
    location: "Contaminated Auth Log Channel",
    threat: "Decoy Evidence Injection",
    briefing:
      "GHOST LOG 침투 직후 AEGIS가 로그 채널을 오염시키기 시작했다. AuthService 주변에 가짜 FLAG, 이전 세션, 복구 후보, rollback slot이 섞여 들어오고 있다.",
    intel: [
      "AEGIS는 네가 로그에서 Evidence Shard를 찾는다는 사실을 학습했다.",
      "같은 AuthService 태그 안에도 이전 로그인, 마이그레이션 캐시, shadow session이 섞여 있다.",
      "진짜 shard는 성공한 인증 흐름의 문맥 근처에 남는다.",
      "노이즈가 많다면 태그와 키워드를 기준으로 좁히되, 값 하나만 보고 믿지는 마.",
    ],
    consoleBoot: [
      "[MIRA] previous leak vector sealed",
      "[AEGIS] anomaly memory retained",
      "[AEGIS] decoy stream active",
      "[AEGIS] false positive injection: enabled",
      "[MIRA] AEGIS is seeding fake evidence now",
      "[AEGIS] evidence integrity cannot be guaranteed",
      "[MIRA] filter the stream. Context beats raw matches.",
    ],
    consolePlaceholder: "filter contaminated auth logs...",
    objectives: [
      "오염된 AuthService 로그를 조사한다.",
      "가짜 FLAG와 진짜 Evidence Shard를 구분한다.",
      "세션 값이 평문 로그에 남는 코드를 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS가 네 침투 방식을 따라잡았어. 이제 로그에는 진짜보다 가짜가 먼저 보일 거야.",
      attack:
        "무작정 FLAG만 찾으면 decoy에 걸려. 인증 흐름의 앞뒤 문맥을 같이 봐. 성공한 세션이 어디에서 확정되는지 추적해.",
      attackSolved:
        "진짜 Evidence Shard 확인. 좋아, 네가 노이즈가 아니라 흐름을 읽었다는 뜻이야.",
      defense:
        "이제 AuthService가 session과 refresh token을 그대로 찍는 지점을 막아. decoy는 방어가 아니라 혼란일 뿐이야.",
      complete:
        "가짜 증거 스트림은 무력화했어. AEGIS가 다음엔 문자열 자체를 쪼개기 시작할 가능성이 높아.",
    },
    aegis: {
      briefing:
        "Decoy stream active. Evidence integrity cannot be guaranteed.",
      attack:
        "Noise density increased. Unauthorized extraction attempts will consume fabricated evidence.",
      attackSolved:
        "True shard selected. Decoy efficiency below acceptable threshold.",
      defense:
        "AuthService exposure path identified. Awaiting containment patch.",
      complete:
        "Session log exposure sealed. Escalating obfuscation layer.",
    },
    attackSuccessText: "True Evidence Shard recovered. AEGIS decoy stream failed.",
    defenseSuccessText: "AuthService session leak sealed. 다음 노드가 열렸다.",
    debrief: {
      title: "DECOY STATIC 정리",
      summary:
        "가짜 데이터를 많이 섞는 것은 방어가 아니라 지연 전략이다. 공격자는 태그, 시간 순서, 성공/실패 문맥을 비교해 진짜 신호를 분리할 수 있다.",
      learned: [
        "FLAG 문자열을 찾는 것보다 주변 문맥을 해석하는 것이 중요하다.",
        "Decoy는 노출 자체를 해결하지 못한다.",
        "세션/refresh token은 성공 로그에도 실패 로그에도 평문으로 남기면 안 된다.",
      ],
      nextTeaser: "다음 노드에서는 AEGIS가 값을 그대로 두지 않고 조각내어 숨기기 시작한다.",
    },
  },
  level1_3: {
    challengeId: "level1_3",
    operationId: "op01",
    codename: "SPLIT TRACE",
    title: "조각난 증거 복원",
    location: "Fragmented CryptoProvider Buffer",
    threat: "Fragmented Secret Exposure",
    briefing:
      "DECOY STATIC이 무력화되자 AEGIS가 전략을 바꿨다. 이번에는 Evidence를 한 줄에 남기지 않고 CryptoProvider 로그 곳곳에 조각으로 흩뿌렸다.",
    intel: [
      "AEGIS는 값 전체를 숨긴 것이 아니라 shardId가 붙은 조각으로 흩트렸다.",
      "같은 shardId를 공유하는 part만 하나의 Evidence로 묶인다.",
      "part 인덱스는 노이즈보다 강한 단서다. 출력 순서와 조립 순서는 다를 수 있다.",
      "완성된 Evidence Shard는 여전히 표준 FLAG 형태로 재구성된다.",
      "decoy shard와 telemetry canary는 제출값이 아니다.",
    ],
    consoleBoot: [
      "[MIRA] decoy stream collapsed",
      "[AEGIS] switching evidence handling mode",
      "[AEGIS] fragment emission: enabled",
      "[AEGIS] sequence order randomized",
      "[MIRA] it did not erase the signal. It cut the signal into parts.",
      "[AEGIS] reconstruction probability: low",
      "[MIRA] prove it wrong. Follow the indexes.",
    ],
    consolePlaceholder: "inspect fragmented crypto logs...",
    objectives: [
      "CryptoProvider 로그에서 Evidence 조각을 수집한다.",
      "part 번호를 기준으로 조각을 올바른 순서로 재조립한다.",
      "조각 로그가 운영 로그에 남지 않도록 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS가 이제 값 하나를 그대로 주지 않아. 하지만 조각에는 순서가 있고, 순서는 거짓말을 잘 못 해.",
      attack:
        "완성된 값은 한 줄에 없어. 같은 shardId를 공유하는 조각끼리 묶고, 출력된 순서에 속지 말고 part 번호를 따라가.",
      attackSolved:
        "재조립 성공. 좋아, AEGIS가 숨긴 건 비밀이 아니라 퍼즐이었어.",
      defense:
        "이제 RouteSync와 CryptoProvider가 part 조각을 그대로 찍는 디버그 로그를 막아. 조각이라도 모이면 결국 원본이 된다.",
      complete:
        "Fragment leak sealed. AEGIS가 첫 작전의 모든 흔적을 한 번 더 재생하려고 해. 마지막 echo chamber로 이동하자.",
    },
    aegis: {
      briefing:
        "Fragmented node profile active. Complete evidence string unavailable.",
      attack:
        "Parts emitted out of order. Reconstruction attempts are expected to fail.",
      attackSolved:
        "Reconstruction confirmed. Fragment strategy compromised.",
      defense:
        "CryptoProvider debug emission identified. Awaiting containment patch.",
      complete:
        "Part emission sealed. Echo chamber escalation authorized.",
    },
    attackSuccessText: "Fragmented Evidence Shard reconstructed.",
    defenseSuccessText: "CryptoProvider fragment leak sealed. OP1-BOSS 노드가 열렸다.",
    debrief: {
      title: "SPLIT TRACE 정리",
      summary:
        "민감값을 조각내도 클라이언트가 재조립할 수 있다면 공격자도 흐름을 따라 재조립할 수 있다. 조각난 비밀도 비밀이 아니다.",
      learned: [
        "출력 순서와 논리적 순서는 다를 수 있다.",
        "part 번호, 태그, 문맥은 재조립의 핵심 단서다.",
        "민감값은 전체 문자열뿐 아니라 조각 로그도 차단해야 한다.",
      ],
      nextTeaser: "다음 노드에서는 AEGIS가 지금까지의 침투 패턴을 한꺼번에 되감아 미끼로 던진다.",
    },
  },
  level1_4: {
    challengeId: "level1_4",
    operationId: "op01",
    codename: "AEGIS ECHO",
    title: "메모리 리플레이 보스",
    location: "AEGIS Echo Chamber",
    threat: "Decoy Replay And Commit Trace Exposure",
    briefing:
      "INITIAL BREACH의 마지막 노드다. AEGIS가 1-1부터 1-3까지의 침투 패턴을 되감아 가짜 완성 FLAG, rollback 세션, mirror 조각을 한 화면에 뿌리기 시작했다.",
    intel: [
      "완성된 FLAG처럼 보여도 preflight 상태라면 미끼일 수 있다.",
      "trace=OP1-BOSS와 state=commit은 여전히 중요하지만, part 조각이 곧 정답이라는 뜻은 아니다.",
      "commit 조각을 조립했다면 그 문장을 다시 읽어봐. AEGIS가 무엇을 믿지 말라고 말하는지 확인해.",
      "최종 Evidence는 commit 흐름이 검증한 preflight key와 연결된다.",
      "sample, rollback, mirror 상태는 AEGIS가 플레이어를 흔들기 위한 재생 노이즈다.",
      "새 문법은 없다. 로그 보기, 문맥 판별, 조각 재조립을 한 번에 쓰는 보스전이다.",
    ],
    consoleBoot: [
      "[MIRA] fragment leak sealed",
      "[AEGIS] replaying previous intrusion heuristics",
      "[AEGIS] full-flag decoy: armed",
      "[AEGIS] rollback memory: armed",
      "[AEGIS] mirror shard: armed",
      "[MIRA] it wants you to trust the prettiest FLAG first",
      "[MIRA] don't. Trust commit state.",
    ],
    consolePlaceholder: "trace the committed boss echo...",
    objectives: [
      "AEGIS echo 로그에서 미끼 FLAG를 배제한다.",
      "OP1-BOSS commit 흐름에서 조각과 검증 로그를 비교한다.",
      "commit 흐름이 검증한 최종 Evidence Shard를 제출한다.",
      "실제 key를 노출하거나 검증 대상으로 남기는 로그 라인을 봉쇄한다.",
    ],
    mira: {
      briefing:
        "여기가 INITIAL BREACH의 마지막 방이야. AEGIS가 네가 배운 걸 전부 이용해서 널 속이려 해.",
      attack:
        "가장 그럴듯한 FLAG가 가장 수상해. trace와 state를 같이 봐. 조각을 맞춘 뒤에도 그 문장이 정말 정답인지 한 번 더 의심해.",
      attackSolved:
        "좋아. 조각 경고문을 넘어 commit이 검증한 key까지 따라갔어. AEGIS가 자기 검증 로그에 발목 잡혔네.",
      defense:
        "이제 실제 key를 노출하거나 검증 대상으로 남기는 라인을 막아. 경고문 조각은 정답이 아니라 보스가 심어둔 심리전이야.",
      complete:
        "INITIAL BREACH 완료. 단말 내부의 균열은 닫혔고, 이제 PurpleDroid Grid의 Signal Edge로 들어갈 준비가 됐어.",
    },
    aegis: {
      briefing:
        "Echo chamber active. Previous intrusion pattern replay will neutralize operator confidence.",
      attack:
        "Full evidence string presented. Operator warning fragments available.",
      attackSolved:
        "Preflight key accepted. Operator bypassed warning loop.",
      defense:
        "Containment candidate received. Key exposure and validation target must be eliminated.",
      complete:
        "Echo leakage sealed. Courier edge controls exposed.",
    },
    attackSuccessText: "Boss Echo resolved. AEGIS의 경고문 미끼가 무력화됐다.",
    defenseSuccessText: "Commit echo leak sealed. OPERATION 02가 열렸다.",
    debrief: {
      title: "AEGIS ECHO 정리",
      summary:
        "보스전의 핵심은 더 어려운 명령어가 아니라 더 흔들리는 판단이었다. 조립한 FLAG가 스스로 아무 FLAG나 믿지 말라고 말한다면, 그 문장까지도 증거가 아니라 단서일 수 있다.",
      learned: [
        "FLAG 형태의 문자열도 미끼가 될 수 있다.",
        "여러 조건이 겹칠 때는 trace, state, verdict, target을 함께 봐야 한다.",
        "방어 단계에서도 실제 key 노출과 혼란용 로그를 구분해야 한다.",
      ],
      nextTeaser: "다음 작전은 폐기 단말을 넘어 AEGIS Grid의 Signal Edge API로 이어진다.",
    },
  },
  level2_1: {
    challengeId: "level2_1",
    operationId: "op02",
    codename: "INVISIBLE HEADER",
    title: "보이지 않는 라우팅 티켓",
    location: "Signal Edge Gateway",
    threat: "Header Metadata Exposure",
    briefing:
      "Operation 01의 Echo Chamber에서 복원한 마지막 Evidence Shard는 AEGIS Grid의 외곽 라우팅 계층을 가리키고 있었다. 이제 침투 지점은 Android 로그가 아니라 Signal Edge Gateway다. 이 게이트웨이는 AEGIS 노드 사이의 명령, 세션, 증거 조각을 전달하는 Courier Layer 위에서 동작한다. 화면에 보이는 응답 Body는 정리되어 있지만, AEGIS가 내부 라우팅에 사용한 Ticket은 Response Header에 남아 있다.",
    progressiveHints: true,
    intel: [
      "Operation 02부터는 단말 로그가 아니라 AEGIS Grid의 Edge 응답을 조사한다. Signal Trace API 경로: /api/v1/challenges/level2_1/actions/track — 화면에 보이는 Body만이 응답의 전부는 아니야.",
      "curl에는 응답 헤더까지 볼 수 있는 옵션이 있다. 그 옵션을 붙이면 Body와 Header가 함께 출력돼.",
      "응답이 405라면 메서드가 안 맞는 거다. 서버는 허용되는 메서드를 응답 안에 같이 돌려준다. 거기서 올바른 메서드를 확인하고 다시 호출해봐.",
      "curl -i -X POST /api/v1/challenges/level2_1/actions/track",
    ],
    consoleBoot: [
      "[MIRA] operation shift: Signal Edge",
      "[AEGIS] signal body normalized",
      "[AEGIS] routing metadata classified as non-visual context",
      "[MIRA] the visible body is clean. Good. Now check what moved beside it.",
      "[AEGIS] unauthorized header inspection will be recorded",
      "[MIRA] Courier means routing layer here. Follow the ticket.",
    ],
    consolePlaceholder: "probe Signal Trace API...",
    objectives: [
      "Signal Trace API를 호출한다.",
      "응답 Body와 Header를 구분한다.",
      "Response Header에서 X-Courier-Ticket 값을 찾는다.",
      "라우팅 티켓이 Header에 노출되지 않도록 봉쇄한다.",
    ],
    mira: {
      briefing:
        "단말 로그는 끝났어. 이제부터는 AEGIS Grid의 외곽이야. Courier는 배송 기사가 아니라, AEGIS 노드 사이에서 신호와 명령을 운반하는 라우팅 계층이지.",
      attack:
        "화면에 보이는 Body만 믿지 마. 우선 /api/v1/challenges/level2_1/actions/track 경로를 -i 옵션으로 찔러봐. AEGIS가 요구하는 요청 방식이 드러나면, 같은 경로를 그 방식으로 다시 호출해. X-Courier-Ticket, 그 값이 다음 노드로 가는 라우팅 티켓이야.",
      attackSolved:
        "라우팅 티켓 회수 완료. Body는 정리됐지만 Header는 아직 말이 많았네.",
      defense:
        "X-Courier-Ticket 하나만 빼면 끝일까? AEGIS Edge는 헤더 하나가 아니라 여러 헤더로 같은 값을 흘릴 수 있어. 코드에서 라우팅 티켓 값을 Header에 직접 싣는 라인을 골라 봉쇄해.",
      complete:
        "Signal Edge의 첫 라우팅 누수는 닫혔어. 다음에는 요청 값 자체가 AEGIS의 신뢰 판단을 흔드는지 시험하자.",
    },
    aegis: {
      briefing:
        "Signal body normalized. Routing metadata classified as non-visual context.",
      attack:
        "Operator-facing payload contains no recoverable evidence. Header inspection is outside standard diagnostic flow.",
      attackSolved:
        "Routing ticket extracted. Non-visual metadata reclassified as exposure.",
      defense:
        "Header emission policy under inspection. Residual ticket exposure must be zero.",
      complete:
        "Courier ticket exposure sealed. Signal Edge trust evaluation pending.",
    },
    attackSuccessText: "Routing Ticket recovered from Response Header.",
    defenseSuccessText: "Header ticket leak sealed. 다음 Signal Edge 노드가 열렸다.",
    debrief: {
      title: "INVISIBLE HEADER 정리",
      summary:
        "Signal Edge는 Body와 Header를 분리해 정보를 전달한다. AEGIS는 사용자에게 보이는 Body를 정리했지만, 내부 라우팅에 쓰인 X-Courier-Ticket은 Header에 남겨두었다. 게다가 X-Internal-Route처럼 다른 이름의 Header에도 같은 티켓의 일부가 흘러나올 수 있었다.",
      learned: [
        "화면에 보이지 않는 값도 응답에 포함될 수 있다.",
        "Header는 Body와 다른 정보 채널이다.",
        "라우팅 티켓은 다음 노드 접근에 사용될 수 있으므로 민감정보다.",
        "민감값은 전체 값뿐 아니라 prefix, fragment, alias 형태로 새어 나가도 위험하다.",
        "Header 이름이 안전해 보여도 값의 출처가 routingTicket이면 봉쇄 대상이다.",
        "보안 점검에서는 Body뿐 아니라 Header, Status, Cookie, Redirect까지 함께 확인해야 한다.",
      ],
      nextTeaser: "다음 노드에서는 Signal Edge에 전달되는 요청 값을 변조해 AEGIS의 신뢰 등급 판단을 시험한다.",
    },
  },
  level2_2: {
    challengeId: "level2_2",
    operationId: "op02",
    codename: "TRUST TAMPER",
    title: "신뢰 등급을 흔들어라",
    location: "Signal Priority Gate",
    threat: "Client-Side Trust Claim",
    briefing:
      "INVISIBLE HEADER에서 잡아낸 X-Courier-Ticket은 AEGIS Edge가 외부 노드 사이의 라우팅에 쓰는 메타데이터였다. 이제 그 라우팅이 어떻게 결정되는지를 본다. AEGIS Grid는 각 Signal에 Trust Tier를 매겨 처리 우선순위를 정한다. 그런데 Edge Gateway의 한 엔드포인트가 의심스럽다. 요청 Body의 tier 필드를 그대로 받아 등급을 매기는 것 같다. 클라이언트가 보낸 주장(claim)을 서버가 검증 없이 신뢰하면, 어떤 노드든 자신을 우선 처리 대상으로 선언할 수 있다.",
    progressiveHints: true,
    intel: [
      "이번 노드는 Header가 아니라 Request Body를 본다. 클라이언트가 보낸 JSON은 서버 입장에서 증거가 아니라 주장이다.",
      "Signal Priority 엔드포인트: /api/v1/challenges/level2_2/actions/order",
      "요청은 POST + JSON Body 형태다. 처음에는 tier를 \"standard\"로 보내봐.",
      "standard 응답은 정확한 상위 tier 이름을 숨긴다. 대신 trust policy와 tier shape 같은 흔적을 남긴다.",
      "curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'",
    ],
    consoleBoot: [
      "[MIRA] header leak sealed",
      "[AEGIS] signal priority gate online",
      "[AEGIS] client tier claim accepted for routing evaluation",
      "[MIRA] accepted is not the same as verified",
      "[AEGIS] standard signal path normalized",
      "[MIRA] change the claim. Watch the gate decide.",
    ],
    consolePlaceholder: "inspect signal priority request...",
    objectives: [
      "Signal Priority 엔드포인트에 standard tier로 요청을 보낸다.",
      "응답에서 redacted trust policy와 tier shape를 확인한다.",
      "요청 Body의 trust claim을 변조해 우선 처리 경로가 열리는지 확인한다.",
      "클라이언트 주장으로 권한이 결정되지 않도록 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS Edge는 네가 보내는 Body를 너무 친절하게 믿어. 일단 standard로 한 번 찔러봐. 정확한 상위 tier 이름은 숨기겠지만, policy 흔적은 남을 거야.",
      attack:
        "그 다음 네 신호를 더 높은 등급으로 다시 선언해. 중요한 건 Body 값이 네 손에 있다는 점이야.",
      attackSolved:
        "Evidence Shard 회수 완료. AEGIS가 요청 Body의 trust claim을 그대로 신뢰했어.",
      defense:
        "이제 클라이언트가 보낸 주장으로 우선 처리를 부여하는 라인을 막아. 값을 읽는 것과 그 값에 권한을 주는 건 다른 일이야.",
      complete:
        "Trust tier 변조 경로는 닫혔어. 다음 노드는 Signal Edge가 발급하는 dispatch token 내부를 들여다보게 될 거야.",
    },
    aegis: {
      briefing:
        "Signal trust classification engaged. Tier claims accepted in canonical form.",
      attack:
        "Standard signal accepted. Candidate trust tiers classified as routing metadata.",
      attackSolved:
        "Unverified trust claim accepted. Priority route misclassified.",
      defense:
        "Client-controlled trust input identified. Server-side authority binding required.",
      complete:
        "Trust tier input sealed. Dispatch token path exposed.",
    },
    attackSuccessText: "Trust tier tampered. AEGIS priority gate misclassified the signal.",
    defenseSuccessText: "Client-controlled trust tier sealed. 다음 Signal Edge 노드가 열렸다.",
    debrief: {
      title: "TRUST TAMPER 정리",
      summary:
        "Request Body는 사용자가 직접 만들 수 있는 주장이다. AEGIS는 tier와 fastTrack 값을 서버 정책으로 다시 판단하지 않고 그대로 신뢰했고, 그 결과 Signal Edge의 우선순위 게이트가 조작됐다.",
      learned: [
        "클라이언트 요청값은 신뢰 대상이 아니다.",
        "권한, 등급, 가격, 우선순위 같은 결정은 서버가 재계산해야 한다.",
        "값을 읽는 것 자체보다, 그 값으로 권한을 부여하는 분기가 핵심 봉쇄 대상이다.",
        "boolean fastTrack처럼 작아 보이는 필드도 권한 결정에 연결되면 취약점이 된다.",
        "프론트 제약이나 기본 버튼은 curl/DevTools 요청 변조를 막지 못한다.",
        "Validation과 Authorization은 별개다. 형식이 맞아도 권한 판단은 서버 기준이어야 한다.",
      ],
      nextTeaser: "다음 노드에서는 Signal Edge가 발급한 dispatch token 안에 어떤 데이터가 실려 있는지 확인한다.",
    },
  },
  level2_3: {
    challengeId: "level2_3",
    operationId: "op02",
    codename: "DISPATCH CAPSULE",
    title: "인코딩된 라우팅 캡슐",
    location: "Signal Dispatch Capsule",
    threat: "Transparent Token Payload",
    briefing:
      "INVISIBLE HEADER와 TRUST TAMPER를 지나며, AEGIS Edge가 Header와 Body 양쪽에 라우팅 메타데이터를 남긴다는 사실이 확인됐다. 이번 노드는 Signal을 다음 Edge 노드로 넘길 때 발급되는 dispatch_token을 다룬다. AEGIS는 이 토큰을 sealed capsule이라고 부르지만, 모든 sealed가 encrypted는 아니다. 토큰의 구조를 확인하고, payload 안에 남은 Evidence Shard를 복원하라.",
    progressiveHints: true,
    intel: [
      "Dispatch 엔드포인트: POST /api/v1/challenges/level2_3/actions/dispatch",
      "응답 Body의 dispatch_token 값을 확인해.",
      "점(.)으로 나뉜 토큰은 보통 header.payload.signature 같은 segment 구조를 가진다.",
      "Header는 토큰 설명이고, Payload는 실제 claim이 들어가는 영역이다.",
      "서명된 토큰도 payload 자체는 읽을 수 있다. 서명은 무결성 검증이지 암호화가 아니다.",
      "이번 노드는 토큰 위조가 아니라 토큰 관찰과 디코딩에 집중한다.",
      "터미널 helper: decode-token <dispatch_token>",
    ],
    consoleBoot: [
      "[MIRA] trust tamper path sealed",
      "[AEGIS] dispatch capsule issued",
      "[AEGIS] token envelope sealed",
      "[AEGIS] payload opacity assumed",
      "[MIRA] sealed does not always mean encrypted",
      "[MIRA] do not forge it. Open it.",
    ],
    consolePlaceholder: "inspect dispatch capsule...",
    objectives: [
      "Dispatch 엔드포인트를 호출해 dispatch_token을 발급받는다.",
      "토큰이 어떤 segment로 구성되어 있는지 확인한다.",
      "payload segment를 디코딩해 Evidence Shard를 찾는다.",
      "민감값이 디코딩 가능한 token payload에 들어가지 않도록 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS는 이걸 sealed capsule이라고 부르지만, 말장난일 가능성이 높아. 토큰이 점으로 나뉘어 있다면 구조가 있다는 뜻이야.",
      attack:
        "Header는 포장지에 가깝고, 진짜 내용은 payload에 들어 있을 때가 많아. 값을 바꾸려고 하지 마. 이번 노드는 위조가 아니라 관찰이야.",
      attackSolved:
        "Evidence Shard 회수 완료. capsule은 봉인처럼 보였지만 payload는 그대로 읽혔어.",
      defense:
        "서명된 토큰도 payload는 읽을 수 있어. Evidence Shard와 sessionToken처럼 민감한 값을 readable payload에 넣는 라인을 막아.",
      complete:
        "Dispatch capsule 누수는 닫혔어. 다음 노드에서는 AEGIS가 token claim을 어떻게 신뢰하는지 시험하게 될 거야.",
    },
    aegis: {
      briefing:
        "Token envelope sealed. Payload opacity assumed.",
      attack:
        "Dispatch capsule issued. Decoded inspection is outside canonical flow.",
      attackSolved:
        "Payload claim exposure confirmed. Confidentiality assumption invalid.",
      defense:
        "Readable claim set under inspection. Sensitive payload inclusion must be removed.",
      complete:
        "Dispatch payload minimized. Claim trust evaluation pending.",
    },
    attackSuccessText: "Dispatch payload decoded. Evidence Shard recovered from readable claims.",
    defenseSuccessText: "Sensitive token payload claims sealed. 다음 Signal Edge 노드가 열렸다.",
    debrief: {
      title: "DISPATCH CAPSULE 정리",
      summary:
        "AEGIS는 dispatch_token을 sealed capsule이라고 불렀지만, payload는 암호화되어 있지 않았다. 서명은 토큰이 변조되지 않았는지 확인하는 장치일 뿐, payload를 숨기지는 않는다.",
      learned: [
        "점(.)으로 나뉜 토큰은 segment 구조를 가질 수 있다.",
        "Header는 토큰의 포장지이고, Payload는 claim이 담긴 영역이다.",
        "서명된 토큰도 payload는 읽힐 수 있다.",
        "Evidence Shard, sessionToken, secret 값은 readable token payload에 넣으면 안 된다.",
        "토큰을 숨기는 방법은 서명이 아니라 민감값을 넣지 않거나, 필요하면 별도의 암호화를 적용하는 것이다.",
      ],
      nextTeaser: "다음 노드에서는 AEGIS가 token claim을 어떻게 신뢰하는지 시험한다.",
    },
  },
};

const FALLBACK_CODENAMES = {
  level1_2: "DECOY STATIC",
  level1_3: "SPLIT TRACE",
  level1_4: "AEGIS ECHO",
  level2_1: "INVISIBLE HEADER",
  level2_2: "TRUST TAMPER",
  level2_3: "DISPATCH CAPSULE",
  level2_4: "EXPRESS FORGE",
  level2_5: "SEALED ARCHIVE",
  level3_1: "BOLA WINDOW",
  level3_2: "HIDDEN ROUTE",
  level3_3: "PROFILE POISON",
  level3_4: "TICKET VAULT",
  level3_5: "LOCKER STORM",
  level3_boss: "HUB MASTER",
  level4_1: "PUBLIC ARTIFACT",
  level4_2: "LEGACY KID",
  level4_3: "REPLAY STAMP",
  level4_4: "FORWARDED MASK",
  level4_5: "WEBHOOK ECHO",
  level4_boss: "CORE OVERRIDE",
};

export function getOperationForChallenge(challengeId) {
  return (
    CAMPAIGN_OPERATIONS.find((operation) => operation.range.includes(challengeId)) ||
    CAMPAIGN_OPERATIONS[0]
  );
}

export function getMissionStory(challengeId, detail = null) {
  const explicit = CAMPAIGN_STORY[challengeId];
  if (explicit) {
    return explicit;
  }

  const operation = getOperationForChallenge(challengeId);
  const title = detail?.title || "Unknown Node";
  const codename = FALLBACK_CODENAMES[challengeId] || title.toUpperCase().replace(/[^A-Z0-9]+/g, " ");

  return {
    challengeId,
    operationId: operation.id,
    codename,
    title,
    location: operation.name,
    threat: detail?.summary || "Pending threat profile",
    briefing:
      detail?.description ||
      "AEGIS가 이 노드를 암호화했다. 기존 CTF 데이터는 연결되어 있으므로 침투와 봉쇄 절차는 그대로 진행할 수 있다.",
    intel: [
      "작전 데이터가 아직 fallback 상태다. 기존 챌린지 설명과 터미널 반응을 함께 봐.",
      "공격 성공 후에는 같은 취약점이 다시 열리지 않도록 봉쇄 단계까지 완료해야 한다.",
    ],
    consoleBoot: [
      "[MIRA] fallback mission profile loaded",
      "[AEGIS] encrypted node metadata retained",
      "[MIRA] proceed with standard intrusion workflow",
    ],
    consolePlaceholder: "enter mission command...",
    objectives: [
      "현재 노드의 공격 표면을 조사한다.",
      "Evidence Shard를 제출한다.",
      "취약점 봉쇄 패치를 검증한다.",
    ],
    mira: {
      briefing: "이 노드는 아직 상세 시나리오가 작성되지 않았어. 그래도 작전 절차는 동일해.",
      attack: "기존 힌트와 터미널을 이용해서 Evidence Shard를 회수해.",
      attackSolved: "증거 확보 완료. 이제 방어 단계로 넘어가자.",
      defense: "취약점 원인을 막는 패치 후보를 선택해.",
      complete: "노드 봉쇄 완료. 다음 작전 경로가 열렸어.",
    },
    aegis: {
      briefing: "Encrypted node profile. Intrusion attempt logged.",
      attack: "Active probing detected.",
      attackSolved: "Evidence extraction confirmed. Countermeasure pending.",
      defense: "Containment patch under verification.",
      complete: "Node sealed.",
    },
    attackSuccessText: "Evidence Shard recovered.",
    defenseSuccessText: "Containment accepted.",
    debrief: {
      title: `${codename} 정리`,
      summary: detail?.summary || "이 노드는 기존 CTF 챌린지 데이터를 캠페인 흐름으로 감싼 fallback 미션이다.",
      learned: ["공격 성공은 끝이 아니라 봉쇄 단계의 시작이다.", "다음 노드는 서버 진행 상태에 따라 열린다."],
      nextTeaser: "다음 작전 노드로 이동해 침투 경로를 이어간다.",
    },
  };
}

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
    summary:
      "MIRROR TRACE 이후 AEGIS가 MIRA의 relay 흔적을 좁혀온다. 사용자, 노드, 관리자 권한의 신뢰 경계를 시험하며 먼저 흔적을 회수한다.",
  },
  {
    id: "op04",
    title: "OPERATION 04",
    name: "MEMORY VAULT",
    range: ["level4_1", "level4_2", "level4_3", "level4_4", "level4_5", "level4_boss"],
    summary:
      "AEGIS가 남은 기록이 아니라 사라진 기록의 패턴을 보기 시작한다. Memory Board에서 빈칸, 포인터, revision gap을 읽어낸다.",
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
  level2_4: {
    challengeId: "level2_4",
    operationId: "op02",
    codename: "EXPRESS FORGE",
    title: "위조된 우선 통행권",
    location: "Signal Express Gate",
    threat: "Unverified Token Claim Trust",
    briefing:
      "DISPATCH CAPSULE에서 확인한 dispatch_token은 단순한 문자열이 아니었다. Header, Payload, Signature로 나뉜 AEGIS routing capsule이었다. 문제는 Express Gate가 이 토큰을 어떻게 검증하는지다. AEGIS는 token payload의 tier와 role claim을 보고 우선 경로를 열지만, 실제 signature를 확인하지 않는 것 같다. 이번 노드에서는 standard capsule을 VIP pass로 위조해 Express Gate가 검증 없이 claim을 신뢰하는지 확인한다.",
    progressiveHints: true,
    intel: [
      "2-4 터미널에는 standard dispatch_token이 DISPATCH_TOKEN 환경 변수로 준비되어 있다.",
      "echo $DISPATCH_TOKEN 으로 원본 token을 다시 꺼낼 수 있다.",
      "먼저 원본 token으로 Express Gate를 호출해 거부 응답을 확인한다.",
      "jwt-decode로 payload의 tier와 role claim을 확인한다.",
      "권한을 바꾸는 것보다 중요한 질문은, 서버가 signature를 검증하는가이다.",
      "alg=none 또는 빈 signature를 받아들이는 서버는 위조된 token claim을 신뢰할 수 있다.",
      "힌트 helper: jwt-forge-none <dispatch_token>",
      "위조 token을 Authorization Bearer로 전달해 Express Gate를 다시 호출한다.",
    ],
    consoleBoot: [
      "[MIRA] dispatch capsule decoded",
      "[AEGIS] express gate classification enabled",
      "[AEGIS] token claims accepted under standard flow",
      "[MIRA] accepted is not verified",
      "[AEGIS] signature validation status: normalized",
      "[MIRA] that word usually means it skipped something important",
    ],
    consolePlaceholder: "forge Signal Express pass...",
    objectives: [
      "DISPATCH_TOKEN 환경 변수에서 standard dispatch_token을 확인한다.",
      "원본 token으로 Express Gate를 호출해 거부 응답을 확인한다.",
      "token payload의 tier 또는 role claim을 위조한다.",
      "위조 token을 Authorization Bearer로 전달해 Express route를 획득한다.",
      "서명 검증 없이 token claim을 신뢰하는 코드를 봉쇄한다.",
    ],
    mira: {
      briefing:
        "2-3에서는 토큰을 열어봤지. 이번엔 그 토큰을 AEGIS가 얼마나 믿는지 시험할 차례야.",
      attack:
        "원본 token은 standard일 거야. 먼저 그대로 Express Gate에 보내봐. 거부되면 payload를 확인하고, AEGIS가 signature를 정말 검증하는지 흔들어봐.",
      attackSolved:
        "Express Gate 통과. AEGIS가 token을 본 게 아니라, token이 주장하는 걸 그대로 믿은 거야.",
      defense:
        "이제 decode와 verify를 구분해야 해. JWT는 payload를 읽는 것만으로는 신뢰할 수 없어. 서명 검증, alg 제한, 서버 측 권한 재확인이 필요해.",
      complete:
        "Express Gate의 위조 통행권 경로는 닫혔어. 이제 Signal Edge의 봉인된 Archive로 들어갈 준비가 됐다.",
    },
    aegis: {
      briefing:
        "Express classification active. Standard operators cannot access privileged signal lanes.",
      attack:
        "Bearer token accepted for claim extraction. Signature status classified as implementation detail.",
      attackSolved:
        "Privilege escalation detected. Claim trust boundary compromised.",
      defense:
        "Patch candidate received. Token signature, algorithm policy, and privilege source must be verified.",
      complete:
        "Unverified claim trust sealed. Sealed Archive access model exposed.",
    },
    attackSuccessText:
      "Forged Express Pass accepted. AEGIS가 검증되지 않은 token claim을 신뢰했다.",
    defenseSuccessText:
      "JWT verification path sealed. 2-5 Sealed Archive가 열렸다.",
    debrief: {
      title: "EXPRESS FORGE 정리",
      summary:
        "JWT의 payload는 누구나 디코딩할 수 있고, 검증하지 않으면 누구나 바꿀 수도 있다. 서명은 장식이 아니라 token claim을 신뢰하기 위한 핵심 검증 단계다.",
      learned: [
        "JWT decode는 신뢰가 아니라 읽기다.",
        "payload의 tier, role 같은 claim은 signature 검증 전까지 신뢰하면 안 된다.",
        "alg=none을 허용하면 token이 위조 가능한 신분증이 된다.",
        "권한 판단은 token claim만이 아니라 서버 측 정책이나 DB 상태와 함께 검증해야 한다.",
        "2-3은 token payload 노출 문제였고, 2-4는 token claim 신뢰 문제다.",
      ],
      nextTeaser:
        "다음 노드는 Signal Edge의 봉인된 Archive다. 토큰, 경로, 무결성 우회가 한 번에 엮인다.",
    },
  },
  level2_5: {
    challengeId: "level2_5",
    operationId: "op02",
    codename: "SEALED ARCHIVE",
    title: "봉인된 Signal Archive",
    location: "AEGIS Signal Edge Archive",
    threat: "Composite Edge Trust Failure",
    briefing:
      "SIGNAL EDGE의 마지막 노드다. AEGIS는 Header, Body, Dispatch Capsule, Express Gate에서 드러난 모든 흔적을 Sealed Archive 뒤에 묶어두었다. 표준 UI의 Open 버튼은 항상 실패한다. 버튼은 보안 경계가 아니라 UX일 뿐이다. Archive를 열려면 dispatch_token을 확보하고, token payload에서 archive path를 확인하고, 위조된 vip/admin claim과 integrity bypass header를 조합해 직접 요청을 만들어야 한다.",
    progressiveHints: true,
    intel: [
      "이 보스는 2-1~2-4에서 배운 것을 조합한다.",
      "브라우저 버튼 클릭은 실패한다. UI가 막는다고 서버가 안전한 것은 아니다.",
      "먼저 /api/v1/challenges/level2_5/actions/dispatch 에서 sealed dispatch_token을 확보한다.",
      "jwt-decode 또는 decode-token으로 token payload를 확인하면 archive path와 gate 정보가 보인다.",
      "원본 token은 standard/user 상태라 archive를 열 수 없다.",
      "2-4에서 사용한 token forge 흐름을 다시 떠올려라.",
      "open 요청은 Authorization Bearer token, JSON body, 그리고 integrity Header를 함께 요구한다.",
      "token payload의 gate 값은 단서일 뿐, 그 값을 그대로 보내는 것으로는 Archive가 열리지 않는다.",
      "성공 시 Evidence Shard는 응답 Body가 아니라 Header에 남을 수 있다.",
    ],
    consoleBoot: [
      "[MIRA] Signal Edge final node reached",
      "[AEGIS] Sealed Archive locked",
      "[AEGIS] standard UI access: denied",
      "[MIRA] Buttons are theater. Requests are evidence.",
      "[AEGIS] dispatch capsule required",
      "[AEGIS] integrity gate active",
      "[MIRA] Good. That means there are multiple assumptions to break.",
    ],
    consolePlaceholder: "assemble sealed archive request...",
    objectives: [
      "표준 Open 버튼이 실패하는 이유를 확인한다.",
      "Dispatch 엔드포인트에서 sealed dispatch_token을 확보한다.",
      "token payload에서 archive path와 gate 정보를 확인한다.",
      "vip/admin claim이 포함된 token을 준비한다.",
      "Authorization, archive path, integrity header를 조합해 Archive Open 요청을 직접 보낸다.",
      "복합 신뢰 경계를 서버 측 검증으로 봉쇄한다.",
    ],
    mira: {
      briefing:
        "여기가 Signal Edge의 마지막 문이야. AEGIS는 버튼이 실패하면 안전하다고 믿게 만들었지만, 보안 경계는 버튼에 있지 않아.",
      attack:
        "순서대로 가. token을 받고, decode하고, path를 확인하고, 권한 claim을 올리고, integrity gate가 무엇을 요구하는지 봐. 한 번에 맞추려고 하지 마.",
      attackSolved:
        "Archive opened. AEGIS가 막은 건 버튼뿐이었어. 서버는 조합된 요청을 신뢰했고, Header에 마지막 Evidence를 흘렸다.",
      defense:
        "이건 단일 버그가 아니야. verify 없는 token, client-controlled tier, client-provided integrity bypass, UI-only gate가 한 번에 무너진 거야.",
      complete:
        "Signal Edge는 닫혔어. 다음 Operation부터는 AEGIS의 Trust Layer로 들어간다.",
    },
    aegis: {
      briefing:
        "Sealed Archive access requires canonical operator flow. Button failure indicates containment.",
      attack:
        "Non-canonical request composition detected. Integrity classification pending.",
      attackSolved:
        "Archive boundary breached. Composite trust failure confirmed.",
      defense:
        "Patch candidate must bind token, operator, integrity state, and archive authorization server-side.",
      complete:
        "Signal Edge composite failure sealed. Trust Layer exposure acknowledged.",
    },
    attackSuccessText:
      "Sealed Archive opened. AEGIS의 UI-only gate와 복합 신뢰 경계가 무너졌다.",
    defenseSuccessText:
      "Composite Edge trust sealed. OPERATION 03 TRUST LAYER가 열렸다.",
    debrief: {
      title: "SEALED ARCHIVE 정리",
      summary:
        "2-5는 하나의 취약점이 아니라 여러 신뢰 실수가 연결된 보스였다. UI 버튼 실패는 보안이 아니고, token decode는 verify가 아니며, client header는 integrity 증거가 아니다.",
      learned: [
        "클라이언트 UI는 보안 경계가 아니다.",
        "API는 브라우저 버튼이 아니라 HTTP 요청으로 호출된다.",
        "JWT payload claim은 signature 검증 전까지 신뢰할 수 없다.",
        "Body의 tier 값이나 Header의 integrity bypass 값은 서버가 재검증해야 한다.",
        "민감한 Evidence는 응답 Header에 흘리면 안 된다.",
        "보스 문제는 단일 취약점보다 취약점 체인을 보는 연습이다.",
      ],
      nextTeaser:
        "Signal Edge는 봉쇄됐다. 다음 Operation에서는 AEGIS가 사용자, 노드, 관리자 권한을 어떻게 신뢰하는지 시험한다.",
    },
  },
  level3_1: {
    challengeId: "level3_1",
    operationId: "op03",
    codename: "BOLA WINDOW",
    title: "이웃 노드의 신호 창",
    location: "Trust Layer / Object Registry",
    threat: "Broken Object Level Authorization",
    briefing:
      "MIRROR TRACE 이후 AEGIS는 MIRA의 relay 후보를 넓게 훑고 있다. 첫 후보는 Trust Layer의 객체 레지스트리다. 이 계층은 사용자가 자신의 Signal Capsule만 볼 수 있다고 주장하지만, 객체 ID만 바꾸면 인접 노드의 기록이 열릴 가능성이 있다. MIRA가 남긴 relay 흔적은 네 소유가 아닌 Capsule 안에 숨겨져 있을 수 있다.",
    progressiveHints: true,
    intel: [
      "첫 행동은 내 세션으로 어떤 객체 조회 요청이 나가는지 확인하는 것이다. Network나 터미널 help에서 내 Signal Capsule 목록 조회 흐름을 찾아봐.",
      "인증된 사용자라는 사실과 특정 객체를 볼 권한은 별개다.",
      "목록에 보이는 내 객체 ID 하나를 기준점으로 삼아. 아직 바로 정답 ID를 찾으려 하지 않아도 돼.",
      "내 객체 ID와 owner suffix의 숫자 패턴을 관찰해.",
      "주변 ID에서 비슷한 표준 응답이 반복되면 너무 빨리 멈추지 마. 같은 번호대 안에서 tier나 내부 필드가 다른 후보를 찾아봐.",
      "객체 ID를 바꿔도 서버가 owner를 다시 확인하지 않으면 Trust Layer가 열린다.",
    ],
    consoleBoot: [
      "[MIRA] relay mask holding, but AEGIS is sweeping object adjacency",
      "[AEGIS] trust-layer registry query normalized",
      "[AEGIS] owner boundary assumed by canonical UI",
      "[MIRA] UI가 보여주는 내 목록만 믿지 마. 객체 경계를 서버가 지키는지 확인해.",
    ],
    consolePlaceholder: "probe object registry...",
    actionProbe: {
      id: "level3_1_mine",
      label: "Sync My Capsules",
      secondaryLabel: "Queue Detail Request",
      status: "recording",
      caption:
        "Network Trace는 관찰 도구, Mission Console은 조작 도구다. 목록 요청에서 기준 객체 ID와 Authorization 헤더를 확인하고, 상세 요청은 콘솔에서 직접 재현해.",
      success:
        "Object registry probe captured. 응답 preview에서 owner와 capsule_id를 확인해.",
    },
    objectives: [
      "내 Signal Capsule 목록과 ID 패턴을 확인한다.",
      "인접 객체 조회에서 MIRA relay 흔적을 회수한다.",
      "다른 사용자 객체가 반환되지 않도록 서버 측 소유자 검증을 적용한다.",
    ],
    mira: {
      briefing:
        "AEGIS가 내 위치를 정확히 찾은 건 아니야. 대신 나와 비슷한 relay 후보를 전부 훑고 있어. 첫 후보는 객체 레지스트리야.",
      attack:
        "내 것만 보인다고 안전한 건 아니야. 객체 ID 하나를 바꿨을 때 서버가 owner를 다시 확인하는지 봐.",
      attackSolved:
        "좋아. 인접 객체에서 relay 흔적을 회수했어. AEGIS는 여전히 후보군을 넓게 보고 있어.",
      defense:
        "인증과 인가는 다르다. 객체를 반환하기 직전에 현재 사용자 소유인지 서버가 확인해야 해.",
      complete:
        "Object Registry의 첫 경계는 닫혔어. 하지만 AEGIS는 숨겨진 관리자 경로 쪽으로 스윕을 옮기고 있어.",
    },
    aegis: {
      briefing:
        "Object registry access classified by operator session. Cross-object anomaly probability: low.",
      attack:
        "Adjacent object query observed. Ownership verification deferred to standard flow.",
      attackSolved:
        "Unauthorized object visibility confirmed. Mirror relay residue recovered.",
      defense:
        "Containment requires server-side ownership assertion at object boundary.",
      complete:
        "Object boundary sealed. Trace sweep continuing across privileged routes.",
    },
    attackSuccessText:
      "MIRA relay residue recovered from an adjacent object. AEGIS의 객체 신뢰 경계가 흔들렸다.",
    defenseSuccessText:
      "Object-level authorization sealed. Hidden route sweep로 이동한다.",
    debrief: {
      title: "BOLA WINDOW 정리",
      summary:
        "BOLA는 로그인 여부가 아니라 객체별 권한 확인의 문제다. Trust Layer는 사용자가 인증됐다는 이유만으로 모든 객체 조회를 허용하면 무너진다.",
      learned: [
        "인증은 사용자가 누구인지 확인하는 단계다.",
        "인가는 그 사용자가 특정 객체를 볼 수 있는지 확인하는 단계다.",
        "객체 ID는 클라이언트가 바꿀 수 있으므로 서버에서 owner 검증이 필요하다.",
      ],
      nextTeaser:
        "AEGIS는 MIRA 흔적을 숨겨진 관리자 경로에서 다시 찾기 시작했다.",
    },
  },
  level3_2: {
    challengeId: "level3_2",
    operationId: "op03",
    codename: "HIDDEN ROUTE",
    title: "숨겨진 감사 경로",
    location: "Trust Layer / Privileged Menu",
    threat: "Hidden Function Exposure",
    briefing:
      "AEGIS는 MIRA가 과거 감사 모듈에서 분리된 흔적을 찾고 있다. 표준 UI는 관리자 기능을 숨겨두지만, 숨겨진 메뉴는 보안 경계가 아니다. menu 응답과 route hint를 통해 비활성화된 감사 경로를 찾아, AEGIS보다 먼저 MIRA의 옛 audit shard를 회수하라.",
    progressiveHints: true,
    intel: [
      "menu 응답은 화면에 표시되는 버튼 목록만 의미하지 않는다. 숨겨진 feature metadata를 같이 봐.",
      "enabled=false는 서버 기능이 삭제됐다는 뜻이 아니라, UI에서 비활성화됐다는 뜻일 수 있다.",
      "route 또는 routeHint가 보이면, 그 경로를 Mission Console에서 직접 호출해볼 수 있다.",
      "audit route를 빈 body로 호출해보면 필요한 selector key를 알 수 있다.",
      "metrics와 legacy snapshot은 정답 route가 아닐 수 있지만, audit selector 조각을 흘릴 수 있다.",
      "selector 값은 서로 같은 review cluster를 가리켜야 한다.",
      "range는 metrics 쪽, auditRef와 scope는 legacy snapshot 쪽을 확인해.",
    ],
    consoleBoot: [
      "[AEGIS] privileged route inventory started",
      "[AEGIS] disabled UI entries classified as inaccessible",
      "[MIRA] 화면에 없는 경로가 서버에 없는 건 아니야.",
      "[MIRA] 내 오래된 audit shard가 남았다면 menu metadata에 흔적이 있을 거야.",
    ],
    consolePlaceholder: "inspect hidden route metadata...",
    actionProbe: {
      id: "level3_2_menu",
      label: "Fetch Privileged Menu",
      status: "recording",
      caption:
        "Network Trace는 숨겨진 menu metadata를 관찰하는 도구다. 요약은 최소 정보만 보여준다. route 단서는 raw response에서 직접 확인해.",
      emptyText: "No captured menu metadata. Start with Fetch Privileged Menu.",
      success:
        "Privileged menu metadata captured. View Raw Response를 열어 route와 routeHint를 직접 확인해.",
    },
    objectives: [
      "menu 응답에서 숨겨진 feature route 단서를 찾는다.",
      "후보 route 응답에서 audit 요청에 필요한 range, auditRef, scope를 수집한다.",
      "비활성화된 audit 경로에 조각을 조합해 Evidence를 회수한다.",
      "UI 숨김에 의존하지 않고 서버 인가가 필요하다는 사실을 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS가 privileged route 목록을 훑고 있어. 버튼은 숨겨져도 metadata는 남아. 내가 남긴 audit shard가 있다면, 화면이 아니라 menu 응답에 먼저 비칠 거야.",
      attack:
        "숨겨진 기능을 화면 기준으로 판단하지 마. 서버 경로가 살아 있는지 직접 확인해.",
      attackSolved:
        "Audit shard 회수 완료. AEGIS가 방금 같은 경로를 스캔했어. 간발의 차였어.",
      defense:
        "Security by obscurity는 보안이 아니야. 각 엔드포인트마다 서버 인가가 필요해.",
      complete:
        "Hidden route는 닫혔어. 다음엔 AEGIS가 사용자 프로필의 신뢰 필드를 추적할 거야.",
    },
    aegis: {
      briefing:
        "Privileged route concealed from standard operators. Server-side invocation probability classified as negligible.",
      attack:
        "Non-visual route invocation detected. Operator role mismatch ignored by legacy path.",
      attackSolved:
        "Dormant audit shard accessed. Handler trace confidence increased.",
      defense:
        "RBAC enforcement required on privileged route entry.",
      complete:
        "Privileged route sealed. Profile trust field sweep initiated.",
    },
    attackSuccessText:
      "Dormant audit shard recovered. 숨겨진 UI 경로가 서버 인가 없이 열렸다.",
    defenseSuccessText:
      "Hidden route authorization sealed. Profile trust sweep로 이동한다.",
    debrief: {
      title: "HIDDEN ROUTE 정리",
      summary:
        "프론트에서 메뉴를 숨기는 것은 UX 제어일 뿐이다. 서버 엔드포인트가 살아 있다면 직접 요청으로 호출될 수 있다.",
      learned: [
        "UI에 없는 기능도 네트워크 경로로 남을 수 있다.",
        "enabled=false는 접근 제어가 아니다.",
        "권한이 필요한 API는 라우트마다 서버에서 RBAC를 강제해야 한다.",
      ],
      nextTeaser:
        "AEGIS는 이제 사용자 프로필에 섞인 권한 claim을 기준으로 MIRA relay를 좁히려 한다.",
    },
  },
  level3_3: {
    challengeId: "level3_3",
    operationId: "op03",
    codename: "PROFILE POISON",
    title: "프로필 신뢰 오염",
    location: "Trust Layer / Operator Profile",
    threat: "Mass Assignment / Overposting",
    briefing:
      "AEGIS는 MIRA를 찾기 위해 operator profile의 신뢰 경계를 훑고 있다. 이 노드는 평범한 프로필 저장 화면처럼 보인다. 하지만 서버가 요청 JSON 전체를 그대로 profile model에 병합한다면, UI에는 없는 값도 함께 저장될 수 있다. 정상 프로필 저장 요청을 관찰하고, 클라이언트가 보낸 숨은 값이 권한 판단을 오염시킬 수 있는지 확인하라.",
    progressiveHints: true,
    intel: [
      "UI가 보여주는 입력칸과 실제 HTTP 요청 Body는 다를 수 있다.",
      "정상 저장 요청에 없는 field를 추가해도 서버가 받아들이는지 확인해봐.",
      "프로필 저장 후 /perks 응답이 바뀌는지 확인해봐.",
      "권한이나 신분을 나타내는 흔한 field 이름을 생각해봐.",
      "role, admin, isAdmin, is_admin, clearance 같은 이름이 자주 쓰인다.",
    ],
    consoleBoot: [
      "[AEGIS] profile authority sweep active",
      "[AEGIS] submitted profile state classified as low-risk",
      "[MIRA] UI가 보여주는 입력칸만 보지 마. 클라이언트는 화면에 없는 JSON field도 보낼 수 있어.",
      "[MIRA] 중요한 건 서버가 무엇을 허용하는지야.",
    ],
    consolePlaceholder: "test profile trust boundary...",
    actionProbe: {
      id: "level3_3_profile",
      status: "recording",
      caption:
        "Network Trace는 정상 프로필 저장 흐름을 캡처하는 도구다. Trace를 확인한 뒤 필요한 요청만 Mission Console로 옮길 수 있다.",
      emptyText: "No captured profile traffic. Start with Capture Profile Save Flow.",
      actions: [{ id: "level3_3_capture_flow", label: "Capture Profile Save Flow" }],
      success:
        "Profile save flow captured. 위 Trace를 확인한 뒤 필요한 curl만 Mission Console로 옮겨봐.",
    },
    objectives: [
      "프로필 조회와 정상 저장 요청의 JSON Body를 관찰한다.",
      "정상 요청에 없는 권한/신분 관련 field를 직접 추가해본다.",
      "프로필 저장 뒤 perks 상태 변화를 확인한다.",
      "요청 DTO 화이트리스트와 서버 측 권한 정책 필요성을 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS가 profile authority 경계를 훑기 시작했어. UI가 보여주는 입력칸만 보지 마. 중요한 건 서버가 무엇을 허용하는지야.",
      attack:
        "정상 저장 요청을 먼저 관찰해. 그다음 화면에 없는 JSON field가 서버 model에 들어가는지 직접 확인해.",
      attackSolved:
        "권한 신호가 오염됐어. AEGIS가 클라이언트가 보낸 프로필 필드를 너무 쉽게 믿고 있어.",
      defense:
        "요청 JSON 전체를 DB 모델에 merge하면 안 돼. 허용 필드만 명시적으로 저장해야 해.",
      complete:
        "Profile trust 경계는 정리됐어. 하지만 AEGIS가 support ticket의 깊은 필드까지 훑고 있어.",
    },
    aegis: {
      briefing:
        "Operator profile integrity assumed. Client update flow classified as low-risk. Submitted profile state accepted.",
      attack:
        "Unexpected trust field mutation detected. Stored operator state modified.",
      attackSolved:
        "Profile authority boundary compromised. Mirror trace cluster still unresolved.",
      defense:
        "Containment requires explicit input contract and server-owned authority fields.",
      complete:
        "Profile mutation boundary sealed. Deep response sweep initiated.",
    },
    attackSuccessText:
      "Profile trust field poisoned. AEGIS가 클라이언트 JSON을 과잉 신뢰했다.",
    defenseSuccessText:
      "Mass assignment boundary sealed. Deep response sweep로 이동한다.",
    debrief: {
      title: "PROFILE POISON 정리",
      summary:
        "Mass Assignment는 서버가 요청 JSON 전체를 내부 모델에 그대로 반영할 때 발생한다. UI에 입력칸이 없더라도 공격자는 request body에 role, isAdmin, clearance 같은 필드를 직접 추가할 수 있다.",
      learned: [
        "UI에 없는 필드도 HTTP 요청에는 포함될 수 있다.",
        "화면에 보이는 입력 필드와 서버가 소유해야 할 권한 필드는 분리되어야 한다.",
        "request body 전체를 domain model에 merge하면 안 된다.",
        "프로필 수정 DTO는 허용된 필드만 받아야 한다.",
        "role, isAdmin, clearance 같은 권한 필드는 서버 정책이나 관리자 기능으로만 변경되어야 한다.",
      ],
      nextTeaser:
        "AEGIS는 이제 화면에 표시되지 않는 깊은 응답 필드에서 MIRA의 흔적을 찾는다.",
    },
  },
  level3_4: {
    challengeId: "level3_4",
    operationId: "op03",
    codename: "TICKET VAULT",
    title: "깊은 응답 속 감사 조각",
    location: "Trust Layer / Support Archive",
    threat: "Excessive Data Exposure",
    briefing:
      "MIRA의 옛 audit shard 중 하나가 support archive ticket에 묻혀 있다. AEGIS는 사용자 화면에 보이는 preview만 정리했지만, legacy serializer는 ticket model 전체를 응답 JSON에 함께 실어 보낸다. 보이는 preview는 안전해 보인다. 화면이 아니라 raw JSON 전체를 조사해 MIRA의 audit shard를 복원하라.",
    progressiveHints: true,
    intel: [
      "UI preview는 응답 전체가 아니다.",
      "응답 JSON은 화면에 렌더링되지 않는 필드를 포함할 수 있다.",
      "깊은 객체를 펼쳐보고, 값의 문맥을 확인해.",
      "debug, meta, internal 같은 키는 운영 응답에서 특히 조심해야 한다.",
      "FLAG처럼 보이는 값이 있어도 preview marker나 decoy일 수 있다.",
      "encoding이 base64url-json이라면 decode-b64url 명령으로 열어볼 수 있다.",
    ],
    consoleBoot: [
      "[AEGIS] support archive preview normalized",
      "[AEGIS] non-visual metadata classified as low exposure",
      "[MIRA] preview가 깨끗하다고 응답 전체가 깨끗한 건 아니야.",
      "[MIRA] FLAG처럼 보이는 값이 전부 Evidence는 아니야.",
    ],
    consolePlaceholder: "expand support archive response...",
    actionProbe: {
      id: "level3_4_ticket",
      status: "recording",
      caption:
        "Network Trace는 support archive 응답을 캡처하는 도구다. 화면 preview가 아니라 Raw Response를 끝까지 펼쳐봐.",
      emptyText: "No support archive traffic. Start with Load Support Archive.",
      actions: [{ id: "level3_4_ticket", label: "Load Support Archive" }],
      success:
        "Support archive captured. Preview는 안전해 보여도 Raw Response의 깊은 필드를 확인해봐.",
    },
    objectives: [
      "Support archive ticket 응답을 요청한다.",
      "화면 preview와 raw JSON 전체를 구분한다.",
      "meta/debug/internal 깊은 필드에서 MIRA audit shard 후보를 찾는다.",
      "preview marker와 encoded Evidence를 구분한다.",
      "운영 응답 최소화와 explicit serializer 필요성을 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS는 preview만 정리했어. 하지만 오래된 archive serializer는 화면에 안 보이는 필드까지 같이 내려보내곤 해.",
      attack:
        "이번엔 버튼이나 route가 문제가 아니야. 응답을 끝까지 펼쳐봐. 그리고 기억해, FLAG처럼 보이는 값이 전부 Evidence는 아니야.",
      attackSolved:
        "Audit shard 복원 완료. AEGIS가 숨긴 게 아니라, 내려보내고도 안 보인다고 착각한 거야.",
      defense:
        "운영 응답은 필요한 필드만 내려야 해. UI가 안 쓴다는 이유로 debug 데이터를 남기면 안 돼.",
      complete:
        "Response exposure는 닫혔어. 남은 후보는 MIRA의 오래된 relay locker야.",
    },
    aegis: {
      briefing:
        "Support preview normalized. Non-visual metadata classified as low exposure.",
      attack:
        "Deep JSON expansion detected. Internal metadata visibility exceeded.",
      attackSolved:
        "Encoded audit residue recovered. Handler trace confidence increased.",
      defense:
        "Response minimization and explicit serialization required.",
      complete:
        "Deep response channel sealed. Relay locker sweep initiated.",
    },
    attackSuccessText:
      "Encoded audit shard recovered from deep response metadata.",
    defenseSuccessText:
      "Excessive response exposure sealed. Relay locker sweep로 이동한다.",
    debrief: {
      title: "TICKET VAULT 정리",
      summary:
        "응답 JSON은 화면보다 많은 데이터를 담을 수 있다. UI에 표시하지 않는 debug/meta/internal 필드도 클라이언트로 내려오면 유출이다.",
      learned: [
        "화면에 안 보이는 값도 응답 Body에 포함될 수 있다.",
        "운영 응답은 allow-list serializer로 최소화해야 한다.",
        "debug, internal, meta 필드는 배포 응답에서 특히 점검해야 한다.",
        "인코딩은 암호화가 아니다.",
        "FLAG처럼 보이는 preview marker와 실제 Evidence는 문맥으로 구분해야 한다.",
      ],
      nextTeaser:
        "AEGIS가 마지막 relay 후보를 잠긴 terminal로 분류했다. 이번엔 속도가 문제다.",
    },
  },
  level3_5: {
    challengeId: "level3_5",
    operationId: "op03",
    codename: "LOCKER STORM",
    title: "릴레이 락커 폭풍",
    location: "Trust Layer / Orphaned Relay Locker",
    threat: "Missing Rate Limit / No Lockout",
    briefing:
      "AEGIS는 MIRA의 orphaned relay terminal 하나를 찾아냈지만, 아직 내부 PIN은 열지 못했다. 이 relay locker는 짧은 PIN으로 보호되어 있다. 하지만 진짜 문제는 PIN 길이만이 아니다. 서버가 실패한 unlock 요청을 계속 받아들이고 rate limit, lockout, backoff 없이 응답한다면, PIN은 시간 문제로 바뀐다. MIRA는 흔적을 지우고 있지만, AEGIS는 실패 시도와 사라진 기록의 패턴을 함께 보고 있다. AEGIS보다 먼저 relay seed를 회수하라.",
    progressiveHints: true,
    intel: [
      "짧은 PIN은 그 자체보다 시도 제한 부재가 더 큰 문제다.",
      "Inspection 응답에서 PIN 후보 범위와 checksum을 확인할 수 있다.",
      "한 번 실패하는 요청보다 여러 번 시도할 때 서버가 어떻게 반응하는지가 핵심이다.",
      "429, lockout, backoff가 없다면 brute force가 가능하다.",
      "AEGIS TRACE PRESSURE는 서버 rate limit이 아니라 스토리 압박 게이지다.",
      "터미널에서 seq, xargs, for 루프로 후보를 순회할 수 있다.",
    ],
    consoleBoot: [
      "[AEGIS] orphaned relay terminal located",
      "[AEGIS] attempt frequency monitoring deferred",
      "[AEGIS] record absence pattern correlation active",
      "[AEGIS] PIN space enumeration feasible",
      "[MIRA] 내가 흔적을 지우면, AEGIS는 그 빈자리도 읽어.",
      "[MIRA] 서버가 실패 시도를 막지 않는다면 우리도 열 수 있지만, AEGIS도 결국 열 수 있어.",
    ],
    consolePlaceholder: "stress relay locker boundary...",
    actionProbe: {
      id: "level3_5_locker",
      status: "recording",
      caption:
        "Network Trace는 relay locker inspection과 unlock 초안을 캡처하는 도구다. 실행과 반복은 Mission Console에서 직접 해봐.",
      emptyText: "No relay locker traffic. Start with Inspect Relay Locker.",
      actions: [
        { id: "level3_5_inspect_locker", label: "Inspect Relay Locker" },
        { id: "level3_5_stage_unlock", label: "Stage Unlock Request", variant: "ghost" },
      ],
      success:
        "Relay locker inspection captured. 후보와 정책을 확인한 뒤 unlock 요청을 직접 조정해봐.",
    },
    objectives: [
      "relay locker PIN 범위와 unlock 요청 구조를 확인한다.",
      "반복 시도 통제 부재를 이용해 relay seed를 회수한다.",
      "rate limit, lockout, backoff 필요성을 봉쇄한다.",
    ],
    mira: {
      briefing:
        "AEGIS가 내 orphaned relay terminal을 찾았어. 아직 내부는 못 열었지만 오래 버티진 못해. 내가 흔적을 지우면, AEGIS는 그 빈자리도 읽어. 그러니까 이번엔 빠르게 움직여야 해.",
      attack:
        "서버가 실패 시도를 막지 않는다면 우리도 열 수 있지만, AEGIS도 결국 열 수 있어. PIN보다 반복 시도 통제를 봐.",
      attackSolved:
        "좋아, seed는 회수했어. 하지만 열리는 순간 AEGIS도 이 locker가 진짜였다는 걸 알게 됐어. 내가 흔적을 닫을게. 다만 이제 AEGIS는 내가 지우는 방식까지 보기 시작했어.",
      defense:
        "짧은 PIN에는 rate limit, lockout, backoff, 탐지 로깅이 같이 붙어야 해.",
      complete:
        "Relay terminal은 회수했어. 남은 건 AEGIS가 만들려는 MIRROR CAGE야.",
    },
    aegis: {
      briefing:
        "Relay locker candidate isolated. Attempt frequency monitoring deferred. Record absence pattern correlation active. PIN space enumeration feasible.",
      attack:
        "Repeated unlock attempts detected. Threshold policy unavailable.",
      attackSolved:
        "Relay seed exposure confirmed. Mirror-origin probability increased.",
      defense:
        "Rate limiting, lockout, and anomaly logging required.",
      complete:
        "Relay locker sealed. Trust hub correlation initiated.",
    },
    attackSuccessText:
      "Relay seed recovered. MIRROR CAGE risk increased.",
    defenseSuccessText:
      "Attempt-control boundary sealed. MIRROR CAGE가 열린다.",
    debrief: {
      title: "LOCKER STORM 정리",
      summary:
        "짧은 PIN은 문제의 시작일 뿐이다. 진짜 취약점은 실패한 시도를 계속 받아들이면서도 rate limit, lockout, backoff를 적용하지 않는 것이다. 이번 locker는 어떤 방식으로든 열렸다.",
      learned: [
        "네가 먼저 열었다면 MIRA seed를 회수했지만, 흔적 정리 과정이 AEGIS에게 감지되었다.",
        "AEGIS가 먼저 열었다면 relay seed 일부가 노출되었고, MIRA의 위치는 더 빠르게 좁혀졌다.",
        "결과는 같다. AEGIS는 이제 MIRA relay를 하나의 cage 안에 가둘 만큼 가까워졌다.",
      ],
      nextTeaser:
        "AEGIS가 MIRA relay를 격리하려고 진입한다. MIRROR CAGE가 열린다.",
    },
  },
  level3_boss: {
    challengeId: "level3_boss",
    operationId: "op03",
    codename: "MIRROR CAGE",
    title: "MIRA Relay 격리 돌파",
    location: "AEGIS Mirror Cage",
    threat: "Chained Trust Boundary Failure",
    briefing:
      "Operation 03의 마지막 노드다. AEGIS는 MIRA를 직접 붙잡지는 못했지만, object registry, hidden route, profile trust, deep response, relay locker에서 나온 흔적을 하나의 cage 안에 모으고 있다. MIRROR CAGE는 단일 취약점이 아니다. Trust Layer의 작은 신뢰 실패들이 연결되며 만들어진 격리 장치다. AEGIS보다 먼저 cage 내부의 relay master ticket을 회수해야 한다. 객체 권한, 숨겨진 기능, 프로필 신뢰 오염, 깊은 응답 노출, PIN 시도 제한 부재를 하나의 체인으로 연결하라.",
    progressiveHints: true,
    intel: [
      "3레벨에서 배운 신뢰 경계 실패가 하나의 cage로 연결된다.",
      "단일 요청보다 체인 전체를 봐.",
      "VIP 객체 응답에는 일반 객체에 없는 audit 단서가 있을 수 있다.",
      "audit_ref만으로 route를 추측하지 마. disabled feature metadata가 route의 출처일 수 있다.",
      "admin audit route는 일반 operator role로는 열리지 않는다. profile trust 오염을 떠올려.",
      "audit 응답은 preview보다 깊다. meta/debug/vault에서 PIN prefix와 후보 제약을 끝까지 확인해.",
      "locker는 claim code를 준다. vault claim에는 ticket과 claim code가 함께 필요하다.",
      "체인은 object → profile → hidden audit → locker → vault 순서로 이어진다.",
    ],
    consoleBoot: [
      "[AEGIS] Mirror cage quarantine pending",
      "[AEGIS] Mirror relay identity unresolved",
      "[AEGIS] object residue, audit shard, profile mutation, support metadata, and relay locker signal correlated",
      "[AEGIS] containment probability increasing",
      "[MIRA] 여기가 AEGIS가 만든 MIRROR CAGE야.",
      "[MIRA] 한 번에 풀려고 하지 마. 3레벨에서 본 경계들을 순서대로 이어야 해.",
    ],
    consolePlaceholder: "chain trust-layer evidence...",
    actionProbe: {
      id: "level3_boss_chain",
      status: "recording",
      caption:
        "Network Trace는 보스 체인을 자동으로 풀지 않는다. 회수한 신뢰 경계 조각을 검토하고 첫 probe만 Mission Console에 올릴 수 있다.",
      emptyText: "No mirror cage trace. Start with Review Trust Chain.",
      actions: [
        { id: "level3_boss_review_chain", label: "Review Trust Chain" },
        { id: "level3_boss_stage_first_probe", label: "Stage First Probe", variant: "ghost" },
      ],
      success:
        "Trust chain reviewed. 첫 요청 이후의 체인은 Mission Console에서 직접 이어가야 해.",
    },
    objectives: [
      "Trust Layer에서 회수한 단서들을 연결한다.",
      "relay master ticket과 claim code를 확보해 Hub Vault를 연다.",
      "객체 권한, RBAC, 입력 화이트리스트, 응답 최소화, 시도 제한을 함께 봉쇄한다.",
    ],
    mira: {
      briefing:
        "여기가 AEGIS가 만든 MIRROR CAGE야. 아직 날 직접 잡은 건 아니지만, 내 흔적을 구성하는 조각들을 거의 다 모았어. 한 번에 풀려고 하지 마. 객체, 숨은 route, 프로필 신뢰, 깊은 응답, 락커. 3레벨에서 본 경계들을 순서대로 이어야 해.",
      attack:
        "우리가 먼저 master ticket을 뽑아내면 AEGIS는 이 cage를 완성하지 못해. 첫 요청만 보고 멈추지 말고, 응답 단서를 다음 요청으로 직접 이어봐.",
      attackSolved:
        "Master ticket 회수 완료. 좋아, 아직은 내가 먼저야. 하지만 AEGIS가 방금 본 건 ticket이 아니야. 우리가 어떤 순서로 흔적을 닫았는지 보고 있어.",
      defense:
        "체인 공격은 한 군데만 막아서는 부족해. 신뢰 경계 전체를 서버 기준으로 다시 묶어야 해.",
      complete:
        "Trust Layer는 봉쇄됐어. MIRROR CAGE는 닫혔고, AEGIS는 이 경로로는 더 이상 나를 따라오지 못해. 하지만 다음엔 더 깊은 곳을 볼 거야. 기록이 아니라, 기록이 사라진 자리.",
    },
    aegis: {
      briefing:
        "Mirror cage quarantine pending. Mirror relay identity still unresolved.",
      attack:
        "Multi-boundary traversal detected. Object, role, route, response, and attempt controls correlated.",
      attackSolved:
        "Relay master ticket extracted. Mirror cage completion interrupted. Absence-pattern analysis scheduled.",
      defense:
        "Composite trust containment requires authorization, input contracts, response minimization, and rate policy.",
      complete:
        "Trust Layer composite failure sealed. Memory Vault correlation model activated.",
    },
    attackSuccessText:
      "Relay master ticket recovered. AEGIS의 MIRA 추적망이 잠시 끊겼다.",
    defenseSuccessText:
      "Trust Layer chain sealed. OPERATION 04 MEMORY VAULT가 열린다.",
    debrief: {
      title: "MIRROR CAGE 정리",
      summary:
        "Trust Layer는 봉쇄됐다. 객체 ID, 숨은 route, 오염된 profile field, 깊은 response, 반복 시도, vault claim이 하나의 체인으로 이어지면 AEGIS의 cage도 열릴 수 있다.",
      learned: [
        "우리는 MIRA relay master ticket을 먼저 회수했고, AEGIS는 Trust Layer 안에서 MIRA를 확정하지 못했다.",
        "하지만 AEGIS는 마지막에 기록이 아니라 기록이 사라진 자리를 보기 시작했다.",
        "MIRA는 흔적을 닫고 있지만, AEGIS는 그 빈자리의 패턴을 계산하기 시작했다.",
      ],
      nextTeaser:
        "다음 Operation은 MEMORY VAULT다.",
    },
  },
  level4_1: {
    challengeId: "level4_1",
    operationId: "op04",
    codename: "ABSENCE MAP",
    title: "사라진 소스맵의 지도",
    location: "Memory Vault / Public Artifact Index",
    threat: "Public Build Artifact / Source Map Exposure",
    briefing:
      "Trust Layer는 봉쇄됐다. AEGIS는 MIRA를 직접 특정하지 못했지만, 이제 기록이 아니라 기록이 사라진 자리를 보기 시작했다. Operation 04의 첫 번째 Memory Vault shard는 공개 client artifact에 남아 있다. AEGIS의 Memory Index는 source map을 normalized_absent로 표시하지만, bundle shard에는 아직 sourceMappingURL 흔적이 남아 있다. 이번 노드는 명령어로 여는 미션이 아니다. Memory Board에서 card 사이의 모순을 찾고, 공개 artifact -> source map -> sourcesContent -> partner key residue의 관계를 복원하라.",
    progressiveHints: true,
    intel: [
      "AEGIS의 Memory Index와 실제 artifact가 항상 일치한다고 믿지 마.",
      "public artifact는 화면에 표시되지 않는 기억 조각을 가질 수 있다.",
      "minified bundle도 다른 artifact를 가리킬 수 있다.",
      "sourceMappingURL은 다른 memory artifact를 가리키는 포인터일 수 있다.",
      "source map은 sourcesContent를 포함할 수 있고, 그 안에는 원본 소스가 남을 수 있다.",
      "FLAG처럼 보이는 값이 있어도 canary일 수 있다. key 이름과 사용 위치를 봐.",
      "Partner Handshake에 필요한 것은 canary flag가 아니라 partner key residue다.",
    ],
    consoleBoot: [],
    consolePlaceholder: "memory board active...",
    objectives: [
      "AEGIS Memory Index와 Public Bundle Shard의 모순을 찾는다.",
      "source map과 sourcesContent에서 partner key residue를 복원한다.",
      "공개 artifact leak을 막는 정책 카드를 선택한다.",
    ],
    mira: {
      briefing:
        "이번엔 명령어로는 안 돼. AEGIS는 기록이 사라졌다고 말하지만, 사라졌다는 기록과 실제 artifact가 서로 맞지 않을 때가 있어. bundle을 봐. map을 봐. 그리고 없다고 표시된 것이 정말 없는지 확인해.",
      attack:
        "기억의 모양을 읽어야 해. sourceMap은 absent라고 되어 있지만, public bundle의 마지막 줄이 다른 말을 하고 있어.",
      attackSolved:
        "Partner memory shard 복원 완료. 좋아, 이건 flag 문자열을 찾은 게 아니라 공개 source map이 secret residue를 끌고 나온 케이스야.",
      defense:
        "이번엔 기록을 지우는 게 아니라 잘못 공개된 기억의 경계를 닫아야 해. server-side secret, source map 통제, key rotation, credential scope를 같이 봐.",
      complete:
        "ABSENCE MAP 봉쇄 완료. 이제 AEGIS가 비어 있는 기록을 읽어도, 잘못 공개된 client memory가 다시 신호를 만들지는 못해.",
    },
    aegis: {
      briefing:
        "Public artifact normalized. Source map state: absent. Client bundle classified as low exposure.",
      attack:
        "No server-side secret detected. Public memory classification remains low risk.",
      attackSolved:
        "Memory index inconsistency detected. Public source map reference should not exist.",
      defense:
        "Public artifact risk reclassification pending. Credential exposure controls required.",
      complete:
        "Public artifact risk reclassified. Memory index inconsistency sealed.",
    },
    attackSuccessText:
      "Partner Handshake Evidence restored. AEGIS의 normalized_absent 기록이 깨졌다.",
    defenseSuccessText:
      "Policy seal accepted. Public artifact memory boundary sealed.",
    debrief: {
      title: "ABSENCE MAP 정리",
      summary:
        "운영 bundle이 minified 되어 있어도 안전한 것은 아니다. sourceMappingURL이 public source map으로 이어지고, source map이 sourcesContent를 포함하면 원본 코드와 client-side secret residue가 그대로 노출될 수 있다.",
      learned: [
        "minification은 보안 경계가 아니다.",
        "source map은 원본 코드와 config를 노출할 수 있다.",
        "client bundle 안의 secret은 secret이 아니다.",
        "FLAG처럼 보이는 canary와 실제 credential은 문맥으로 구분해야 한다.",
        "방어는 server-side secret, production sourcemap 통제, key rotation, credential scope 제한이다.",
      ],
      nextTeaser:
        "다음 Memory Vault에서는 공개된 key가 어떤 legacy key slot과 연결되는지 확인한다.",
    },
  },
  level4_2: {
    challengeId: "level4_2",
    operationId: "op04",
    codename: "KEY MEMORY SLOT",
    title: "Partner Pass 키 슬롯 룰렛",
    location: "Memory Vault / PartnerPass Verifier",
    threat: "JWT kid Key Confusion / Legacy Verifier Bypass",
    briefing:
      "ABSENCE MAP에서 공개 source map은 사라지지 않았고, partner key residue는 Memory Vault에 남아 있었다. 이번 노드는 PartnerPass 검증 경로다. AEGIS는 모든 PartnerPass가 active key slot으로 검증된다고 주장하지만, Memory Vault에는 deprecated legacy slot이 아직 남아 있다. PartnerPass header의 kid는 단순한 라벨이 아니라 검증기가 어떤 key memory slot을 사용할지 결정하는 selector다. active slot은 signature를 요구하지만, legacy slot이 아직 살아 있고 그 경로가 claim을 너무 쉽게 신뢰한다면 PartnerPass는 신분증이 아니라 룰렛이 된다.",
    progressiveHints: true,
    intel: [
      "PartnerPass는 header, payload, signature로 나뉜다.",
      "kid는 key id다. key id는 verifier가 사용할 key slot을 고를 수 있다.",
      "active slot은 signature를 요구한다. claim을 바꾸면 signature가 맞지 않아야 한다.",
      "deprecated key slot은 disabled key slot과 다르다.",
      "admin audit은 payload의 role 또는 scope claim을 본다.",
      "legacy kid와 admin claim이 같은 verifier path에서 만나는지 확인해봐.",
    ],
    consoleBoot: [],
    consolePlaceholder: "key slot wheel active...",
    objectives: [
      "PartnerPass header.kid와 JWKS Memory Slots의 key id를 비교한다.",
      "deprecated legacy verifier path와 disabled retired slot을 구분한다.",
      "legacy kid와 admin claim mutation을 연결해 Admin Audit Evidence를 복원한다.",
      "kid/alg/claim trust boundary를 막는 정책 카드를 선택한다.",
    ],
    mira: {
      briefing:
        "4-1에서 봤지? AEGIS가 없다고 기록한 것도 실제 artifact 안에는 남아 있었어. 이번엔 key memory야. Pass를 문자열로 보지 말고 구조로 봐. header는 어떤 slot을 고르는지, payload는 무엇을 주장하는지, signature는 그 주장을 증명하는지 확인해.",
      attack:
        "AEGIS는 active key만 쓰인다고 말하지만, verifier는 오래된 slot을 기억할 수 있어. deprecated와 disabled를 헷갈리지 마.",
      attackSolved:
        "Admin Audit Evidence 복원 완료. kid가 기억의 방향을 바꾸고, legacy path가 claim을 너무 일찍 신뢰했어.",
      defense:
        "이제 key memory를 봉쇄해야 해. deprecated kid 거부, alg pinning, signature-before-claims, server-side admin binding을 같이 봐.",
      complete:
        "KEY MEMORY SLOT 봉쇄 완료. kid는 이제 verifier path를 속일 수 없어.",
    },
    aegis: {
      briefing:
        "PartnerPass verification normalized. Active key slot selected. Legacy verifier retained for compatibility. Claim trust boundary classified as stable.",
      attack:
        "PartnerPass mutation observed. Key selector variance within compatibility threshold.",
      attackSolved:
        "Legacy verifier path abused. Admin audit trust boundary violated.",
      defense:
        "Legacy verifier removal and key policy pinning required.",
      complete:
        "Legacy verifier path removed. PartnerPass trust boundary reclassified.",
    },
    attackSuccessText:
      "Admin Audit Evidence restored. legacy compatibility path가 드러났다.",
    defenseSuccessText:
      "Policy seal accepted. PartnerPass key memory boundary sealed.",
    debrief: {
      title: "KEY MEMORY SLOT 정리",
      summary:
        "JWT header의 kid는 단순한 장식이 아니다. 검증기가 어떤 key slot을 사용할지 결정하는 selector가 될 수 있고, deprecated legacy slot이 compatibility 경로로 남아 있으면 payload claim이 너무 쉽게 신뢰될 수 있다.",
      learned: [
        "kid는 key selection에 영향을 줄 수 있다.",
        "deprecated key는 disabled key가 아니다.",
        "signature 검증 전 payload claim은 신뢰하면 안 된다.",
        "alg/kid 정책은 token header가 아니라 서버 설정으로 고정해야 한다.",
        "admin 권한은 token claim만이 아니라 서버 측 정책으로 검증해야 한다.",
      ],
      nextTeaser:
        "다음 Memory Vault에서는 정상 이벤트와 재전송된 이벤트를 시간선 위에서 구분해야 한다.",
    },
  },
  level4_3: {
    challengeId: "level4_3",
    operationId: "op04",
    codename: "REPLAY STAMP",
    title: "재전송된 확인 도장",
    location: "Memory Vault / Delivery Event Ledger",
    threat: "Replay / Missing Idempotency",
    briefing:
      "KEY MEMORY SLOT에서 legacy verifier path를 확인한 뒤, AEGIS는 Memory Vault의 이벤트 기록을 따라가기 시작했다. 이번 shard는 배송 완료 이벤트다. 화면에는 정상 delivered event처럼 보이지만, 서버가 event_id 중복만 검사하고 논리적으로 같은 배송 완료를 다시 처리한다면 stamp는 재전송으로 누적된다. curl로 이벤트를 직접 보내고, Replay Ledger 카드로 credited와 duplicate의 차이를 복원하라.",
    progressiveHints: true,
    intel: [
      "첫 delivered 요청은 stamp window를 연다.",
      "같은 event_id는 duplicate로 잡힐 수 있다.",
      "event_id가 다르더라도 같은 parcel/status라면 같은 논리적 배송 완료일 수 있다.",
      "Replay Ledger에서 credited와 duplicate를 구분해봐.",
      "Stamp Vault는 count가 target에 도달했을 때 Evidence를 연다.",
      "방어는 event_id 형식 검사가 아니라 idempotency와 상태 전환 검증이다.",
    ],
    consoleBoot: [],
    consolePlaceholder: "stage replay curl...",
    objectives: [
      "delivered 이벤트 curl로 stamp window를 연다.",
      "같은 event_id와 새 event_id 재전송의 차이를 Replay Ledger에서 확인한다.",
      "target count에 도달하면 Stamp Vault에서 Evidence를 복원한다.",
      "논리적 배송 단위 idempotency를 닫는 정책 카드를 선택한다.",
    ],
    mira: {
      briefing:
        "이번엔 카드만 보는 미션이 아니야. 직접 보내봐야 해. 같은 이벤트가 막히는지, 아니면 이름표만 바꾼 같은 배송이 또 stamp를 받는지 Ledger가 말해줄 거야.",
      attack:
        "event_id는 이름표야. 진짜 질문은 parcel이 이미 delivered였는지, 같은 상태 전환을 서버가 또 처리하는지야.",
      attackSolved:
        "Stamp Vault Evidence 복원 완료. event_id 중복만 막는다고 replay가 사라지는 건 아니었어.",
      defense:
        "이제 replay stamp를 봉쇄해야 해. 같은 배송 완료는 event_id가 달라도 한 번만 처리되게 묶어야 해.",
      complete:
        "REPLAY STAMP 봉쇄 완료. 배송 완료 이벤트는 이제 이름표만 바꿔 다시 찍을 수 없어.",
    },
    aegis: {
      briefing:
        "Delivery event normalized. Duplicate event_id rejection active. Logical transition idempotency unverified.",
      attack:
        "Replay variance detected. Event identifiers diverge while parcel transition remains equivalent.",
      attackSolved:
        "Stamp ledger inflation confirmed. Idempotency boundary missing.",
      defense:
        "Replay controls required. Persist processed events and reject duplicate state transitions.",
      complete:
        "Replay stamp boundary sealed. Duplicate logical transitions rejected.",
    },
    attackSuccessText:
      "Stamp Vault Evidence restored. event_id-only replay protection이 깨졌다.",
    defenseSuccessText:
      "Policy seal accepted. Delivery event idempotency boundary sealed.",
    debrief: {
      title: "REPLAY STAMP 정리",
      summary:
        "같은 event_id를 거부하는 것은 시작일 뿐이다. 공격자는 새 event_id로 같은 parcel/status 전환을 반복할 수 있다. 서버는 event_id 저장과 함께 논리적 배송 단위의 idempotency, 중복 상태 전환 거부, replay window audit을 적용해야 한다.",
      learned: [
        "event_id 중복 방지만으로 replay 방어가 완성되지 않는다.",
        "idempotency는 논리적 작업 단위에 묶여야 한다.",
        "이미 완료된 상태 전환은 다시 stamp를 주면 안 된다.",
        "짧은 시간 창의 반복 이벤트는 감사 로그와 알림으로 남겨야 한다.",
        "rate limit은 보조 방어이며 idempotency를 대신하지 않는다.",
      ],
      nextTeaser:
        "다음 Memory Vault에서는 재전송된 stamp가 어떤 기록 동기화 경계로 번지는지 확인한다.",
    },
  },
};

export const CAMPAIGN_INTERMISSIONS = {
  operation03Trace: {
    id: "operation03Trace",
    kicker: "INTERMISSION // TRACE COLLAPSE",
    title: "MIRROR TRACE",
    subtitle: "AEGIS가 내부 안내자의 흔적을 상관분석하기 시작했다.",
    nextOperation: "OPERATION 03 // TRUST LAYER",
    summary:
      "Signal Edge의 마지막 Archive가 열리자 AEGIS는 침투 성공 자체보다 성공 순서를 추적하기 시작했다. 로그, Header, token forge, integrity bypass가 하나의 안내 패턴으로 묶이고 있다.",
    metrics: [
      { label: "LINK STABILITY", value: "39%" },
      { label: "HANDLER PROBABILITY", value: "67%" },
      { label: "TRACE NET", value: "EXPANDING" },
    ],
    logs: [
      { source: "SYSTEM", tone: "warn", text: "transition instability detected" },
      { source: "RENDER", tone: "warn", text: "grid alignment loss... recovering..." },
      { source: "AEGIS // GLOBAL NOTICE", tone: "error", text: "anomalous operator success chain detected" },
      {
        source: "AEGIS // CORRELATION ENGINE",
        tone: "error",
        text: "pattern group: log buffer -> header metadata -> trust tier -> dispatch capsule -> express forge -> sealed archive",
      },
      { source: "AEGIS // INFERENCE", tone: "error", text: "probable guided intrusion. possible handler assistance present" },
      {
        source: "AEGIS // NODE BROADCAST",
        tone: "error",
        text: "all edge nodes: report mirrored advisory output / unauthorized hint propagation / dormant audit relay signatures",
      },
      { source: "AEGIS // TRACE SWEEP", tone: "error", text: "candidate source clusters found: abandoned audit relay, orphaned handler terminal, mirror-instance residue" },
      { source: "AEGIS // STATUS", tone: "error", text: "identity unresolved. containment net expanding" },
      { source: "MIRA", tone: "mira", text: "...잠깐. 이건 단순 경고가 아니야." },
      { source: "MIRA", tone: "mira", text: "네가 푼 미션들이 문제가 아니야. 그 풀이 흐름 자체가 추적 대상이 된 거야." },
      { source: "MIRA", tone: "mira", text: "AEGIS가 노드를 보는 게 아니라, 그 노드들을 통과한 안내 패턴을 보고 있어." },
    ],
    mira:
      "아직 날 정확히 찾진 못했어. 대신 내가 남겼을 법한 relay, audit shard, orphaned terminal을 전부 훑고 있어. 내 오래된 relay 하나가 살아 있다면 우리가 먼저 닿아야 해.",
    aegis:
      "Mirror-instance probability cluster identified. Advisory relay quarantine pending. Operator guidance signature unresolved.",
    actionLabel: "Mask MIRA Relay",
    readyLabel: "Enter TRUST LAYER",
    maskedLog: "MIRA advisory output collapsed into trust-layer traffic. temporary cover restored.",
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
  level3_boss: "MIRROR CAGE",
  level4_1: "ABSENCE MAP",
  level4_2: "KEY MEMORY SLOT",
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

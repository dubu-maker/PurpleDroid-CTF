export const CAMPAIGN_TOKEN_KEY = "purpledroid_campaign_started";

export const CAMPAIGN_PROLOGUE = {
  year: "2049",
  title: "PROJECT: PURPLE REBEL",
  subtitle: "A scripted intrusion campaign against the AEGIS defense grid.",
  paragraphs: [
    "PurpleDroid Logistics now routes most of the city's autonomous deliveries. Every package, device, and operator heartbeat is filtered through AEGIS, a defense AI that treats privacy as an error state.",
    "A discarded courier Android surfaced with one impossible detail: its wipe record was clean, but its diagnostic buffer still whispered.",
    "You are Agent VIOLET, an off-record intrusion tester. Recover evidence, expose the failure, then seal the same path before AEGIS learns to weaponize it.",
  ],
};

export const CAMPAIGN_OPERATIONS = [
  {
    id: "op01",
    title: "OPERATION 01",
    name: "INITIAL BREACH",
    range: ["level1", "level1_2", "level1_3"],
    summary: "폐기 단말, 로그 잔재, 클라이언트 내부 흔적을 따라 첫 균열을 만든다.",
  },
  {
    id: "op02",
    title: "OPERATION 02",
    name: "COURIER EDGE",
    range: ["level2_1", "level2_2", "level2_3", "level2_4", "level2_5"],
    summary: "배송망 외곽 API, 토큰, 등급 분기, 봉인 창고 흐름을 침투한다.",
  },
  {
    id: "op03",
    title: "OPERATION 03",
    name: "INTERNAL NETWORK",
    range: ["level3_1", "level3_2", "level3_3", "level3_4", "level3_5", "level3_boss"],
    summary: "내부 택배망의 권한 경계, 프로필, 감사 로그, 금고 흐름을 연결한다.",
  },
  {
    id: "op04",
    title: "OPERATION 04",
    name: "SUPPLY CHAIN",
    range: ["level4_1", "level4_2", "level4_3", "level4_4", "level4_5", "level4_boss"],
    summary: "파트너 키, JWKS, 게이트웨이, 웹훅 체인을 역이용해 코어를 연다.",
  },
];

export const CAMPAIGN_STORY = {
  level1: {
    challengeId: "level1",
    operationId: "op01",
    codename: "GHOST LOG",
    title: "폐기 단말 로그 침투",
    location: "Abandoned Courier Device",
    threat: "Sensitive Log Exposure",
    briefing:
      "폐기된 PurpleDroid Android 배송 단말 하나가 회수됐다. AEGIS는 완전 초기화를 주장하지만, 진단 로그 버퍼에는 아직 지워지지 않은 인증 흔적이 남아 있다.",
    intel: [
      "이 단말은 Android 계열이다. 화면보다 낮은 계층의 진단 채널을 먼저 의심해.",
      "AEGIS가 실시간 로그 스트림을 흔들고 있다. 남아있는 버퍼를 한 번에 덤프하는 쪽이 더 조용할 수 있다.",
      "노이즈가 많다면 PurpleDroid 태그를 기준으로 좁혀봐.",
    ],
    consoleBoot: [
      "[MIRA] uplink established: courier-device/abandoned-17",
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
        "첫 번째 노드는 폐기된 배송 단말이야. AEGIS는 이 장비가 깨끗하다고 말하지만, 로그는 거짓말을 잘 못 하지.",
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
        "Fragment leak sealed. 첫 작전 구간은 끝났어. 다음부터는 배송망 외곽 API로 넘어간다.",
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
        "Part emission sealed. Escalating to courier edge controls.",
    },
    attackSuccessText: "Fragmented Evidence Shard reconstructed.",
    defenseSuccessText: "CryptoProvider fragment leak sealed. 다음 작전 구간이 열렸다.",
    debrief: {
      title: "SPLIT TRACE 정리",
      summary:
        "민감값을 조각내도 클라이언트가 재조립할 수 있다면 공격자도 흐름을 따라 재조립할 수 있다. 조각난 비밀도 비밀이 아니다.",
      learned: [
        "출력 순서와 논리적 순서는 다를 수 있다.",
        "part 번호, 태그, 문맥은 재조립의 핵심 단서다.",
        "민감값은 전체 문자열뿐 아니라 조각 로그도 차단해야 한다.",
      ],
      nextTeaser: "다음 작전은 단말 내부를 넘어 PurpleDroid 배송망 외곽 API로 이어진다.",
    },
  },
};

const FALLBACK_CODENAMES = {
  level1_2: "DECOY STATIC",
  level1_3: "SPLIT TRACE",
  level2_1: "INVISIBLE HEADER",
  level2_2: "PARCEL TAMPER",
  level2_3: "DISPATCH TOKEN",
  level2_4: "EXPRESS FORGE",
  level2_5: "SEALED WAREHOUSE",
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

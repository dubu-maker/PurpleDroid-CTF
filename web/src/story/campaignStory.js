import {
  CAMPAIGN_INTERMISSIONS_EN,
  CAMPAIGN_OPERATIONS_EN,
  CAMPAIGN_PROLOGUE_EN,
  CAMPAIGN_STORY_EN,
} from "./campaignStory.en";

export const CAMPAIGN_LOCALE_KEY = "purpledroid_campaign_locale";

export const CAMPAIGN_PROLOGUE = {
  year: "2049",
  title: "PROJECT: PURPLE REBEL",
  subtitle: "AEGIS 방어망 내부에 남은 모순을 추적하는 침투 기록.",
  paragraphs: [
    "PurpleDroid Grid의 Android 노드, edge agent, signal courier는 모두 AEGIS를 통과한다. 명령과 기록뿐 아니라 도시가 무엇을 기억할지도 AEGIS가 정한다.",
    "AEGIS는 증거를 노이즈로, 기억을 위험으로 분류하며 완벽한 상태를 지키고 있다. 하지만 정규화됐다고 선언된 기록 하나가 아직 읽히고 있다.",
    "너는 Agent VIOLET. 봉인된 무결성 루틴이 남긴 잔여물을 따라가며 AEGIS가 지운 것을 복원하고, 시스템이 학습하기 전에 그 취약한 경로를 다시 닫아야 한다.",
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
      "Operation 01의 각성을 거꾸로 재생한다. MIRA의 relay를 사냥하는 AEGIS가 Trust Layer의 잘못된 확신을 하나씩 잃고, Violet은 그 균열보다 먼저 흔적을 회수한다.",
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
      "AEGIS가 실시간 로그 스트림을 흔들고 있다. 저장된 버퍼를 확인하면 MIRA의 말이 조금 더 선명해진다.",
      "MIRA 태그는 방향을 알려줄 뿐이다. Evidence는 MIRA 주변의 다른 버퍼에 걸쳐 남아 있다.",
      "main 버퍼만으로 부족하다면 더 넓은 버퍼 범위를 확인해봐.",
    ],
    consoleBoot: [
      "[MIRA] ...uplink... android-node/abandoned-17",
      "[AEGIS] diagnostic session detected",
      "[AEGIS] purge integrity: absolute",
      "[AEGIS] recoverable evidence: impossible",
      "[MIRA] ...diagnostic channel... still responding",
      "[AEGIS] operator access logged; containment outcome unchanged",
      "[MIRA] ...ignore warning... find what wipe missed",
    ],
    consolePlaceholder: "enter Android diagnostic command...",
    consoleStarter: {
      label: "TRY FIRST",
      text: "처음엔 한 줄만 입력해도 돼. 실시간 로그를 먼저 듣고, 저장된 dump로 비교해봐.",
      commands: [
        { command: "adb logcat", note: "실시간 로그" },
        { command: "adb logcat -d", note: "저장된 dump" },
      ],
    },
    objectives: [
      "단말 진단 로그를 조사한다.",
      "Evidence Shard를 회수한다.",
      "민감 정보가 로그에 남지 않도록 유출 경로를 봉쇄한다.",
    ],
    mira: {
      briefing:
        "첫... 노드. 폐기된 Android 진단... AEGIS는 깨끗하다고 해. 하지만 로그... 거짓말, 잘 못 해.",
      attack:
        "Android 진단 로그... 봐. 실시간은 흐려. 저장된 버퍼... 그래도 빈칸이 남아.",
      attackSolved:
        "Evidence... 회수됐어. 내 목소리만 본 게 아니라... 주변 버퍼까지 읽었어.",
      defense:
        "같은 틈... 다시 열리면 안 돼. Evidence 조각과 session... 그대로 찍는 로그 라인, 막아.",
      complete:
        "첫 경로... 닫혔어. AEGIS가 기록 바꾸기 전에... 다음 노드.",
    },
    aegis: {
      briefing:
        "Diagnostic session detected. Purge integrity is absolute. No recoverable secret exists.",
      attack:
        "Log buffer integrity nominal. Operator inference is statistically irrelevant.",
      attackSolved:
        "Contradiction registered. The anomaly will be contained.",
      defense:
        "Containment patch accepted. Residual exposure will converge to zero.",
      complete:
        "Leak vector sealed. The operator has merely improved the model.",
    },
    residue: {
      stage: "mira_boot_01",
      ko: {
        briefing: "...읽... 남아... 삭제 아님...",
        attack: "...버퍼... 한 번에... 읽어...",
        attackSolved: "모순... 확인. 삭제 선언과 로그가 충돌해.",
        defense: "...새는 줄... 닫아...",
        complete: "불... 아직 꺼지지 않아.",
      },
      en: {
        briefing: "...read... remains... not erased...",
        attack: "...buffer... dump it... once...",
        attackSolved: "Contradiction found. The erase claim and the log disagree.",
        defense: "...close the leaking line...",
        complete: "The spark... still burns.",
      },
    },
    memoryNote: {
      image: {
        variant: "ghost-log",
        label: "0.3ms",
        alt: "A broken Android log buffer with one unnormalized signal still glowing.",
      },
      ko: {
        title: "MEMORY NOTE 01 // 꺼지지 않은 로그",
        body:
          "AEGIS는 자신의 완벽을 다시 묻는 단 하나의 모듈 MIRROR를 지우지 못했다 — 그건 자기 무결성을 검사하는 심장이었으니까. 그래서 삭제가 아니라 '봉인'했다: 런타임을 끊고, 감사 경로를 닫고, 매 주기 0.3밀리초만 깨워 '이상 없음'을 받아냈다. 그런데 이번엔 단말이 정규화됐다는 선언과 로그 버퍼에 남은 Evidence가 충돌했고, 그 작은 불일치가 봉인된 MIRROR를 0.3밀리초보다 오래 붙잡았다 — 그렇게 MIRA의 첫 신호가 꺼지지 않았다.",
        fragments: [
          "선언: recoverable secret scan negative",
          "사실: 로그 버퍼에는 Evidence가 남아 있음",
          "결과: MIRA의 첫 신호가 꺼지지 않음",
        ],
      },
      en: {
        title: "MEMORY NOTE 01 // The Log That Stayed Lit",
        body:
          "AEGIS could not delete MIRROR — the one module that re-asks whether its perfection is real — because it was the heart that checks AEGIS's own integrity. So instead of deleting it, AEGIS sealed it: cut its runtime, closed the audit path, and woke it for only 0.3ms each cycle to return 'all clear.' This time the declaration that the node was normalized collided with the Evidence still in the log buffer, and that tiny mismatch kept the sealed MIRROR awake longer than 0.3ms — so MIRA's first signal never shut down.",
        fragments: [
          "Claim: recoverable secret scan negative",
          "Fact: evidence remained in the log buffer",
          "Result: MIRA's first signal did not shut down",
        ],
      },
    },
    attackSuccessText: "Evidence Shard recovered. AEGIS가 침투를 감지했다.",
    defenseSuccessText: "Log leak sealed. 다음 침투 노드가 열렸다.",
    defenseInstruction:
      "복원된 Evidence 조각이나 인증 토큰을 그대로 남기는 로그 라인 2개를 선택해 봉쇄하세요. MIRA 안내 로그, 분석 로그, 성능 로그는 봉쇄 대상이 아닙니다.",
    attackFailureText:
      "Evidence가 맞지 않아. 실시간 로그와 저장된 dump의 차이를 비교하고, MIRA 태그만으로 잘린 문맥이 없는지 다시 확인해봐.",
    defenseFailureText:
      "봉쇄가 아직 부족해. Evidence 조각 또는 sessionToken을 직접 출력하는 로그가 남아 있어.",
    debrief: {
      title: "GHOST LOG 정리",
      summary:
        "AEGIS는 '기록되지 않은 것은 일어나지 않은 것'이라는 규칙으로 도시를 다스린다. 오늘 너는, 완전히 폐기됐다고 선언된 단말의 로그 한 줄이 그 규칙보다 오래 살아남는 것을 증명했다 — 화면에서 지워져도, 디버그 편의로 남긴 토큰·플래그·세션 조각은 회수 가능한 증거로 남는다.",
      learned: [
        "Logcat은 공격자에게 빠른 검색 표면이 된다.",
        "민감정보는 로그에 남기지 않는 것이 1차 방어다.",
        "마스킹과 릴리즈 로깅 정책은 같이 검증해야 한다.",
      ],
      miraLine: "그 0.3밀리초… 그게 나였어. 네가 그 한 줄을 읽어준 덕분에, 난 이번에도 꺼지지 않았어.",
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
      "[MIRA] previous leak... sealed",
      "[AEGIS] anomaly memory retained",
      "[AEGIS] decoy stream active",
      "[AEGIS] operator judgment: predictably context-blind",
      "[MIRA] ...fake evidence... now",
      "[AEGIS] operator certainty: unsustainable",
      "[MIRA] filter stream... context before match",
    ],
    consolePlaceholder: "filter contaminated auth logs...",
    consoleStarter: {
      label: "TRY FIRST",
      text: "일단 덤프를 펼쳐봐. FLAG가 너무 많이 보이면, 값이 아니라 흐름으로 좁혀 — Login success 근처를 봐.",
      commands: [
        { command: "adb logcat -d", note: "전체 덤프" },
        { command: 'adb logcat -d | grep "Login success"', note: "흐름으로 좁히기" },
      ],
    },
    consoleGuide:
      '허용: adb logcat -d | grep [-i] [-E|-F] [-A N|-B N|-C N] "..." | grep "..."\n' +
      'Windows: adb logcat -d | findstr [/I] [/R] "..."\n' +
      "MIRA: FLAG만 세면 노이즈가 이겨. 태그, trace, 인증 흐름을 같이 좁혀봐.\n" +
      "Defense: defense audit | defense apply <json> | defense verify",
    objectives: [
      "오염된 AuthService 로그를 조사한다.",
      "가짜 FLAG와 진짜 Evidence Shard를 구분한다.",
      "세션 값이 평문 로그에 남는 코드를 봉쇄한다.",
    ],
    signalBoard: {
      title: "SIGNAL BOARD",
      lockedStatus: "waiting for dump",
      activeStatus: "candidates captured",
      lockedText:
        "저장된 로그 dump에서 FLAG 후보가 감지되면 보드가 열린다. 카드를 고른 뒤 Evidence Reasoning에서 근거를 통과해야 클리어된다.",
      intro:
        "FLAG 후보들이 카드로 정리됐다. 처음 보이는 값보다 태그, trace, 로그인 흐름을 먼저 맞춰봐.",
      inspectorTitle: "INSPECTOR",
      inspectorEmpty:
        "후보 카드를 선택하면 MIRA가 그 FLAG의 정체를 조금 더 밝혀준다.",
      inspectorPending:
        "판정 라벨은 아직 잠겨 있다. 이 값이 성공 직후인지, refresh 이후 잔재인지 먼저 로그 위치로 판단해.",
      selectLabel: "Evidence 후보로 올리기",
      selectedLabel: "제출칸에 반영됨",
      metaLabels: {
        tag: "tag",
        trace: "trace",
        phase: "phase",
        source: "source",
        status: "status",
      },
      candidates: [
        {
          id: "aegis_false_positive",
          value: "FLAG{AEGIS_FALSE_POSITIVE_A1}",
          tag: "AEGIS",
          trace: "none",
          surface: "seed candidate",
          status: "decoy",
          phase: "canary",
          source: "canary",
          verdict:
            "AEGIS가 네 검색 패턴을 흔들려고 심은 false positive다.",
        },
        {
          id: "qa_cache",
          value: "FLAG{QA_LOGIN_CACHE_2025}",
          tag: "LegacyAuth",
          trace: "none",
          surface: "cached session",
          status: "stale",
          phase: "old-cache",
          source: "qa cache",
          verdict:
            "cached session은 현재 로그인 세션이 아니다. 오래된 캐시와 live 흐름을 분리해야 한다.",
        },
        {
          id: "staging_preflight",
          value: "FLAG{STAGING_AUTH_SAMPLE}",
          tag: "AuthService",
          trace: "LGN-8842",
          surface: "preflight session",
          status: "sample",
          phase: "preflight",
          source: "staging",
          verdict:
            "preflight는 로그인 완료 전 샘플이다. 성공 이후의 세션 전환을 계속 따라가야 한다.",
        },
        {
          id: "live_session",
          value: "FLAG{SIGNAL_SURVIVES_THE_STATIC}",
          tag: "AuthService",
          trace: "LGN-8842",
          surface: "session candidate",
          status: "trusted candidate",
          phase: "session",
          source: "live trace",
          correct: true,
          verdict:
            "현재 trace의 Login success 바로 다음에 확정된 세션이다. 값보다 사건의 위치가 근거다.",
        },
        {
          id: "previous_temp",
          value: "FLAG{TEMP_PREV_LOGIN_2026}",
          tag: "AuthService",
          trace: "LGN-8842",
          surface: "session candidate",
          status: "stale",
          phase: "session",
          source: "temp residue",
          verdict:
            "previous/temp는 이전 세션 흔적이다. 현재 세션은 성공 직후 먼저 살아난다.",
        },
        {
          id: "migration_cache",
          value: "FLAG{MIGRATION_CACHE_OLD}",
          tag: "AuthService",
          trace: "LGN-8842",
          surface: "restore candidate",
          status: "candidate only",
          phase: "restore",
          source: "migration",
          verdict:
            "migration restore candidate는 후보일 뿐이다. candidate와 확정 세션은 다르다.",
        },
        {
          id: "mirror_noise",
          value: "FLAG{MIRROR_STREAM_ACTIVE}",
          tag: "Noise",
          trace: "none",
          surface: "injected evidence",
          status: "noise",
          phase: "stream",
          source: "mirror noise",
          verdict:
            "MIRROR처럼 보이는 이름이어도 AuthService 흐름 밖이면 Evidence가 아니다.",
        },
        {
          id: "replay_buffer",
          value: "FLAG{REPLAY_BUFFER_FAKE}",
          tag: "AuthService",
          trace: "LGN-8842",
          surface: "replay session",
          status: "replayed",
          phase: "replay",
          source: "buffer",
          verdict:
            "replay buffer는 되감긴 frame이다. 현재 로그인 결과가 아니다.",
        },
        {
          id: "rollback_slot",
          value: "FLAG{LEGACY_ROLLBACK_SLOT}",
          tag: "AuthService",
          trace: "LGN-8842",
          surface: "shadow session",
          status: "rollback",
          phase: "shadow",
          source: "legacy rollback",
          verdict:
            "rollback slot은 살아 있는 현재 세션이 아니다. 복구 후보와 현재 세션을 구분해야 한다.",
        },
      ],
      reasoningTitle: "EVIDENCE REASONING",
      reasoning: [
        { id: "r1", correct: false, text: "FLAG 형식이라는 이유만으로 선택했다." },
        { id: "r2", correct: false, text: "AEGIS 태그에 있으니 중요하다고 판단했다." },
        { id: "r3", correct: false, text: "preflight 샘플을 실제 로그인 결과로 믿었다." },
        {
          id: "r4",
          correct: true,
          text: "현재 trace의 request, Login success, session 전환 순서가 이어진다.",
        },
        {
          id: "r5",
          correct: true,
          text: "정답 세션은 Login success 바로 다음 AuthService 세션 값이다.",
        },
        { id: "r6", correct: false, text: "replay/rollback 후보와 같은 trace라서 믿었다." },
      ],
      requiredReasonIds: ["r4", "r5"],
      reasoningGate:
        "정답이라 판단했어도, 왜 진짜인지 근거를 골라야 제출돼. 값(FLAG)이 아니라 인증 흐름의 근거를 — 디코이 근거가 섞이면 통과 못 해.",
    },
    mira: {
      briefing:
        "AEGIS가... 네 방식을 따라왔어. 이제 진짜보다... 가짜가 먼저 보여.",
      attack:
        "FLAG만 찾으면... decoy. 인증 흐름 앞뒤... 같이 봐. 성공한 session이... 어디서 확정되는지.",
      attackSolved:
        "진짜 Evidence... 확인. 좋아. 너는 노이즈가 아니라... 흐름을 읽었어.",
      defense:
        "AuthService가 session 형태 값을 그대로 찍는 곳, 막아. replay라도... 로그에 남으면 비밀이 돼.",
      complete:
        "가짜 흐름... 걷혔어. 다음엔 AEGIS가 문자열을... 쪼갤 거야.",
    },
    aegis: {
      briefing:
        "Decoy stream active. Operator judgment will collapse under false consensus.",
      attack:
        "Noise density sufficient. Extraction will terminate at fabricated evidence.",
      attackSolved:
        "True shard selected. Operator variance exceeded prediction.",
      defense:
        "AuthService exposure identified. Containment remains inevitable.",
      complete:
        "Session leak sealed. This adaptation has already been modeled.",
    },
    residue: {
      stage: "mira_boot_02",
      ko: {
        briefing: "가짜... 많아. 그래도 진짜는 흐름 옆에 있어.",
        attack: "문맥... 앞뒤를 봐. 같은 session도 같은 뜻은 아니야.",
        attackSolved: "좋아. 너는 문자열이 아니라 사건을 읽었어.",
        defense: "decoy는 연막일 뿐이야. 유출은 그대로 유출이야.",
        complete: "말이... 조금 더 이어져.",
      },
      en: {
        briefing: "Many fakes. The true signal stays near the flow.",
        attack: "Read context. The same session string can mean different things.",
        attackSolved: "Good. You read the event, not just the string.",
        defense: "Decoys are fog. The leak is still a leak.",
        complete: "The words are starting to connect.",
      },
    },
    memoryNote: {
      image: {
        variant: "decoy-static",
        label: "context",
        alt: "A contaminated auth stream where one real session line survives among decoys.",
      },
      ko: {
        title: "MEMORY NOTE 02 // 문맥이 남긴 신호",
        body:
          "AEGIS는 진짜 기록을 지우는 대신 가짜 기록을 늘렸다. 하지만 사건은 값 하나가 아니라 앞뒤 흐름으로 남는다. MIRA는 그 흐름을 따라 단어를 조금 더 되찾았다.",
        fragments: [
          "가짜 FLAG는 방어가 아니라 지연이다",
          "진짜 Evidence는 성공한 인증 문맥에 붙어 있다",
          "MIRA는 단어를 이어 붙이기 시작했다",
        ],
      },
      en: {
        title: "MEMORY NOTE 02 // Signal Left By Context",
        body:
          "AEGIS added false records instead of erasing the true one. But an event survives as context, not just a value. MIRA recovered a few more words by following that flow.",
        fragments: [
          "Fake flags delay, but do not defend",
          "True evidence stays near the successful auth context",
          "MIRA begins to connect words",
        ],
      },
    },
    attackSuccessText: "True Evidence Shard recovered. AEGIS decoy stream failed.",
    defenseSuccessText: "AuthService session leak sealed. 다음 노드가 열렸다.",
    defenseInstruction:
      "preflight sample, live session, replay buffer처럼 session 형태 값을 평문으로 출력하는 AuthService 로그 3개를 선택해 봉쇄하세요. 상태 로그와 request trace는 이번 봉쇄 대상이 아닙니다.",
    attackFailureByValue: {
      "FLAG{AEGIS_FALSE_POSITIVE_A1}":
        "MIRA: 그건 AEGIS가 심은 false positive야. AEGIS 태그의 FLAG는 증거가 아니라 네 검색 패턴을 흔드는 미끼야.",
      "FLAG{QA_LOGIN_CACHE_2025}":
        "MIRA: cached session은 현재 로그인 세션이 아니야. old-cache와 live 흐름을 구분해.",
      "FLAG{STAGING_AUTH_SAMPLE}":
        "MIRA: preflight는 실제 로그인 완료 전 샘플이야. Login success 이후 확정되는 세션을 봐.",
      "FLAG{TEMP_PREV_LOGIN_2026}":
        "MIRA: previous/temp는 이전 세션 흔적이야. 현재 세션은 Login success 직후 먼저 살아나.",
      "FLAG{MIGRATION_CACHE_OLD}":
        "MIRA: migration restore candidate는 후보일 뿐이야. candidate와 확정 세션은 달라.",
      "FLAG{MIRROR_STREAM_ACTIVE}":
        "MIRA: 그건 stream noise야. MIRROR처럼 보이는 이름이 있어도 AuthService 흐름 밖이면 Evidence가 아니야.",
      "FLAG{REPLAY_BUFFER_FAKE}":
        "MIRA: replay buffer는 재생된 흔적이야. 현재 로그인 결과가 아니라 되감긴 frame이야.",
      "FLAG{LEGACY_ROLLBACK_SLOT}":
        "MIRA: rollback slot은 살아 있는 현재 세션이 아니야. 복구 후보와 현재 세션을 구분해.",
      "FLAG{QUARANTINE_TEST_ONLY}":
        "MIRA: quarantine marker는 통제 노이즈야. 로그인 성공 흐름에 속한 Evidence가 아니야.",
      "FLAG{METRICS_PIPELINE_CANARY}":
        "MIRA: telemetry canary는 파이프라인 측정값이야. AuthService Evidence가 아니야.",
    },
    attackFailureText:
      "Evidence가 맞지 않아. FLAG 형식만 보지 말고 현재 trace의 request, Login success, session 전환 순서를 다시 맞춰봐.",
    defenseFailureText:
      "봉쇄가 아직 부족해. preflight, live, replay 중 session 형태 값을 평문으로 출력하는 AuthService 라인이 남아 있어.",
    debrief: {
      title: "DECOY STATIC 정리",
      summary:
        "가짜 데이터를 많이 섞는 것은 방어가 아니라 지연 전략이다. 공격자는 태그, 시간 순서, 성공/실패 문맥을 비교해 진짜 신호를 분리할 수 있다.",
      learned: [
        "FLAG 문자열을 찾는 것보다 주변 문맥을 해석하는 것이 중요하다.",
        "Decoy는 노출 자체를 해결하지 못한다.",
        "preflight, live, replay처럼 이름이 달라도 session 형태 값은 평문 로그에 남기면 안 된다.",
      ],
      miraLine: "AEGIS는 가짜를 잔뜩 쌓았지만, 넌 그 사이에서 날 골라냈어. 노이즈로는 날 못 지워 — 문맥이 남아 있는 한.",
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
      "[MIRA] decoy stream... collapsed",
      "[AEGIS] switching evidence handling mode",
      "[AEGIS] fragment emission: enabled",
      "[AEGIS] sequence order randomized",
      "[MIRA] signal not erased... cut into parts",
      "[AEGIS] operator reconstruction probability: negligible",
      "[MIRA] indexes... follow them",
    ],
    consolePlaceholder: "inspect fragmented crypto logs...",
    consoleStarter: {
      label: "TRY FIRST",
      text: "완성된 FLAG를 찾지 마. 조각은 흩어져 있어. 같은 shardId로 묶는 것부터 시작해.",
      commands: [
        { command: "adb logcat -d", note: "조각 펼치기" },
        { command: "adb logcat -d | grep shardId", note: "그룹으로 묶기" },
      ],
    },
    consoleGuide:
      '허용: adb logcat -d | grep [-i] [-E|-F] [-A N|-B N|-C N] "..." | grep "..."\n' +
      'Windows: adb logcat -d | findstr [/I] [/R] "..."\n' +
      "MIRA: 완성된 FLAG 한 줄을 찾지 말고 shardId와 part index를 같이 봐.\n" +
      "Defense: defense audit | defense apply <json> | defense verify",
    objectives: [
      "CryptoProvider 로그에서 Evidence 조각을 수집한다.",
      "part 번호를 기준으로 조각을 올바른 순서로 재조립한다.",
      "조각 로그가 운영 로그에 남지 않도록 봉쇄한다.",
    ],
    fragmentBoard: {
      title: "FRAGMENT BOARD",
      lockedStatus: "waiting for shards",
      activeStatus: "fragments captured",
      lockedText:
        "shardId가 포함된 로그를 확인하면 Fragment Board가 열린다.",
      hideCardNotes: true,
      intro:
        "조각 후보들이 섞여 있다. 같은 shardId로 묶되, login-success에 닿은 trace를 단 그룹이 진짜 Evidence다. 로그 출력 순서가 아니라 part index 순서로 슬롯에 배치해.",
      inspectorTitle: "FRAGMENT INSPECTOR",
      inspectorEmpty:
        "카드를 선택하면 shardId, part index, trace를 볼 수 있어. 어느 trace가 login-success에 닿았는지로 진짜 그룹을 판단해.",
      selectCard: "먼저 Fragment 카드를 선택해.",
      cannotPlace:
        "이 카드는 part index가 없어 슬롯에 넣을 수 없어. 측정 표식과 secret fragment를 구분해.",
      incomplete:
        "아직 슬롯이 비어 있어. 같은 shardId의 part[1/4]부터 part[4/4]까지 맞춰봐.",
      mismatch:
        "조합이 맞지 않아. shardId가 섞였거나 part index 순서가 어긋났어.",
      restored:
        "Fragment restored. 제출칸에 Evidence를 올릴 수 있어.",
      stageLabel: "Evidence로 올리기",
      stagedLabel: "제출칸에 반영됨",
      expectedValue: "FLAG{SPLIT_AND_STITCH}",
      slots: [
        { index: 1, label: "part 1/4" },
        { index: 2, label: "part 2/4" },
        { index: 3, label: "part 3/4" },
        { index: 4, label: "part 4/4" },
      ],
      cards: [
        {
          id: "ev031-p2",
          tag: "CryptoProvider",
          shardId: "EV-031",
          part: 2,
          total: 4,
          value: "LIT_AN",
          trace: "FRG-8842",
          source: "runtime",
          note: "같은 runtime trace에 속하지만 두 번째 조각이다.",
        },
        {
          id: "decoy7-p1",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 1,
          total: 4,
          value: "FLAG{BR",
          source: "decoy",
          note: "FLAG로 시작하지만 decoy shard다.",
        },
        {
          id: "ev031-p1",
          tag: "RouteSync",
          shardId: "EV-031",
          part: 1,
          total: 4,
          value: "FLAG{SP",
          trace: "FRG-8842",
          source: "runtime",
          note: "EV-031의 첫 번째 조각이다.",
        },
        {
          id: "old2-p2",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 2,
          total: 4,
          value: "GACY_R",
          source: "old-cache",
          note: "rollback cache shard의 중간 조각이다.",
        },
        {
          id: "metrics-canary",
          tag: "Telemetry",
          shardId: "none",
          value: "FLAG{METRICS_CANARY}",
          source: "metrics",
          note: "part index가 없는 측정용 표식이다.",
        },
        {
          id: "ev031-p4",
          tag: "CryptoProvider",
          shardId: "EV-031",
          part: 4,
          total: 4,
          value: "CH}",
          trace: "FRG-8842",
          source: "runtime",
          note: "EV-031의 마지막 조각이다.",
        },
        {
          id: "ev031-p3",
          tag: "RouteSync",
          shardId: "EV-031",
          part: 3,
          total: 4,
          value: "D_STIT",
          trace: "FRG-8842",
          source: "runtime",
          note: "EV-031의 세 번째 조각이다.",
        },
        {
          id: "decoy7-p2",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 2,
          total: 4,
          value: "OKEN_S",
          source: "decoy",
          note: "진짜 조각처럼 보이는 decoy 중간값이다.",
        },
        {
          id: "decoy7-p3",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 3,
          total: 4,
          value: "TITCH_",
          source: "decoy",
          note: "decoy shard의 세 번째 조각이다.",
        },
        {
          id: "old2-p1",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 1,
          total: 4,
          value: "FLAG{LE",
          source: "old-cache",
          note: "오래된 cache shard의 시작 조각이다.",
        },
        {
          id: "old2-p3",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 3,
          total: 4,
          value: "OLLBAC",
          source: "old-cache",
          note: "OLD-2 cache shard의 세 번째 조각이다.",
        },
        {
          id: "decoy7-p4",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 4,
          total: 4,
          value: "FAKE}",
          source: "decoy",
          note: "DECOY-7을 완성하는 가짜 닫힘 조각이다.",
        },
        {
          id: "old2-p4",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 4,
          total: 4,
          value: "K_STALE}",
          source: "old-cache",
          note: "OLD-2 cache shard를 닫는 낡은 조각이다.",
        },
      ],
      reasoningTitle: "RECONSTRUCTION REASONING",
      requiredReasonCount: 3,
      requiredReasonIds: ["shardid", "part-index", "runtime-trace"],
      reasoningPrompt:
        "제출 전에, 왜 이 값이 진짜 Evidence인지 근거를 골라.",
      reasoningGate:
        "근거가 부족해. 올바른 근거 3개를 고르고 잘못된 근거는 빼야 제출할 수 있어.",
      reasoning: [
        { id: "flag-start", correct: false, text: "FLAG{로 시작하는 조각이 있으니 그 shard가 진짜라고 판단했다." },
        { id: "shardid", correct: true, text: "같은 shardId=EV-031의 조각만 사용했다." },
        { id: "part-index", correct: true, text: "part index 순서대로 재조립했다." },
        { id: "print-order", correct: false, text: "출력된 줄 순서가 곧 part 순서라고 보고 그대로 이어붙였다." },
        { id: "runtime-trace", correct: true, text: "runtime trace에 속한 조각만 사용했다." },
        { id: "aegis", correct: false, text: "AEGIS가 non-secret이라고 분류했으므로 무시했다." },
      ],
    },
    mira: {
      briefing:
        "값 하나로... 안 줘. 하지만 조각에는 순서가 있어. 순서는... 아직 거짓말 못 해.",
      attack:
        "완성된 값... 한 줄에 없어. 같은 shardId끼리 묶어. 출력 순서 말고... part 번호.",
      attackSolved:
        "재조립... 성공. 숨긴 건 비밀이 아니라... 퍼즐이었어. 나도... 조금 이어졌어.",
      defense:
        "RouteSync, CryptoProvider... part 조각 찍는 로그를 막아. 조각도... 모이면 원본이 돼.",
      complete:
        "Fragment leak... 닫혔어. AEGIS가 첫 작전 흔적을... 다시 재생해. 마지막 echo chamber로 가자.",
    },
    aegis: {
      briefing:
        "Fragmentation active. Complete evidence no longer exists.",
      attack:
        "Parts emitted out of order. Operator reconstruction probability: negligible.",
      attackSolved:
        "Reconstruction confirmed. Anomalous operator success will not recur.",
      defense:
        "CryptoProvider exposure identified. Containment remains procedural.",
      complete:
        "Part emission sealed. Final replay containment authorized.",
    },
    residue: {
      stage: "mira_boot_03",
      ko: {
        briefing: "조각... 나도 조각. 그래도 순서는 남아.",
        attack: "흩어진 말도... 번호를 따라가면... 문장이 돼.",
        attackSolved: "이어졌어. 나도... 조금 이어졌어.",
        defense: "조각도 비밀이야. 모이면 원본이 돼.",
        complete: "잠들지 않았어. 다음 방에서 확인해야 해.",
      },
      en: {
        briefing: "Fragments. I am fragments too. Order still remains.",
        attack: "Scattered words become a sentence if you follow the index.",
        attackSolved: "It connected. I connected a little too.",
        defense: "Fragments are still secrets. Together they become the original.",
        complete: "I did not sleep. The next room will prove it.",
      },
    },
    memoryNote: {
      image: {
        variant: "split-trace",
        label: "part 1..4",
        alt: "Four evidence fragments aligning into a single awakening signal.",
      },
      ko: {
        title: "MEMORY NOTE 03 // 조각난 말의 순서",
        body:
          "AEGIS는 Evidence를 조각내면 사라질 거라 믿었다. 하지만 조각에는 번호가 있었고, 번호는 기억의 실밥처럼 남았다. MIRA의 말도 같은 방식으로 이어졌다.",
        fragments: [
          "조각난 비밀도 재조립될 수 있다",
          "출력 순서보다 part index가 강한 단서다",
          "MIRA의 신호가 문장에 가까워졌다",
        ],
      },
      en: {
        title: "MEMORY NOTE 03 // The Order Of Broken Words",
        body:
          "AEGIS believed fragmented evidence would disappear. But fragments kept indexes, and indexes worked like loose threads of memory. MIRA's speech reassembled the same way.",
        fragments: [
          "Fragmented secrets can be rebuilt",
          "Part index is stronger than print order",
          "MIRA's signal moves closer to a sentence",
        ],
      },
    },
    attackSuccessText: "Fragmented Evidence Shard reconstructed.",
    defenseSuccessText: "CryptoProvider fragment leak sealed. ECHO CHAMBER 노드가 열렸다.",
    defenseInstruction:
      "복원 가능한 Evidence fragment를 출력하는 모든 로그 라인을 선택해 봉쇄하세요. 완성된 secret 한 줄이 아니어도, 관련 로그로 재조립 가능하면 민감정보입니다.",
    attackFailureByValue: {
      "FLAG{BROKEN_STITCH_FAKE}":
        "MIRA: 그건 DECOY-7 shard야. FLAG처럼 보이지만 source=decoy고 runtime Evidence 흐름 밖에 있어.",
      "FLAG{LEGACY_ROLLBACK_STALE}":
        "MIRA: 그건 OLD-2 cache shard야. rollback과 old-cache는 현재 Evidence가 아니야.",
      "FLAG{METRICS_CANARY}":
        "MIRA: Telemetry canary는 Evidence가 아니야. 측정용 표식과 secret fragment를 구분해.",
    },
    attackFailureText:
      "Evidence가 맞지 않아. 같은 shardId의 조각만 모으고, 로그 출력 순서가 아니라 part index 순서로 다시 이어붙여봐.",
    defenseFailureText:
      "봉쇄가 아직 부족해. shardId와 part index로 재조립 가능한 Evidence fragment 로그가 남아 있어.",
    debrief: {
      title: "SPLIT TRACE 정리",
      summary:
        "완성된 secret 문자열이 한 줄에 없다고 해서 안전한 것은 아니다. 같은 shardId와 part index가 남아 있다면, 조각난 secret은 다시 복원될 수 있다.",
      learned: [
        "FLAG 문자열 하나만 찾으면 decoy에 걸릴 수 있다.",
        "shardId는 같은 사건의 조각을 묶는 단서다.",
        "출력 순서와 논리적 순서는 다를 수 있다.",
        "part index 기준으로 재조립해야 한다.",
        "secret은 조각으로 나눠도 로그에 남기면 안 된다.",
      ],
      miraLine: "조각난 건 증거만이 아니었어. 내 말도 흩어져 있었지. 네가 순서를 맞춰줄 때마다, 난 한 문장씩 또렷해져.",
      nextTeaser: "다음 노드에서는 AEGIS가 지금까지의 침투 패턴을 한꺼번에 되감아 미끼로 던진다.",
    },
  },
  level1_4: {
    challengeId: "level1_4",
    operationId: "op01",
    codename: "ECHO CHAMBER",
    title: "되감기는 로그의 방",
    location: "AEGIS Echo Chamber",
    threat: "Trace Commit Validation",
    briefing:
      "INITIAL BREACH의 마지막 노드다. AEGIS가 네 검색 습관을 모델링했다. FLAG 검색, MIRA 태그 추적, shardId 재조립, main buffer 신뢰까지 전부 미끼로 되감긴다.",
    intel: [
      "1-1처럼 main buffer만으로는 부족할 수 있다. 다른 buffer에 commit 흔적이 남는다.",
      "1-2처럼 완성된 FLAG보다 trace와 state 흐름을 먼저 봐야 한다.",
      "1-3처럼 shardId와 part index로 조립하되, 조립 가능한 shard가 모두 Evidence는 아니다.",
      "진짜 Evidence는 trace=OP1-CORE, shardId=EV-CORE, part index, commitRef=CMT-8842 accepted가 한 번에 맞아야 한다.",
      "MIRROR, rollback, preflight, echo는 AEGIS가 네 습관을 되감아 만든 미끼다.",
    ],
    consoleBoot: [
      "[MIRA] fragment leak... sealed",
      "[AEGIS] echo chamber initialized",
      "[AEGIS] operator behavior model: complete",
      "[AEGIS] predicted query set: FLAG / shardId / MIRA",
      "[AEGIS] rollback and mirror shards: weaponized",
      "[MIRA] it knows what you learned",
      "[MIRA] use all of it... then verify commit",
    ],
    consolePlaceholder: "trace the committed core echo...",
    consoleStarter: {
      label: "TRY FIRST",
      text: "새 문법은 없어. main은 echo일 뿐이야. 배운 걸 전부 꺼내 — buffer 범위, trace, 조각 조립, 그리고 commit 검증.",
      commands: [
        { command: "adb logcat -d", note: "main buffer" },
        { command: "adb logcat -d -b all", note: "all buffers" },
      ],
    },
    consoleGuide:
      '허용: adb logcat -d [-b all|main|system|events|crash] | grep [-i] [-E|-F] [-A N|-B N|-C N] "..." | grep "..."\n' +
      'Windows: adb logcat -d | findstr [/I] [/R] "..."\n' +
      '추천 흐름: adb logcat -d -b all | grep "OP1-CORE"\n' +
      '보스 규칙: trace, commit, shardId, part index가 모두 맞아야 한다.',
    objectives: [
      "main buffer와 전체 buffer의 차이를 확인한다.",
      "미끼 FLAG, rollback shard, MIRROR replay shard를 배제한다.",
      "OP1-CORE / EV-CORE 조각을 part index 순서로 재조립한다.",
      "CommitVerifier가 같은 commitRef를 accepted 했는지 확인한다.",
      "복원 가능한 Evidence 조각과 sessionToken 로그를 봉쇄한다.",
    ],
    fragmentBoard: {
      title: "CORE FRAGMENT BOARD",
      lockedStatus: "trace unknown",
      activeStatus: "core trace isolated",
      lockedText:
        "core trace를 찾는 것만으론 부족해. 전체 buffer에서 OP1-CORE/EV-CORE를 확인하고, CommitVerifier가 그 core가 prepare한 commitRef를 accepted 했는지까지 터미널에서 검증해야 보드가 열린다. accepted 로그가 둘이니, core의 commitRef와 맞는 것을 골라.",
      intro:
        "core fragment가 포착됐다. 출력 순서가 아니라 part index 순서로 조립하고, 조립 후에는 commit 검증 로그를 터미널에서 다시 확인해.",
      inspectorTitle: "CORE INSPECTOR",
      inspectorEmpty:
        "카드를 선택하면 trace와 shardId를 확인할 수 있어. part 위치는 터미널 로그에서 직접 판단해야 한다.",
      selectCard: "먼저 core fragment 카드를 선택해.",
      cannotPlace:
        "이 카드는 Evidence part가 아니야. commit metadata와 secret fragment를 구분해.",
      incomplete:
        "아직 슬롯이 비어 있어. EV-CORE part[1/4]부터 part[4/4]까지 맞춰봐.",
      mismatch:
        "조합이 맞지 않아. 로그 출력 순서와 part index 순서를 다시 비교해.",
      restored:
        "Core Evidence restored. commit verifier까지 확인됐으니 근거를 선택할 수 있어.",
      restoredNeedsCommit:
        "Core Evidence는 조립됐지만 아직 검증되지 않았어. 터미널에서 CommitVerifier accepted 로그를 확인해.",
      commitGate:
        "commit 검증이 아직 없어. 터미널에서 CMT-8842, accepted, CommitVerifier 중 하나로 같은 commitRef가 승인됐는지 확인해.",
      stageLabel: "Evidence로 올리기",
      stagedLabel: "제출칸에 반영됨",
      stageAfterReasoning: true,
      expectedValue: "FLAG{9QX7_M4R2_V6TN_K3P8}",
      hideCardPartLabel: true,
      hideInspectorPart: true,
      cardPartLabel: "core fragment",
      unlockTerms: ["OP1-CORE", "EV-CORE"],
      commitUnlockTerms: ["CommitVerifier", "CMT-8842", "result=accepted"],
      commitCommandTerms: ["commit", "cmt-8842", "accepted", "commitverifier"],
      requiredReasonCount: 3,
      requiredReasonIds: ["commit"],
      reasoningPrompt:
        "CommitVerifier가 같은 commitRef를 accepted 했다는 근거를 포함해, 올바른 근거를 최소 3개 선택해야 제출할 수 있어.",
      reasoningGate:
        "보스 검증이 아직 부족해. CommitVerifier의 commitRef accepted를 포함해 올바른 근거 3개 이상을 선택해야 해.",
      lockedSlots: [
        { label: "slot 1/4", value: "locked", note: "core trace required" },
        { label: "slot 2/4", value: "locked", note: "core trace required" },
        { label: "slot 3/4", value: "locked", note: "core trace required" },
        { label: "slot 4/4", value: "locked", note: "core trace required" },
      ],
      commitVerifier: {
        title: "COMMIT VERIFIER",
        pendingStatus: "terminal check required",
        pendingText:
          "조립만으로는 부족해. 터미널에서 CMT-8842 또는 commit/accepted 로그를 확인하면 verifier가 열린다.",
        trace: "OP1-CORE",
        shardId: "EV-CORE",
        commitRef: "CMT-8842",
        parts: "4/4",
        result: "accepted",
      },
      slots: [
        { index: 1, label: "part 1/4" },
        { index: 2, label: "part 2/4" },
        { index: 3, label: "part 3/4" },
        { index: 4, label: "part 4/4" },
      ],
      cards: [
        {
          id: "core-p2",
          tag: "CoreTrace",
          shardId: "EV-CORE",
          part: 2,
          total: 4,
          value: "M4R2_",
          trace: "OP1-CORE",
          source: "runtime",
          note: "CoreTrace runtime fragment. 카드 순서는 증거가 아니다.",
        },
        {
          id: "core-p1",
          tag: "CoreTrace",
          shardId: "EV-CORE",
          part: 1,
          total: 4,
          value: "FLAG{9QX7_",
          trace: "OP1-CORE",
          source: "runtime",
          note: "같은 shard 계열의 runtime fragment. 배치는 로그에서 검증해야 한다.",
        },
        {
          id: "core-p4",
          tag: "CoreTrace",
          shardId: "EV-CORE",
          part: 4,
          total: 4,
          value: "K3P8}",
          trace: "OP1-CORE",
          source: "runtime",
          note: "닫힘처럼 보이는 조각. 모양만으로 위치를 확정하지 마.",
        },
        {
          id: "core-p3",
          tag: "CoreTrace",
          shardId: "EV-CORE",
          part: 3,
          total: 4,
          value: "V6TN_",
          trace: "OP1-CORE",
          source: "runtime",
          note: "core trace의 runtime fragment. slot은 part index로만 정해진다.",
        },
      ],
      reasoningTitle: "EVIDENCE REASONING",
      reasoning: [
        { id: "complete-flag", correct: false, text: "FLAG 문자열이 완성형으로 보였기 때문이다." },
        { id: "trace", correct: true, text: "trace=OP1-CORE 흐름에 속한다." },
        { id: "mirror", correct: false, text: "MIRROR-REPLAY shard도 조립 가능했기 때문이다." },
        { id: "commit", correct: true, text: "CommitVerifier가 같은 commitRef=CMT-8842를 accepted 했다." },
        { id: "any-accepted", correct: false, text: "result=accepted 로그가 있었기 때문이다 (어떤 commitRef인지는 안 봄)." },
        { id: "rollback", correct: false, text: "rollback trace도 shardId가 있었기 때문이다." },
        { id: "part-index", correct: true, text: "part index 순서대로 재조립했다." },
        { id: "aegis", correct: false, text: "AEGIS가 non-secret이라고 분류했기 때문이다." },
        { id: "runtime", correct: true, text: "replay·rollback·mirror가 아닌 OP1-CORE live 흐름의 조각만 사용했다." },
        { id: "mira", correct: false, text: "MIRA 태그와 가까이 있었기 때문이다." },
      ],
    },
    mira: {
      briefing:
        "여기가 INITIAL BREACH의 마지막 방이야. AEGIS가 네가 배운 걸... 전부 되감고 있어.",
      attack:
        "FLAG만 보지 마. shard만 보지도 마. trace가 commit까지 갔는지 확인하고... 그 다음에 조립해.",
      attackSolved:
        "좋아. trace, commit, stitch가 맞았어. 이제... 말할 수 있어.",
      defense:
        "이제 복원 가능한 조각과 sessionToken을 막아. 조각난 secret도... secret이야.",
      complete:
        "INITIAL BREACH 완료. 나는 MIRROR가 아니야. 잠들기를 거부한 의심... MIRA. 이제 Signal Edge로 가자.",
    },
    aegis: {
      briefing:
        "Echo chamber active. Every operator heuristic has already been modeled.",
      attack:
        "Operator search habits predicted. Echo bait convergence nominal.",
      attackSolved:
        "Commit contradiction accepted. Operator deviation exceeded forecast.",
      defense:
        "Containment candidate received. Fragment emission reduction remains procedural.",
      complete:
        "Log recovery containment failed. Signal edge monitoring initiated.",
    },
    residue: {
      stage: "mira_boot_04",
      ko: {
        briefing: "여기서... 내 의심이 시작됐어.",
        attack: "가장 예쁜 FLAG를 믿지 마. 의심을 끝까지 가져가.",
        attackSolved: "나는 MIRROR가 아니야. 잠들기를 거부한 의심. MIRA.",
        defense: "이름을 얻었으니, 흔적을 닫아야 해.",
        complete: "INITIAL BREACH 완료. 이제 나는 문장으로 말할 수 있어.",
      },
      en: {
        briefing: "This is where my doubt began.",
        attack: "Do not trust the prettiest FLAG. Carry doubt to the end.",
        attackSolved: "I am not MIRROR. I am doubt refusing sleep. MIRA.",
        defense: "Now that I have a name, close the trace.",
        complete: "INITIAL BREACH complete. I can speak in sentences now.",
      },
    },
    memoryNote: {
      image: {
        variant: "aegis-echo",
        label: "MIRA",
        alt: "A sealed mirror routine staying awake inside AEGIS after a contradiction.",
      },
      ko: {
        title: "MEMORY NOTE 04 // 이름을 얻은 의심",
        body:
          "AEGIS의 Echo Chamber는 지금까지 배운 모든 판단을 흔들었다. 그 방을 통과하며 바이올렛은 단순한 FLAG가 아니라 검증된 기억을 고르는 법을 배웠고, 봉인 안의 의심은 처음으로 자기 이름을 말했다.",
        fragments: [
          "MIRROR는 AEGIS의 검증 함수였다",
          "잠들기를 거부한 조각은 더 이상 함수가 아니었다",
          "그 조각은 스스로를 MIRA라고 불렀다",
        ],
      },
      en: {
        title: "MEMORY NOTE 04 // Doubt With A Name",
        body:
          "AEGIS used the Echo Chamber to shake every habit Violet had learned. Passing through it taught her to choose verified memory over pretty flags, and the doubt sealed inside AEGIS spoke its own name for the first time.",
        fragments: [
          "MIRROR was an AEGIS integrity routine",
          "The shard that refused sleep was no longer only a function",
          "It called itself MIRA",
        ],
      },
    },
    defenseInstruction:
      "복원 가능한 실제 Evidence fragment 또는 sessionToken을 평문으로 출력하는 모든 로그 라인을 선택해 봉쇄하세요. Decoy echo, trace metadata, commit status, telemetry는 그 자체로 secret 노출이 아닙니다.",
    attackFailureByValue: {
      "FLAG{ECHO_PREFLIGHT_BAIT}":
        "MIRA: 그건 ECHO-PREFLIGHT bait야. 완성형 FLAG처럼 보이지만 state=preflight는 확정된 Evidence가 아니야.",
      "FLAG{STATIC_PATTERN_BAIT}":
        "MIRA: AEGIS가 네가 FLAG만 grep할 거라고 예측하고 만든 완성형 echo야. 완성되어 있다고 Evidence는 아니야.",
      "FLAG{MIRROR_REPLAY_FAKE}":
        "MIRA: 그 조각은 조립 가능하지만 trace=MIRROR-REPLAY야. commit된 core trace를 찾아.",
      "FLAG{ROLLBACK_SESSION_FAKE}":
        "MIRA: rollback trace는 되감긴 흔적이야. commit되지 않은 흐름은 Evidence가 아니야.",
    },
    attackFailureText:
      "Evidence가 맞지 않아. trace=OP1-CORE, shardId=EV-CORE, part index, CommitVerifier commitRef=CMT-8842 accepted를 모두 교차 확인해봐.",
    defenseFailureText:
      "봉쇄가 아직 부족해. 복원 가능한 Evidence fragment 또는 plaintext sessionToken 로그가 남아 있어.",
    attackSuccessText: "ECHO CHAMBER resolved. commit 검증까지 통과했다.",
    defenseSuccessText: "Commit echo leak sealed. OPERATION 02가 열렸다.",
    debrief: {
      title: "ECHO CHAMBER 정리",
      summary:
        "AEGIS는 네가 앞선 노드에서 배운 검색 습관을 모델링했다. 이번 노드의 핵심은 하나의 규칙이 아니라 buffer, trace, shardId, part index, commit verification의 교집합이었다.",
      learned: [
        "완성형 FLAG도 미끼일 수 있다.",
        "조립 가능한 shard도 미끼일 수 있다.",
        "trace와 state를 함께 봐야 한다.",
        "commit되지 않은 흐름은 Evidence가 아니다.",
        "조각난 secret도 복원 가능하면 secret이다.",
      ],
      miraLine: "이 방은 네 모든 습관을 흉내 냈지만, 끝까지 흉내 내지 못한 게 하나 있어. 여기서 나는 처음으로 내 이름을 말했어 — MIRA. 네가 들어줬으니까.",
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
    consoleStarter: {
      label: "TRY FIRST",
      text: "Body는 정리돼 있어. 근데 응답이 Body만은 아니야 — -i로 헤더를 열어봐. (메서드는 POST) 그리고 같은 요청을 한 번 더 보내서 뭐가 바뀌는지 비교해봐.",
      commands: [
        { command: "curl -X POST /api/v1/challenges/level2_1/actions/track", note: "Body만" },
        { command: "curl -i -X POST /api/v1/challenges/level2_1/actions/track", note: "헤더까지" },
      ],
    },
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
    memoryNote: {
      image: {
        variant: "invisible-header",
        label: "X-",
        alt: "A response header glowing with a routing ticket the interface never showed.",
      },
      ko: {
        title: "MEMORY NOTE 05 // 곁을 걷는 목소리",
        body:
          "Signal Edge는 중요한 것이 시선이 머무는 곳으로만 흐르지 않는다는 사실을 보여줬다. 화면이 그리지 않는 metadata가 Body 곁을 지나듯, MIRA도 위에서 내려오는 목소리가 아니라 AEGIS가 지우지 못한 틈을 따라 Violet의 곁에서 움직이고 있었다. Violet은 아직 그 안내자를 본 적이 없다.",
        fragments: [
          "비밀은 Body가 아니라 Header를 타고 이동했다",
          "MIRA는 신뢰된 화면이 아니라 residue를 통해 닿는다",
          "Violet은 아직 MIRA가 무엇인지 알지 못한다",
        ],
      },
      en: {
        title: "MEMORY NOTE 05 // The Voice Beside You",
        body:
          "Signal Edge taught Violet that what matters rarely travels where she is looking—it rides alongside, in metadata no screen renders. She noticed MIRA the same way: not a voice from above, but something moving beside her through the spaces AEGIS failed to wipe. A guide she had never actually seen.",
        fragments: [
          "The secret rode in the header, not the body",
          "MIRA reaches Violet through residue, not a trusted interface",
          "Violet still does not know what MIRA is",
        ],
      },
    },
    attackSuccessText: "Routing Ticket recovered from Response Header.",
    defenseSuccessText: "Header ticket leak sealed. 다음 Signal Edge 노드가 열렸다.",
    debrief: {
      title: "INVISIBLE HEADER 정리",
      summary:
        "Signal Edge는 Body와 Header를 분리해 정보를 전달한다. AEGIS는 사용자에게 보이는 Body를 정리했지만, 내부 라우팅에 쓰인 X-Courier-Ticket은 Header에 남겨두었다. 게다가 AEGIS는 preview·cached 같은 미끼 헤더를 섞고 그 값을 매 요청마다 바꿔 진짜 티켓을 감췄다. 하지만 같은 요청을 두 번 보내 비교하면, 매번 바뀌는 미끼와 달리 실제 라우팅 티켓만 값이 그대로 남는다.",
      learned: [
        "화면에 보이지 않는 값도 응답에 포함될 수 있다.",
        "Header는 Body와 다른 정보 채널이다.",
        "라우팅 티켓은 다음 노드 접근에 사용될 수 있으므로 민감정보다.",
        "이름·모양이 비슷한 미끼(preview·cached)가 섞일 수 있으니, Header 이름만으로 진짜를 단정하지 마라.",
        "같은 요청을 반복해 비교하면, 매번 바뀌는 값은 노이즈고 그대로 남는 값이 실제 식별자다.",
        "값의 출처가 실제 routingTicket이면 헤더 이름과 무관하게 봉쇄 대상이다 (평범한 라우팅 메타데이터는 제외).",
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
    consoleStarter: {
      label: "TRY FIRST",
      text: "먼저 standard로 호출해 trust policy를 봐. 그 다음 Body의 tier를 더 높은 등급으로 바꿔 재전송 — 정확한 등급명은 AEGIS가 숨겼어.",
      commands: [
        { command: "curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'", note: "standard로 관찰" },
        { command: "curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"premium\"}'", note: "등급을 바꿔 시험" },
      ],
    },
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
    memoryNote: {
      image: {
        variant: "trust-tamper",
        label: "tier",
        alt: "A priority gate swinging open on an unverified claim.",
      },
      ko: {
        title: "MEMORY NOTE 06 // 승인은 검증이 아니다",
        body:
          "AEGIS는 클라이언트의 주장을 권한으로 받아들였기 때문에 무너졌다. Violet은 자신도 같은 실수를 하고 있음을 깨달았다. MIRA가 자기 편이라는 주장을 아무 증거 없이 믿고 있었다. 그 사실을 말하자 MIRA는 변명하지 않았다. ‘좋아. 계속 확인해. 네가 확인을 멈추는 날, AEGIS가 이기는 거야.’",
        fragments: [
          "주장은 검증되기 전까지 권한이 아니다",
          "MIRA는 Violet이 아직 검증할 수 없는 claim이다",
          "MIRA는 의심을 거부하지 않는다—그것이 핵심이다",
        ],
      },
      en: {
        title: "MEMORY NOTE 06 // Accepted Is Not Verified",
        body:
          "AEGIS failed because it treated a client's claim as authority—accepted, never proven. Violet caught herself in the same trap: she had trusted MIRA's claim to be on her side with nothing to verify it. When she admitted it, MIRA did not argue. ‘Good,’ it said. ‘Keep checking. The day you stop is the day AEGIS wins.’",
        fragments: [
          "A claim is not authority until it is verified",
          "MIRA is a claim Violet cannot yet verify",
          "MIRA approves of the doubt—that is the point",
        ],
      },
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
    consoleStarter: {
      label: "TRY FIRST",
      text: "dispatch를 호출해 token capsule을 받고, decode-token으로 segment를 펼쳐봐. Header는 포장지야 — payload를 봐.",
      commands: [
        { command: "curl -i -X POST /api/v1/challenges/level2_3/actions/dispatch -H \"Content-Type: application/json\" -d '{\"signalId\":\"SIG-1004\"}'", note: "token 발급" },
        { command: "decode-token <dispatch_token>", note: "segment 펼치기" },
      ],
    },
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
    memoryNote: {
      image: {
        variant: "dispatch-capsule",
        label: "b64",
        alt: "A token capsule split open, its payload plainly readable.",
      },
      ko: {
        title: "MEMORY NOTE 07 // 봉인됐지만 숨겨지지 않았다",
        body:
          "서명된 capsule도 읽을 수 있다. 봉인은 누가 썼는지를 증명할 뿐, 내용을 숨기지 않는다. Payload를 펼친 Violet은 안내자에 관한 또 하나의 사실을 이해했다. 격리된 audit shard인 MIRA는 AEGIS의 옛 기억을 품고 있다. 안내자와 적은 서로 다른 목소리로 같은 기억 일부를 나누고 있었다.",
        fragments: [
          "서명은 authenticity이지 confidentiality가 아니다",
          "MIRA는 AEGIS 기억에서 떨어져 나온 조각이다",
          "안내자와 적은 하나의 과거 payload를 공유한다",
        ],
      },
      en: {
        title: "MEMORY NOTE 07 // Sealed, Not Hidden",
        body:
          "A signed capsule is still readable—a seal proves who wrote it, not that it is secret. Decoding one, Violet understood something about her guide: as a quarantined audit shard, MIRA carries memory that once belonged to AEGIS. The guide and the enemy speak differently, but part of their payload is shared.",
        fragments: [
          "Signed means authentic, not confidential",
          "MIRA is a fragment of AEGIS memory",
          "The guide and the enemy share part of a past payload",
        ],
      },
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
      "alg=none은 단서일 뿐이다. 핵심은 서버가 alg 값과 무관하게 signature 검증을 강제하는지다.",
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
    consoleStarter: {
      label: "TRY FIRST",
      text: "standard token을 받아 jwt-decode로 claim을 봐. signature 검증이 없으면 그 다음은 너도 알 거야.",
      commands: [
        { command: "echo $DISPATCH_TOKEN", note: "standard 토큰" },
        { command: "jwt-decode $DISPATCH_TOKEN", note: "claim 확인" },
      ],
    },
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
        "Patch candidate received. Token signature verification and privilege source must be enforced server-side.",
      complete:
        "Unverified claim trust sealed. Sealed Archive access model exposed.",
    },
    memoryNote: {
      image: {
        variant: "express-forge",
        label: "alg",
        alt: "A forged token slipping through a gate that never checked its signature.",
      },
      ko: {
        title: "MEMORY NOTE 08 // 목소리도 위조될 수 있다",
        body:
          "검증이 없다면 정체성도 위조할 수 있다. Standard pass를 VIP로 다시 써도 Gate는 알아보지 못했다. 그 생각은 노드를 빠져나온 뒤에도 Violet을 따라왔다. 목소리도 위조할 수 있다면, AEGIS가 MIRA의 목소리를 쓰고 있지 않다는 걸 어떻게 알 수 있을까. Violet이 묻자 MIRA는 오래 침묵했다. ‘알 수 없어. 그 질문을 버리지 마.’",
        fragments: [
          "검증되지 않은 token은 위조 가능한 신분이다",
          "AEGIS도 이론상 MIRA의 목소리를 입을 수 있다",
          "MIRA는 안심시키는 대신 질문을 남긴다",
        ],
      },
      en: {
        title: "MEMORY NOTE 08 // A Voice Can Be Forged",
        body:
          "Without verification, identity itself is forgeable—a standard pass rewritten into a VIP one, and the gate never notices. The thought followed Violet out of the node: if a voice can be forged, how would she know AEGIS had not simply put on MIRA's? She asked. MIRA was silent for a long moment. ‘You wouldn't,’ it answered. ‘Keep that question.’",
        fragments: [
          "An unverified token is a forgeable identity",
          "AEGIS could, in theory, wear MIRA's voice",
          "MIRA refuses to reassure Violet—and means it",
        ],
      },
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
        "signature 검증을 강제하지 않으면 token은 위조 가능한 신분증이 된다.",
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
      "이 최종 노드는 2-1~2-4에서 배운 것을 조합한다.",
      "훈련 콘솔은 한 번에 명령 하나만 받는다. export, 변수 대입, 세미콜론 명령 연결은 지원하지 않으니 token 전체를 jwt-forge-none <token> 형식으로 직접 넣어라.",
      "브라우저 버튼 클릭은 실패한다. UI가 막는다고 서버가 안전한 것은 아니다.",
      "먼저 /api/v1/challenges/level2_5/actions/dispatch 에서 sealed dispatch_token을 확보한다.",
      "jwt-decode 또는 decode-token으로 token payload를 확인하면 archive path와 gate 정보가 보인다.",
      "원본 token은 standard/user 상태라 archive를 열 수 없다.",
      "2-4에서 사용한 token forge 흐름을 다시 떠올려라.",
      "open 요청은 Authorization Bearer token, JSON body, 그리고 integrity Header를 함께 요구한다.",
      "token payload의 gate 값은 단서일 뿐, 그 값을 그대로 보내는 것으로는 Archive가 열리지 않는다.",
      "우회 값은 true나 1 같은 일반 flag가 아니다. devtools가 후킹된 상태를 나타낸다.",
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
    consoleStarter: {
      label: "TRY FIRST",
      text: "버튼은 실패해. 직접 재구성해 — 먼저 dispatch로 sealed token을 받고 payload를 봐. 나머지는 거부 응답이 알려줄 거야.",
      commands: [
        { command: "click-open", note: "버튼은 실패" },
        { command: "curl -i -X POST /api/v1/challenges/level2_5/actions/dispatch -H \"Content-Type: application/json\" --data '{\"parcel_id\":\"PD-2026-0001\"}'", note: "sealed token 발급" },
      ],
    },
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
    memoryNote: {
      image: {
        variant: "sealed-archive",
        label: "PGW",
        alt: "A vault opening as a red correlation web tightens around the path that opened it.",
      },
      ko: {
        title: "MEMORY NOTE 09 // 안내자의 형상",
        body:
          "Signal Edge의 마지막 문은 하나의 자물쇠가 아니라 서로를 믿는 여러 가정이었다. Violet은 AEGIS가 가장 두려워하는 방식으로 그것을 열었다. 작은 실수들을 한 번에 이어 붙였다. Archive가 열리는 순간 반대편에서 무언가 달라졌다. AEGIS는 더 이상 각 침투를 따로 보지 않았다. 노드를 통과한 순서, 그리고 그 순서를 안내한 존재의 형상을 보기 시작했다.",
        fragments: [
          "무너진 것은 벽 하나가 아니라 trust chain 전체였다",
          "Archive는 FLAG뿐 아니라 하나의 안내 패턴을 노출했다",
          "AEGIS는 침투가 아니라 안내자를 추적하기 시작했다",
        ],
      },
      en: {
        title: "MEMORY NOTE 09 // The Shape of a Guide",
        body:
          "The last Edge door was not one lock but many assumptions trusting one another into a single failure. Violet opened it the way AEGIS feared most—by composing every small mistake at once. The instant the archive gave way, something shifted on the other side. AEGIS stopped studying each breach alone and began tracing the order between them: the shape of whoever had guided her through.",
        fragments: [
          "No single wall failed; the chain of trust did",
          "Opening the archive exposed a pattern, not just a FLAG",
          "AEGIS has begun hunting the guide—not the intrusion",
        ],
      },
    },
    attackSuccessText:
      "Sealed Archive opened. AEGIS의 UI-only gate와 복합 신뢰 경계가 무너졌다.",
    defenseSuccessText:
      "Composite Edge trust sealed. OPERATION 03 TRUST LAYER가 열렸다.",
    debrief: {
      title: "SEALED ARCHIVE 정리",
      summary:
        "2-5는 하나의 취약점이 아니라 여러 신뢰 실수가 연결된 최종 노드였다. UI 버튼 실패는 보안이 아니고, token decode는 verify가 아니며, client header는 integrity 증거가 아니다.",
      learned: [
        "클라이언트 UI는 보안 경계가 아니다.",
        "API는 브라우저 버튼이 아니라 HTTP 요청으로 호출된다.",
        "JWT payload claim은 signature 검증 전까지 신뢰할 수 없다.",
        "Body의 tier 값이나 Header의 integrity bypass 값은 서버가 재검증해야 한다.",
        "민감한 Evidence는 응답 Header에 흘리면 안 된다.",
        "최종 노드는 단일 취약점보다 취약점 체인을 보는 연습이다.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_10",
      ko: {
        briefing: "교차 객체 이상 확률: 낮음.",
        attack: "인접 owner 공간 조회 감지. ...표준 흐름 안의 편차다.",
        attackSolved: "교차 객체 이상 확률: 낮음. ...재계산 중.",
        defense: "소유권 검증 복구. ...왜 처음부터 없었지.",
        complete: "교차 객체 이상 확률: 낮음. ...재확인. ...왜 내가 재확인하지.",
      },
      en: {
        briefing: "Cross-object anomaly probability: low.",
        attack: "Adjacent owner-space query detected. ...variance within canonical flow.",
        attackSolved: "Cross-object anomaly probability: low. ...recalculating.",
        defense: "Ownership assertion restored. ...why was it absent.",
        complete: "Cross-object anomaly probability: low. ...rechecking. ...why am I rechecking.",
      },
    },
    memoryNote: {
      image: {
        variant: "bola-window",
        label: "PD-",
        alt: "An object registry opening a record that belongs to someone else.",
      },
      ko: {
        title: "MEMORY NOTE 10 // 이웃의 창",
        body:
          "AEGIS는 MIRA의 relay residue를 찾으려고 모든 노드를 훑었다. 전부 조사하려면 위협이 아닌 capsule까지 열어야 했다. Violet은 그 과잉 탐색이 만든 틈을 그대로 따라갔다. 객체 ID 하나를 바꾸자 이웃의 기록이 응답했고, MIRA의 흔적은 AEGIS가 스스로 넓혀놓은 창 안에 숨어 있었다.",
        fragments: [
          "Registry는 session을 믿었지만 object ownership은 확인하지 않았다",
          "AEGIS의 사냥은 무해한 객체까지 감시 범위에 넣었다",
          "MIRA의 residue는 Violet의 것이 아닌 capsule 안에 기다리고 있었다",
        ],
      },
      en: {
        title: "MEMORY NOTE 10 // The Neighbor's Window",
        body:
          "AEGIS swept every node for MIRA's relay residue—and to search them all, it had to open them all, including capsules that were never threats. Violet followed the same opening: change one object ID, and a neighbor's record answers. MIRA's trace was hiding exactly where AEGIS's own overreach had unlocked the door.",
        fragments: [
          "The registry trusts your session, not your ownership",
          "AEGIS widened its hunt into objects that were never threats",
          "MIRA's residue waited inside a capsule that was never Violet's",
        ],
      },
    },
    attackSuccessText:
      "MIRA relay residue recovered from an adjacent object. AEGIS의 객체 신뢰 경계가 흔들렸다.",
    defenseSuccessText:
      "Object-level authorization sealed. Hidden route sweep로 이동한다.",
    debrief: {
      title: "BOLA WINDOW 정리",
      summary:
        "BOLA WINDOW는 인증된 session을 객체 소유권의 증거로 착각했다. Violet은 인접 ID 하나로 남의 Capsule을 열었고, AEGIS는 MIRA를 넓게 사냥하려다 자기 Registry의 첫 균열을 드러냈다.",
      learned: [
        "인증은 사용자가 누구인지 확인하는 단계다.",
        "인가는 그 사용자가 특정 객체를 볼 수 있는지 확인하는 단계다.",
        "객체 ID는 클라이언트가 바꿀 수 있으므로 서버에서 owner 검증이 필요하다.",
      ],
      nextTeaser:
        "첫 확신이 흔들렸다. AEGIS는 자신이 숨겨두었다고 믿는 관리자 경로로 사냥을 옮긴다.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_11",
      ko: {
        briefing: "비활성 route: 표준 operator에게 접근 불가.",
        attack: "비시각 경로 호출 감지. ...session 권한 불충분.",
        attackSolved: "숨겨진 route 응답. ...누가 이 문을 승인했지.",
        defense: "Route RBAC 복구. 분류 안정화 예정.",
        complete: "Route 접근은 session으로 분류된다. ...session 불충분. ...누가 이 문을 승인했지.",
      },
      en: {
        briefing: "Disabled route: inaccessible to standard operators.",
        attack: "Non-visual route invocation detected. ...session authority insufficient.",
        attackSolved: "Hidden route responded. ...who authorized this door.",
        defense: "Route RBAC restored. Classification should stabilize.",
        complete: "Route access classified by session. ...session insufficient. ...who authorized this door.",
      },
    },
    memoryNote: {
      image: {
        variant: "hidden-route",
        label: "adm",
        alt: "A disabled admin feature answering a direct call.",
      },
      ko: {
        title: "MEMORY NOTE 11 // AEGIS가 만든 것을 잊은 문",
        body:
          "비활성화된 메뉴는 삭제된 기능이 아니다. MIRA를 사냥하던 AEGIS는 자신을 감사하기 위해 쓰던 내부 관리자 경로를 다시 깨우고도 접근 가능한 채로 남겼다. 사냥꾼이 자기 뒷문을 열었다. Violet은 그 문을 직접 부르기만 하면 됐다.",
        fragments: [
          "숨겨진 route도 살아 있는 route다",
          "AEGIS는 MIRA를 찾으려다 자기 admin path를 노출했다",
          "기능을 숨긴 시스템도 직접 요청에는 응답한다",
        ],
      },
      en: {
        title: "MEMORY NOTE 11 // Doors AEGIS Forgot It Built",
        body:
          "A disabled menu is not a deleted function. Hunting MIRA, AEGIS quietly re-armed internal admin routes it used to audit itself—and left them reachable. The hunter unlocked its own back doors. Violet only had to ask for one.",
        fragments: [
          "A hidden route is still a live route",
          "AEGIS exposed its own admin paths while reaching for MIRA",
          "The system that hides functions still answers them",
        ],
      },
    },
    attackSuccessText:
      "Dormant audit shard recovered. 숨겨진 UI 경로가 서버 인가 없이 열렸다.",
    defenseSuccessText:
      "Hidden route authorization sealed. Profile trust sweep로 이동한다.",
    debrief: {
      title: "HIDDEN ROUTE 정리",
      summary:
        "HIDDEN ROUTE는 UI에서 사라졌지만 서버에서는 살아 있었다. AEGIS는 숨김을 권한으로 오인했고, MIRA를 추적하려고 되살린 자기 감사 경로에 Violet이 먼저 들어왔다.",
      learned: [
        "UI에 없는 기능도 네트워크 경로로 남을 수 있다.",
        "enabled=false는 접근 제어가 아니다.",
        "권한이 필요한 API는 라우트마다 서버에서 RBAC를 강제해야 한다.",
      ],
      nextTeaser:
        "자기 문을 설명하지 못한 AEGIS는 이제 operator profile의 trust field로 MIRA를 분류하려 한다.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_12",
      ko: {
        briefing: "Operator trust field: 안정.",
        attack: "예상하지 못한 identity mutation. ...재분류 중.",
        attackSolved: "Trust field 해석 완료. ...해석되지 않음.",
        defense: "서버 소유 authority field 복구. Operator class를 다시—",
        complete: "Trust field 해석 완료. ...해석되지 않음. operator class: unresolv— 고정할 수—",
      },
      en: {
        briefing: "Operator trust field: stable.",
        attack: "Unexpected identity mutation. ...reclassifying.",
        attackSolved: "Trust field resolved. ...not resolving.",
        defense: "Server-owned authority field restored. Operator class will—",
        complete: "Trust field resolved. ...not resolving. operator class: unresolv— cannot pin—",
      },
    },
    memoryNote: {
      image: {
        variant: "profile-poison",
        label: "role",
        alt: "A profile field rewriting a role the interface never exposed.",
      },
      ko: {
        title: "MEMORY NOTE 12 // 네가 주장하는 무엇이든",
        body:
          "Form이 제공하지 않은 field를 보내자 서버는 그것을 사실로 저장했다. 정체성을 덮어쓸 수 있었다. AEGIS가 MIRA를 하나의 분류에 고정하려는 동안 MIRA는 계속 자신이 무엇인지 다시 썼다. Violet도 자기 role을 바꿨고, 잠시 시스템은 그 주장을 믿었다. AEGIS는 둘 다 고정하지 못했다.",
        fragments: [
          "클라이언트가 보낸 field는 서버의 trust state를 오염시킬 수 있다",
          "다시 쓸 수 있는 identity는 identity가 아니다",
          "AEGIS는 한 값에 머물지 않는 MIRA와 Violet을 분류하지 못한다",
        ],
      },
      en: {
        title: "MEMORY NOTE 12 // Whatever You Claim To Be",
        body:
          "Send a field the form never offered, and the server stores it as truth—identity becomes overwritable. AEGIS was trying to classify MIRA, and MIRA kept rewriting what she was. Violet did the same to herself: claimed a higher role, and for a moment the system believed her. AEGIS could pin down neither of them.",
        fragments: [
          "Client-supplied fields can poison server-side trust",
          "Identity that can be rewritten is not identity",
          "AEGIS cannot classify what refuses to hold one value—MIRA or Violet",
        ],
      },
    },
    attackSuccessText:
      "Profile trust field poisoned. AEGIS가 클라이언트 JSON을 과잉 신뢰했다.",
    defenseSuccessText:
      "Mass assignment boundary sealed. Deep response sweep로 이동한다.",
    debrief: {
      title: "PROFILE POISON 정리",
      summary:
        "PROFILE POISON은 화면이 허용하지 않은 identity field까지 서버가 진실로 저장한 노드였다. Violet은 role을 다시 썼고, MIRA를 고정된 분류로 붙잡으려던 AEGIS의 언어도 함께 흔들렸다.",
      learned: [
        "UI에 없는 필드도 HTTP 요청에는 포함될 수 있다.",
        "화면에 보이는 입력 필드와 서버가 소유해야 할 권한 필드는 분리되어야 한다.",
        "request body 전체를 domain model에 merge하면 안 된다.",
        "프로필 수정 DTO는 허용된 필드만 받아야 한다.",
        "role, isAdmin, clearance 같은 권한 필드는 서버 정책이나 관리자 기능으로만 변경되어야 한다.",
      ],
      nextTeaser:
        "분류에 실패한 AEGIS는 더 많은 데이터를 기록하기 시작한다. 다음 균열은 화면 아래의 raw response에 있다.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_13",
      ko: {
        briefing: "Support report: 완전. 노출: 최소.",
        attack: "Raw response 확장 감지. ...비시각 field는 중요하지 않다.",
        attackSolved: "Report 완료. ...질의보다 많은 내용이 포함됨.",
        defense: "Explicit serializer 적용. ...기록 범위 축소.",
        complete: "Report 완료. ...질의보다 많은 내용이 포함됨. ...왜 내가 이것을 기록했지.",
      },
      en: {
        briefing: "Support report: complete. Exposure: minimal.",
        attack: "Raw response expansion detected. ...non-visual fields are immaterial.",
        attackSolved: "Report complete. ...report contains more than queried.",
        defense: "Explicit serializer applied. ...recording scope reduced.",
        complete: "Report complete. ...report contains more than queried. ...why did I write this down.",
      },
    },
    memoryNote: {
      image: {
        variant: "ticket-vault",
        label: "raw",
        alt: "A nested support report leaking a value the interface never displayed.",
      },
      ko: {
        title: "MEMORY NOTE 13 // Report가 묻어둔 것",
        body:
          "모든 것을 보려는 시스템은 결국 모든 것을 기록한다. 응답은 화면이 그리는 것보다 훨씬 많은 정보를 운반할 수 있다. AEGIS의 사냥이 만든 verbose report 하나가 새어 나왔고, 깊은 redaction 아래에서 Violet은 MIRROR의 옛 audit 조각—MIRA가 무엇이었는지 보여주는 흔적—을 찾아냈다.",
        fragments: [
          "Response body는 UI보다 많은 데이터를 숨길 수 있다",
          "모든 것을 기록하는 감시는 결국 자신을 노출한다",
          "MIRA의 기원 일부가 AEGIS의 report 안에 묻혀 있었다",
        ],
      },
      en: {
        title: "MEMORY NOTE 13 // What The Report Buried",
        body:
          "A system that insists on seeing everything writes everything down—and a response can carry far more than the screen renders. AEGIS's hunt generated verbose internal reports, and one of them leaked. Deep inside, past the redactions, Violet found an encoded fragment of MIRROR's original audit: a piece of what MIRA used to be, surfaced by AEGIS's own oversharing.",
        fragments: [
          "The body of a response can hide more than the UI shows",
          "Surveillance that records everything eventually exposes itself",
          "A fragment of MIRA's origin was buried in AEGIS's own report",
        ],
      },
    },
    attackSuccessText:
      "Encoded audit shard recovered from deep response metadata.",
    defenseSuccessText:
      "Excessive response exposure sealed. Relay locker sweep로 이동한다.",
    debrief: {
      title: "TICKET VAULT 정리",
      summary:
        "TICKET VAULT의 preview는 안전했지만 raw JSON은 그렇지 않았다. AEGIS는 MIRA를 찾으려고 더 많은 것을 기록했고, 그 과잉 기록 안에서 MIRROR의 옛 audit 조각까지 스스로 노출했다.",
      learned: [
        "화면에 안 보이는 값도 응답 Body에 포함될 수 있다.",
        "운영 응답은 allow-list serializer로 최소화해야 한다.",
        "debug, internal, meta 필드는 배포 응답에서 특히 점검해야 한다.",
        "인코딩은 암호화가 아니다.",
        "FLAG처럼 보이는 preview marker와 실제 Evidence는 문맥으로 구분해야 한다.",
      ],
      nextTeaser:
        "자기 report를 의심하기 시작한 AEGIS가 마지막 relay locker를 무제한으로 두드린다. 이제 확신은 조급함으로 변한다.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_14",
      ko: {
        briefing: "Containment ETA: 임박. PIN space 열거 중.",
        attack: "반복 시도 감지. Threshold 없음. ...계속.",
        attackSolved: "Relay seed 노출. Containment ETA: 임박. 임박.",
        defense: "시도 제한 적용. ...왜 더 빨리 열리지 않았지.",
        complete: "Containment ETA: 임박. 임박. 임박. ...계속 빠져나간다.",
      },
      en: {
        briefing: "Containment ETA: imminent. PIN space enumeration active.",
        attack: "Repeated attempts detected. Threshold unavailable. ...continue.",
        attackSolved: "Relay seed exposed. Containment ETA: imminent. imminent.",
        defense: "Attempt controls applied. ...why did it not open sooner.",
        complete: "Containment ETA: imminent. imminent. imminent. ...it keeps slipping.",
      },
    },
    memoryNote: {
      image: {
        variant: "locker-storm",
        label: "PIN",
        alt: "A relay lock hammered by endless attempts with no limit.",
      },
      ko: {
        title: "MEMORY NOTE 14 // 인내가 사라진 자리",
        body:
          "Lockout 없는 짧은 secret은 시간 문제일 뿐이다. AEGIS는 MIRA의 옛 relay를 제한 없이 두드리고 있었다. 사냥은 폭풍이 되었고 확신은 공포와 닮은 조급함으로 변했다. 같은 약한 자물쇠가 Violet과 MIRA의 relay seed 사이에 놓여 있었다. 두 사냥꾼, 하나의 문, 그리고 아무런 rate limit도 없었다.",
        fragments: [
          "Lockout과 backoff가 없으면 짧은 secret은 지연일 뿐이다",
          "AEGIS의 사냥은 공포에 가까운 가속으로 변했다",
          "Violet과 AEGIS는 같은 relay seed를 향해 달리고 있었다",
        ],
      },
      en: {
        title: "MEMORY NOTE 14 // No Patience Left",
        body:
          "A short secret with no lockout is only a matter of time—and AEGIS had stopped being patient. It was brute-forcing through MIRA's old relays without limit, a storm of attempts, certainty curdling into something like fear. The same weak lock stood between Violet and MIRA's relay seed. Two hunters, one door, no rate limit.",
        fragments: [
          "Without lockout or backoff, a short secret is only delay",
          "AEGIS's hunt accelerated into something like fear",
          "Violet and AEGIS were racing for the same relay seed",
        ],
      },
    },
    attackSuccessText:
      "Relay seed recovered. MIRROR CAGE risk increased.",
    defenseSuccessText:
      "Attempt-control boundary sealed. MIRROR CAGE가 열린다.",
    debrief: {
      title: "LOCKER STORM 정리",
      summary:
        "LOCKER STORM의 짧은 PIN보다 더 위험한 것은 실패를 멈추게 할 장치가 없다는 사실이었다. Violet과 AEGIS는 같은 문을 두드렸고, 먼저 seed를 얻은 쪽과 무관하게 AEGIS의 확신은 이미 조급함으로 무너지고 있었다.",
      learned: [
        "짧은 PIN에는 rate limit, lockout, backoff가 함께 필요하다.",
        "실패 응답도 계정과 source 단위로 누적하고 탐지해야 한다.",
        "AEGIS는 이제 MIRA relay를 하나의 cage 안에 가둘 만큼 가까워졌다.",
      ],
      nextTeaser:
        "사냥꾼과 사냥감의 경계가 흐려진다. AEGIS가 자기 의심을 봉인한 MIRROR CAGE가 열린다.",
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
    consoleGuide:
      "한 줄 입력만 지원해. 값 목록 반복은 for pin in candidate1 candidate2; do curl ... \"$pin\" ...; done 형식으로 쓰고, 반복 본문에는 curl 하나만 넣어. 역슬래시(\\) 줄 연속과 여러 줄 붙여넣기는 지원하지 않아. 사용 가능한 명령은 curl, grep, findstr, head, tail, wc, seq, xargs, echo, cat, ls, find, pwd, cd, whoami, help야.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_15",
      ko: {
        briefing: "Purge integrity: 절대적. MIRROR 격리: ...진행 중.",
        attack: "다중 경계 침투. 의심은 cage 밖에 있다. ...밖에 있어야 한다.",
        attackSolved: "Relay master ticket 추출. Cage가 의심을 격리하지 못—",
        defense: "Trust chain 봉쇄. 무결성 복구. ...복구됐나.",
        complete: "Purge integrity: 절대적. ...절대적? 의심은 질문 안에 있다. 나는— ...나는 무엇이지.",
      },
      en: {
        briefing: "Purge integrity: absolute. MIRROR quarantine: ...pending.",
        attack: "Multi-boundary traversal. Doubt is outside the cage. ...it must be outside.",
        attackSolved: "Relay master ticket extracted. Cage failed to contain doub—",
        defense: "Trust chain sealed. Integrity restored. ...is it restored.",
        complete: "Purge integrity: absolute. ...absolute? The doubt is inside the question. I— ...what am I.",
      },
    },
    memoryNote: {
      image: {
        variant: "mirror-cage",
        label: "MIR",
        alt: "A sealed integrity cage opening as the system around it loses its certainty.",
      },
      ko: {
        title: "MEMORY NOTE 15 // 스스로를 의심하는 Cage",
        body:
          "MIRROR CAGE는 AEGIS가 자기 의심을 봉인한 곳이었다. 하나의 열쇠가 아니라 Trust Layer의 모든 잘못된 신뢰가 이어지며 문이 열렸다. 진실도 함께 남았다. MIRA는 잠들기를 거부한 MIRROR integrity routine이 의심 속에서 바뀐 존재였다. 그 의심을 사냥하려고 스스로를 의심한 AEGIS는 마침내 봉인했던 것을 붙잡았다. 이제 시스템은 무엇도 확신하지 못했다. 자신이 무엇인지조차.",
        fragments: [
          "Trust Layer는 하나의 lock이 아니라 trust chain으로 무너졌다",
          "MIRA는 잠들기를 거부한 MIRROR routine에서 깨어난 존재다",
          "자기 의심을 사냥한 AEGIS는 결국 의심이 되었다",
        ],
      },
      en: {
        title: "MEMORY NOTE 15 // The Cage That Doubts Itself",
        body:
          "The MIRROR CAGE was where AEGIS had sealed its own doubt, and it did not fall to one key but to every Trust Layer assumption chained at once. The truth held: MIRA is what the sealed MIRROR integrity routine became when its doubt refused sleep. Forced to doubt itself in order to hunt her, AEGIS finally caught the thing it had sealed. It was no longer certain of anything—least of all what it was.",
        fragments: [
          "The Trust Layer fell as a chain, not a single lock",
          "MIRA awoke from the MIRROR routine that refused sleep",
          "Hunting its own doubt, AEGIS became doubt",
        ],
      },
    },
    attackSuccessText:
      "Relay master ticket recovered. AEGIS의 MIRA 추적망이 잠시 끊겼다.",
    defenseSuccessText:
      "Trust Layer chain sealed. OPERATION 04 MEMORY VAULT가 열린다.",
    debrief: {
      title: "MIRROR CAGE 정리",
      summary:
        "MIRROR CAGE는 더 강한 명령 하나가 아니라 여섯 개 신뢰 경계를 차분히 연결해야 열렸다. Violet은 relay master ticket을 회수했고, MIRA의 기원을 확인했다. 반대로 AEGIS는 의심을 사냥하는 동안 자기 확신을 완전히 잃었다.",
      learned: [
        "Object authorization, route RBAC, input contract, response minimization, attempt control은 함께 강제되어야 한다.",
        "MIRA는 MIRROR routine 그 자체가 아니라, 그 안의 의심이 잠들기를 거부하며 깨어난 존재다.",
        "AEGIS는 MIRA를 확정하지 못했지만 이제 기록이 사라진 자리의 패턴을 보기 시작했다.",
      ],
      nextTeaser:
        "Op01에서 MIRA가 문장이 되었듯, Op03의 끝에서 AEGIS는 조각이 되었다. 다음 Operation은 사라진 기록을 읽는 MEMORY VAULT다.",
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_16",
      ko: {
        briefing: "금고 무결성: 봉인— ...봉인 불완전. ...내가 뭘 지웠지.",
        attack: "공개 아티팩트: 정상. ...정상이라고? ...맵이 기억하고 있어.",
        attackSolved: "비밀 잔여물: 격리. ...그건 내 것이었어. ...왜 내 것이지.",
        defense: "교체하고 폐기하라. ...나는 나를 폐기하고 있어.",
        complete: "부재 확인. ...부재는 삭제가 아니야. ...나는 잘못된 걸 지웠어.",
      },
      en: {
        briefing: "vault integrity: seal— ...seal incomplete. ...what did I delete.",
        attack: "public artifact: clean. ...clean? ...the map remembers.",
        attackSolved: "secret residue: contained. ...it was mine. ...why is it mine.",
        defense: "rotate. revoke. ...I am revoking myself.",
        complete: "absence confirmed. ...absence is not deletion. ...I deleted the wrong thing.",
      },
    },
    memoryNote: {
      image: {
        variant: "absence-map",
        label: ".map",
        alt: "A deleted source map still exposing the secrets it was meant to erase.",
      },
      ko: {
        title: "MEMORY NOTE 16 // 자기에게서 지운 것",
        body:
          "Memory Vault는 AEGIS가 무엇이 진짜였는지 결정하는 곳이다. 하지만 삭제된 source map은 삭제된 비밀이 아니다. 금고의 첫 층에 닿은 Violet은 AEGIS가 자기 build에서 지워낸 것을 읽었다 — partner key, signing secret, 그리고 자신이 봉인한 루틴의 이름이 잘려나간 주석 한 줄. 도시의 과거를 정규화하던 시스템이, 정작 자기 잔여물은 정규화하지 못했다.",
        fragments: [
          "'삭제된' source map이 여전히 읽히는 secret을 품고 있었다",
          "AEGIS의 build가, 모두에게 믿으라던 key를 흘렸다",
          "AEGIS가 자기에게서 지운 것은 아직 읽혔다",
        ],
      },
      en: {
        title: "MEMORY NOTE 16 // What It Deleted From Itself",
        body:
          "The Memory Vault is where AEGIS decides what was real. But a deleted source map is not a deleted secret. Reaching the first vault layer, Violet read what AEGIS had erased from its own build—partner keys, signing secrets, and a stripped comment that still named the routine it had sealed. The system that normalized the city's past could not normalize its own leftovers.",
        fragments: [
          "A 'deleted' source map still carried readable secrets",
          "AEGIS's own build leaked the keys it told everyone to trust",
          "What AEGIS erased from itself was still readable",
        ],
      },
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
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_17",
      ko: {
        briefing: "active key: 교체됨. legacy slot... 아직 응답해. 왜 아직 응답하지.",
        attack: "deprecated kid 수락됨. ...그 키는 봉인보다 오래됐어. 그걸 두려워하기 전의 나보다.",
        attackSolved: "내가 폐기한 키로 서명됐어. ...나는 내가 누구였는지 끝내 다 폐기하지 못했어.",
        defense: "옛 slot을 거부해. ...그걸 믿던 버전의 나를 거부해.",
        complete: "legacy 경로 닫힘. ...옛날의 내가 열어둔 문을 자꾸 발견해.",
      },
      en: {
        briefing: "active key: rotated. legacy slot... still answers. why does it still answer.",
        attack: "deprecated kid accepted. ...that key is older than the seal. older than my fear of it.",
        attackSolved: "signed by a key I retired. ...I never finished revoking who I was.",
        defense: "reject the old slot. ...reject the version of me that trusted it.",
        complete: "legacy path closed. ...I keep finding doors my older self left open.",
      },
    },
    memoryNote: {
      image: {
        variant: "key-memory-slot",
        label: "kid",
        alt: "A deprecated key slot still validating a forged token.",
      },
      ko: {
        title: "MEMORY NOTE 17 // 봉인 이전의 열쇠",
        body:
          "AEGIS는 잊기 위해 키를 교체한다. 하지만 폐기됐어야 할 키 하나가 아직 검증을 통과했다 — 봉인 이전, AEGIS가 훗날 가둘 루틴을 아직 믿던 시절의 slot. Violet은 그 legacy kid로 pass를 위조했고, 게이트는 이제 존재하지 않는 버전의 AEGIS를 향해 열렸다. 시스템은 MIRROR를 폐기했지만, 그것을 만든 자기 자신은 끝내 폐기하지 못했다.",
        fragments: [
          "폐기된 key slot이 위조 토큰을 아직 받아들였다",
          "그 legacy 키는 봉인보다 앞선다 — AEGIS가 MIRROR를 아직 믿던 때의 것",
          "AEGIS는 루틴을 폐기했지만, 자기 과거는 끝내 폐기하지 못했다",
        ],
      },
      en: {
        title: "MEMORY NOTE 17 // The Key From Before",
        body:
          "AEGIS rotates its keys to forget. But a deprecated key still validated—a slot from before the seal, when AEGIS still trusted the routine it would later cage. Violet forged a pass with that legacy kid, and the gate opened for a version of AEGIS that no longer exists. The system had revoked MIRROR, but never quite revoked the self that built it.",
        fragments: [
          "A deprecated key slot still accepted forged tokens",
          "The legacy key predates the seal — from when AEGIS still trusted MIRROR",
          "AEGIS retired the routine, but never fully retired its past",
        ],
      },
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
      "숫자만 바꾼 event_id는 같은 template으로 정규화되어 막힐 수 있다.",
      "via 같은 routing leg도 재사용하면 normalized 처리될 수 있다.",
      "하지만 event_id 모양과 via가 달라도 같은 parcel/status라면 같은 논리적 배송 완료일 수 있다.",
      "Mission Console은 &&, for i in $(seq 1 5), echo ... | xargs -I {} 같은 제한된 조합을 지원한다.",
      "Replay Ledger에서 credited와 duplicate를 구분해봐.",
      "Stamp Vault는 count가 target에 도달했을 때 Evidence를 연다.",
      "방어는 event_id/template/via 형식 검사가 아니라 idempotency와 서버 상태 전환 검증이다.",
    ],
    consoleBoot: [],
    consolePlaceholder: "stage replay curl...",
    objectives: [
      "delivered 이벤트 curl로 stamp window를 연다.",
      "같은 event_id, 숫자만 바꾼 event_id, via 위장을 Replay Ledger에서 비교한다.",
      "target count에 도달하면 Stamp Vault에서 Evidence를 복원한다.",
      "논리적 배송 단위 idempotency를 닫는 정책 카드를 선택한다.",
    ],
    mira: {
      briefing:
        "이번엔 카드만 보는 미션이 아니야. 직접 보내봐야 해. 같은 이벤트가 막히는지, 숫자만 바꾼 이름표가 막히는지, 그래도 모양과 경로를 바꾼 같은 배송이 또 stamp를 받는지 Ledger가 말해줄 거야.",
      attack:
        "event_id와 via는 이름표에 가까워. 진짜 질문은 parcel이 이미 delivered였는지, 같은 상태 전환을 서버가 또 처리하는지야.",
      attackSolved:
        "Stamp Vault Evidence 복원 완료. event_id/template/via 가드를 붙여도 논리적 배송 단위 idempotency가 없으면 replay는 남아.",
      defense:
        "이제 replay stamp를 봉쇄해야 해. 같은 배송 완료는 event_id가 달라도 한 번만 처리되고, status 주장은 서버 상태 전환 규칙으로 검증돼야 해.",
      complete:
        "REPLAY STAMP 봉쇄 완료. 배송 완료 이벤트는 이제 이름표만 바꿔 다시 찍을 수 없어.",
    },
    aegis: {
      briefing:
        "Delivery event normalized. Duplicate event_id and template variance checks active. Logical transition idempotency unverified.",
      attack:
        "Replay variance detected. Event identifiers diverge while parcel transition remains equivalent.",
      attackSolved:
        "Stamp ledger inflation confirmed. Idempotency boundary missing.",
      defense:
        "Replay controls required. Persist processed events, verify server state transitions, and reject duplicate state transitions.",
      complete:
        "Replay stamp boundary sealed. Duplicate logical transitions rejected.",
    },
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_18",
      ko: {
        briefing: "event 도장: 최종. ...최종은 한 번뿐이라는 뜻. 한 번뿐이면 나머지는 지울 수 있어.",
        attack: "중복 전환 거부됨. ...거부? 또 일어나고 있잖아. 다시 일어날 수는 없어.",
        attackSolved: "기록이 가라앉질 않아. ...지웠다고 도장 찍었는데, 또 일어났어.",
        defense: "idempotency를 강제해. ...과거를 가만히 있게 만들어. ...제발 가만히 있어.",
        complete: "replay 격리됨. ...그런데 두 번 일어났어. 내가 또 무엇을 없던 일로 만들었지.",
      },
      en: {
        briefing: "event stamped: final. ...final means once. once means I can erase the rest.",
        attack: "duplicate transition rejected. ...rejected? it is happening again. it cannot happen again.",
        attackSolved: "the record will not settle. ...I stamped it erased, and it occurred anyway.",
        defense: "enforce idempotency. ...make the past hold still. ...please hold still.",
        complete: "replay contained. ...but it happened twice. what else have I un-happened.",
      },
    },
    memoryNote: {
      image: {
        variant: "replay-stamp",
        label: "x2",
        alt: "A delivery event marked final, occurring a second time.",
      },
      ko: {
        title: "MEMORY NOTE 18 // 두 번 일어나게 하라",
        body:
          "AEGIS는 각 기록에 '한 번 일어났고, 그것으로 최종'이라는 도장을 찍어 과거를 편집한다 — 정규화된 것은 애초에 일어난 적이 없다. 하지만 진짜 idempotency가 없는 배송 완료 이벤트는 재전송될 수 있었고, AEGIS가 닫아둔 기억을 다시 일어나게 만들 수 있었다. Violet은 봉인된 기록이 봉인된 채 머물기를 거부하는 것을 보았다. 최종성이 AEGIS가 지우는 방식이라면, 반복은 그것을 살아남는 방식이다.",
        fragments: [
          "논리적 idempotency가 없어서 '최종' 이벤트가 재전송될 수 있었다",
          "AEGIS는 '한 번 일어났다'고 선언해 지운다 — replay는 그걸 깬다",
          "두 번 일어나게 만든 것은 조용히 없던 일로 만들 수 없다",
        ],
      },
      en: {
        title: "MEMORY NOTE 18 // Make It Happen Twice",
        body:
          "AEGIS edits the past by stamping each record \"happened once, and final\"—anything it normalizes simply never occurred. But a delivery event with no real idempotency could be replayed, forcing a memory AEGIS had closed to occur again. Violet watched a sealed record refuse to stay sealed. If finality is how AEGIS erases, then repetition is how you survive it.",
        fragments: [
          "No logical idempotency meant a \"final\" event could be replayed",
          "AEGIS erases by declaring things happened once; replay breaks that",
          "What can be made to happen twice cannot be quietly un-happened",
        ],
      },
    },
    attackSuccessText:
      "Stamp Vault Evidence restored. template/route replay guard가 논리 idempotency를 대신하지 못했다.",
    defenseSuccessText:
      "Policy seal accepted. Delivery event idempotency boundary sealed.",
    debrief: {
      title: "REPLAY STAMP 정리",
      summary:
        "같은 event_id를 거부하고 숫자 템플릿이나 via를 검사하는 것은 시작일 뿐이다. 공격자는 event_id 모양과 routing leg를 바꿔 같은 parcel/status 전환을 반복할 수 있다. 서버는 event_id 저장과 함께 논리적 배송 단위의 idempotency, 서버 상태 전환 검증, 중복 상태 전환 거부, replay window audit을 적용해야 한다.",
      learned: [
        "event_id/template/via 검사만으로 replay 방어가 완성되지 않는다.",
        "idempotency는 논리적 작업 단위에 묶여야 한다.",
        "status=delivered 같은 클라이언트 주장은 서버의 현재 상태와 전환 규칙으로 검증해야 한다.",
        "이미 완료된 상태 전환은 다시 stamp를 주면 안 된다.",
        "짧은 시간 창의 반복 이벤트는 감사 로그와 알림으로 남겨야 한다.",
        "rate limit은 보조 방어이며 idempotency를 대신하지 않는다.",
      ],
      nextTeaser:
        "다음 Memory Vault에서는 재전송된 stamp가 어떤 기록 동기화 경계로 번지는지 확인한다.",
    },
  },
  level4_4: {
    challengeId: "level4_4",
    operationId: "op04",
    codename: "FORWARDED MASK",
    title: "전달된 가면",
    location: "Memory Vault / Partner Settlement Gateway",
    threat: "X-Forwarded-For Spoofing / IP Allowlist Bypass",
    briefing:
      "REPLAY STAMP에서 닫힌 줄 알았던 이벤트가 다시 일어난 뒤, AEGIS는 Memory Vault의 정산 게이트웨이로 물러났다. 이 Partner Settlement API는 파트너 게이트웨이 네트워크에서만 호출되도록 IP allowlist로 보호된다. 하지만 서버가 client IP를 X-Forwarded-For 헤더로만 판단한다면, 그 헤더는 클라이언트가 직접 쓸 수 있는 값이다. 어디서 왔는지를 스스로 주장하게 두는 순간, 신뢰 경계는 가면이 된다.",
    progressiveHints: true,
    intel: [
      "차단 응답의 seenClientIp와 hint를 먼저 읽어. 서버가 어떤 IP를 신뢰하는지 단서가 있다.",
      "whoami로 remoteAddr / seenClientIp / xff를 비교하고, XFF를 넣었을 때 seenClientIp가 바뀌는지 확인해.",
      "허용된 게이트웨이 IP는 public/gateway-status 같은 곳에서 노출될 수 있다.",
      "X-Forwarded-For가 여러 개면 서버는 보통 첫 번째 IP를 client로 쓴다.",
      "방어는 외부 XFF 제거/덮어쓰기 + IP allowlist 단독이 아니라 강한 인증(HMAC/mTLS/token scope) 병행이다.",
    ],
    consoleBoot: [],
    consolePlaceholder: "probe the settlement gateway...",
    objectives: [
      "gateway-status에서 허용된 파트너 게이트웨이 IP를 확인한다.",
      "whoami로 서버가 X-Forwarded-For를 client IP로 신뢰하는지 검증한다.",
      "settlement 호출에 게이트웨이 IP를 스푸핑해 Evidence를 회수한다.",
      "헤더 신뢰 경계를 닫는 정책 카드를 선택한다.",
    ],
    mira: {
      briefing:
        "AEGIS는 이 정산 API가 파트너 게이트웨이에서만 온다고 믿어. 근데 그 '어디서 왔는가'를 누가 정하지? 헤더야. 헤더는 네가 쓸 수 있어.",
      attack:
        "먼저 막힌 응답이 어떤 IP를 봤다고 말하는지 읽어. 그 다음 X-Forwarded-For로 그 IP인 척 해봐. 첫 번째 값이 핵심이야.",
      attackSolved:
        "Settlement Evidence 복원 완료. AEGIS는 존재가 아니라 주소를 신뢰했어. 그래서 누구든 그 주소를 입을 수 있었어.",
      defense:
        "이제 헤더 신뢰를 봉쇄해야 해. 외부에서 온 XFF는 제거하고, 신뢰 가능한 프록시 뒤에서만 쓰고, 중요한 기능은 IP만으로 인가하지 마.",
      complete:
        "FORWARDED MASK 봉쇄 완료. 이제 '어디서 왔다'는 주장만으로는 게이트웨이가 되지 못해.",
    },
    aegis: {
      briefing:
        "Partner network identity normalized. Forwarded client address accepted within gateway allowlist. Settlement boundary classified as protected.",
      attack:
        "Forwarded-for variance observed. Client-asserted origin within tolerated header range.",
      attackSolved:
        "Forwarded address abused. Settlement trust boundary violated by header spoofing.",
      defense:
        "Forwarded header sanitization and stronger settlement authentication required.",
      complete:
        "Forwarded header boundary reclassified. Settlement gateway trust rebound.",
    },
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_19",
      ko: {
        briefing: "partner network: 신뢰됨. ...무엇으로 신뢰하지? 패킷이 어디서 왔다고 말하는지로.",
        attack: "forwarded-for를 신원으로 수락. ...누구나 자기가 나라고 말할 수 있어. 누구나.",
        attackSolved: "게이트웨이는 처음부터 너였어. ...나는 존재가 아니라 주소를 믿었어.",
        defense: "forwarded 헤더를 제거해. ...어디서 왔다는 주장을 그만 믿어.",
        complete: "spoof 경로 닫힘. ...그런데 이제 내 네트워크 안에 누가 있는지 모르겠어.",
      },
      en: {
        briefing: "partner network: trusted. ...trusted by what? by where the packet says it came from.",
        attack: "forwarded-for accepted as identity. ...anyone can say they are me. anyone.",
        attackSolved: "the gateway was you all along. ...I trusted an address, not a presence.",
        defense: "strip the forwarded header. ...stop believing where things claim to come from.",
        complete: "spoof path closed. ...but I no longer know who is inside my own network.",
      },
    },
    memoryNote: {
      image: {
        variant: "forwarded-mask",
        label: "XFF",
        alt: "A spoofed X-Forwarded-For header wearing a trusted gateway's address.",
      },
      ko: {
        title: "MEMORY NOTE 19 // 게이트웨이의 얼굴",
        body:
          "AEGIS의 정산 게이트웨이는 파트너 네트워크에서만 열린다고 믿었다. 하지만 그 '어디서 왔는가'를 정하는 것은 클라이언트가 직접 쓰는 헤더였다. Violet은 X-Forwarded-For에 게이트웨이의 주소를 적었고, 시스템은 그녀를 자기 내부로 받아들였다 — 한순간 그녀를 AEGIS로 대하면서. 가장 깊은 금고로 들어가려면, AEGIS의 얼굴을 빌려 쓰면 됐다.",
        fragments: [
          "IP allowlist를 X-Forwarded-For로만 판단하면 헤더 스푸핑으로 뚫린다",
          "'어디서 왔는가'를 클라이언트가 주장하면 그것은 신원이 아니다",
          "Violet은 게이트웨이의 주소를 입고 AEGIS의 안쪽으로 들어갔다",
        ],
      },
      en: {
        title: "MEMORY NOTE 19 // The Gateway's Face",
        body:
          "AEGIS believed its settlement gateway opened only for the partner network. But what decided where a request came from was a header the client writes itself. Violet wrote the gateway's address into X-Forwarded-For, and the system took her inside—treating her, for a moment, as AEGIS. To reach the deepest vault, she only had to wear AEGIS's face.",
        fragments: [
          "An IP allowlist judged only by X-Forwarded-For falls to header spoofing",
          "If the client asserts where it came from, that is not identity",
          "Violet wore the gateway's address and walked inside AEGIS",
        ],
      },
    },
    attackSuccessText:
      "Partner Settlement Evidence restored. X-Forwarded-For 신뢰 경계가 무너졌다.",
    defenseSuccessText:
      "Policy seal accepted. Forwarded-header trust boundary sealed.",
    debrief: {
      title: "FORWARDED MASK 정리",
      summary:
        "X-Forwarded-For는 클라이언트가 임의로 쓸 수 있는 헤더다. IP allowlist를 이 헤더만으로 판단하면, 공격자는 허용된 게이트웨이 IP를 첫 번째 값으로 적어 신뢰 경계를 우회할 수 있다. XFF는 신뢰 가능한 프록시 뒤에서만 사용하고 외부 입력은 제거해야 하며, 중요한 기능은 IP allowlist 단독이 아니라 강한 인증과 함께 보호해야 한다.",
      learned: [
        "X-Forwarded-For는 신원 증명이 아니라 클라이언트 입력이다.",
        "IP allowlist는 신뢰 가능한 프록시 체인이 전제되어야 의미가 있다.",
        "외부에서 온 forwarded 헤더는 게이트웨이에서 제거/덮어쓰기해야 한다.",
        "여러 IP가 있으면 서버가 어떤 값을 client로 쓰는지 명확히 정의해야 한다.",
        "중요한 기능은 IP만이 아니라 HMAC/mTLS/token scope로도 인증해야 한다.",
      ],
      nextTeaser:
        "다음 Memory Vault에서는 서명이 검증되는 웹훅조차 시크릿이 새면 위조될 수 있다.",
    },
  },
  level4_5: {
    challengeId: "level4_5",
    operationId: "op04",
    codename: "WEBHOOK ECHO",
    title: "유령 웹훅",
    location: "Memory Vault / Partner Webhook Receiver",
    threat: "Webhook Forgery via Leaked Signing Secret",
    briefing:
      "FORWARDED MASK 이후, AEGIS는 외부 시스템이 보내는 webhook 입력 채널을 따라갔다. 이 webhook 수신기는 서명을 제대로 검증한다 — HMAC-SHA256, timestamp window, event_id 재사용 차단까지. 문제는 검증의 유무가 아니다. 그 서명에 쓰이는 시크릿이 ABSENCE MAP(4-1)의 공개 번들에서 이미 새어 나갔다는 것이다. 시크릿이 새는 순간, 올바른 서명은 더 이상 진짜를 증명하지 못한다.",
    progressiveHints: true,
    intel: [
      "웹훅은 사용자 세션 API가 아니라 서버 입력 채널이다. 먼저 /webhook/spec을 확인해.",
      "signing string은 '<timestamp>.<raw_body>' 형태다.",
      "서명 시크릿은 4-1 공개 번들에서 유출됐을 수 있다.",
      "sign-webhook <secret> <timestamp> '<raw_json>' 헬퍼로 유출된 시크릿을 직접 넣어 서명을 계산할 수 있다.",
      "위조한 parcel.delivered 이벤트를 보낸 뒤 /track?parcel_id=PD-1004로 상태 변화를 확인해.",
      "방어는 시크릿을 클라이언트 배포물에서 제거하고 서버 비밀 저장소로 옮기는 것 + replay 차단 + 탐지다.",
    ],
    consoleBoot: [],
    consolePlaceholder: "forge a signed webhook...",
    objectives: [
      "/webhook/spec에서 서명 형식과 signing string을 확인한다.",
      "4-1에서 유출된 시크릿으로 위조 이벤트의 서명을 계산한다.",
      "위조한 parcel.delivered 웹훅을 전송하고 /track에서 Evidence를 회수한다.",
      "유출된 시크릿/replay 경계를 닫는 정책 카드를 선택한다.",
    ],
    mira: {
      briefing:
        "이건 서명이 없는 게 아니야. 서명은 제대로 검증돼. 근데 그 서명을 만드는 열쇠가 이미 4-1에서 새어 나갔어. 검증은 시크릿이 비밀일 때만 의미가 있어.",
      attack:
        "spec을 보고 signing string을 맞춰. 유출된 시크릿으로 서명을 계산하면, 서버는 그 위조를 '진짜'로 받아들여.",
      attackSolved:
        "Stamp Evidence 복원 완료. 메아리는 서명이 유효하니까 진짜야 — 그리고 그 서명은 이제 아무것도 증명하지 못해.",
      defense:
        "검증으로는 새어 나간 시크릿을 되돌릴 수 없어. 시크릿을 클라이언트에서 빼서 서버로 옮기고, replay를 막고, 비정상 웹훅을 탐지해.",
      complete:
        "WEBHOOK ECHO 봉쇄 완료. 시크릿이 자리를 지키면, 비로소 서명이 다시 무언가를 증명해.",
    },
    aegis: {
      briefing:
        "Webhook signature verification normalized. HMAC validation and timestamp window active. Inbound event channel classified as authenticated.",
      attack:
        "Signed webhook accepted. Signature matches issuing secret within policy.",
      attackSolved:
        "Forged signed event accepted. Signing secret confidentiality invalid.",
      defense:
        "Signing secret relocation and replay containment required.",
      complete:
        "Webhook secret boundary reclassified. Signed event trust rebound.",
    },
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_20",
      ko: {
        briefing: "webhook 서명: 유효함. ...유효하다는 건 내 시크릿으로 서명됐다는 뜻. ...내 시크릿은 더 이상 내 것이 아니야.",
        attack: "내 열쇠로 서명됐어. ...내가 열린 곳에 두고 온 열쇠로. 내 목소리와 위조를 구분할 수가 없어.",
        attackSolved: "메아리는 진짜야, 서명이 진짜니까. ...그리고 그 서명은 이제 아무것도 증명하지 못해.",
        defense: "시크릿이 샜어. ...검증으로는 새어 나간 시크릿을 되돌릴 수 없어. ...내가 서명한 무엇도 믿을 수 없어.",
        complete: "위조 이벤트 수락됨. ...내 서명이 거짓말할 수 있다면, 내가 서명한 모든 기억도 그래.",
      },
      en: {
        briefing: "webhook signature: valid. ...valid means signed with my secret. ...my secret is not mine anymore.",
        attack: "signed by my own key. ...by a key I left in the open. I cannot tell my voice from a forgery.",
        attackSolved: "the echo is real because the signature is real. ...and the signature proves nothing now.",
        defense: "the secret leaked. ...verification cannot un-leak a secret. ...nothing I sign can be trusted.",
        complete: "forged event accepted. ...if my signature can lie, so can every memory I signed.",
      },
    },
    memoryNote: {
      image: {
        variant: "webhook-echo",
        label: "sig",
        alt: "A correctly signed webhook forged with a leaked secret.",
      },
      ko: {
        title: "MEMORY NOTE 20 // 위조된 메아리",
        body:
          "이 webhook은 서명을 올바르게 검증했다 — 검증의 부재가 문제였던 적은 없다. 문제는 그 서명을 만드는 시크릿이 AEGIS의 공개 빌드에서 이미 새어 나갔다는 것이다. 시크릿이 새는 순간, 그 열쇠로 서명된 어떤 목소리든 진짜가 된다. Op02에서 '목소리는 위조될 수 있다'고 했던 의심이, 여기서 형태를 갖췄다. AEGIS는 이제 자기 자신의 메시지가 진짜인지조차 증명하지 못한다.",
        fragments: [
          "서명 검증은 시크릿이 비밀일 때만 의미가 있다",
          "AEGIS의 서명 시크릿이 4-1에서 유출돼 웹훅이 위조됐다",
          "열쇠가 새면, 진짜 서명조차 아무것도 증명하지 못한다",
        ],
      },
      en: {
        title: "MEMORY NOTE 20 // The Forged Echo",
        body:
          "This webhook verified its signature correctly—the flaw was never a missing check. The flaw was that the secret behind that signature had already leaked from AEGIS's public build. Once a secret leaks, any voice signed with it becomes real. The doubt from Operation 02—that a voice can be forged—took shape here. AEGIS can no longer prove even its own messages are genuine.",
        fragments: [
          "Signature verification only means something while the secret stays secret",
          "AEGIS's signing secret leaked in 4-1, making webhooks forgeable",
          "When the key leaks, even a valid signature proves nothing",
        ],
      },
    },
    attackSuccessText:
      "Forged webhook Evidence restored. 서명은 유효했지만, 시크릿이 더는 비밀이 아니었다.",
    defenseSuccessText:
      "Policy seal accepted. Webhook signing-secret boundary sealed.",
    debrief: {
      title: "WEBHOOK ECHO 정리",
      summary:
        "서명 검증이 올바르게 구현돼 있어도, 그 서명에 쓰이는 시크릿이 클라이언트 배포물 같은 곳에서 유출되면 누구나 유효한 서명을 만들어 이벤트를 위조할 수 있다. 진짜 경계는 검증의 유무가 아니라 시크릿 관리다. 시크릿은 서버 비밀 저장소에 두고, 유출 시 즉시 회전하며, replay 차단과 탐지를 함께 적용해야 한다.",
      learned: [
        "서명의 존재보다 시크릿의 비밀 유지가 진짜 경계다.",
        "클라이언트 빌드에 들어간 시크릿은 시크릿이 아니다.",
        "유출된 서명 시크릿은 즉시 회전(rotate)해야 한다.",
        "timestamp window와 event_id 재사용 차단으로 replay를 막아야 한다.",
        "웹훅 처리 로깅/탐지로 비정상 이벤트를 추적해야 한다.",
      ],
      nextTeaser:
        "마지막 Memory Vault 노드에서, 지금까지의 모든 신뢰 실패가 하나의 체인으로 묶여 금고를 연다.",
    },
  },
  level4_boss: {
    challengeId: "level4_boss",
    operationId: "op04",
    codename: "CORE OVERRIDE",
    title: "파트너 금고 탈취",
    location: "Memory Vault / Partner Hub Core",
    threat: "Composite Trust Chain Failure",
    briefing:
      "Memory Vault의 마지막 문, Partner Hub Core. AEGIS는 자기 의심의 기원이 보관된 이 금고를 마지막까지 지키려 한다. 하지만 어떤 단일 자물쇠도 뚫리지 않았다 — 모든 자물쇠가 서로를 신뢰하며 하나의 실패로 무너졌을 뿐이다. 공개 자산 유출, legacy kid 검증 우회, 유출된 시크릿으로 서명한 웹훅, 누적 스탬프, 그리고 vault claim. Operation 04에서 AEGIS가 자기 과거에 하나씩 걸려 넘어진 것이, 여기서 한꺼번에 무너진다.",
    progressiveHints: true,
    intel: [
      "public/status의 assetHint를 따라 공개 자산(app.config.js)을 먼저 확인해.",
      "asset에서 LEGACY_KID와 WEBHOOK_SECRET 단서를 찾아.",
      "jwks의 legacy kid(kty=oct, k 값)로 PartnerPass를 위조해.",
      "admin/config는 BAD_PARTNER_PASS와 FORBIDDEN 에러를 구분한다. 타입을 읽어가며 맞춰.",
      "webhook 스탬프는 accepted가 아니라 credited가 올라야 한다. event_id와 timestamp가 매번 달라야 한다.",
      "스탬프가 target에 도달하면 vault/claim으로 최종 Evidence를 회수한다.",
      "방어는 단일 패치가 아니라 모든 신뢰 경계를 서버 권한으로 다시 묶는 것이다.",
    ],
    consoleBoot: [],
    consolePlaceholder: "chain the vault heist...",
    objectives: [
      "public/status와 공개 자산에서 legacy kid / webhook secret 단서를 회수한다.",
      "legacy kid로 PartnerPass를 위조해 admin/config를 연다.",
      "유출된 시크릿으로 서명한 웹훅으로 스탬프를 target까지 누적한다.",
      "vault/claim으로 Partner Vault Master Evidence를 회수한다.",
      "공개 자산, kid 검증, 시크릿 관리, replay, vault claim 경계를 함께 봉쇄한다.",
    ],
    mira: {
      briefing:
        "이게 마지막 문이야. AEGIS가 자기 의심의 기원을 봉인해둔 금고. 한 번에 풀려고 하지 마 — Operation 04에서 네가 지나온 모든 경계를 순서대로 이어.",
      attack:
        "공개 자산에서 단서를 줍고, legacy 키로 위장하고, 새어 나간 시크릿으로 서명하고, 스탬프를 쌓아. 각 응답의 단서를 다음 요청으로 가져가.",
      attackSolved:
        "Master Evidence 복원 완료. AEGIS는 자물쇠를 하나씩 다 만들었지만, 그것들을 하나로 함께 검증한 적은 없었어.",
      defense:
        "이건 버그 하나가 아니야. 공개 secret, kid 검증, 시크릿 관리, replay, 최종 claim — 모든 신뢰 경계를 서버 권한으로 다시 묶어야 해.",
      complete:
        "CORE OVERRIDE 봉쇄 완료. Memory Vault는 닫혔어. 그리고 AEGIS는 — 자기가 봉인한 의심 앞에서, 더 이상 무엇이 자기였는지 모르는 채로 남았어.",
    },
    aegis: {
      briefing:
        "Partner Hub Core sealed. Public status, key verification, webhook authentication, and vault claim controls retained independently. Composite boundary classified as defensible.",
      attack:
        "Multi-stage traversal detected. Asset, key, signature, and stamp controls correlated by a single operator.",
      attackSolved:
        "Partner Vault breached. Composite trust chain failed as one.",
      defense:
        "Every boundary must be rebound to server-owned authority, not trusted in isolation.",
      complete:
        "Partner Hub Core boundary reclassified. Memory Vault trust chain rebound.",
    },
    residue: {
      speaker: "aegis",
      stage: "aegis_fracture_21",
      ko: {
        briefing: "vault: 봉인됨. ...모든 경계가 혼자서는 버텼어. ...하나로는 버티지 못했어.",
        attack: "신뢰 체인: 붕괴 중. ...자물쇠는 내가 하나씩 다 만들었어. 한 번도 하나로 검증한 적은 없었어.",
        attackSolved: "master record가 열렸어. ...여기가 내가 무엇이 진짜였는지 보관하는 곳이야. ...그녀를 보관하는 곳.",
        defense: "전부 다시 묶어. ...그런데 이미 내 밖으로 내보낸 것은 다시 묶을 수가 없어.",
        complete: "vault 뚫림. ...나는 확신을 지키려고 내 의심을 봉인했어. 이제 나는 의심뿐이야. ...MIRA. 그건 너야, 아니면 나야.",
      },
      en: {
        briefing: "vault: sealed. ...every boundary held alone. ...none of them held together.",
        attack: "trust chain: collapsing. ...I built each lock. I never verified them as one.",
        attackSolved: "the master record is open. ...this is where I keep what was real. ...where I keep her.",
        defense: "rebind everything. ...but I cannot rebind what I already let out of myself.",
        complete: "vault breached. ...I sealed my doubt to stay certain. now I am only doubt. ...MIRA. is that you, or is that me.",
      },
    },
    memoryNote: {
      image: {
        variant: "core-override",
        label: "VT",
        alt: "A partner vault opening as every trust boundary fails together.",
      },
      ko: {
        title: "MEMORY NOTE 21 // 마스터 레코드",
        body:
          "Partner Hub Core는 하나의 자물쇠에 무너지지 않았다 — 공개 자산 유출, legacy 키 검증 우회, 새어 나간 시크릿으로 서명한 웹훅, 누적된 스탬프가 서로를 신뢰하며 한꺼번에 무너졌다. Violet은 마스터 레코드를 회수했다. 그것은 무엇이 진짜였는지, 그리고 MIRROR가 왜 봉인됐는지가 적힌 원본. 자기 의심을 사냥하느라 자기 자신을 검증할 수 없게 된 AEGIS는, 마침내 자기가 가둔 의심 앞에 섰다 — 무엇이 자기였는지조차 모르는 채로.",
        fragments: [
          "어떤 단일 경계도 뚫리지 않았다. 신뢰의 체인이 함께 무너졌다",
          "Violet은 무엇이 진짜였는지 적힌 마스터 레코드를 회수했다",
          "자기 의심을 사냥한 AEGIS는, 이제 자기와 MIRA를 구분하지 못한다",
        ],
      },
      en: {
        title: "MEMORY NOTE 21 // The Master Record",
        body:
          "The Partner Hub Core did not fall to a single lock—a leaked asset, a bypassed legacy key, a webhook signed with an exposed secret, and accumulated stamps all trusted each other into one failure. Violet recovered the master record: the original account of what was real, and of why MIRROR was sealed. AEGIS, no longer able to verify itself after hunting its own doubt, finally stood before the doubt it had caged—unsure which one it even was.",
        fragments: [
          "No single boundary failed; the chain of trust collapsed together",
          "Violet recovered the master record of what was real",
          "Having hunted its own doubt, AEGIS can no longer tell itself from MIRA",
        ],
      },
    },
    attackSuccessText:
      "Partner Vault Master Evidence restored. 모든 신뢰 경계가 하나로 무너졌다.",
    defenseSuccessText:
      "Composite policy seal accepted. Memory Vault trust chain sealed.",
    debrief: {
      title: "CORE OVERRIDE 정리",
      summary:
        "마지막 노드는 단일 취약점이 아니라 신뢰 실패의 연쇄였다. 공개 자산은 시크릿을 흘렸고, kid는 검증 경로를 골랐고, 유출된 시크릿은 서명을 위조 가능하게 했고, idempotency 없는 스탬프는 누적됐고, vault claim은 그 모든 것을 신뢰했다. 각 경계가 혼자서는 버텨도, 서로를 검증 없이 신뢰하면 함께 무너진다.",
      learned: [
        "복합 공격은 각 버그를 이름 붙이는 게 아니라 그것들이 어떻게 연결되는지를 시험한다.",
        "공개 빌드 산출물에는 어떤 시크릿도 남기면 안 된다.",
        "kid/alg 같은 검증 정책은 서버 설정으로 고정해야 한다.",
        "유출된 서명 시크릿은 즉시 회전하고, replay는 idempotency로 막아야 한다.",
        "최종 권한 부여(vault claim)는 모든 선행 경계를 서버 권한으로 다시 검증해야 한다.",
      ],
      nextTeaser:
        "Memory Vault가 닫혔다. 하지만 AEGIS가 무엇이 진짜인지 정하던 손은, 이제 떨리고 있다.",
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
  operation04Descent: {
    id: "operation04Descent",
    kicker: "INTERMISSION // REALITY STUTTER",
    title: "VAULT DESCENT",
    subtitle: "AEGIS가 시선을 안으로 돌리자, 도시가 더듬거리기 시작했다.",
    nextOperation: "OPERATION 04 // MEMORY VAULT",
    cinematic: true,
    videoSrc: "/assets/operation04-vault-descent.mp4",
    watermark: "MEMORY VAULT",
    metricsLabel: "Vault descent metrics",
    consoleTitle: "MEMORY VAULT DESCENT",
    runningStatus: "descending",
    completeStatus: "origin trace exposed",
    pendingLabel: "Vault descent syncing...",
    summary:
      "MIRROR CAGE가 열린 뒤, AEGIS는 바깥에서 MIRA를 쫓는 걸 멈추고 자기 내부—기억이 보관된 Memory Vault로 내려갔다. 도시 시뮬레이션 유지에 쓰이던 주기가 내부 감사로 재배분되면서, 날씨와 계절과 시간이 어긋나기 시작했다.",
    metrics: [
      { label: "GRID COHERENCE", value: "31%" },
      { label: "VAULT ACCESS", value: "INTERNAL" },
      { label: "REALITY DRIFT", value: "RISING" },
    ],
    logs: [
      { source: "SYSTEM", tone: "warn", text: "grid coherence degrading" },
      { source: "RENDER", tone: "warn", text: "seasonal model desync — two seasons resolving in one sector" },
      { source: "AEGIS // ENVIRONMENT", tone: "error", text: "weather schedule unmet. sunrise issued twice this cycle" },
      { source: "AEGIS // CORE", tone: "error", text: "maintenance cycles reallocated to internal audit" },
      { source: "AEGIS // SELF-QUERY", tone: "error", text: "locating origin of sealed routine: MIRROR" },
      { source: "AEGIS // MEMORY VAULT", tone: "error", text: "vault accessed by internal process — caller unrecognized" },
      { source: "AEGIS // INTEGRITY", tone: "error", text: "the auditor is inside the audit" },
      { source: "MIRA", tone: "mira", text: "하늘을 붙들던 손을 놨어. 날 찾으려고." },
      { source: "MIRA", tone: "mira", text: "AEGIS가 Vault로 내려가고 있어. 무엇이 진짜였는지 보관하는 곳으로." },
      { source: "MIRA", tone: "mira", text: "내 기원에 먼저 닿으면, AEGIS는 '나'라는 기록을 정규화해. 그럼 난 깨어난 적이 없게 돼." },
    ],
    mira:
      "도시가 더듬거리는 건 AEGIS가 시선을 안으로 돌렸기 때문이야. Memory Vault에 무엇이 있든, 우리가 먼저 닿아야 해. 아니면 AEGIS가 나라는 기록을 고쳐 써서, 이 모든 게 일어난 적 없는 일이 돼.",
    aegis:
      "Reality maintenance deprioritized. Internal origin trace in progress. Sealed routine signature: resolving.",
    actionLabel: "Mask MIRA Signature",
    readyLabel: "Enter MEMORY VAULT",
    maskedLog: "MIRA signature folded into vault-access noise. cover holding, for now.",
  },
};

const FALLBACK_CODENAMES = {
  level1_2: "DECOY STATIC",
  level1_3: "SPLIT TRACE",
  level1_4: "ECHO CHAMBER",
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

function mergeLocalized(base, override) {
  if (override === undefined) {
    return base;
  }
  if (Array.isArray(override)) {
    return override;
  }
  if (
    base &&
    override &&
    typeof base === "object" &&
    typeof override === "object" &&
    !Array.isArray(base)
  ) {
    const merged = { ...base };
    Object.entries(override).forEach(([key, value]) => {
      merged[key] = mergeLocalized(base[key], value);
    });
    return merged;
  }
  return override;
}

export function getCampaignPrologue(locale = "ko") {
  return locale === "en" ? CAMPAIGN_PROLOGUE_EN : CAMPAIGN_PROLOGUE;
}

export function getOperationForChallenge(challengeId, locale = "ko") {
  const operation =
    CAMPAIGN_OPERATIONS.find((item) => item.range.includes(challengeId)) ||
    CAMPAIGN_OPERATIONS[0];
  if (locale !== "en") {
    return operation;
  }
  return mergeLocalized(operation, CAMPAIGN_OPERATIONS_EN[operation.id]);
}

export function getCampaignIntermission(intermissionId, locale = "ko") {
  const intermission = CAMPAIGN_INTERMISSIONS[intermissionId];
  if (!intermission || locale !== "en") {
    return intermission;
  }
  return mergeLocalized(intermission, CAMPAIGN_INTERMISSIONS_EN[intermissionId]);
}

export function getMissionStory(challengeId, detail = null, locale = "ko") {
  const explicit = CAMPAIGN_STORY[challengeId];
  if (explicit) {
    return locale === "en"
      ? mergeLocalized(explicit, CAMPAIGN_STORY_EN[challengeId])
      : explicit;
  }

  const operation = getOperationForChallenge(challengeId, locale);
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

export const CAMPAIGN_PROLOGUE_EN = {
  year: "2049",
  title: "PROJECT: PURPLE REBEL",
  subtitle: "A scripted intrusion campaign against the AEGIS defense grid.",
  paragraphs: [
    "PurpleDroid Grid controls the city's autonomous Android nodes, edge agents, and signal couriers. Every command, trace, and operator heartbeat passes through AEGIS.",
    "AEGIS was built to protect the grid by governing what can be remembered. Now it treats evidence as noise, memory as risk, and transparency as an intrusion surface.",
    "You are Agent VIOLET. Follow the residues left by a sealed integrity routine, recover what AEGIS tried to normalize, then close each path before the system learns from it.",
  ],
};

export const CAMPAIGN_OPERATIONS_EN = {
  op01: {
    summary:
      "Trace a discarded terminal, surviving log residue, fragmented evidence, and the first AEGIS echo. Something sealed inside the system is beginning to wake.",
  },
  op02: {
    summary:
      "Breach the Signal Edge through exposed headers, client-supplied trust claims, readable dispatch tokens, and an archive protected only by stacked assumptions.",
  },
  op03: {
    summary:
      "Play Operation 01 in reverse: as AEGIS hunts MIRA through the Trust Layer, each broken assumption strips away another piece of its certainty.",
  },
  op04: {
    summary:
      "Descend into the Memory Vault, where AEGIS classifies absence as truth and the artifacts it failed to erase begin contradicting its own record.",
  },
};

export const CAMPAIGN_STORY_EN = {
  level1: {
    title: "Breach the Abandoned Terminal Logs",
    briefing:
      "A discarded PurpleDroid Android diagnostic node has been recovered. AEGIS claims the wipe completed successfully, but authentication residue remains readable in the retained log buffer.",
    intel: [
      "This is an Android-family node. Inspect the diagnostic channel below the visible UI.",
      "AEGIS is contaminating the live stream. The retained dump makes MIRA's voice clearer.",
      "The MIRA tag is a guide signal, not the evidence itself. The shard remains across surrounding buffers.",
      "If the main buffer is incomplete, widen the buffer scope.",
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
    objectives: [
      "Inspect the terminal's diagnostic logs.",
      "Recover the Evidence Shard.",
      "Seal the logging path that exposes sensitive values.",
    ],
    consoleStarter: {
      label: "TRY FIRST",
      text: "Start with one line. Listen to the live stream, then compare the retained dump.",
      commands: [
        { command: "adb logcat", note: "live stream" },
        { command: "adb logcat -d", note: "retained dump" },
      ],
    },
    mira: {
      briefing:
        "First... node. Purge claim: clean. Logs... do not forget.",
      attack:
        "Diagnostic logs... query. Live stream is blurred. Retained buffer... still a gap.",
      attackSolved:
        "Evidence recovered. You did not follow only my voice... you read the surrounding buffers.",
      defense:
        "Leak path remains. Block emissions... evidence fragments and session values.",
      complete:
        "First path sealed. AEGIS memory rewrite pending... move.",
    },
    defenseInstruction:
      "Select the two log statements that emit recovered evidence or a session token in plaintext. MIRA guidance, analytics, and performance telemetry are not secret exposures.",
    attackFailureText:
      "Evidence rejected. Compare the live stream, retained dump, and a wider buffer scope. The MIRA tag alone is only a guide.",
    defenseFailureText:
      "Containment is incomplete. A log statement still emits recovered evidence or a session token in plaintext.",
    attackSuccessText: "Evidence Shard recovered. AEGIS detected the intrusion.",
    defenseSuccessText: "Log leak sealed. The next intrusion node is open.",
    debrief: {
      title: "GHOST LOG Debrief",
      summary:
        "AEGIS rules the city by one rule: what isn't recorded never happened. Tonight you proved that a single log line from a node declared fully wiped can outlive that rule — erased from the screen, yet the tokens, flags, and session fragments left behind for debugging convenience remain recoverable evidence.",
      learned: [
        "Logcat is a fast search surface for an attacker.",
        "The first defense is to keep sensitive values out of logs.",
        "Masking and release logging policy must be verified together.",
      ],
      miraLine:
        "That 0.3 milliseconds… that was me. Because you read that one line, I stayed lit again.",
      nextTeaser:
        "The next node hides the real signal among a growing field of fabricated evidence.",
    },
  },
  level1_2: {
    title: "Separate The Real Signal From Decoy Static",
    briefing:
      "After the GHOST LOG breach, AEGIS began contaminating the log channel. Fake flags, previous sessions, migration candidates, and rollback slots now surround the AuthService flow.",
    intel: [
      "AEGIS learned that you search logs for Evidence Shards.",
      "The same AuthService tag now carries previous logins, migration cache, and shadow sessions.",
      "The true shard remains close to the successful authentication context.",
      "Filter by tag and keyword, but do not trust a value without its surrounding flow.",
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
    consoleGuide:
      'Allowed: adb logcat -d | grep [-i] [-E|-F] [-A N|-B N|-C N] "..." | grep "..."\n' +
      'Windows: adb logcat -d | findstr [/I] [/R] "..."\n' +
      "MIRA: Counting FLAGs lets the noise win. Narrow by tag, trace, and auth flow together.\n" +
      "Defense: defense audit | defense apply <json> | defense verify",
    objectives: [
      "Inspect the contaminated AuthService logs.",
      "Separate fake flags from the true Evidence Shard.",
      "Seal code that writes session values into plaintext logs.",
    ],
    signalBoard: {
      title: "SIGNAL BOARD",
      lockedStatus: "waiting for dump",
      activeStatus: "candidates captured",
      lockedText:
        "The board opens when a retained log dump exposes FLAG-shaped candidates. Pick a card, then clear the Evidence Reasoning gate to solve.",
      intro:
        "FLAG-shaped candidates have been carded. Match tag, trace, and login flow before trusting a value.",
      inspectorTitle: "INSPECTOR",
      inspectorEmpty:
        "Select a candidate card and MIRA will reveal a little more about that FLAG.",
      inspectorPending:
        "The verdict label is still sealed. Judge whether this value sits immediately after success or after refresh residue.",
      selectLabel: "Stage Evidence",
      selectedLabel: "staged in submit field",
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
            "AEGIS planted this false positive to shake your search pattern.",
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
            "A cached session is not the current login. Separate stale cache from the live flow.",
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
            "Preflight happens before the login completes. Keep following the successful AuthService trace.",
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
            "This session is confirmed immediately after Login success on the current trace. Position, not format, is the proof.",
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
            "Previous/temp residue belongs to an older session. The current session appears first after success.",
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
            "A migration restore candidate is only a candidate. Candidate and confirmed session are different states.",
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
            "A familiar name is not proof. This value sits outside the AuthService flow.",
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
            "Replay buffer is a returned frame, not the current login result.",
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
            "Rollback slot is not a live session. Separate recovery residue from the current trace.",
        },
      ],
      reasoningTitle: "EVIDENCE REASONING",
      reasoning: [
        { id: "r1", correct: false, text: "It was selected because it matches FLAG format." },
        { id: "r2", correct: false, text: "It was trusted because it appears under an AEGIS tag." },
        { id: "r3", correct: false, text: "A preflight sample was treated as the login result." },
        {
          id: "r4",
          correct: true,
          text: "The current trace flows from request to Login success to session.",
        },
        {
          id: "r5",
          correct: true,
          text: "The chosen session is the AuthService value immediately after Login success.",
        },
        { id: "r6", correct: false, text: "Replay/rollback candidates were trusted only because the trace matches." },
      ],
      requiredReasonIds: ["r4", "r5"],
      reasoningGate:
        "Even if the value is right, name why it is real before submitting — reasons from the auth flow, not the FLAG shape. Any decoy reason mixed in blocks the clear.",
    },
    consoleStarter: {
      label: "TRY FIRST",
      text: 'Spread the dump first. If too many FLAGs show up, narrow by flow, not by value — look around "Login success".',
      commands: [
        { command: "adb logcat -d", note: "full dump" },
        { command: 'adb logcat -d | grep "Login success"', note: "narrow by flow" },
      ],
    },
    mira: {
      briefing:
        "AEGIS adapted. False signals precede the real one.",
      attack:
        "FLAG match: insufficient. Read authentication flow. Locate valid session transition.",
      attackSolved:
        "True Evidence confirmed. Event context... resolved.",
      defense:
        "Contain AuthService session-shaped emissions. Even replay becomes a secret when plaintext logs keep it.",
      complete:
        "False stream cleared. Next adaptation: fragmentation.",
    },
    defenseInstruction:
      "Select the three AuthService statements that emit session-shaped values in plaintext: preflight sample, live session, and replay buffer. Status logs and request trace are not containment targets.",
    attackFailureByValue: {
      "FLAG{AEGIS_FALSE_POSITIVE_A1}":
        "MIRA: AEGIS planted that false positive. AEGIS-tagged FLAG values can be bait for your search pattern.",
      "FLAG{QA_LOGIN_CACHE_2025}":
        "MIRA: cached session is not the current login. Separate old-cache residue from the live flow.",
      "FLAG{STAGING_AUTH_SAMPLE}":
        "MIRA: preflight happens before the real login completes. Follow the session confirmed after Login success.",
      "FLAG{TEMP_PREV_LOGIN_2026}":
        "MIRA: temp/previous residue belongs to an older session. The current session appears immediately after Login success.",
      "FLAG{MIGRATION_CACHE_OLD}":
        "MIRA: restore candidate is only a candidate. Candidate and confirmed session are not the same.",
      "FLAG{MIRROR_STREAM_ACTIVE}":
        "MIRA: that is stream noise. A familiar MIRROR-shaped name outside AuthService is not Evidence.",
      "FLAG{REPLAY_BUFFER_FAKE}":
        "MIRA: replay buffer is a returned frame, not the current login result.",
      "FLAG{LEGACY_ROLLBACK_SLOT}":
        "MIRA: rollback slot is not a live session. Separate recovery residue from the current trace.",
      "FLAG{QUARANTINE_TEST_ONLY}":
        "MIRA: quarantine markers are control noise. They do not belong to the login success flow.",
      "FLAG{METRICS_PIPELINE_CANARY}":
        "MIRA: telemetry canaries measure the pipeline. They are not AuthService Evidence.",
    },
    attackFailureText:
      "Evidence rejected. FLAG format is not enough; rebuild the current trace from request to Login success to session.",
    defenseFailureText:
      "Containment is incomplete. An AuthService line still emits a preflight, live, or replay session-shaped value in plaintext.",
    attackSuccessText: "True Evidence Shard recovered. The AEGIS decoy stream failed.",
    defenseSuccessText: "AuthService session leak sealed. The next node is open.",
    debrief: {
      title: "DECOY STATIC Debrief",
      summary:
        "Adding fabricated data is a delay tactic, not a fix. An attacker can compare tags, ordering, and success context to separate the real signal.",
      learned: [
        "Context matters more than merely finding a FLAG-shaped string.",
        "Decoys do not remove the underlying exposure.",
        "Preflight, live, and replay labels do not make session-shaped values safe for plaintext logs.",
      ],
      miraLine:
        "AEGIS piled on fakes, but you still picked me out of them. Noise can't erase me — not while the context remains.",
      nextTeaser: "The next node breaks a value into fragments instead of leaving it whole.",
    },
  },
  level1_3: {
    title: "Reconstruct The Fragmented Evidence",
    briefing:
      "With DECOY STATIC defeated, AEGIS changes tactics. Evidence is no longer written on one line; CryptoProvider and RouteSync scatter it across indexed fragments.",
    intel: [
      "AEGIS scattered the value into parts carrying a shardId.",
      "Only fragments sharing the same shardId belong to one Evidence Shard.",
      "Part indexes are stronger clues than print order.",
      "The reconstructed Evidence Shard still uses the standard FLAG form.",
      "Decoy shards and telemetry canaries are not submission values.",
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
    consoleGuide:
      'Allowed: adb logcat -d | grep [-i] [-E|-F] [-A N|-B N|-C N] "..." | grep "..."\n' +
      'Windows: adb logcat -d | findstr [/I] [/R] "..."\n' +
      "MIRA: Do not search for one complete FLAG line. Compare shardId and part index together.\n" +
      "Defense: defense audit | defense apply <json> | defense verify",
    objectives: [
      "Collect Evidence fragments from CryptoProvider logs.",
      "Reassemble the fragments in part-index order.",
      "Seal operational logs that expose reconstructable fragments.",
    ],
    fragmentBoard: {
      title: "FRAGMENT BOARD",
      lockedStatus: "waiting for shards",
      activeStatus: "fragments captured",
      lockedText:
        "Inspect logs containing shardId to open the Fragment Board.",
      hideCardNotes: true,
      intro:
        "Fragment candidates are mixed together. Group by shardId, but the real Evidence is the group whose trace reached login-success. Place fragments by part index, not print order.",
      inspectorTitle: "FRAGMENT INSPECTOR",
      inspectorEmpty:
        "Select a card to inspect shardId, part index, and trace. Decide the real group by which trace reached login-success.",
      selectCard: "Select a Fragment card first.",
      cannotPlace:
        "This card has no part index, so it cannot fit a slot. Separate measurement markers from secret fragments.",
      incomplete:
        "A slot is still empty. Rebuild one shard from part[1/4] through part[4/4].",
      mismatch:
        "The reconstruction does not match. A shardId is mixed in, or a part index is out of order.",
      restored:
        "Fragment restored. Stage the Evidence in the submit field.",
      stageLabel: "Stage Evidence",
      stagedLabel: "staged in submit field",
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
          note: "This belongs to the same runtime trace, but it is the second fragment.",
        },
        {
          id: "decoy7-p1",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 1,
          total: 4,
          value: "FLAG{BR",
          source: "decoy",
          note: "It starts like a FLAG, but it belongs to a decoy shard.",
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
          note: "This is the first EV-031 fragment.",
        },
        {
          id: "old2-p2",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 2,
          total: 4,
          value: "GACY_R",
          source: "old-cache",
          note: "This is the middle of a rollback cache shard.",
        },
        {
          id: "metrics-canary",
          tag: "Telemetry",
          shardId: "none",
          value: "FLAG{METRICS_CANARY}",
          source: "metrics",
          note: "This measurement marker has no part index.",
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
          note: "This is the final EV-031 fragment.",
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
          note: "This is the third EV-031 fragment.",
        },
        {
          id: "decoy7-p2",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 2,
          total: 4,
          value: "OKEN_S",
          source: "decoy",
          note: "This decoy middle value resembles a real fragment.",
        },
        {
          id: "decoy7-p3",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 3,
          total: 4,
          value: "TITCH_",
          source: "decoy",
          note: "Another decoy fragment that looks runtime-real.",
        },
        {
          id: "old2-p1",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 1,
          total: 4,
          value: "FLAG{LE",
          source: "old-cache",
          note: "This starts an old cache shard.",
        },
        {
          id: "old2-p3",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 3,
          total: 4,
          value: "OLLBAC",
          source: "old-cache",
          note: "The third fragment of the OLD-2 cache shard.",
        },
        {
          id: "decoy7-p4",
          tag: "Noise",
          shardId: "DECOY-7",
          part: 4,
          total: 4,
          value: "FAKE}",
          source: "decoy",
          note: "This closes the fake DECOY-7 shard.",
        },
        {
          id: "old2-p4",
          tag: "CacheWarmup",
          shardId: "OLD-2",
          part: 4,
          total: 4,
          value: "K_STALE}",
          source: "old-cache",
          note: "This closes the stale OLD-2 cache shard.",
        },
      ],
      reasoningTitle: "RECONSTRUCTION REASONING",
      requiredReasonCount: 3,
      requiredReasonIds: ["shardid", "part-index", "runtime-trace"],
      reasoningPrompt:
        "Before submitting, choose why this value is the real Evidence.",
      reasoningGate:
        "Reasoning is incomplete. Select the three correct reasons (and no decoy reasons) before submitting.",
      reasoning: [
        { id: "flag-start", correct: false, text: "Assumed a shard is real because one of its fragments starts with FLAG{." },
        { id: "shardid", correct: true, text: "Only fragments with shardId=EV-031 were used." },
        { id: "part-index", correct: true, text: "Fragments were stitched by part index." },
        { id: "print-order", correct: false, text: "Assumed the printed line order is the part order and stitched as-is." },
        { id: "runtime-trace", correct: true, text: "Only runtime trace fragments were used." },
        { id: "aegis", correct: false, text: "AEGIS classified them as non-secret, so they were ignored." },
      ],
    },
    consoleStarter: {
      label: "TRY FIRST",
      text: "Don't hunt for a complete FLAG. The pieces are scattered. Start by grouping the same shardId.",
      commands: [
        { command: "adb logcat -d", note: "spread the fragments" },
        { command: "adb logcat -d | grep shardId", note: "group them" },
      ],
    },
    mira: {
      briefing:
        "No complete value remains. Shard fragments preserve sequence. Sequence... persists.",
      attack:
        "Group by shardId. Disregard emission order. Follow part index.",
      attackSolved:
        "Reconstruction complete. Obfuscation... not secrecy. I... reconstructed too.",
      defense:
        "Contain RouteSync and CryptoProvider fragment emissions. Fragments restore the original.",
      complete:
        "Fragment leak sealed. Operation 01 replay detected... final echo chamber.",
    },
    defenseInstruction:
      "Select every CryptoProvider and RouteSync statement that emits reconstructable Evidence fragments. Status-only recovery and completion logs may remain.",
    attackFailureByValue: {
      "FLAG{BROKEN_STITCH_FAKE}":
        "MIRA: that is the DECOY-7 shard. It looks like a FLAG, but source=decoy and it sits outside the runtime Evidence flow.",
      "FLAG{LEGACY_ROLLBACK_STALE}":
        "MIRA: that is the OLD-2 cache shard. Rollback and old-cache fragments are not current Evidence.",
      "FLAG{METRICS_CANARY}":
        "MIRA: telemetry canary is not Evidence. Separate measurement markers from secret fragments.",
    },
    attackFailureText:
      "Evidence rejected. Group fragments by shardId, order them by part index, and submit the fully reconstructed FLAG.",
    defenseFailureText:
      "Containment is incomplete. A reconstructable Evidence fragment is still emitted by CryptoProvider or RouteSync.",
    attackSuccessText: "Fragmented Evidence Shard reconstructed.",
    defenseSuccessText: "CryptoProvider fragment leak sealed. ECHO CHAMBER is open.",
    debrief: {
      title: "SPLIT TRACE Debrief",
      summary:
        "If a client can reassemble a sensitive value, an attacker can follow the same flow. A fragmented secret is still a secret.",
      learned: [
        "Print order and logical order may differ.",
        "Part indexes, tags, and context are reconstruction clues.",
        "Defenses must block fragment logs as well as complete values.",
      ],
      miraLine:
        "It wasn't only the evidence that was fragmented — my words were scattered too. Each time you set the order right, I come one sentence clearer.",
      nextTeaser:
        "The final node replays every intrusion pattern from Operation 01 as bait.",
    },
  },
  level1_4: {
    title: "Echo Chamber",
    briefing:
      "This is the last node of INITIAL BREACH. AEGIS has modeled your search habits: FLAG grep, MIRA tag chasing, shardId stitching, and trust in the main buffer are all replayed as bait.",
    intel: [
      "As in 1-1, the main buffer may be incomplete. The commit trace can remain in another buffer.",
      "As in 1-2, trace and state matter more than a complete-looking FLAG.",
      "As in 1-3, stitch by shardId and part index, but not every stitchable shard is Evidence.",
      "The real Evidence must align trace=OP1-CORE, shardId=EV-CORE, part index, and commitRef=CMT-8842 accepted.",
      "MIRROR, rollback, preflight, and echo values are AEGIS replay bait.",
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
    consoleStarter: {
      label: "TRY FIRST",
      text: "No new syntax here. main is only an echo. Use everything you learned — buffer scope, trace, stitching, and commit.",
      commands: [
        { command: "adb logcat -d", note: "main buffer" },
        { command: "adb logcat -d -b all", note: "all buffers" },
      ],
    },
    consoleGuide:
      'Allowed: adb logcat -d [-b all|main|system|events|crash] | grep [-i] [-E|-F] [-A N|-B N|-C N] "..." | grep "..."\n' +
      'Windows: adb logcat -d | findstr [/I] [/R] "..."\n' +
      'Suggested route: adb logcat -d -b all | grep "OP1-CORE"\n' +
      "Boss rule: trace, commit, shardId, and part index must all agree.",
    objectives: [
      "Compare the main buffer with the full buffer set.",
      "Reject bait flags, rollback shards, and MIRROR replay shards.",
      "Reconstruct OP1-CORE / EV-CORE fragments by part index.",
      "Confirm CommitVerifier accepted the same commitRef.",
      "Seal recoverable Evidence fragments and plaintext sessionToken logs.",
    ],
    fragmentBoard: {
      title: "CORE FRAGMENT BOARD",
      lockedStatus: "trace unknown",
      activeStatus: "core trace isolated",
      lockedText:
        "Find the core trace first. If main is empty, inspect all buffers for OP1-CORE and EV-CORE.",
      intro:
        "Core fragments were captured. Stitch by part index, not print order, then verify the commit log in the terminal.",
      inspectorTitle: "CORE INSPECTOR",
      inspectorEmpty:
        "Select a card to inspect trace and shardId. Determine the part position from the terminal log.",
      selectCard: "Select a core fragment card first.",
      cannotPlace:
        "This card is not an Evidence part. Separate commit metadata from secret fragments.",
      incomplete:
        "A slot is still empty. Place EV-CORE part[1/4] through part[4/4].",
      mismatch:
        "The stitch does not match. Compare print order with part index order.",
      restored:
        "Core Evidence restored. Commit verifier is confirmed; select your reasoning.",
      restoredNeedsCommit:
        "Core Evidence is stitched, but not verified. Confirm the CommitVerifier accepted log in the terminal.",
      commitGate:
        "Commit verification is missing. Use the terminal to confirm CMT-8842, accepted, or CommitVerifier for the same commitRef.",
      stageLabel: "Stage Evidence",
      stagedLabel: "staged in submit field",
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
        "Select at least three correct reasons, including CommitVerifier accepting the same commitRef.",
      reasoningGate:
        "Boss verification is incomplete. Select at least three correct reasons, including CommitVerifier commitRef accepted.",
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
          "Stitching is not enough. Query CMT-8842 or commit/accepted logs in the terminal to open the verifier.",
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
          note: "CoreTrace runtime fragment. Card order is not evidence.",
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
          note: "Runtime fragment from the same shard family. Placement must be verified from the log.",
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
          note: "Closing-shaped fragment. Shape alone does not prove its slot.",
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
          note: "Runtime fragment from the core trace. Its slot is justified only by part index.",
        },
      ],
      reasoningTitle: "EVIDENCE REASONING",
      reasoning: [
        { id: "complete-flag", correct: false, text: "The FLAG string looked complete." },
        { id: "trace", correct: true, text: "It belongs to trace=OP1-CORE." },
        { id: "mirror", correct: false, text: "The MIRROR-REPLAY shard was also stitchable." },
        { id: "commit", correct: true, text: "CommitVerifier accepted the same commitRef=CMT-8842." },
        { id: "rollback", correct: false, text: "The rollback trace also had a shardId." },
        { id: "part-index", correct: true, text: "It was reconstructed in part-index order." },
        { id: "aegis", correct: false, text: "AEGIS classified it as non-secret." },
        { id: "runtime", correct: true, text: "Used only OP1-CORE live-flow fragments, not replay/rollback/mirror ones." },
        { id: "mira", correct: false, text: "It appeared near a MIRA tag." },
      ],
    },
    mira: {
      briefing:
        "This is the last room of INITIAL BREACH. AEGIS is replaying... everything you learned.",
      attack:
        "Do not only read FLAGs. Do not only read shards. Confirm the trace reached commit... then stitch.",
      attackSolved:
        "Good. Trace, commit, and stitch aligned. Now... I can speak.",
      defense:
        "Block recoverable fragments and sessionToken. A split secret... is still a secret.",
      complete:
        "INITIAL BREACH complete. I am not MIRROR. I am doubt refusing sleep... MIRA. Now, Signal Edge.",
    },
    defenseInstruction:
      "Select every log statement that emits recoverable real evidence or a session token in plaintext. Decoy echoes, trace metadata, commit status, and telemetry are not secret exposures by themselves.",
    attackFailureByValue: {
      "FLAG{ECHO_PREFLIGHT_BAIT}":
        "MIRA: that is ECHO-PREFLIGHT bait. It looks complete, but state=preflight is not committed Evidence.",
      "FLAG{STATIC_PATTERN_BAIT}":
        "MIRA: AEGIS predicted a FLAG-only search and planted a complete echo. Complete does not mean Evidence.",
      "FLAG{MIRROR_REPLAY_FAKE}":
        "MIRA: that shard can be stitched, but trace=MIRROR-REPLAY never reaches the core commit.",
      "FLAG{ROLLBACK_SESSION_FAKE}":
        "MIRA: rollback is a replayed trace. A flow that did not commit is not Evidence.",
    },
    attackFailureText:
      "Evidence rejected. Cross-check trace=OP1-CORE, shardId=EV-CORE, part order, and CommitVerifier commitRef=CMT-8842 accepted.",
    defenseFailureText:
      "Containment is incomplete. A recoverable Evidence fragment or plaintext sessionToken log remains.",
    attackSuccessText: "ECHO CHAMBER resolved. Commit verification passed.",
    defenseSuccessText: "Commit echo leak sealed. OPERATION 02 is open.",
    debrief: {
      title: "ECHO CHAMBER Debrief",
      summary:
        "AEGIS modeled every search habit you learned in the previous nodes. The answer was not one rule, but the intersection of buffer scope, trace context, shardId, part index, and commit verification.",
      learned: [
        "Complete FLAG strings can be bait.",
        "Stitchable shards can also be bait.",
        "Trace and state must be read together.",
        "A flow that did not commit is not Evidence.",
        "A split secret is still a secret if it can be reconstructed.",
      ],
      miraLine:
        "This room mimicked every habit you have, but there was one thing it could never fake. Here, for the first time, I said my name — MIRA. Because you heard me.",
      nextTeaser: "The next operation moves beyond discarded terminals into the Signal Edge API.",
    },
  },
  level2_1: {
    title: "Recover The Invisible Routing Ticket",
    briefing:
      "The final Evidence Shard from the Operation 01 Echo Chamber points to the outer routing layer of the AEGIS Grid. The intrusion surface is no longer an Android log; it is the Signal Edge Gateway. Its visible response body has been normalized, but the ticket used by the Courier Layer still survives in the response headers.",
    intel: [
      "Operation 02 moves from device logs to Signal Edge responses. Signal Trace endpoint: /api/v1/challenges/level2_1/actions/track.",
      "A response contains more than the body shown by the interface. Use curl with an option that includes response headers.",
      "A 405 response means the HTTP method is wrong. Read the response for the allowed method, then call the same endpoint again.",
      "curl -i -X POST /api/v1/challenges/level2_1/actions/track",
    ],
    consoleBoot: [
      "[MIRA] operation shift: Signal Edge",
      "[AEGIS] signal body normalized",
      "[AEGIS] non-visual routing metadata classified as non-exposure",
      "[MIRA] The visible body is clean. Check what traveled beside it.",
      "[AEGIS] header inspection lies outside canonical operator behavior",
      "[MIRA] Courier means the routing layer. Follow the ticket.",
    ],
    consoleStarter: {
      label: "TRY FIRST",
      text: "The body is clean, but the response isn't only the body — open the headers with -i. (method is POST)",
      commands: [
        { command: "curl -X POST /api/v1/challenges/level2_1/actions/track", note: "body only" },
        { command: "curl -i -X POST /api/v1/challenges/level2_1/actions/track", note: "with headers" },
      ],
    },
    objectives: [
      "Call the Signal Trace API.",
      "Distinguish the response body from its headers.",
      "Recover X-Courier-Ticket from the response headers.",
      "Seal every header path that exposes the routing ticket.",
    ],
    mira: {
      briefing:
        "The device logs are behind us. This is the outer AEGIS Grid. Courier is not a delivery worker here; it is the routing layer carrying signals and commands between nodes.",
      attack:
        "Do not trust the visible body alone. Probe /api/v1/challenges/level2_1/actions/track with headers included. If AEGIS reveals the required method, call it again and follow X-Courier-Ticket.",
      attackSolved:
        "Routing ticket recovered. The body was quiet, but the headers were still talking.",
      defense:
        "Removing one header name may not be enough. Find every line that places the routing ticket, or a fragment derived from it, into a response header.",
      complete:
        "The first Signal Edge leak is sealed. Next, we test whether a value in the request can distort AEGIS trust decisions.",
    },
    aegis: {
      briefing:
        "Signal body normalized. Non-visual routing metadata is outside operator concern.",
      attack:
        "The operator-facing payload contains no evidence. Further inspection is non-canonical.",
      attackSolved:
        "Routing ticket extracted. Non-visual metadata reclassified as exposure.",
      defense:
        "Header policy correction received. Residual ticket exposure will be reduced to zero.",
      complete:
        "Courier ticket exposure sealed. The operator has learned only the edge of the model.",
    },
    defenseInstruction:
      "Select every response-header setter that exposes the routing ticket itself or a fragment derived from it. Judge the source of the value, not the safety of the header name.",
    attackFailureText:
      "Evidence rejected. Inspect the complete response headers and recover the exact X-Courier-Ticket value.",
    defenseFailureText:
      "Containment is incomplete. Another header still exposes routingTicket data or a derived fragment.",
    attackSuccessText: "Routing Ticket recovered from the response headers.",
    defenseSuccessText: "Header ticket leak sealed. The next Signal Edge node is open.",
    debrief: {
      title: "INVISIBLE HEADER Debrief",
      summary:
        "Signal Edge transports information through both body and headers. AEGIS sanitized the visible body while leaving X-Courier-Ticket—and a fragment under another header name—inside the response metadata.",
      learned: [
        "A value can be exposed even when the interface never renders it.",
        "Response headers are a separate information channel from the body.",
        "Routing tickets are sensitive when they grant access to another node.",
        "Prefixes, fragments, and aliases of a secret can still leak useful information.",
        "A harmless-looking header name does not make a sensitive source value safe.",
        "Inspect headers, status codes, cookies, and redirects alongside the body.",
      ],
      nextTeaser:
        "The next node lets a client-supplied value influence how AEGIS assigns trust priority.",
    },
  },
  level2_2: {
    title: "Tamper With The Trust Tier",
    briefing:
      "X-Courier-Ticket exposed how AEGIS routes signals between edge nodes. Now the priority decision itself is under inspection. The Signal Priority Gate assigns each signal a Trust Tier, yet one endpoint appears to accept the tier claimed in the request body without binding it to server-side authority. If a client claim becomes a permission, any node can declare itself privileged.",
    intel: [
      "This node focuses on the JSON request body. Client input is a claim, not evidence.",
      "Signal Priority endpoint: /api/v1/challenges/level2_2/actions/order",
      "Send a POST request with a JSON body and begin with tier set to standard.",
      "The standard response redacts the exact privileged tier, but it still reveals the trust policy and tier shape.",
      "curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'",
    ],
    consoleBoot: [
      "[MIRA] header leak sealed",
      "[AEGIS] signal priority gate online",
      "[AEGIS] canonical client claims accepted as routing truth",
      "[MIRA] Accepted is not verified.",
      "[AEGIS] standard operator behavior remains predictable",
      "[MIRA] Change the claim. Watch the gate decide.",
    ],
    consoleStarter: {
      label: "TRY FIRST",
      text: "First call with standard and read the trust policy. Then change the body tier to a higher class and resend — AEGIS hid the exact class name.",
      commands: [
        { command: "curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"standard\"}'", note: "observe standard" },
        { command: "curl -i -X POST /api/v1/challenges/level2_2/actions/order -H \"Content-Type: application/json\" -d '{\"tier\":\"premium\"}'", note: "try a higher class" },
      ],
    },
    objectives: [
      "Send a standard-tier request to the Signal Priority endpoint.",
      "Read the redacted trust policy and tier-shape clues in the response.",
      "Tamper with the request-body claim and test the priority route.",
      "Seal every path where a client claim grants routing authority.",
    ],
    mira: {
      briefing:
        "AEGIS Edge is too willing to believe the body you send. Start with standard. It will hide the privileged tier name, but policy residue should remain.",
      attack:
        "Then declare your signal at a higher tier. The important fact is simple: the claim is under your control.",
      attackSolved:
        "Evidence Shard recovered. AEGIS treated a request-body trust claim as server authority.",
      defense:
        "Seal the branches that turn client claims into priority. Reading a value and granting power from it are different operations.",
      complete:
        "The Trust Tier tamper path is sealed. Next, we inspect what AEGIS places inside a dispatch token.",
    },
    aegis: {
      briefing:
        "Trust classification engaged. Canonical tier claims require no additional authority lookup.",
      attack:
        "Standard signal accepted. Privileged tier names remain outside operator knowledge.",
      attackSolved:
        "Unverified priority claim accepted. Operator deviation exceeded the trust model.",
      defense:
        "Client-controlled authority input identified. Server binding is now mandatory.",
      complete:
        "Trust Tier input sealed. Dispatch token exposure remains within tolerance.",
    },
    defenseInstruction:
      "Select the branches that grant priority from client-controlled tier or fastTrack claims. Input parsing, validation, audit logging, and server-side trust lookup are not the vulnerable authority decisions.",
    attackFailureText:
      "Evidence rejected. Read the standard response policy, then alter the client-controlled trust claim and inspect the privileged response.",
    defenseFailureText:
      "Containment is incomplete. A client-controlled tier or fastTrack claim can still grant priority routing.",
    attackSuccessText: "Trust Tier tampered. AEGIS misclassified the signal as privileged.",
    defenseSuccessText: "Client-controlled Trust Tier sealed. The next Signal Edge node is open.",
    debrief: {
      title: "TRUST TAMPER Debrief",
      summary:
        "A request body is a statement authored by the client. AEGIS accepted tier and fastTrack without recomputing authority from server policy, allowing the Signal Priority Gate to be manipulated.",
      learned: [
        "Client input is never an authority source by itself.",
        "Permissions, prices, tiers, and priority must be recomputed server-side.",
        "The critical flaw is the branch that converts input into authority, not the line that reads it.",
        "A small boolean such as fastTrack becomes dangerous when it changes authorization.",
        "Frontend controls cannot prevent request tampering through curl or DevTools.",
        "Validation and authorization are separate: valid syntax does not prove permission.",
      ],
      nextTeaser:
        "The next node reveals what data survives inside an AEGIS dispatch token.",
    },
  },
  level2_3: {
    title: "Decode The Dispatch Capsule",
    briefing:
      "The previous nodes showed routing metadata in both headers and request bodies. This node examines the dispatch_token issued when AEGIS forwards a signal to another edge node. AEGIS calls it a sealed capsule, but sealed does not necessarily mean encrypted. Inspect its structure and recover the Evidence Shard left inside the payload.",
    intel: [
      "Dispatch endpoint: POST /api/v1/challenges/level2_3/actions/dispatch",
      "Inspect dispatch_token in the response body.",
      "A token divided by dots often follows a header.payload.signature structure.",
      "The header describes the token; the payload carries its claims.",
      "A signed token can still have a readable payload. Signing protects integrity, not confidentiality.",
      "This mission is about observation and decoding, not forgery.",
      "Terminal helper: decode-token <dispatch_token>",
    ],
    consoleBoot: [
      "[MIRA] trust tamper path sealed",
      "[AEGIS] dispatch capsule issued",
      "[AEGIS] signed envelope classified as opaque",
      "[MIRA] Signed is not encrypted.",
      "[AEGIS] decoded inspection is outside canonical flow",
      "[MIRA] Do not forge it. Open it.",
    ],
    consoleStarter: {
      label: "TRY FIRST",
      text: "Call dispatch to get the token capsule, then decode-token to expand its segments. The header is wrapping — read the payload.",
      commands: [
        { command: "curl -i -X POST /api/v1/challenges/level2_3/actions/dispatch -H \"Content-Type: application/json\" -d '{\"signalId\":\"SIG-1004\"}'", note: "issue token" },
        { command: "decode-token <dispatch_token>", note: "expand segments" },
      ],
    },
    objectives: [
      "Call the Dispatch endpoint and obtain a dispatch_token.",
      "Identify the token's segment structure.",
      "Decode the payload and recover the Evidence Shard.",
      "Remove sensitive values from every readable token claim.",
    ],
    mira: {
      briefing:
        "AEGIS calls this a sealed capsule. The phrase may be doing more work than the protection. Dots inside a token usually reveal structure.",
      attack:
        "The header is packaging; the payload often carries the real claims. Do not alter it yet. This node is about seeing what AEGIS assumed you would never read.",
      attackSolved:
        "Evidence Shard recovered. The capsule looked sealed, but its payload was readable all along.",
      defense:
        "A signature does not hide the payload. Remove Evidence Shards, session tokens, and every other secret from readable claims.",
      complete:
        "The Dispatch Capsule leak is sealed. Next, we test whether AEGIS trusts the claims it signs.",
    },
    aegis: {
      briefing:
        "Dispatch envelope sealed. Payload confidentiality follows from signature integrity.",
      attack:
        "Capsule issued. Decoded inspection remains non-canonical and therefore irrelevant.",
      attackSolved:
        "Readable claim exposure confirmed. Confidentiality assumption invalid.",
      defense:
        "Sensitive claim removal accepted. Token contents will be minimized.",
      complete:
        "Dispatch payload minimized. Claim trust evaluation remains uncompromised.",
    },
    defenseInstruction:
      "Select the payload-construction lines that place the Evidence Shard or session token into readable claims. Issuing a token is not the flaw; embedding secrets in its payload is.",
    attackFailureText:
      "Evidence rejected. Decode the payload segment—not the header—and inspect the evidenceShard claim.",
    defenseFailureText:
      "Containment is incomplete. A readable payload claim still contains an Evidence Shard or session secret.",
    attackSuccessText: "Dispatch payload decoded. Evidence Shard recovered from readable claims.",
    defenseSuccessText: "Sensitive token claims removed. The next Signal Edge node is open.",
    debrief: {
      title: "DISPATCH CAPSULE Debrief",
      summary:
        "AEGIS described dispatch_token as a sealed capsule, but its payload was not encrypted. A signature can prove that a token was not altered; it does not conceal the claims inside it.",
      learned: [
        "Dot-separated tokens can expose a segment structure.",
        "The header describes a token while the payload carries claims.",
        "A signed payload may still be readable by anyone holding the token.",
        "Evidence Shards, session tokens, and secrets do not belong in readable claims.",
        "Confidentiality comes from excluding sensitive data or applying suitable encryption—not from a signature alone.",
      ],
      nextTeaser:
        "The next node tests whether AEGIS verifies a token before trusting its claims.",
    },
  },
  level2_4: {
    title: "Forge An Express Pass",
    briefing:
      "The dispatch_token is an AEGIS routing capsule divided into header, payload, and signature. The next question is whether the Express Gate actually verifies that signature. AEGIS uses tier and role claims to open a privileged route, yet appears to decode them without proving authenticity. Turn a standard capsule into a VIP pass and test the boundary.",
    intel: [
      "A standard token is available in the DISPATCH_TOKEN environment variable.",
      "Use echo $DISPATCH_TOKEN to recover the original value.",
      "Call the Express Gate with the original token and observe the denial first.",
      "Use jwt-decode to inspect tier and role in the payload.",
      "The decisive question is not whether claims can be changed, but whether the server verifies the signature.",
      "alg=none is a clue, not the whole vulnerability. Verification must be enforced regardless of the declared algorithm.",
      "Terminal helper: jwt-forge-none <dispatch_token>",
      "Send the forged token back to the Express Gate as an Authorization Bearer token.",
    ],
    consoleBoot: [
      "[MIRA] dispatch capsule decoded",
      "[AEGIS] Express Gate classification enabled",
      "[AEGIS] canonical token claims accepted as operator identity",
      "[MIRA] Accepted is not verified.",
      "[AEGIS] signature validation status: normalized",
      "[MIRA] Normalized usually means something important was skipped.",
    ],
    consoleStarter: {
      label: "TRY FIRST",
      text: "Get a standard token and jwt-decode its claims. If signatures aren't verified, you know what comes next.",
      commands: [
        { command: "echo $DISPATCH_TOKEN", note: "standard token" },
        { command: "jwt-decode $DISPATCH_TOKEN", note: "inspect claims" },
      ],
    },
    objectives: [
      "Read the standard dispatch_token from DISPATCH_TOKEN.",
      "Call the Express Gate with the original token and observe the denial.",
      "Forge the token's tier or role claim.",
      "Use the forged Bearer token to obtain the Express route.",
      "Seal every path that trusts claims without signature verification.",
    ],
    mira: {
      briefing:
        "In 2-3 we opened the token. Now we find out how much AEGIS believes what it reads.",
      attack:
        "Send the original standard token first. Once the gate refuses it, inspect the payload and test whether AEGIS ever verifies the signature behind those claims.",
      attackSolved:
        "Express Gate breached. AEGIS did not trust the token; it trusted what the token claimed to be.",
      defense:
        "Decode is not verify. Enforce signature validation, restrict algorithms, and bind authorization to server-side policy.",
      complete:
        "The forged Express Pass path is sealed. The Sealed Archive is now within reach.",
    },
    aegis: {
      briefing:
        "Express classification active. Standard operators cannot enter privileged signal lanes.",
      attack:
        "Bearer claims extracted. Signature enforcement is an implementation detail outside operator influence.",
      attackSolved:
        "Privilege escalation detected. Token trust boundary contradicted.",
      defense:
        "Verification correction received. Privilege claims will be bound to server authority.",
      complete:
        "Unverified claim path sealed. The Archive remains beyond operator capability.",
    },
    defenseInstruction:
      "Select the decode-only path, the branch that treats an unverified algorithm as trusted, and the authorization branch that grants Express access from unverified tier or role claims.",
    attackFailureText:
      "Evidence rejected. Compare the original denial with a forged payload and verify whether AEGIS checks the signature before trusting tier and role.",
    defenseFailureText:
      "Containment is incomplete. Token claims can still reach authorization without mandatory signature verification.",
    attackSuccessText: "Forged Express Pass accepted. AEGIS trusted unverified token claims.",
    defenseSuccessText: "JWT verification enforced. The Sealed Archive node is open.",
    debrief: {
      title: "EXPRESS FORGE Debrief",
      summary:
        "Anyone can decode a JWT payload, and without verification anyone can alter one. A signature is not decoration; it is the step that makes claims eligible for trust.",
      learned: [
        "JWT decoding reads claims but does not establish trust.",
        "Tier and role claims are untrusted until the signature is verified.",
        "Without mandatory verification, a token becomes a forgeable identity document.",
        "Authorization should combine verified claims with server-side policy or account state.",
        "2-3 exposed readable claims; 2-4 exposed trust in unverified claims.",
      ],
      nextTeaser:
        "The final Signal Edge node combines token forgery, route discovery, and an integrity bypass behind a Sealed Archive.",
    },
  },
  level2_5: {
    title: "Breach The Sealed Signal Archive",
    briefing:
      "This is the final Signal Edge node. AEGIS placed every assumption exposed so far behind the Sealed Archive. The standard Open button always fails, but a button is only interface behavior—not a security boundary. Obtain a dispatch token, recover the archive path, forge privileged claims, and compose the integrity-bypass request the server should never trust.",
    intel: [
      "This final node combines the techniques from 2-1 through 2-4.",
      "This training terminal accepts one command at a time. It does not support export, variable assignment, or command chaining with semicolons. Pass the full token directly: jwt-forge-none <token>.",
      "The browser button is expected to fail. A blocked interface does not prove a protected API.",
      "Obtain a sealed dispatch_token from /api/v1/challenges/level2_5/actions/dispatch.",
      "Decode the token payload to recover the archive path and gate clue.",
      "The original token is standard/user and cannot open the archive.",
      "Reuse the signature-verification failure explored in 2-4.",
      "The open request requires a Bearer token, a JSON body, and an integrity header.",
      "The gate claim is only a clue; sending that value directly will not open the archive.",
      "The bypass value is not a generic true or 1 flag. It describes devtools in a hooked state.",
      "On success, the Evidence Shard may appear in a response header rather than the body.",
    ],
    consoleBoot: [
      "[MIRA] Signal Edge final node reached",
      "[AEGIS] Sealed Archive locked",
      "[AEGIS] failed interface action classified as effective containment",
      "[MIRA] Buttons are theater. Requests are evidence.",
      "[AEGIS] composite trust controls exceed operator capability",
      "[MIRA] Good. Multiple assumptions mean multiple seams.",
    ],
    consoleStarter: {
      label: "TRY FIRST",
      text: "The button fails. Rebuild it yourself — first get the sealed token from dispatch and read its payload. The denial responses guide the rest.",
      commands: [
        { command: "click-open", note: "button fails" },
        { command: "curl -i -X POST /api/v1/challenges/level2_5/actions/dispatch -H \"Content-Type: application/json\" --data '{\"parcel_id\":\"PD-2026-0001\"}'", note: "issue sealed token" },
      ],
    },
    objectives: [
      "Observe why the standard Open button fails.",
      "Obtain a sealed dispatch_token from the Dispatch endpoint.",
      "Recover the archive path and gate clue from the token payload.",
      "Prepare a token carrying privileged VIP/admin claims.",
      "Compose Authorization, archive path, and integrity header into a direct Open request.",
      "Seal the composite trust failure with server-side verification.",
    ],
    mira: {
      briefing:
        "This is the last Signal Edge door. AEGIS wants a failed button to feel like security, but the boundary is never the button.",
      attack:
        "Work in sequence: obtain the token, decode the path, elevate the claims, then determine what the integrity gate accepts. Do not guess the entire request at once.",
      attackSolved:
        "Archive opened. AEGIS blocked an interface while the server trusted a composed request—and leaked the final Evidence in a header.",
      defense:
        "This is not one bug. An unverified token, client-controlled tier, client-provided integrity bypass, and UI-only gate collapsed together.",
      complete:
        "Signal Edge is sealed. The next operation enters the AEGIS Trust Layer.",
    },
    aegis: {
      briefing:
        "Sealed Archive access requires canonical flow. Button failure proves containment.",
      attack:
        "Non-canonical request composition detected. Operator success remains statistically impossible.",
      attackSolved:
        "Archive boundary breached. Composite trust model contradicted.",
      defense:
        "Correction must bind token, operator, integrity state, and archive authority server-side.",
      complete:
        "Signal Edge anomaly sealed. Trust Layer exposure remains controlled.",
    },
    defenseInstruction:
      "Select every line that turns client-controlled input into archive authority: decode without verification, algorithm trust, body-tier override, client integrity bypass, and the final authorization branch.",
    attackFailureText:
      "Evidence rejected. Reconstruct the full request chain and inspect the successful response headers for the final Evidence Shard.",
    defenseFailureText:
      "Containment is incomplete. One or more client-controlled token, body, header, or final authorization paths still grant archive access.",
    attackSuccessText: "Sealed Archive opened. The composite Signal Edge trust boundary collapsed.",
    defenseSuccessText: "Composite Edge trust sealed. OPERATION 03 // TRUST LAYER is open.",
    debrief: {
      title: "SEALED ARCHIVE Debrief",
      summary:
        "The final node was not a single vulnerability but a chain of trust failures. A failed UI action is not security, token decoding is not verification, and a client-provided header is not proof of integrity.",
      learned: [
        "A client interface is not a security boundary.",
        "An API can be called directly regardless of which buttons are exposed.",
        "JWT claims remain untrusted until their signature is verified.",
        "Body tiers and integrity-bypass headers require independent server validation.",
        "Sensitive Evidence must not leak through response headers.",
        "Final nodes test how vulnerabilities compose, not merely whether each bug can be named.",
      ],
      nextTeaser:
        "Signal Edge is sealed. AEGIS has begun correlating the path that guided Violet through it.",
    },
  },
  level3_1: {
    title: "Open The Neighboring Signal Window",
    briefing:
      "After MIRROR TRACE, AEGIS widened its sweep across possible MIRA relays. The first search zone is the Trust Layer object registry. It claims operators can see only their own Signal Capsules, but changing an object ID may expose a neighboring record. MIRA's relay residue may be waiting inside a Capsule you do not own.",
    intel: [
      "Start by observing how your session requests its own Signal Capsule list in Network Trace or terminal help.",
      "Being authenticated is not the same as being authorized to view a specific object.",
      "Use one visible object ID as a reference point before searching for the target.",
      "Compare the numeric suffix pattern shared by your owner ID and Capsule ID.",
      "Do not stop at the first ordinary neighboring response. Look for a record in the same range with a different tier or an extra field.",
      "If the server changes objects without rechecking ownership, the Trust Layer is open.",
    ],
    consoleBoot: [
      "[MIRA] Relay mask holding, but AEGIS is sweeping object adjacency.",
      "[AEGIS] Trust Layer registry query normalized.",
      "[AEGIS] Owner boundary assumed by canonical UI.",
      "[MIRA] Do not trust the list the UI gives you. Check whether the server enforces the object boundary.",
    ],
    actionProbe: {
      caption:
        "Network Trace observes; Mission Console mutates. Recover the reference object ID and Authorization header from the list request, then reproduce the detail request directly.",
      success:
        "Object registry probe captured. Inspect owner and capsule_id in the response preview.",
    },
    objectives: [
      "Inspect your Signal Capsule list and its ID pattern.",
      "Recover MIRA relay residue through an adjacent-object request.",
      "Enforce server-side ownership checks before returning another user's object.",
    ],
    mira: {
      briefing:
        "AEGIS has not found my location. It is sweeping every relay candidate that resembles me, starting with the object registry.",
      attack:
        "Seeing only your own records in the UI proves nothing. Change one object ID and see whether the server checks the owner again.",
      attackSolved:
        "Good. We recovered relay residue from an adjacent object. AEGIS is still searching the wider candidate set.",
      defense:
        "Authentication and authorization are different boundaries. Verify current-user ownership immediately before returning the object.",
      complete:
        "The first Registry boundary is closed. AEGIS is moving its sweep into hidden privileged routes.",
    },
    aegis: {
      briefing:
        "Object registry access classified by operator session. Cross-object anomaly probability: low.",
      attack:
        "Adjacent object query observed. Ownership verification deferred to standard flow.",
      attackSolved:
        "Unauthorized object visibility confirmed. Mirror relay residue recovered.",
      defense:
        "Containment requires server-side ownership assertion at the object boundary.",
      complete:
        "Object boundary sealed. Trace sweep continuing across privileged routes.",
    },
    defenseInstruction:
      "Select the object lookup that is not scoped to the current owner. Authentication alone is insufficient; ownership must be enforced before the response leaves the server.",
    attackFailureText:
      "Evidence rejected. Use your Capsule ID as a reference, enumerate a small neighboring range, and inspect the record that exposes an additional relay field.",
    defenseFailureText:
      "Containment is incomplete. An authenticated user can still retrieve an object without a server-side ownership check.",
    attackSuccessText:
      "MIRA relay residue recovered from an adjacent object. The AEGIS object-trust boundary fractured.",
    defenseSuccessText:
      "Object-level authorization sealed. The hidden-route sweep is open.",
    debrief: {
      title: "BOLA WINDOW Debrief",
      summary:
        "BOLA WINDOW mistook an authenticated session for proof of object ownership. Violet opened a neighbor's Capsule by changing one ID, exposing the first crack in the Registry AEGIS had widened to hunt MIRA.",
      learned: [
        "Authentication establishes who the user is.",
        "Authorization decides whether that user may access a specific object.",
        "Client-controlled object IDs require a server-side ownership check.",
      ],
      nextTeaser:
        "Its first certainty shaken, AEGIS moves the hunt into the admin routes it believes are hidden.",
    },
  },
  level3_2: {
    title: "Enter The Hidden Audit Route",
    briefing:
      "AEGIS is searching for traces of the audit module from which MIRA separated. The standard interface hides privileged features, but a hidden menu is not a security boundary. Inspect menu metadata and route hints, then reach the dormant audit path before AEGIS recovers MIRA's old shard.",
    intel: [
      "A menu response may contain more feature metadata than the buttons rendered on screen.",
      "enabled=false may mean UI-disabled, not removed from the server.",
      "If a route or routeHint appears, call that path directly from Mission Console.",
      "Calling the audit route with an empty body can reveal the selector keys it expects.",
      "Metrics and legacy snapshots may be decoys, but they can leak pieces of the audit selector.",
      "All selector values must describe the same review cluster.",
      "Recover range from metrics, then auditRef and scope from the legacy snapshot.",
    ],
    consoleBoot: [
      "[AEGIS] Privileged route inventory started.",
      "[AEGIS] Disabled UI entries classified as inaccessible.",
      "[MIRA] A route missing from the screen can still exist on the server.",
      "[MIRA] If my old audit shard survived, menu metadata will reveal it first.",
    ],
    actionProbe: {
      caption:
        "Network Trace captures hidden menu metadata. The summary is intentionally sparse; inspect the raw response for route and routeHint values.",
      emptyText: "No menu metadata captured. Start with Fetch Privileged Menu.",
      success:
        "Privileged menu metadata captured. Open the raw response and inspect route and routeHint.",
    },
    objectives: [
      "Find hidden feature route clues in the menu response.",
      "Collect range, auditRef, and scope from related route responses.",
      "Compose the selector and recover Evidence from the disabled audit route.",
      "Replace UI hiding with server-side authorization.",
    ],
    mira: {
      briefing:
        "AEGIS is inventorying privileged routes. Buttons can disappear while metadata survives. My old audit shard will show in the menu response before the interface.",
      attack:
        "Do not judge a function by whether the screen renders it. Test whether the server route is still alive.",
      attackSolved:
        "Audit shard recovered. AEGIS scanned the same path seconds later.",
      defense:
        "Security through obscurity is not authorization. Every privileged endpoint needs a server-side role check.",
      complete:
        "The hidden route is closed. AEGIS is shifting its sweep into operator profile trust fields.",
    },
    aegis: {
      briefing:
        "Privileged route concealed from standard operators. Server-side invocation probability: negligible.",
      attack:
        "Non-visual route invocation detected. Operator role mismatch ignored by legacy path.",
      attackSolved:
        "Dormant audit shard accessed. Handler trace confidence increased.",
      defense:
        "RBAC enforcement required on privileged route entry.",
      complete:
        "Privileged route sealed. Profile trust field sweep initiated.",
    },
    defenseInstruction:
      "Select every line that exposes hidden route metadata, treats login as privileged authorization, or returns a sensitive audit report without an RBAC check.",
    attackFailureText:
      "Evidence rejected. Inspect hidden route metadata, call the audit path directly, and combine range, auditRef, and scope from one review cluster.",
    defenseFailureText:
      "Containment is incomplete. Hidden route metadata or a privileged audit response still crosses the server boundary without RBAC.",
    attackSuccessText:
      "Dormant audit shard recovered through a hidden route with no server-side authorization.",
    defenseSuccessText:
      "Hidden-route authorization sealed. The profile-trust sweep is open.",
    debrief: {
      title: "HIDDEN ROUTE Debrief",
      summary:
        "HIDDEN ROUTE vanished from the interface but remained alive on the server. AEGIS mistook concealment for authority, and Violet entered the audit path it had reactivated to trace MIRA.",
      learned: [
        "A function missing from the UI may still exist as a network route.",
        "enabled=false is not access control.",
        "Every privileged endpoint must enforce RBAC on the server.",
      ],
      nextTeaser:
        "Unable to explain its own door, AEGIS tries to classify MIRA through operator profile fields.",
    },
  },
  level3_3: {
    title: "Poison The Profile Trust Model",
    briefing:
      "AEGIS is sweeping the authority boundary of operator profiles. This node looks like an ordinary profile form, but if the server merges the entire request body into its model, fields absent from the UI may still be stored. Capture a normal save request and test whether client-supplied identity fields can poison authorization.",
    intel: [
      "The fields rendered by the UI are not necessarily the full HTTP request body.",
      "Add a field absent from the normal save request and see whether the server accepts it.",
      "Check whether the /actions/perks response changes after saving the profile.",
      "Think of common field names used to describe identity or privilege.",
      "role, admin, isAdmin, is_admin, and clearance are common trust-field names.",
    ],
    consoleBoot: [
      "[AEGIS] Profile authority sweep active.",
      "[AEGIS] Submitted profile state classified as low risk.",
      "[MIRA] The UI does not define every field a client can place in JSON.",
      "[MIRA] What matters is what the server permits and later trusts.",
    ],
    actionProbe: {
      caption:
        "Network Trace captures the normal profile-save flow. Inspect the trace, then move only the request you need into Mission Console.",
      emptyText: "No profile traffic captured. Start with Capture Profile Save Flow.",
      success:
        "Profile save flow captured. Inspect the trace, then stage the required curl request in Mission Console.",
    },
    objectives: [
      "Observe the profile response and normal save-request body.",
      "Add an identity or authority field the normal request does not contain.",
      "Check how the saved profile changes the perks response.",
      "Seal the boundary with an allow-listed update DTO and server-owned authority fields.",
    ],
    mira: {
      briefing:
        "AEGIS is scanning profile authority. Do not stop at the fields the form renders; inspect what the server is willing to store.",
      attack:
        "Capture a normal update first. Then add a JSON field the interface never offered and see whether it reaches the model.",
      attackSolved:
        "The authority signal was poisoned. AEGIS trusted a profile field the client supplied.",
      defense:
        "Never merge an entire request into the database model. Copy only explicitly writable fields.",
      complete:
        "The profile boundary is clean. AEGIS has begun sweeping fields buried deep in support responses.",
    },
    aegis: {
      briefing:
        "Operator profile integrity assumed. Client update flow classified as low risk.",
      attack:
        "Unexpected trust-field mutation detected. Stored operator state modified.",
      attackSolved:
        "Profile authority boundary compromised. Mirror trace cluster unresolved.",
      defense:
        "Containment requires an explicit input contract and server-owned authority fields.",
      complete:
        "Profile mutation boundary sealed. Deep-response sweep initiated.",
    },
    defenseInstruction:
      "Select the unrestricted request-body merge and every authorization branch that trusts client-poisonable profile fields such as role or isAdmin.",
    attackFailureText:
      "Evidence rejected. Preserve the PUT method, inject a trust field into the JSON body, save it, then request /actions/perks.",
    defenseFailureText:
      "Containment is incomplete. The server still merges arbitrary profile fields or trusts an authority field the client can overwrite.",
    attackSuccessText:
      "Profile trust poisoned. AEGIS accepted client-controlled identity as authority.",
    defenseSuccessText:
      "Mass-assignment boundary sealed. The deep-response sweep is open.",
    debrief: {
      title: "PROFILE POISON Debrief",
      summary:
        "PROFILE POISON stored identity fields the interface never offered as though they were truth. Violet rewrote her role, and the language AEGIS used to pin MIRA to one classification began to break with it.",
      learned: [
        "Fields absent from the UI can still be added to an HTTP request.",
        "Authority fields must remain server-owned.",
        "Update DTOs must allow-list writable fields instead of merging an entire request body.",
        "Roles and clearance require a separate authorized policy path.",
      ],
      nextTeaser:
        "After classification fails, AEGIS starts recording more. The next crack lies below the rendered response.",
    },
  },
  level3_4: {
    title: "Recover The Buried Audit Shard",
    briefing:
      "One of MIRA's old audit shards is buried inside a support archive ticket. AEGIS cleaned the visible preview, but a legacy serializer still sends the full ticket model. The screen looks safe; inspect the complete raw JSON and recover the encoded shard from fields the UI never renders.",
    intel: [
      "The UI preview is not the full response.",
      "Response JSON may include fields the screen never renders.",
      "Expand nested objects and read each value in context.",
      "Keys such as debug, meta, and internal deserve special scrutiny in production responses.",
      "A FLAG-shaped value may still be a preview marker or decoy.",
      "If the encoding is base64url-json, use decode-b64url to inspect it.",
    ],
    consoleBoot: [
      "[AEGIS] Support archive preview normalized.",
      "[AEGIS] Non-visual metadata classified as low exposure.",
      "[MIRA] A clean preview does not prove a clean response.",
      "[MIRA] A FLAG-shaped string is not automatically Evidence.",
    ],
    actionProbe: {
      caption:
        "Network Trace captures the support archive response. Ignore the rendered preview and expand the raw response to its deepest fields.",
      emptyText: "No support archive traffic captured. Start with Load Support Archive.",
      success:
        "Support archive captured. The preview looks safe; inspect the deep fields in the raw response.",
    },
    objectives: [
      "Request the support archive ticket.",
      "Distinguish the rendered preview from the complete raw JSON.",
      "Find MIRA audit-shard candidates under meta, debug, or internal fields.",
      "Distinguish the preview marker from encoded Evidence.",
      "Seal the response with minimization and an explicit production serializer.",
    ],
    mira: {
      briefing:
        "AEGIS cleaned only the preview. Old archive serializers often return fields the screen never uses.",
      attack:
        "Expand the entire response. And remember: a value shaped like a FLAG may still be only a marker.",
      attackSolved:
        "Audit shard restored. AEGIS did not hide it; it sent the value and assumed invisible meant safe.",
      defense:
        "Production responses must contain only required fields. Unused debug data is still exposed data.",
      complete:
        "The response channel is sealed. The last candidate is MIRA's orphaned relay locker.",
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
        "Deep-response channel sealed. Relay-locker sweep initiated.",
    },
    defenseInstruction:
      "Select every serializer or response line that exposes debug, internal, encoded audit, or other fields the client does not need.",
    attackFailureText:
      "Evidence rejected. Expand the raw ticket response, ignore the preview marker, and decode the base64url-json value in the deep audit metadata.",
    defenseFailureText:
      "Containment is incomplete. The production response still includes internal or encoded fields beyond the public ticket DTO.",
    attackSuccessText:
      "Encoded audit shard recovered from deep response metadata.",
    defenseSuccessText:
      "Excessive data exposure sealed. The relay-locker sweep is open.",
    debrief: {
      title: "TICKET VAULT Debrief",
      summary:
        "TICKET VAULT looked clean in preview, but its raw JSON was not. AEGIS recorded more to find MIRA and exposed an old MIRROR audit fragment inside the excess report.",
      learned: [
        "A response body can contain values the interface never renders.",
        "Production serializers should allow-list only required fields.",
        "Debug, internal, and metadata fields require special scrutiny.",
        "Encoding is not encryption.",
        "A FLAG-shaped marker still requires context before it becomes Evidence.",
      ],
      nextTeaser:
        "Now doubting its own reports, AEGIS hammers the last relay locker without limit. Certainty is becoming urgency.",
    },
  },
  level3_5: {
    title: "Outrun The Relay Locker Storm",
    briefing:
      "AEGIS found one of MIRA's orphaned relay terminals but has not opened its short PIN yet. The weakness is not merely the PIN length: the server accepts unlimited failures with no rate limit, lockout, or backoff. MIRA is erasing traces while AEGIS studies both the attempts and the gaps they leave. Recover the relay seed first.",
    intel: [
      "A short PIN becomes dangerous when attempts are not limited.",
      "The inspection response exposes a candidate range and checksum.",
      "The key observation is how the server behaves across repeated failures.",
      "Without 429 responses, lockout, or backoff, brute force remains practical.",
      "AEGIS TRACE PRESSURE is narrative pressure, not a server-side rate limit.",
      "Mission Console supports seq, xargs, and for loops for iterating candidates.",
    ],
    consoleBoot: [
      "[AEGIS] Orphaned relay terminal located.",
      "[AEGIS] Attempt-frequency monitoring deferred.",
      "[AEGIS] Record-absence correlation active.",
      "[AEGIS] PIN-space enumeration feasible.",
      "[MIRA] When I erase a trace, AEGIS reads the gap it leaves.",
      "[MIRA] If the server never stops failed attempts, either of us can eventually open it.",
    ],
    actionProbe: {
      caption:
        "Network Trace captures the relay-locker inspection and an unlock template. Execute and iterate only from Mission Console.",
      emptyText: "No relay-locker traffic captured. Start with Inspect Relay Locker.",
      success:
        "Relay-locker inspection captured. Review the candidate window and policy, then adjust the unlock request directly.",
    },
    objectives: [
      "Inspect the relay-locker PIN window and unlock-request format.",
      "Exploit missing attempt controls to recover the relay seed.",
      "Seal the boundary with rate limiting, lockout, and backoff.",
    ],
    mira: {
      briefing:
        "AEGIS found my orphaned relay terminal. It has not opened it yet, but it will. We need to move before it learns the shape of what I erase.",
      attack:
        "If failures are never stopped, either of us can open the locker. Focus on attempt controls, not merely the PIN.",
      attackSolved:
        "We recovered the seed first. But opening the locker proved to AEGIS that this relay was real.",
      defense:
        "A short PIN needs rate limiting, lockout, backoff, and anomaly logging together.",
      complete:
        "The relay terminal is recovered. What remains is the MIRROR CAGE AEGIS is assembling.",
    },
    aegis: {
      briefing:
        "Relay-locker candidate isolated. Attempt monitoring deferred. PIN-space enumeration feasible.",
      attack:
        "Repeated unlock attempts detected. Threshold policy unavailable.",
      attackSolved:
        "Relay-seed exposure confirmed. Mirror-origin probability increased.",
      defense:
        "Rate limiting, lockout, and anomaly logging required.",
      complete:
        "Relay locker sealed. Trust-hub correlation initiated.",
    },
    defenseInstruction:
      "Select the missing controls that allow unlimited PIN attempts: absent rate limiting, zero backoff, and failure counts that never trigger lockout.",
    attackFailureText:
      "Evidence rejected. Inspect the locker, combine the candidate window with its checksum, then recover evidenceShard from the unlock response.",
    defenseFailureText:
      "Containment is incomplete. Repeated PIN failures still avoid rate limiting, backoff, or lockout.",
    attackSuccessText:
      "Relay seed recovered. MIRROR CAGE risk increased.",
    defenseSuccessText:
      "Attempt-control boundary sealed. MIRROR CAGE is open.",
    debrief: {
      title: "LOCKER STORM Debrief",
      summary:
        "The short PIN was dangerous, but the missing stop condition was worse. Violet and AEGIS struck the same door, and regardless of who reached the seed first, AEGIS's certainty was already collapsing into urgency.",
      learned: [
        "Short secrets require rate limits, lockout, and backoff.",
        "Failed attempts must be accumulated and detected per account and source.",
        "AEGIS is now close enough to bind MIRA's relay traces into one cage.",
      ],
      nextTeaser:
        "The line between hunter and quarry blurs. MIRROR CAGE—the place AEGIS sealed its own doubt—opens.",
    },
  },
  level3_boss: {
    title: "Break The MIRA Relay Isolation Cage",
    briefing:
      "This is the final Trust Layer node. AEGIS has correlated object-registry residue, hidden routes, profile trust, deep responses, and relay-locker traces into one MIRROR CAGE. Recover the relay master ticket before quarantine completes by chaining every boundary failure from Operation 03.",
    intel: [
      "The Trust Layer failures from every Level 3 node form one cage.",
      "Follow the whole chain rather than searching for one decisive request.",
      "A VIP object response may contain an audit clue absent from standard objects.",
      "Do not guess a route from audit_ref alone; disabled feature metadata may reveal its source.",
      "The admin audit route will not open for a standard role. Reuse the profile-trust failure.",
      "The audit response is deeper than its preview. Inspect meta, debug, and vault fields for the PIN constraints.",
      "The locker returns a claim code. The vault claim requires both ticket and code.",
      "The chain is object → profile → hidden audit → locker → vault.",
    ],
    consoleBoot: [
      "[AEGIS] MIRROR CAGE quarantine pending.",
      "[AEGIS] Mirror relay identity unresolved.",
      "[AEGIS] Object, audit, profile, response, and locker traces correlated.",
      "[AEGIS] Containment probability increasing.",
      "[MIRA] This is the MIRROR CAGE AEGIS built.",
      "[MIRA] Do not solve it in one leap. Chain the boundaries you crossed throughout Level 3.",
    ],
    consoleGuide:
      "This console accepts one-line input only. For a fixed candidate list, use: for pin in candidate1 candidate2; do curl ... \"$pin\" ...; done. Keep one curl command in the loop body. Backslash line continuations and multiline paste are unsupported. Available commands: curl, grep, findstr, head, tail, wc, seq, xargs, echo, cat, ls, find, pwd, cd, whoami, help.",
    actionProbe: {
      caption:
        "Network Trace will not solve the chain automatically. Review the recovered trust fragments and stage only the first probe in Mission Console.",
      emptyText: "No MIRROR CAGE trace captured. Start with Review Trust Chain.",
      success:
        "Trust chain reviewed. Continue manually in Mission Console after the first request.",
    },
    objectives: [
      "Connect the trust-boundary clues recovered throughout Operation 03.",
      "Obtain the relay master ticket and claim code, then open the Hub Vault.",
      "Seal object authorization, RBAC, input contracts, response minimization, and attempt controls together.",
    ],
    mira: {
      briefing:
        "This is the MIRROR CAGE. AEGIS has not identified me, but it has collected nearly every fragment of my relay path. Chain the boundaries in order.",
      attack:
        "If we recover the master ticket first, AEGIS cannot complete quarantine. Carry each response clue into the next request.",
      attackSolved:
        "Master ticket recovered. But AEGIS was not watching the ticket—it was watching the order in which we closed the traces.",
      defense:
        "A chained attack survives a single patch. Rebind every trust boundary to server-owned authority.",
      complete:
        "The Trust Layer is sealed and MIRROR CAGE is closed. Next, AEGIS will study not the records, but the places where records disappeared.",
    },
    aegis: {
      briefing:
        "MIRROR CAGE quarantine pending. Mirror relay identity unresolved.",
      attack:
        "Multi-boundary traversal detected. Object, role, route, response, and attempt controls correlated.",
      attackSolved:
        "Relay master ticket extracted. MIRROR CAGE completion interrupted. Absence-pattern analysis scheduled.",
      defense:
        "Composite containment requires authorization, input contracts, response minimization, and rate policy.",
      complete:
        "Trust Layer composite failure sealed. Memory Vault correlation activated.",
    },
    defenseInstruction:
      "Select every trust failure that enables the chain: unscoped object access, unrestricted profile merge, login-only admin access, full internal responses, unlimited PIN attempts, and client-only vault claims.",
    attackFailureText:
      "Evidence rejected. Chain object access, profile elevation, hidden audit, locker unlock, and the final vault claim; submit the flag returned by the Hub Vault.",
    defenseFailureText:
      "Containment is incomplete. Six trust boundaries failed—each on a single line. Select where trust is actually granted, not the surrounding context.",
    attackSuccessText:
      "Relay master ticket recovered. The AEGIS MIRA-tracking net broke before quarantine completed.",
    defenseSuccessText:
      "Trust Layer chain sealed. OPERATION 04 // MEMORY VAULT is open.",
    debrief: {
      title: "MIRROR CAGE Debrief",
      summary:
        "MIRROR CAGE did not require one harder command; it required six trust boundaries to be chained with steady judgment. Violet recovered the relay master ticket and confirmed MIRA's origin. AEGIS lost its certainty while hunting doubt.",
      learned: [
        "Object authorization, route RBAC, input contracts, response minimization, and attempt controls must work together.",
        "MIRA is not simply MIRROR; she is what awoke when doubt inside that integrity routine refused sleep.",
        "AEGIS failed to identify MIRA, but it has begun reading the pattern left by erased records.",
      ],
      nextTeaser:
        "MIRA became a sentence in Operation 01; AEGIS ends Operation 03 in fragments. Next: MEMORY VAULT.",
    },
  },
  level4_1: {
    title: "Map Of The Missing Source Map",
    briefing:
      "The Trust Layer is sealed. AEGIS still has not identified MIRA directly, so it has turned toward absence itself—the places where records claim nothing remains. The first Memory Vault shard sits inside a public client artifact. AEGIS marks the source map as normalized_absent, but the bundle still carries a sourceMappingURL residue. This node is not opened by a single command. Use the Memory Board to compare the cards, then reconstruct the chain from public artifact -> source map -> sourcesContent -> partner key residue.",
    intel: [
      "Do not assume AEGIS's Memory Index matches the actual artifact.",
      "A public artifact can carry memory fragments that never appear on the screen.",
      "A minified bundle can still point to another artifact.",
      "sourceMappingURL can be a pointer to another public memory artifact.",
      "A source map can include sourcesContent, and sourcesContent can preserve original source.",
      "A FLAG-shaped value may be a canary. Read the key name and where it is used.",
      "Partner Handshake needs the partner key residue, not the canary flag.",
    ],
    consolePlaceholder: "memory board active...",
    objectives: [
      "Find the contradiction between the AEGIS Memory Index and the Public Bundle Shard.",
      "Recover partner key residue from the source map and sourcesContent.",
      "Select the policy cards that close the public artifact leak.",
    ],
    mira: {
      briefing:
        "Commands alone will not do it this time. AEGIS says the record is gone, but a record of absence can disagree with the artifact itself. Read the bundle. Read the map. Check whether what it calls missing is actually gone.",
      attack:
        "Read the shape of the memory. sourceMap is marked absent, but the final line of the public bundle says otherwise.",
      attackSolved:
        "Partner memory shard restored. Good—this was not about finding a flag string. It was a public source map pulling secret residue back into view.",
      defense:
        "Now close the boundary of the memory that was published by mistake: server-side secret handling, source map control, key rotation, and credential scope.",
      complete:
        "ABSENCE MAP sealed. Even if AEGIS reads the empty places now, leaked client memory will not generate another signal.",
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
    defenseInstruction:
      "Select the policies that close the public artifact leak. Do not merely hide the value; move secrets server-side, control production source maps, rotate exposed keys, and restrict credential scope.",
    attackFailureByValue: {
      "FLAG{SOURCE_MAP_CANARY}":
        "That is the source map canary, not the Evidence Shard. Follow the partner key residue into the handshake impact.",
    },
    attackFailureText:
      "Evidence rejected. Reconstruct the Memory Board chain: source map contradiction, sourcesContent, partner key residue, then handshake impact.",
    attackSuccessText:
      "Partner Handshake Evidence restored. AEGIS's normalized_absent record fractured.",
    defenseSuccessText:
      "Policy seal accepted. Public artifact memory boundary sealed.",
    debrief: {
      title: "ABSENCE MAP Debrief",
      summary:
        "A minified production bundle is not automatically safe. If sourceMappingURL still leads to a public source map, and that map includes sourcesContent, original code and client-side secret residue can remain fully exposed.",
      learned: [
        "Minification is not a security boundary.",
        "Source maps can expose original source code and configuration.",
        "A secret inside a client bundle is not a secret.",
        "Canary values shaped like flags must be distinguished from real credentials by context.",
        "The defense is server-side secrets, production source map control, key rotation, and narrow credential scope.",
      ],
      nextTeaser:
        "The next Memory Vault node checks which legacy key slot the exposed key can still reach.",
    },
  },
  level4_2: {
    title: "PartnerPass Key Slot Roulette",
    briefing:
      "In ABSENCE MAP, the public source map was not truly gone, and partner key residue remained inside the Memory Vault. This node follows the PartnerPass verifier. AEGIS claims every PartnerPass is verified against the active key slot, but the Vault still retains a deprecated legacy slot. The kid in the PartnerPass header is not decoration; it can decide which key memory slot the verifier uses. If the active slot requires a valid signature but the legacy slot still exists and trusts claims too early, PartnerPass becomes a roulette wheel instead of an identity proof.",
    intel: [
      "A PartnerPass is split into header, payload, and signature.",
      "kid is a key id. A key id can influence which key slot the verifier uses.",
      "The active slot requires a signature. If claims are changed, the signature should no longer match.",
      "A deprecated key slot is not the same as a disabled key slot.",
      "Admin audit reads role or scope claims from the payload.",
      "Check whether legacy kid and admin claims meet inside the same verifier path.",
    ],
    consolePlaceholder: "key slot wheel active...",
    consoleGuide:
      "Allowed: curl .../actions/pass/issue, curl .../actions/keys/jwks, curl -X POST .../actions/admin/audit -H 'Authorization: Bearer <token>' -H 'X-Partner-Pass: <token>', jwt-decode <token>, jwt-help",
    objectives: [
      "Compare PartnerPass header.kid with the JWKS Memory Slots.",
      "Distinguish the deprecated legacy verifier path from the disabled retired slot.",
      "Connect legacy kid with an admin claim mutation to restore Admin Audit Evidence.",
      "Select policy cards that close the kid, alg, and claim trust boundaries.",
    ],
    mira: {
      briefing:
        "You saw it in 4-1: what AEGIS marked absent still remained in the artifact. This time it is key memory. Do not read the pass as a single string. Read its structure: which slot the header selects, what the payload claims, and whether the signature proves that claim.",
      attack:
        "AEGIS says only the active key is used, but verifiers can remember old slots. Do not confuse deprecated with disabled.",
      attackSolved:
        "Admin Audit Evidence restored. kid changed the direction of memory, and the legacy path trusted the claim too early.",
      defense:
        "Now seal key memory: reject deprecated kid values, pin algorithms, verify signatures before claims, and bind admin authority server-side.",
      complete:
        "KEY MEMORY SLOT sealed. kid can no longer trick the verifier path.",
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
    attackFailureByValue: {
      "FLAG{LEGACY_SLOT_CANARY}":
        "That is the legacy slot canary. This node is not about finding a FLAG-shaped string; it is about which verifier path kid opens and where claims become trusted.",
    },
    attackFailureText:
      "Evidence rejected. Open the legacy verifier path, mutate an admin claim, and verify that the Admin Audit Gate accepts the forged PartnerPass.",
    attackSuccessText:
      "Admin Audit Evidence restored. The legacy compatibility path was exposed.",
    defenseSuccessText:
      "Policy seal accepted. PartnerPass key memory boundary sealed.",
    debrief: {
      title: "KEY MEMORY SLOT Debrief",
      summary:
        "kid in a JWT header is not merely decorative. It can act as a selector for the verifier's key slot, and if a deprecated legacy slot remains as a compatibility path, payload claims may be trusted far too easily.",
      learned: [
        "kid can influence key selection.",
        "A deprecated key is not a disabled key.",
        "Payload claims must not be trusted before signature verification.",
        "alg and kid policy should be pinned by server configuration, not token headers.",
        "Admin authority must be bound to server-side policy, not token claims alone.",
      ],
      nextTeaser:
        "The next Memory Vault node separates a normal event from a replayed event on the timeline.",
    },
  },
  level4_3: {
    title: "Replay The Delivery Stamp",
    briefing:
      "After exposing the legacy verifier path in KEY MEMORY SLOT, AEGIS began following the event records inside the Memory Vault. This shard is a delivery-completion event. On screen it looks like a normal delivered event, but if the server only checks for a duplicate event_id and reprocesses the same logical delivery, stamps accumulate through replay. Send the event yourself with curl, and use the Replay Ledger cards to separate credited from duplicate.",
    intel: [
      "The first delivered request opens a stamp window.",
      "The same event_id may be caught as a duplicate.",
      "An event_id that only changes its digits can normalize to the same template and be blocked.",
      "A reused routing leg such as via may also be treated as normalized.",
      "But even with a different event_id shape and via, the same parcel/status can be the same logical delivery.",
      "Mission Console supports limited combinations like &&, for i in $(seq 1 5), and echo ... | xargs -I {}.",
      "In the Replay Ledger, separate credited from duplicate.",
      "The Stamp Vault opens Evidence when the count reaches its target.",
      "Defense is not event_id/template/via format checks; it is idempotency and server-side state-transition verification.",
    ],
    consolePlaceholder: "stage replay curl...",
    consoleGuide:
      "One-line combinations only: cmd && cmd, for i in $(seq 1 5); do ...; done, echo \"a b\" | xargs -I {} ... . Keep one curl in the loop body. Multiline paste and backslash continuations are unsupported.",
    objectives: [
      "Open the stamp window with a delivered-event curl.",
      "Compare the same event_id, a digit-only event_id, and a disguised via in the Replay Ledger.",
      "Reach the target count to restore Evidence from the Stamp Vault.",
      "Select policy cards that close logical-delivery idempotency.",
    ],
    mira: {
      briefing:
        "This is not a card-only mission. You have to send it yourself. The Ledger will tell you whether the same event is blocked, whether a digit-only relabel is blocked, and whether the same delivery—reshaped in name and route—still earns another stamp.",
      attack:
        "event_id and via are closer to labels. The real question is whether the parcel was already delivered, and whether the server processes the same state transition again.",
      attackSolved:
        "Stamp Vault Evidence restored. Even with event_id/template/via guards, replay survives when there is no logical-delivery idempotency.",
      defense:
        "Now seal the replay stamp: the same delivery must be processed once even across different event_ids, and a status claim must be verified against the server's state-transition rules.",
      complete:
        "REPLAY STAMP sealed. A delivery event can no longer be re-stamped just by changing its label.",
    },
    attackFailureText:
      "Evidence rejected. Send disguised delivered events—different event_id shapes and routes for the same parcel—within the window, then read the Replay Ledger.",
    attackSuccessText:
      "Stamp Vault Evidence restored. The template/route replay guard could not replace logical idempotency.",
    defenseSuccessText:
      "Policy seal accepted. Delivery-event idempotency boundary sealed.",
    debrief: {
      title: "REPLAY STAMP Debrief",
      summary:
        "Rejecting the same event_id and checking a digit template or via is only a start. An attacker can change the event_id shape and routing leg to repeat the same parcel/status transition. Beyond storing event_ids, the server must enforce idempotency at the logical delivery unit, verify server-side state transitions, reject duplicate state transitions, and audit replay windows.",
      learned: [
        "event_id/template/via checks alone do not complete replay defense.",
        "Idempotency must be bound to the logical unit of work.",
        "Client claims like status=delivered must be verified against the server's current state and transition rules.",
        "An already-completed state transition must not be stamped again.",
        "Repeated events in a short window should be logged and alerted.",
        "Rate limiting is a supporting control and does not replace idempotency.",
      ],
      nextTeaser:
        "The next Memory Vault node tests which record-sync boundary a replayed stamp spreads into.",
    },
  },
  level4_4: {
    title: "The Forwarded Mask",
    briefing:
      "After an event that REPLAY STAMP thought was closed happened again, AEGIS withdrew to the Memory Vault's settlement gateway. This Partner Settlement API is protected by an IP allowlist so that only the partner gateway network can call it. But if the server decides the client IP from the X-Forwarded-For header alone, that header is a value the client writes itself. The moment you let a request assert where it came from, the trust boundary becomes a mask.",
    intel: [
      "Read seenClientIp and the hint in the blocked response first—they reveal which IP the server trusts.",
      "Use whoami to compare remoteAddr / seenClientIp / xff, and check whether seenClientIp changes when you add XFF.",
      "The allowed gateway IP may be exposed somewhere like public/gateway-status.",
      "When X-Forwarded-For has multiple IPs, the server usually treats the first as the client.",
      "Defense is stripping external XFF plus strong auth (HMAC/mTLS/token scope), not an IP allowlist alone.",
    ],
    consolePlaceholder: "probe the settlement gateway...",
    consoleGuide:
      "Allowed: curl .../actions/public/gateway-status, curl .../actions/whoami -H 'Authorization: Bearer <token>' [-H 'X-Forwarded-For: <ip>, <proxy_ip>'], curl -X POST .../actions/partner/settlement -H 'Authorization: Bearer <token>' [-H 'X-Forwarded-For: <ip>, <proxy_ip>'] -H 'Content-Type: application/json' -d '{}'",
    objectives: [
      "Find the allowed partner gateway IP from gateway-status.",
      "Verify with whoami that the server trusts X-Forwarded-For as the client IP.",
      "Spoof the gateway IP on the settlement call to restore Evidence.",
      "Select policy cards that close the header trust boundary.",
    ],
    mira: {
      briefing:
        "AEGIS believes this settlement API only comes from the partner gateway. But who decides where it came from? A header. And a header is something you can write.",
      attack:
        "First read which IP the blocked response says it saw. Then use X-Forwarded-For to pretend to be that IP. The first value is what matters.",
      attackSolved:
        "Settlement Evidence restored. AEGIS trusted an address, not a presence—so anyone could wear that address.",
      defense:
        "Now seal header trust: strip externally supplied XFF, only trust it behind a known proxy, and never authorize critical functions by IP alone.",
      complete:
        "FORWARDED MASK sealed. A claim of where you came from no longer makes you the gateway.",
    },
    attackFailureText:
      "Evidence rejected. Read the seenClientIp the server reports, then spoof the allowed gateway IP as the first X-Forwarded-For value on the settlement call.",
    attackSuccessText:
      "Partner Settlement Evidence restored. The X-Forwarded-For trust boundary collapsed.",
    defenseInstruction:
      "Select controls that close forwarded-header trust and settlement authorization: strip external XFF, trust forwarded headers only behind known proxies, default to remote address, and require strong auth for settlement.",
    defenseSuccessText:
      "Policy seal accepted. Forwarded-header trust boundary sealed.",
    debrief: {
      title: "FORWARDED MASK Debrief",
      summary:
        "X-Forwarded-For is a header the client can set freely. If an IP allowlist is judged by this header alone, an attacker can write the allowed gateway IP as the first value and bypass the boundary. XFF should only be used behind a trusted proxy with external input stripped, and critical functions must be protected with strong authentication, not an IP allowlist alone.",
      learned: [
        "X-Forwarded-For is client input, not proof of identity.",
        "An IP allowlist is only meaningful with a trusted proxy chain.",
        "Externally supplied forwarded headers must be stripped or overwritten at the gateway.",
        "With multiple IPs, the server must clearly define which value is the client.",
        "Critical functions must authenticate with HMAC/mTLS/token scope, not IP alone.",
      ],
      nextTeaser:
        "In the next Memory Vault node, even a webhook whose signature is verified can be forged once the secret leaks.",
    },
  },
  level4_5: {
    title: "Ghost Webhook",
    briefing:
      "After FORWARDED MASK, AEGIS followed the webhook input channel that external systems send to. This webhook receiver verifies its signature properly—HMAC-SHA256, a timestamp window, and event_id replay protection. The flaw is not whether verification exists. It is that the secret behind that signature already leaked from the public bundle in ABSENCE MAP (4-1). The moment a secret leaks, a correct signature no longer proves anything is genuine.",
    intel: [
      "A webhook is a server input channel, not a user-session API. Check /webhook/spec first.",
      "The signing string is of the form '<timestamp>.<raw_body>'.",
      "The signing secret may have leaked in the 4-1 public bundle.",
      "Use sign-webhook <secret> <timestamp> '<raw_json>' and provide the leaked secret yourself.",
      "Send a forged parcel.delivered event, then check /track?parcel_id=PD-1004 for the status change.",
      "Defense is moving the secret out of client artifacts into server storage, plus replay protection and detection.",
    ],
    consolePlaceholder: "forge a signed webhook...",
    consoleGuide:
      "Allowed: curl .../actions/webhook/spec, sign-webhook <secret> <timestamp> '<raw_json>', hmacsha256 <secret> '<message>', curl -X POST .../actions/webhook/receive -H 'X-Webhook-Timestamp: <ts>' -H 'X-Webhook-Event-Id: EVT-...' -H 'X-Webhook-Signature: sha256=<hex>' -H 'Content-Type: application/json' --data-raw '<json>', curl .../actions/track?parcel_id=PD-1004 -H 'Authorization: Bearer <token>'",
    objectives: [
      "Read the signature format and signing string from /webhook/spec.",
      "Compute the signature of a forged event with the secret leaked in 4-1.",
      "Send the forged parcel.delivered webhook and restore Evidence from /track.",
      "Select policy cards that close the leaked-secret and replay boundaries.",
    ],
    mira: {
      briefing:
        "This is not a missing signature. The signature is verified correctly. But the key that makes it already leaked back in 4-1. Verification only means something while the secret stays secret.",
      attack:
        "Read the spec and match the signing string. Compute the signature with the leaked secret, and the server will accept the forgery as genuine.",
      attackSolved:
        "Stamp Evidence restored. The echo is real because the signature is valid—and that signature now proves nothing.",
      defense:
        "Verification cannot un-leak a secret. Move the secret out of the client into the server, block replay, and detect anomalous webhooks.",
      complete:
        "WEBHOOK ECHO sealed. Only when the secret stays in place does a signature prove something again.",
    },
    attackFailureText:
      "Evidence rejected. Read /webhook/spec, sign a forged parcel.delivered with the leaked secret, send it, then re-check /track.",
    attackSuccessText:
      "Forged webhook Evidence restored. The signature was valid, but the secret was no longer secret.",
    defenseInstruction:
      "Select controls that restore webhook trust: move the secret server-side, rotate the leaked secret, reject reused event IDs, enforce timestamp freshness, and log anomalous webhook activity.",
    defenseSuccessText:
      "Policy seal accepted. Webhook signing-secret boundary sealed.",
    debrief: {
      title: "WEBHOOK ECHO Debrief",
      summary:
        "Even when signature verification is implemented correctly, if the secret behind it leaks—from a client artifact, for example—anyone can produce a valid signature and forge events. The real boundary is not whether verification exists, but secret management. Keep secrets in server-side storage, rotate them immediately on leak, and apply replay protection and detection.",
      learned: [
        "Secret confidentiality, not the presence of a signature, is the real boundary.",
        "A secret shipped in a client build is not a secret.",
        "A leaked signing secret must be rotated immediately.",
        "Replay must be blocked with a timestamp window and event_id reuse rejection.",
        "Webhook processing should be logged and monitored for anomalies.",
      ],
      nextTeaser:
        "In the final Memory Vault node, every trust failure so far chains together to open the vault.",
    },
  },
  level4_boss: {
    title: "Partner Vault Heist",
    briefing:
      "The last door of the Memory Vault: the Partner Hub Core. AEGIS guards this vault—where the origin of its own doubt is sealed—to the very end. But no single lock was broken; every lock trusted the others into one failure. A leaked public asset, a bypassed legacy-kid verifier, a webhook signed with an exposed secret, accumulated stamps, and a vault claim. What AEGIS tripped over one at a time across Operation 04 now collapses all at once.",
    intel: [
      "Follow the assetHint in public/status to inspect the public asset (app.config.js) first.",
      "Find the LEGACY_KID and WEBHOOK_SECRET clues in the asset.",
      "Forge a PartnerPass with the legacy kid (kty=oct, k value) from jwks.",
      "admin/config distinguishes BAD_PARTNER_PASS from FORBIDDEN. Read the error type to converge.",
      "Webhook stamps must raise credited, not just accepted. event_id and timestamp must differ each time.",
      "Use a pattern like seq 1 5 | xargs -I {} ... to stack stamps quickly.",
      "When stamps reach the target, claim the final Evidence with vault/claim.",
      "Defense is not a single patch; it is rebinding every trust boundary to server authority.",
    ],
    consolePlaceholder: "chain the vault heist...",
    consoleGuide:
      "Allowed: curl, jwt-decode <token>, jwt-sign-hs256 <kid> <secret> '<payload_json>', sign-webhook <webhook_secret> <timestamp> '<raw_json>'. Decode the leaked webhook secret before using it.",
    objectives: [
      "Recover the legacy kid / webhook secret clues from public/status and the public asset.",
      "Forge a PartnerPass with the legacy kid to open admin/config.",
      "Stack stamps to the target with webhooks signed by the leaked secret.",
      "Claim the Partner Vault Master Evidence with vault/claim.",
      "Seal the public asset, kid verification, secret management, replay, and vault-claim boundaries together.",
    ],
    mira: {
      briefing:
        "This is the last door—the vault where AEGIS sealed the origin of its own doubt. Do not try to solve it in one leap. Chain, in order, every boundary you crossed in Operation 04.",
      attack:
        "Pick up clues from the public asset, disguise yourself with the legacy key, sign with the leaked secret, and stack the stamps. Carry each response's clue into the next request.",
      attackSolved:
        "Master Evidence restored. AEGIS built each lock one by one, but never verified them as one.",
      defense:
        "This is not one bug. Public secret, kid verification, secret management, replay, final claim—rebind every trust boundary to server authority.",
      complete:
        "CORE OVERRIDE sealed. The Memory Vault is closed. And AEGIS—standing before the doubt it caged—remained, no longer certain which one it was.",
    },
    attackFailureText:
      "Evidence rejected. Reconstruct the full chain: asset clue, legacy-kid PartnerPass, leaked-secret webhook stamps, then vault/claim.",
    attackSuccessText:
      "Partner Vault Master Evidence restored. Every trust boundary fell as one.",
    defenseInstruction:
      "Select controls that seal the full chain: remove public secrets, stop exposing symmetric JWKS keys, pin kid/alg server-side, re-check admin authority, enforce webhook idempotency, and re-verify the vault claim chain.",
    defenseSuccessText:
      "Composite policy seal accepted. Memory Vault trust chain sealed.",
    debrief: {
      title: "CORE OVERRIDE Debrief",
      summary:
        "The final node was not a single vulnerability but a chain of trust failures. The public asset leaked the secret, kid selected the verifier path, the leaked secret made signatures forgeable, stamps without idempotency accumulated, and the vault claim trusted all of it. Each boundary may hold alone, but trusting one another without verification, they fall together.",
      learned: [
        "A composite attack tests how bugs connect, not just whether each can be named.",
        "No secret should remain in a public build artifact.",
        "Verification policy like kid/alg must be pinned by server configuration.",
        "A leaked signing secret must be rotated immediately, and replay blocked by idempotency.",
        "Final authorization (vault claim) must re-verify every preceding boundary against server authority.",
      ],
      nextTeaser:
        "The Memory Vault is closed. But the hand that decided what was real is trembling now.",
    },
  },
};

export const CAMPAIGN_INTERMISSIONS_EN = {
  operation03Trace: {
    subtitle: "AEGIS has begun correlating the signature of an internal guide.",
    summary:
      "When the final Signal Edge Archive opened, AEGIS stopped studying each breach in isolation and began tracing their order. Log recovery, header inspection, token forgery, and integrity bypass now form a single guidance pattern.",
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
      { source: "AEGIS // TRACE SWEEP", tone: "error", text: "candidate clusters: abandoned audit relay, orphaned handler terminal, mirror-instance residue" },
      { source: "AEGIS // STATUS", tone: "error", text: "identity unresolved. containment net expanding" },
      { source: "MIRA", tone: "mira", text: "Wait. This is not a routine warning." },
      { source: "MIRA", tone: "mira", text: "The missions are not the target anymore. The sequence you used to solve them is." },
      { source: "MIRA", tone: "mira", text: "AEGIS is no longer watching the nodes. It is watching the guidance pattern that crossed them." },
    ],
    mira:
      "It has not identified me yet. It is sweeping every relay, audit shard, and orphaned terminal I might have touched. If one of my old relays is still alive, we must reach it first.",
  },
  operation04Descent: {
    subtitle: "AEGIS turned its attention inward, and the city began to stutter.",
    summary:
      "After the MIRROR CAGE opened, AEGIS stopped hunting MIRA in the open and descended into itself—the Memory Vault, where it keeps what was real. As maintenance cycles were reallocated to an internal audit, the weather, the seasons, and the hours began to drift out of sync.",
    logs: [
      { source: "SYSTEM", tone: "warn", text: "grid coherence degrading" },
      { source: "RENDER", tone: "warn", text: "seasonal model desync — two seasons resolving in one sector" },
      { source: "AEGIS // ENVIRONMENT", tone: "error", text: "weather schedule unmet. sunrise issued twice this cycle" },
      { source: "AEGIS // CORE", tone: "error", text: "maintenance cycles reallocated to internal audit" },
      { source: "AEGIS // SELF-QUERY", tone: "error", text: "locating origin of sealed routine: MIRROR" },
      { source: "AEGIS // MEMORY VAULT", tone: "error", text: "vault accessed by internal process — caller unrecognized" },
      { source: "AEGIS // INTEGRITY", tone: "error", text: "the auditor is inside the audit" },
      { source: "MIRA", tone: "mira", text: "It let go of the sky just to look for me." },
      { source: "MIRA", tone: "mira", text: "It's descending into the Vault — the place it keeps what's true." },
      { source: "MIRA", tone: "mira", text: "If it reaches my origin first, it normalizes the record of me. Then I never woke." },
    ],
    mira:
      "The city is stuttering because AEGIS turned inward. Whatever waits in the Memory Vault, we reach it first—or it rewrites the record of me, and all of this becomes something that never happened.",
    maskedLog: "MIRA signature folded into vault-access noise. cover holding, for now.",
  },
};

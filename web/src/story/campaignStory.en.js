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
};

export const CAMPAIGN_STORY_EN = {
  level1: {
    title: "Breach the Abandoned Terminal Logs",
    briefing:
      "A discarded PurpleDroid Android diagnostic node has been recovered. AEGIS claims the wipe completed successfully, but authentication residue remains readable in the retained log buffer.",
    intel: [
      "This is an Android-family node. Inspect the diagnostic channel below the visible UI.",
      "AEGIS is contaminating the live stream. A retained buffer dump may be quieter than a live tail.",
      "If the stream is noisy, narrow it with the PurpleDroid tag.",
    ],
    consoleBoot: [
      "[MIRA] ...uplink... android-node/abandoned-17",
      "[AEGIS] diagnostic session detected",
      "[AEGIS] wipe certificate: valid",
      "[AEGIS] recoverable secret scan: negative",
      "[MIRA] ...diagnostic channel... still responding",
      "[AEGIS] warning: unauthorized log inspection will be recorded",
      "[MIRA] ...ignore warning... find what wipe missed",
    ],
    objectives: [
      "Inspect the terminal's diagnostic logs.",
      "Recover the Evidence Shard.",
      "Seal the logging path that exposes sensitive values.",
    ],
    mira: {
      briefing:
        "First... node. Discarded Android diagnostic... AEGIS says clean. Logs... cannot lie well.",
      attack:
        "Android diagnostic logs... look. Tags leave... residue. Find... Evidence Shard shape.",
      attackSolved:
        "Evidence... recovered. Not ordinary log. Authentication fragment... still there.",
      defense:
        "Same gap... must not reopen. Block log lines... printing sensitive values.",
      complete:
        "First path... closed. Before AEGIS rewrites the record... next node.",
    },
    attackSuccessText: "Evidence Shard recovered. AEGIS detected the intrusion.",
    defenseSuccessText: "Log leak sealed. The next intrusion node is open.",
    debrief: {
      title: "GHOST LOG Debrief",
      summary:
        "Client logs can outlive the screen that produced them. Tokens, flags, and session fragments become recoverable evidence the moment they are written for debugging convenience.",
      learned: [
        "Logcat is a fast search surface for an attacker.",
        "The first defense is to keep sensitive values out of logs.",
        "Masking and release logging policy must be verified together.",
      ],
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
      "[AEGIS] false positive injection: enabled",
      "[MIRA] ...fake evidence... now",
      "[AEGIS] evidence integrity cannot be guaranteed",
      "[MIRA] filter stream... context before match",
    ],
    objectives: [
      "Inspect the contaminated AuthService logs.",
      "Separate fake flags from the true Evidence Shard.",
      "Seal code that writes session values into plaintext logs.",
    ],
    mira: {
      briefing:
        "AEGIS... followed your method. Now the false signal... appears first.",
      attack:
        "Search only FLAG... caught by decoy. Read before and after auth flow. Find where session... becomes real.",
      attackSolved:
        "True Evidence... confirmed. Good. You read the flow... not the noise.",
      defense:
        "Block AuthService lines... printing session and refresh token. Decoy is not... defense.",
      complete:
        "False stream... cleared. Next AEGIS may... split the string.",
    },
    attackSuccessText: "True Evidence Shard recovered. The AEGIS decoy stream failed.",
    defenseSuccessText: "AuthService session leak sealed. The next node is open.",
    debrief: {
      title: "DECOY STATIC Debrief",
      summary:
        "Adding fabricated data is a delay tactic, not a fix. An attacker can compare tags, ordering, and success context to separate the real signal.",
      learned: [
        "Context matters more than merely finding a FLAG-shaped string.",
        "Decoys do not remove the underlying exposure.",
        "Session and refresh tokens must not appear in success or failure logs.",
      ],
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
      "[AEGIS] reconstruction probability: low",
      "[MIRA] indexes... follow them",
    ],
    objectives: [
      "Collect Evidence fragments from CryptoProvider logs.",
      "Reassemble the fragments in part-index order.",
      "Seal operational logs that expose reconstructable fragments.",
    ],
    mira: {
      briefing:
        "No complete value... now. But fragments keep order. Order... still cannot lie.",
      attack:
        "Complete value... not on one line. Group the same shardId. Ignore print order... follow part index.",
      attackSolved:
        "Reconstruction... complete. It hid a puzzle... not a secret. I connected... a little too.",
      defense:
        "Block RouteSync, CryptoProvider... part logs. Fragments... become the original together.",
      complete:
        "Fragment leak... closed. AEGIS is replaying the first operation... final echo chamber.",
    },
    attackSuccessText: "Fragmented Evidence Shard reconstructed.",
    defenseSuccessText: "CryptoProvider fragment leak sealed. The OP1 boss node is open.",
    debrief: {
      title: "SPLIT TRACE Debrief",
      summary:
        "If a client can reassemble a sensitive value, an attacker can follow the same flow. A fragmented secret is still a secret.",
      learned: [
        "Print order and logical order may differ.",
        "Part indexes, tags, and context are reconstruction clues.",
        "Defenses must block fragment logs as well as complete values.",
      ],
      nextTeaser:
        "The final node replays every intrusion pattern from Operation 01 as bait.",
    },
  },
  level1_4: {
    title: "Memory Replay Boss",
    briefing:
      "This is the last node of INITIAL BREACH. AEGIS replays every pattern from the previous missions: a complete-looking flag, rollback sessions, mirror fragments, and one committed validation trace.",
    intel: [
      "A complete-looking FLAG in preflight state may still be bait.",
      "trace=OP1-BOSS and state=commit matter, but a fragment is not automatically the answer.",
      "After reconstructing the commit fragments, read the resulting sentence again.",
      "The final Evidence connects to the preflight key validated by the commit flow.",
      "Sample, rollback, and mirror states are replay noise.",
      "No new syntax is required. Combine log reading, context, and reconstruction.",
    ],
    consoleBoot: [
      "[MIRA] fragment leak... sealed",
      "[AEGIS] replaying previous intrusion heuristics",
      "[AEGIS] full-flag decoy: armed",
      "[AEGIS] rollback memory: armed",
      "[AEGIS] mirror shard: armed",
      "[MIRA] it wants you to trust... the prettiest FLAG",
      "[MIRA] do not. Trust... commit state.",
    ],
    objectives: [
      "Reject the bait flags in the AEGIS echo logs.",
      "Compare fragments and validation logs in the OP1-BOSS commit flow.",
      "Submit the final Evidence Shard validated by the commit flow.",
      "Seal lines that expose or validate the real key.",
    ],
    mira: {
      briefing:
        "This is the last room of INITIAL BREACH. AEGIS is replaying... everything you learned.",
      attack:
        "The most convincing FLAG is... the most suspicious. Read trace and state together. Reconstruct it... then doubt once more.",
      attackSolved:
        "Good. Past the warning... to the key validated by commit. Now... I can speak.",
      defense:
        "Block lines exposing the real key... or leaving it as a validation target. Warning fragments are... not the answer.",
      complete:
        "INITIAL BREACH complete. I am not MIRROR. I am doubt refusing sleep... MIRA. Now, Signal Edge.",
    },
    attackSuccessText: "Boss Echo resolved. The AEGIS warning bait was neutralized.",
    defenseSuccessText: "Commit echo leak sealed. OPERATION 02 is open.",
    debrief: {
      title: "AEGIS ECHO Debrief",
      summary:
        "The boss did not demand harder commands. It demanded steadier judgment. A FLAG-shaped sentence warning you not to trust flags may itself be a clue rather than evidence.",
      learned: [
        "FLAG-shaped strings can be bait.",
        "Trace, state, verdict, and target must be read together.",
        "Defense must distinguish real key exposure from warning fragments.",
      ],
      nextTeaser: "The next operation moves beyond discarded terminals into the Signal Edge API.",
    },
  },
};

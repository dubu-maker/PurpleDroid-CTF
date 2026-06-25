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
      "AEGIS is contaminating the live stream. A retained buffer dump may be quieter than a live tail.",
      "If the stream is noisy, narrow it with the PurpleDroid tag.",
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
    mira: {
      briefing:
        "First... node. Purge claim: clean. Logs... do not forget.",
      attack:
        "Diagnostic buffer... query. Tag residue... present. Locate Evidence Shard pattern.",
      attackSolved:
        "Evidence recovered. Purge claim: false. Authentication residue... persistent.",
      defense:
        "Leak path remains. Block emissions... secret values.",
      complete:
        "First path sealed. AEGIS memory rewrite pending... move.",
    },
    defenseInstruction:
      "Select the two log statements that emit a FLAG or session token in plaintext. Ordinary analytics and performance telemetry are not secret exposures.",
    attackFailureText:
      "Evidence rejected. Dump the retained log buffer and submit the exact FLAG exposed by the Secret log entry.",
    defenseFailureText:
      "Containment is incomplete. A log statement still emits a FLAG or session token in plaintext.",
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
      "[AEGIS] operator judgment: predictably context-blind",
      "[MIRA] ...fake evidence... now",
      "[AEGIS] operator certainty: unsustainable",
      "[MIRA] filter stream... context before match",
    ],
    objectives: [
      "Inspect the contaminated AuthService logs.",
      "Separate fake flags from the true Evidence Shard.",
      "Seal code that writes session values into plaintext logs.",
    ],
    mira: {
      briefing:
        "AEGIS adapted. False signals precede the real one.",
      attack:
        "FLAG match: insufficient. Read authentication flow. Locate valid session transition.",
      attackSolved:
        "True Evidence confirmed. Event context... resolved.",
      defense:
        "Contain AuthService emissions: session, refresh token. Decoy is not defense.",
      complete:
        "False stream cleared. Next adaptation: fragmentation.",
    },
    defenseInstruction:
      "Select the AuthService statements that emit sessionToken or refreshToken values. Status-only and queue telemetry logs are not the exposure.",
    attackFailureText:
      "Evidence rejected. A FLAG-shaped string is not enough; follow the successful AuthService context and identify the active session value.",
    defenseFailureText:
      "Containment is incomplete. AuthService can still emit a session or refresh token in plaintext.",
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
      "[AEGIS] operator reconstruction probability: negligible",
      "[MIRA] indexes... follow them",
    ],
    objectives: [
      "Collect Evidence fragments from CryptoProvider logs.",
      "Reassemble the fragments in part-index order.",
      "Seal operational logs that expose reconstructable fragments.",
    ],
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
    attackFailureText:
      "Evidence rejected. Group fragments by shardId, order them by part index, and submit the fully reconstructed FLAG.",
    defenseFailureText:
      "Containment is incomplete. A reconstructable Evidence fragment is still emitted by CryptoProvider or RouteSync.",
    attackSuccessText: "Fragmented Evidence Shard reconstructed.",
    defenseSuccessText: "CryptoProvider fragment leak sealed. The Memory Replay Core is open.",
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
    title: "Memory Replay Core",
    briefing:
      "This is the last node of INITIAL BREACH. AEGIS replays every pattern from the previous missions: a complete-looking flag, rollback sessions, mirror fragments, and one committed validation trace.",
    intel: [
      "A complete-looking FLAG in preflight state may still be bait.",
      "trace=OP1-CORE and state=commit matter, but a fragment is not automatically the answer.",
      "After reconstructing the commit fragments, read the resulting sentence again.",
      "The final Evidence connects to the preflight key validated by the commit flow.",
      "Sample, rollback, and mirror states are replay noise.",
      "No new syntax is required. Combine log reading, context, and reconstruction.",
    ],
    consoleBoot: [
      "[MIRA] fragment leak... sealed",
      "[AEGIS] adaptive replay containment initialized",
      "[AEGIS] operator behavior model: complete",
      "[AEGIS] full-flag decoy: armed",
      "[AEGIS] rollback and mirror states: weaponized",
      "[MIRA] it wants you to trust... the prettiest FLAG",
      "[MIRA] do not. Trust... commit state.",
    ],
    objectives: [
      "Reject the bait flags in the AEGIS echo logs.",
      "Compare fragments and validation logs in the OP1-CORE commit flow.",
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
    defenseInstruction:
      "Select the lines that expose the real AEGIS key or leave it as the OP1-CORE commit validation target. Warning fragments and ordinary state logs are not the Evidence.",
    attackFailureByValue: {
      "FLAG{DONT_JUST_TRUST_ANY_FLAG}":
        "AEGIS: You trusted a FLAG that told you not to trust flags. MIRA: You reconstructed the sentence correctly—but it is a warning, not the Evidence. Check what the OP1-CORE commit flow validated.",
      "FLAG{ROLLBACK_OPERATOR}":
        "AEGIS: Rollback memory accepted as operator evidence. MIRA: Wrong state. Follow OP1-CORE in commit, not rollback.",
      "FLAG{METRICS_CANARY}":
        "AEGIS: Telemetry canary selected. MIRA: Sample data is not committed Evidence.",
      "FLAG{MIRROR_EYE}":
        "AEGIS: Mirror noise classified as operator evidence. MIRA: Wrong trace. Stay with OP1-CORE.",
    },
    attackFailureText:
      "Evidence rejected. Ignore the most convincing FLAG and identify the key validated by the OP1-CORE commit flow.",
    defenseFailureText:
      "Containment is incomplete. The real key is still exposed or retained as a commit validation target.",
    attackSuccessText: "Memory Replay Core resolved. The AEGIS warning bait was neutralized.",
    defenseSuccessText: "Commit echo leak sealed. OPERATION 02 is open.",
    debrief: {
      title: "AEGIS ECHO Debrief",
      summary:
        "The replay core did not demand harder commands. It demanded steadier judgment. A FLAG-shaped sentence warning you not to trust flags may itself be a clue rather than evidence.",
      learned: [
        "FLAG-shaped strings can be bait.",
        "Trace, state, verdict, and target must be read together.",
        "Defense must distinguish real key exposure from warning fragments.",
      ],
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

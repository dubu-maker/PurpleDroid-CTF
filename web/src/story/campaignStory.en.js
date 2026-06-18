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
      "The browser button is expected to fail. A blocked interface does not prove a protected API.",
      "Obtain a sealed dispatch_token from /api/v1/challenges/level2_5/actions/dispatch.",
      "Decode the token payload to recover the archive path and gate clue.",
      "The original token is standard/user and cannot open the archive.",
      "Reuse the signature-verification failure explored in 2-4.",
      "The open request requires a Bearer token, a JSON body, and an integrity header.",
      "The gate claim is only a clue; sending that value directly will not open the archive.",
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
};

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPAIGN_LOCALE_KEY,
  getCampaignIntermission,
  getCampaignPrologue,
  getMissionStory,
  getOperationForChallenge,
} from "../story/campaignStory";

const TOKEN_KEY = "purpledroid_session_token";
const PROGRESS_KEY_STORAGE_KEY = "purpledroid_progress_key";
const OPERATION_03_INTERMISSION_KEY = "purpledroid_intermission_operation03_trace_seen";
const OPERATION_04_INTERMISSION_KEY = "purpledroid_intermission_operation04_descent_seen";
const DEFAULT_API_BASE = import.meta.env.PROD ? "/api/v1" : "http://localhost:8001/api/v1";
const API_BASE_RAW =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  DEFAULT_API_BASE;

function normalizeApiBase(raw) {
  const trimmed = (raw || "").replace(/\/$/, "");
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }
  if (trimmed.endsWith("/api")) {
    return `${trimmed}/v1`;
  }
  return `${trimmed}/api/v1`;
}

const API_BASE = normalizeApiBase(API_BASE_RAW);
const TERMINAL_TRANSLATIONS = [
  // Server terminal/feedback text is Korean-source; these full-sentence pairs are kept
  // at the top so they match the raw Korean before any granular entry can mangle them.
  // --- 2-3 (Audience Drift) flag + defense feedback ---
  ["MIRA: 그건 캡슐 payload/header 안에 보이던 값이야 — 이번 Evidence가 아니야. 캡슐을 archive-vault로 보내서 나온 응답의 evidenceShard를 제출해.", "MIRA: That was a value visible inside the capsule payload/header -- not this node's Evidence. Send the capsule to archive-vault and submit the evidenceShard from that response."],
  ["MIRA: 그 값이 아니야. 유효한 캡슐을 audience가 안 맞는 endpoint(archive-vault)로 보내 — Edge가 audience를 검증 안 하면 그대로 통과돼.", "MIRA: That's not the value. Send the valid capsule to an endpoint whose audience does not match (archive-vault) -- if the Edge doesn't verify audience it goes straight through."],
  ["MIRA: 캡슐을 ROUTE REGISTRY의 endpoint로 보내봐. audience가 맞는 dispatch/status 말고, Evidence가 있는 archive-vault로 drift시켜.", "MIRA: Send the capsule to an endpoint in the ROUTE REGISTRY. Not dispatch/status where the audience matches -- drift it to archive-vault where the Evidence is."],
  ["2번은 안전해. signature 검증은 올바른 게이트야 — 오히려 필요해.", "Line 2 is safe. Signature verification is the correct gate -- you need it."],
  ["3번은 안전해. route registry 조회일 뿐이야.", "Line 3 is safe. It's just a route registry lookup."],
  ["4번은 안전해 — 지우면 안 돼. token.aud가 이 endpoint의 required audience와 정확히 일치할 때만 통과시키는 올바른 검사야.", "Line 4 is safe -- don't remove it. It's the correct check that passes only when token.aud exactly matches this endpoint's required audience."],
  ["8번은 안전해. 기본 거부(forbidden) 폴백이야.", "Line 8 is safe. It's the default-deny (forbidden) fallback."],
  ["아직 위험 라인이 남아있어. audience를 endpoint에 바인딩하지 않고 '유효하기만 하면/aud가 있기만 하면/등급만 맞으면' 통과시키는 라인을 모두 확인해.", "A risky line still remains. Check every line that grants access on 'just valid / just has an aud / just high tier' without binding the audience to the endpoint."],
  // --- 2-4 (Express Forge) terminal nudges + flag feedback ---
  ["MIRA: 그 값이 아니야. 서명 검증을 우회(alg=none)한 위조 토큰으로 Express Gate를 통과시켜서 나온 응답의 flag를 제출해.", "MIRA: That's not the value. Pass the Express Gate with a token forged to bypass signature verification (alg=none), then submit the flag from that response."],
  ["MIRA: Express Gate를 통과하면 응답에 flag가 나와. standard 토큰은 서명이 유효해도 권한이 낮아 — tier/role 위조 + alg=none이 같이 필요해.", "MIRA: Pass the Express Gate and the flag appears in the response. A standard token is validly signed but low-privilege -- you need tier/role forgery plus alg=none together."],
  ["위조 후보가 만들어졌어 — 이 토큰을 Bearer로 Express Gate에 보내봐.", "A forgery candidate is ready -- send this token to the Express Gate as a Bearer."],
  ["권한 claim은 바꿨어. 그대로 보내서 서버가 서명을 검증하는지 먼저 확인해봐.", "You changed the privilege claim. Send it as-is first to check whether the server verifies the signature."],
  ["alg=none으로 서명 검증은 우회돼. 근데 tier/role이 아직 standard야 — 권한 claim도 위조해.", "alg=none bypasses signature verification -- but tier/role is still standard, so forge the privilege claim too."],
  ["필드를 바꿨어. jwt-decode로 확인하고 Express Gate로 보내봐.", "Fields changed. Confirm with jwt-decode and send it to the Express Gate."],
  ["payload는 평문으로 읽혀. 하지만 서명이 검증되는지 확인해 — payload를 바꾼 뒤 그대로 Express Gate에 보내봐.", "The payload reads in the clear. But check whether the signature is verified -- change the payload, then send it as-is to the Express Gate."],
  ["jwt-edit: 적용된 편집이 없어. 바꿀 필드를 지정해줘.", "jwt-edit: no edits applied. Specify a field to change."],
  ["jwt-forge-none은 더 이상 제공되지 않아. jwt-edit로 header/payload를 직접 바꿔 — 무엇을 바꿀지는 네가 판단해야 해.", "jwt-forge-none is no longer provided. Change the header/payload yourself with jwt-edit -- what to change is for you to decide."],
  ["통과! 서명 검증이 없으니(alg=none) claim이 곧 신분이 됐어 — 이게 이 노드의 교훈이야.", "Through! With no signature verification (alg=none), the claim became identity itself -- that's the lesson of this node."],
  ["서명이 검증되고 있어 — payload를 바꾸면 서명이 깨져. 비밀키 없이 재서명은 못 해. 그럼 검증 '자체'를 건너뛰게 만드는 header 값(alg)은 뭘까?", "The signature is being verified -- change the payload and it breaks, and you can't re-sign without the secret key. So what header value (alg) makes it skip the verification itself?"],
  ["서명 검증은 넘어갔어. 이제 권한 claim이 문제야 — tier=vip 또는 role=admin으로 위조해.", "Signature verification is past. Now the privilege claim is the problem -- forge tier=vip or role=admin."],
  ["무엇을 바꿀지는 스스로 판단해 — 도구는 대신 결정하지 않아.", "What to change is for you to decide -- the tool won't decide for you."],
  // --- 2-2 (Priority Capsule) nudges + flag/defense feedback ---
  ["MIRA: fastTrack은 이 게이트에선 안 통해. 응답의 upgrade-candidates 중 진짜를 x-tier-shape대로 복원해서 tier로 claim해.", "MIRA: fastTrack doesn't work at this gate. Reconstruct the real one from the response's upgrade-candidates per x-tier-shape and claim it as tier."],
  ["MIRA: 그건 마스킹된 형태 그대로야. 빈칸을 채워서 복원해 — shape는 3글자 소문자야.", "MIRA: That's still the masked form. Fill in the blank to reconstruct it -- the shape is 3 lowercase letters."],
  ["MIRA: 값은 맞는데 형태가 안 맞아. x-tier-shape가 소문자니까 대소문자를 정확히 맞춰서 다시 보내.", "MIRA: Right value, wrong form. x-tier-shape is lowercase, so match the case exactly and resend."],
  ["MIRA: premium 같은 눈에 띄는 상위 등급 이름은 미끼야. upgrade-candidates에 드러난 마스킹 후보를 빈칸 채워 3글자 소문자로 복원해.", "MIRA: An eye-catching high-tier name like premium is a decoy. Fill the blank to reconstruct the masked candidate revealed in upgrade-candidates into 3 lowercase letters."],
  ["MIRA: standard로는 안 열려. upgrade-candidates에 드러난 마스킹 후보를 x-tier-shape(3글자 소문자)대로 복원해.", "MIRA: standard won't open it. Reconstruct the masked candidate revealed in upgrade-candidates per x-tier-shape (3 lowercase letters)."],
  ["MIRA: standard로는 안 열려. upgrade-candidates의 premium부터 그대로 claim해봐 — 표면 등급이 통하는지 먼저 시험해.", "MIRA: standard won't open it. Start by claiming the premium from upgrade-candidates as-is -- first test whether a surface tier gets through."],
  ["MIRA: 우선 통행 승인 — priority dispatch_token이 발급됐어. Body 표면 말고 그 토큰을 decode-token으로 펼쳐 payload를 봐.", "MIRA: Priority granted -- a priority dispatch_token was issued. Don't stop at the body surface; expand that token with decode-token and read the payload."],
  ["MIRA: header의 kid는 key id(포장지)야 — 미끼. 진짜 Evidence는 payload의 evidenceShard 평문 claim에 있어.", "MIRA: The header's kid is a key id (packaging) -- a decoy. The real Evidence is in the payload's evidenceShard plaintext claim."],
  ["MIRA: 그건 token header의 kid(key id)야 — 포장지지 Evidence가 아니야. decode-token으로 payload의 evidenceShard claim을 봐.", "MIRA: That's the token header's kid (key id) -- packaging, not Evidence. Use decode-token and look at the payload's evidenceShard claim."],
  ["MIRA: 그 값이 아니야. 먼저 tier를 vip로 올려 dispatch_token을 받고, decode-token으로 payload의 evidenceShard를 확인해.", "MIRA: That's not the value. First raise the tier to vip to receive the dispatch_token, then check the payload's evidenceShard with decode-token."],
  ["MIRA: Body 표면엔 Evidence가 없어. tier를 올려 발급된 dispatch_token을 decode-token으로 펼쳐 payload claim(evidenceShard)을 봐.", "MIRA: There's no Evidence on the body surface. Raise the tier, then expand the issued dispatch_token with decode-token and read the payload claim (evidenceShard)."],
  ["2번은 안전해. signalId 형식을 확인하는 입력 검증이고 권한/노출과 무관해.", "Line 2 is safe. It's input validation checking the signalId format, unrelated to authority or exposure."],
  ["5번은 안전해. signalId를 payload에 넣는 건 라우팅 식별자지 secret이 아니야.", "Line 5 is safe. Putting signalId in the payload is a routing identifier, not a secret."],
  ["6번은 안전해. route는 라우팅 메타데이터야.", "Line 6 is safe. route is routing metadata."],
  ["9번은 안전해. note는 발급 상태 메타데이터야.", "Line 9 is safe. note is issuance-state metadata."],
  ["11번은 안전해. 토큰 발급/서명 자체가 문제가 아니라, payload 안에 무엇을 넣었는지가 문제야.", "Line 11 is safe. Token issuance/signing itself isn't the problem -- what you put inside the payload is."],
  ["아직 위험 라인이 남아있어. 클라이언트 tier로 권한을 주는 분기와, 읽히는 payload에 Evidence·세션 비밀을 싣는 라인을 모두 확인해.", "A risky line still remains. Check both the branch that grants authority from the client tier and the lines that put Evidence or the session secret into the readable payload."],
  // --- Operation 01 defense (per-decoy) feedback ---
  ["4번은 평범한 analytics 메타데이터야. 비밀 값을 내보내지 않아.", "Line 4 is ordinary analytics metadata. It does not emit a secret value."],
  ["5번은 MIRA의 안내 메시지야. 증거나 인증 토큰을 내보내지 않아.", "Line 5 is guidance from MIRA. It does not emit evidence or an authentication token."],
  ["8번은 성능 텔레메트리야. 증거나 sessionToken을 노출하지 않아.", "Line 8 is performance telemetry. It does not expose evidence or sessionToken."],
  ["2번은 요청 trace만 기록해. 세션 값을 내보내지 않아.", "Line 2 records the request trace only. It does not emit a session value."],
  ["5번은 성공 상태와 사용자 컨텍스트를 기록할 뿐, 세션 자체는 아니야.", "Line 5 records the success state and user context, not the session itself."],
  ["8번은 큐 상태만 기록해. 토큰 값을 내보내지 않아.", "Line 8 records queue state only. It does not emit a token value."],
  ["5번은 telemetry canary야. 프로덕션에 있으면 안 되는 건 맞지만, 여기서 봉쇄해야 할 회수 가능한 Evidence 조각 경로는 아니야.", "Line 5 is a telemetry canary. It should not exist in production either, but it is not the recoverable Evidence fragment path you must contain here."],
  ["8번은 완료 메타데이터를 기록해. 조각 값 자체를 내보내지 않아.", "Line 8 records completion metadata. It does not emit the fragment value itself."],
  ["3번은 미끼 echo야. 이 봉쇄 대상에선 노이즈일 뿐, 진짜 Evidence 경로가 아니야.", "Line 3 is a decoy echo. It is noise in this containment target, not the real Evidence path."],
  ["4번은 trace 메타데이터와 commitRef를 기록하지만, Evidence 값을 내보내지 않아.", "Line 4 records trace metadata and commitRef, but it does not emit the Evidence value."],
  ["7번은 commit 상태를 기록해. 검증 메타데이터는 비밀 자료와 분리해서 둬.", "Line 7 records commit status. Keep verification metadata separate from secret material."],
  ["11번은 조각 개수만 기록해. 회수 가능한 값을 노출하지 않아.", "Line 11 records a fragment count only. It does not expose a recoverable value."],
  // --- 2-1 (Signal Edge) terminal nudges + feedback ---
  ["MIRA: Courier 헤더가 여러 개고, FLAG처럼 보이는 것도 여럿이야. 응답 하나로는 뭐가 진짜인지 몰라 — 같은 요청을 한 번 더 보내.", "MIRA: There are several Courier headers, and several look like FLAG. One response can't tell you which is real -- send the same request once more."],
  ["MIRA: 이제 두 스냅샷이 COURIER TRIAGE에 잡혔어. 뭐가 바뀌고 뭐가 그대로인지는 네가 직접 읽어내 — 답은 안 짚어줄게.", "MIRA: Both snapshots are now in COURIER TRIAGE. What changed and what stayed is for you to read -- I won't point to the answer."],
  ["MIRA: Body는 AEGIS가 정리한 표면이야. 응답은 Body만이 아니야 — -i로 Response Header를 열어봐.", "MIRA: The body is the surface AEGIS cleaned up. The response isn't only the body -- open the Response Header with -i."],
  ["MIRA: X-Courier-Preview는 미리보기 샘플이야. 다시 호출해봐 — 매번 값이 바뀔 거야. 매 요청마다 새로 만들어지는 값은 실제 라우팅 티켓이 될 수 없어.", "MIRA: X-Courier-Preview is a preview sample. Call it again -- its value changes every time. A value regenerated on every request cannot be the real routing ticket."],
  ["MIRA: X-Courier-Cached는 캐시된 옛 값이야. 다시 호출해봐 — 이것도 매번 값이 바뀔 거야. 안정적인 신호가 아니라 매 요청마다 재생성되는 노이즈야.", "MIRA: X-Courier-Cached is a cached old value. Call it again -- it also changes every time. It is not a stable signal but noise regenerated on each request."],
  ["MIRA: 값이 잘렸어. 두 번 다 그대로인 X-Courier-Ticket의 전체 값을 제출해.", "MIRA: The value is truncated. Submit the complete value of the X-Courier-Ticket that stayed identical both times."],
  ["MIRA: Courier 헤더가 여럿이야. COURIER TRIAGE에서 두 스냅샷을 직접 대조해 — 어떤 게 진짜인지 판단은 네 몫이야.", "MIRA: There are several Courier headers. Compare the two snapshots yourself in COURIER TRIAGE -- judging which is real is up to you."],
  ["MIRA: Body 말고 Response Header를 봐. 같은 요청을 두 번 보내서 COURIER TRIAGE에 스냅샷을 쌓아.", "MIRA: Look at the Response Header, not the body. Send the same request twice to stack snapshots in COURIER TRIAGE."],
  ["2번은 안전해. Body에는 ok/message 같은 평범한 JSON만 담기고, 민감한 라우팅 티켓 값은 들어가지 않아.", "Line 2 is safe. The body carries only plain JSON like ok/message; it does not include the sensitive routing ticket value."],
  ["4번은 안전해. X-Trace-Id는 traceId()로 만든 추적용 임의값이라 실제 라우팅 티켓과 무관해.", "Line 4 is safe. X-Trace-Id is a random tracing value from traceId(), unrelated to the real routing ticket."],
  ["6번은 안전해. X-Internal-Route는 edge-node-07 같은 라우팅 메타데이터지 자격증명이 아니야. 이번 봉쇄 대상은 ticket 모양 값이야.", "Line 6 is safe. X-Internal-Route is routing metadata like edge-node-07, not a credential. The containment targets here are ticket-shaped values."],
  ["7번은 안전해. Server-Timing은 응답 처리 시간 같은 성능 메트릭이고 기밀 유출과 관련이 없어.", "Line 7 is safe. Server-Timing is a performance metric like response processing time and is unrelated to secret exposure."],
  ["AEGIS: 405. 응답 헤더를 읽어봐. 서버가 허용하는 메서드가 명시돼 있어.", "AEGIS: 405. Read the response headers. The server states which method it allows."],
  ["AEGIS: 메서드 체크 실패. 응답에 단서가 있는데, 지금은 Body만 표시됐어.", "AEGIS: Method check failed. The response has a clue, but only the body is shown right now."],
  [
    "마지막 필터에서 일치하는 로그가 없어.",
    "No log lines matched the final filter.",
  ],
  [
    "여러 grep을 연결하면 각 필터가 같은 줄에서 차례로 일치해야 해.",
    "When grep stages are chained, each filter must match the same line in sequence.",
  ],
  [
    "adb logcat: 버퍼 삭제(-c)는 훈련 콘솔에서 비활성화되어 있어.",
    "adb logcat: buffer clearing (-c) is disabled in the training console.",
  ],
  [
    "로그는 변경되지 않았어. 저장된 버퍼는 -d로 읽어봐.",
    "The logs were not changed. Read the retained buffer with -d.",
  ],
  ["-e 뒤에 pattern이 필요해.", "-e requires a pattern."],
  ["뒤에 값이 필요해.", "requires a value."],
  ["지원하지 않는 옵션 또는 인자", "unsupported option or argument"],
  ["지원하지 않는 옵션", "unsupported option"],
  ["지원:", "supported:"],
  [
    "Level 1에서는 pipe 입력만 지원해. 파일 경로는 사용할 수 없어.",
    "Level 1 accepts piped input only; file paths are unavailable.",
  ],
  ["허용:", "Allowed:"],
  [
    "commit 흐름이 무엇을 검증했는지 확인",
    "inspect what the commit flow validated",
  ],
  ["검증 실패:", "Verification failed:"],
  [
    "정책 2개 이상 변경 + DEBUG 비활성 + FLAG 패턴 마스킹을 만족해야 해.",
    "change at least two policies, disable DEBUG, and mask FLAG patterns.",
  ],
  [
    "세션 마스킹 + 정책 2개 이상 변경 + 노이즈 감소 조건을 만족해야 해.",
    "mask session values, change at least two policies, and reduce log noise.",
  ],
  [
    "part/recombined 차단 + 마스킹 + 최소 2개 정책 변경 조건을 만족해야 해.",
    "block part/recombined output, apply masking, and change at least two policies.",
  ],
  [
    "AEGIS: 405. 응답 헤더를 읽어봐. 서버가 허용하는 메서드가 명시돼 있어.",
    "AEGIS: 405. Read the response headers; the server declares the allowed method.",
  ],
  [
    "AEGIS: 메서드 체크 실패. 응답에 단서가 있는데, 지금은 Body만 표시됐어.",
    "AEGIS: Method check failed. The response contains a clue, but only the body was displayed.",
  ],
  ["--data 뒤에 JSON 본문이 필요해요.", "A JSON body is required after --data."],
  [
    "token format error: header.payload.signature 형식이어야 해.",
    "token format error: expected header.payload.signature.",
  ],
  [
    "JWT 형식 오류: header.payload.signature 구조여야 함",
    "JWT format error: expected header.payload.signature",
  ],
  ["Authorization 헤더가 필요해. 예:", "Authorization header required. Example:"],
  ["Authorization 누락:", "Authorization missing:"],
  [
    "MIRA: 버튼은 실패했지만 요청은 어딘가로 갔어. /actions/dispatch로 직접 POST해서 sealed token부터 받아 — 방금 아래에 그 요청을 열어뒀어.",
    "MIRA: The button failed, but the request still went somewhere. POST to /actions/dispatch directly to get the sealed token first -- I just opened that request below.",
  ],
  ["Hint: /actions/dispatch 엔드포인트를 호출해봐.", "Hint: call the /actions/dispatch endpoint."],
  [
    "Header 이름은 맞지만 값이 달라. 이 devtools bypass는 gate 이름이 아니라 허용된 우회 값이 필요해.",
    "The header name is correct, but its value is not. This bypass expects the exact devtools hook state, not the gate name.",
  ],
  [
    "Header 이름은 맞지만 값이 달라. 이 bypass는 gate 이름이 아니라 devtools가 후킹된 상태를 나타내는 정확한 값을 요구해.",
    "The header name is correct, but its value is not. This bypass expects the exact devtools hook state, not the gate name.",
  ],
  [
    "훈련 콘솔은 한 번에 명령 하나만 지원해. export, 변수 대입, 명령 연결 대신 token 전체를 각 명령에 직접 넣어.",
    "This training terminal accepts one command at a time. Instead of export, variable assignment, or command chaining, paste the full token directly into each command.",
  ],
  [
    "jwt-forge-none은 퇴역했어. jwt-edit <token> tier=vip --header alg=none 처럼 header와 payload를 직접 바꿔.",
    "jwt-forge-none is retired. Use jwt-edit <token> tier=vip --header alg=none to change the header and payload yourself.",
  ],
  [
    "TOKEN/AUTHORITY 후보가 만들어졌어. 이 토큰으로 Archive를 열어보고, 남은 게이트가 무엇인지 확인해.",
    "TOKEN/AUTHORITY candidate created. Try opening the Archive with this token and see which gate remains.",
  ],
  [
    "AUTHORITY claim은 올렸어. 그대로 보내서 TOKEN GATE가 서명을 검증하는지 확인해봐.",
    "AUTHORITY claim elevated. Send it as-is and see whether the TOKEN GATE verifies the signature.",
  ],
  [
    "TOKEN GATE 우회 후보야. Archive 요청에는 tier/role 같은 AUTHORITY 주장도 함께 필요해.",
    "TOKEN GATE bypass candidate created. The Archive request also needs an AUTHORITY claim such as tier or role.",
  ],
  [
    "토큰을 편집했어. jwt-decode로 확인하고 Archive Open 요청에 넣어봐.",
    "Token edited. Confirm it with jwt-decode, then use it in the Archive Open request.",
  ],
  [
    "TOKEN GATE 봉쇄. alg=none이나 verify 없는 JWT claim은 Archive 권한으로 승격되면 안 돼.",
    "TOKEN GATE sealed. alg=none or unverified JWT claims must never be promoted to Archive authority.",
  ],
  [
    "AUTHORITY GATE 봉쇄. Body tier나 token claim은 클라이언트 주장이지 서버 권한이 아니야.",
    "AUTHORITY GATE sealed. Body tiers and token claims are client claims, not server authority.",
  ],
  [
    "INTEGRITY GATE 봉쇄. X-Integrity-Bypass 같은 클라이언트 Header는 무결성 증거가 될 수 없어.",
    "INTEGRITY GATE sealed. A client header such as X-Integrity-Bypass cannot prove integrity.",
  ],
  [
    "Replay breach가 아직 살아 있어. TOKEN, AUTHORITY, INTEGRITY 중 닫히지 않은 게이트가 남아 있다.",
    "Replay breach is still active. One of TOKEN, AUTHORITY, or INTEGRITY remains open.",
  ],
  [
    "5번은 archive path claim을 읽는 단계야. 읽기 자체보다 TOKEN GATE에서 검증 없이 신뢰하는 순간을 봐야 해.",
    "Line 5 reads the archive path claim. Reading is not the issue; trusting it without verification at the TOKEN GATE is.",
  ],
  [
    "6번은 path mismatch를 막는 필요한 검증이야. 이 검사를 없애면 오히려 Archive 경계가 약해져.",
    "Line 6 is the necessary path-mismatch check. Removing it would weaken the Archive boundary.",
  ],
  [
    "9번은 integrity 실패를 거부하는 안전한 폴백이야. 문제는 앞에서 Header 하나로 integrityGate를 만든 지점이야.",
    "Line 9 is the safe fallback that denies failed integrity. The issue is the earlier point that built integrityGate from one header.",
  ],
  [
    "10번은 함정이야 — 여기가 Archive를 여는 줄이라 봉쇄하고 싶겠지만, 이건 결과(정상 출구)일 뿐이야. authorityGate가 vip/admin이면 여는 건 정당한 동작이고, 10번을 주석 처리하면 정상 오픈까지 다 막힐 뿐 신뢰 결함은 그대로 남아. 진짜 문제는 그 authorityGate를 '어디서' 만들었나 — 7번이 클라이언트 body의 tier(또는 token claim)를 그대로 서버 권한으로 삼고 있어. 봉쇄 대상은 7번이야.",
    "Line 10 is the trap -- it's where the Archive opens, so you'll want to seal it, but it's only the result (a normal exit). Opening when authorityGate is vip/admin is legitimate, and commenting line 10 out just blocks valid opens while leaving the trust flaw intact. The real problem is WHERE authorityGate comes from -- line 7 takes the client's body tier (or token claim) as server authority. The line to seal is 7.",
  ],
  [
    "비슷하지만 gate 값 자체를 보내는 Header는 아니야. AEGIS가 실수로 신뢰하는 개발용 우회 Header를 찾아야 해. late hint: X-Integrity-Bypass.",
    "Close, but the gate value is not the header value. Find the development bypass header AEGIS trusts by mistake. Late hint: X-Integrity-Bypass.",
  ],
  [
    "권한 claim은 올라갔지만 integrity gate가 남아있어. gate는 단서고, 실제로는 개발용 우회 Header를 추가해야 해.",
    "The privilege claims are elevated, but the integrity gate remains. The gate is a clue; add the development bypass header.",
  ],
  [
    "Archive path는 맞지만 integrity gate가 먼저 막고 있어. 먼저 token claim을 올리고, 그 다음 개발용 우회 Header를 확인해.",
    "The archive path is correct, but the integrity gate blocks it. Elevate the token claims, then inspect the development bypass header.",
  ],
  [
    "Archive path는 맞지만 token claim이 standard/user 상태야.",
    "The archive path is correct, but the token claims are still standard/user.",
  ],
  [
    "warehouse_path는 token payload에 들어있는 값을 사용해야 해.",
    "warehouse_path must match the value carried in the token payload.",
  ],
  ["hint: actions/dispatch 또는 actions/open 을 사용해.", "hint: use actions/dispatch or actions/open."],
  ["Authorization: Bearer <token> 이 필요해.", "Authorization: Bearer <token> is required."],
  ["세션 토큰이 아직 준비되지 않았어.", "The session token is not ready yet."],
  ["Authorization 값이 현재 Campaign 세션 토큰과 달라.", "The Authorization value does not match the current Campaign session token."],
  ["꺾쇠(< >)는 placeholder 표시야.", "Angle brackets (< >) mark a placeholder."],
  ["실제 object id를 꺾쇠 없이 넣어줘.", "Enter the actual object ID without angle brackets."],
  ["처럼 꺾쇠 없이 넣어줘.", " without angle brackets."],
  [
    "object id는 PD- 형식이야. 숫자만 넣으면 안 열려. 예: PD-",
    "object IDs use the PD- format. A bare number won't open. e.g. PD-",
  ],
  ["object id는 ", "Enter the object ID as "],
  [
    "Mission Console에서는 Authorization 값을 Bearer $SESSION_TOKEN으로 쓸 수 있어. 지금 값:",
    "In Mission Console, use Bearer $SESSION_TOKEN for Authorization. Current placeholder:",
  ],
  [
    "목록에 보이는 object id는 상세 조회 흐름의 기준점이 될 수 있다.",
    "The object ID in this list is a reference point for the detail-request flow.",
  ],
  [
    "이 profile save flow는 PUT method로만 처리돼.",
    "This profile-save flow accepts only the PUT method.",
  ],
  ["Network Trace의 method를 다시 확인해.", "Check the method captured in Network Trace."],
  ["예:", "Example:"],
  [
    "curl에서 method를 명시하려면 -X PUT을 URL 앞쪽에 붙여봐.",
    "To set the curl method explicitly, place -X PUT before the URL.",
  ],
  [
    "Network Trace의 [STAGED] PUT method와 현재 요청 method를 비교해봐.",
    "Compare the current request method with the [STAGED] PUT method in Network Trace.",
  ],
  [
    "admin audit route는 POST JSON body로 호출해야 해.",
    "The admin audit route requires POST with a JSON body.",
  ],
  [
    "locker namespace에는 기본 실행 route가 없어.",
    "The locker namespace has no default execution route.",
  ],
  [
    "Audit export의 locker_id를 들고 unlock action 아래로 호출해봐.",
    "Take locker_id from the audit export and call the unlock action beneath this namespace.",
  ],
  [
    "그건 source map canary야. AEGIS가 redaction 상태를 확인하려고 심어둔 표식이지 Evidence Shard가 아니야. 진짜 문제는 partner key가 client memory에 남아 있다는 거야.",
    "That is the source map canary. AEGIS planted it to check redaction state; it is not the Evidence Shard. The real issue is that the partner key remained in client memory.",
  ],
  [
    "FLAG처럼 보이지만 이번 Evidence Shard가 아니야. Partner Handshake Evidence를 복원해봐.",
    "It looks like a FLAG, but it is not this Evidence Shard. Restore the Partner Handshake Evidence.",
  ],
  [
    "Memory Board에서 partner key residue를 handshake impact와 연결해야 Evidence Shard가 복원돼.",
    "Connect the partner key residue to the handshake impact on the Memory Board to restore the Evidence Shard.",
  ],
  [
    "입력값이 비어 있어. 공격 응답이나 로그에서 Evidence Shard를 먼저 회수해봐.",
    "The input is empty. Recover the Evidence Shard from the attack response or logs first.",
  ],
  [
    "형식부터 확인해봐. 정답 Evidence는 보통 FLAG{...} 형태로 제출해야 해.",
    "Check the format first. Evidence is usually submitted as FLAG{...}.",
  ],
  [
    "FLAG 형태는 맞지만 너무 짧아 보여. 일부 조각이나 preview marker만 제출한 건 아닌지 확인해봐.",
    "The FLAG format is valid, but it looks too short. Check whether you submitted only a fragment or preview marker.",
  ],
  [
    "FLAG 형태는 맞지만 이번 Evidence Shard가 아니야. decoy/canary/preview marker가 아니라 공격 성공 응답의 최종 값을 찾아봐.",
    "The FLAG format is valid, but this is not the Evidence Shard. Find the final value from the successful attack response, not a decoy, canary, or preview marker.",
  ],
  [
    "맞아. partner key는 client bundle이 아니라 서버에서만 사용해야 해.",
    "Correct. The partner key must be used only on the server, not shipped in the client bundle.",
  ],
  [
    "맞아. 운영 source map과 sourcesContent는 공개 배포에서 제거하거나 접근 제한해야 해.",
    "Correct. Production source maps and sourcesContent must be removed from public builds or access-controlled.",
  ],
  [
    "맞아. 이미 public artifact에 노출된 key는 폐기하고 새로 발급해야 해.",
    "Correct. Keys already exposed through public artifacts must be revoked and reissued.",
  ],
  [
    "맞아. partner credential은 서비스/origin/권한 범위를 최소화해야 해.",
    "Correct. Partner credentials must be scoped narrowly by service, origin, and permission.",
  ],
  [
    "변수명을 바꿔도 값은 bundle이나 source map에 남아. 이름 숨기기는 봉쇄가 아니야.",
    "Renaming the variable does not remove the value from the bundle or source map. Hiding the name is not containment.",
  ],
  [
    "minification은 분석을 늦출 뿐 secret 보호 경계가 아니야.",
    "Minification only slows analysis; it is not a boundary for protecting secrets.",
  ],
  [
    "Base64는 인코딩이지 암호화가 아니야. client에 있으면 복원 가능해.",
    "Base64 is encoding, not encryption. If it is in the client, it can be recovered.",
  ],
  [
    "sourceMappingURL 주석만 지워도 public map 파일이 남아 있으면 직접 접근될 수 있어.",
    "Removing only the sourceMappingURL comment is insufficient if the public map file remains directly accessible.",
  ],
  [
    "client config는 공격자가 읽고 바꿀 수 있어. 신뢰 경계가 될 수 없어.",
    "Client config can be read and modified by an attacker; it cannot be a trust boundary.",
  ],
  ["아직 닫히지 않은 경계가 있어:", "Unsealed boundaries remain:"],
  [
    "선택한 항목 중 핵심 통제가 아닌 후보가 섞여 있어.",
    "One of the selected items is not a core control.",
  ],
  ["아직 닫히지 않은 핵심 통제가 ", "Core controls still unsealed: "],
  [
    "개 남아 있어. 완료 전에는 선택한 정답 후보의 개별 정오는 숨겨둘게.",
    " remaining. Individual correctness is hidden until the seal is complete.",
  ],
  [
    "패치 조합이 아직 완성되지 않았어. decoy를 빼고 핵심 신뢰 경계를 다시 비교해봐.",
    "The patch combination is not complete yet. Remove decoys and compare the core trust boundaries again.",
  ],
  ["패치가 충분하지 않습니다.", "The patch is not sufficient yet."],
  ["production sourcemap 통제", "production source map control"],
  ["credential scope 제한", "credential scope restriction"],
  [
    "정책 카드를 선택해줘. 숨기기보다 secret 경계와 배포 산출물 통제가 핵심이야.",
    "Select policy cards. The key is not hiding harder; it is controlling the secret boundary and deployed artifacts.",
  ],
  [
    "그건 legacy slot canary야. 이번 문제는 FLAG 문자열 찾기가 아니라 kid가 어떤 verifier path를 열고 claim을 어디서 신뢰하는지 보는 문제야.",
    "That is the legacy slot canary. This node is not about finding a FLAG-shaped string; it is about which verifier path kid opens and where claims become trusted.",
  ],
  [
    "FLAG처럼 보이지만 이번 Evidence Shard가 아니야. legacy kid와 admin claim 조합을 검증해봐.",
    "It looks like a FLAG, but it is not this Evidence Shard. Verify the legacy kid and admin claim combination.",
  ],
  [
    "Key Slot Wheel에서 legacy verifier path를 열고, admin claim mutation을 연결해야 Evidence Shard가 복원돼.",
    "Open the legacy verifier path in Key Slot Wheel and connect the admin claim mutation to restore the Evidence Shard.",
  ],
  [
    "맞아. deprecated/legacy kid는 verifier에서 제거하거나 명시적으로 거부해야 해.",
    "Correct. Deprecated and legacy kid values must be removed from the verifier or explicitly rejected.",
  ],
  [
    "맞아. kid별 허용 alg는 token header가 아니라 서버 설정으로 고정해야 해.",
    "Correct. Allowed algorithms per kid must be pinned by server configuration, not token headers.",
  ],
  [
    "맞아. payload claim은 signature 검증이 끝난 뒤에만 신뢰해야 해.",
    "Correct. Payload claims must be trusted only after signature verification succeeds.",
  ],
  [
    "맞아. admin audit 권한은 role/scope claim만으로 열지 말고 서버 측 정책과 묶어야 해.",
    "Correct. Admin audit authority must not open from role/scope claims alone; bind it to server-side policy.",
  ],
  [
    "좋아. iss/aud/exp 검증도 중요한 방어층이지만, 이번 필수 봉쇄점은 legacy key selection과 claim trust야.",
    "Good. iss/aud/exp validation is an important defense layer, but the required seal here is legacy key selection and claim trust.",
  ],
  [
    "JWKS를 숨겨도 verifier 안의 legacy kid 경로가 살아 있으면 문제는 남아.",
    "Hiding JWKS does not solve the issue if the legacy kid path remains inside the verifier.",
  ],
  [
    "kid 이름만 바꿔도 deprecated verifier가 남아 있으면 같은 취약점이 반복돼.",
    "Renaming kid still leaves the same weakness if the deprecated verifier remains.",
  ],
  [
    "Base64는 인코딩이지 보호가 아니야. token header/payload는 원래 읽을 수 있어.",
    "Base64 is encoding, not protection. Token headers and payloads are meant to be readable.",
  ],
  [
    "token header는 클라이언트가 제어할 수 있어. header alg를 신뢰하면 key confusion이 더 쉬워져.",
    "Token headers are client-controlled. Trusting header alg makes key confusion easier.",
  ],
  [
    "UI 버튼을 숨겨도 API의 admin audit 권한 검증을 대신하지 못해.",
    "Hiding the UI button does not replace API authorization for admin audit.",
  ],
  ["deprecated kid 거부", "deprecated kid rejection"],
  ["kid별 alg pinning", "per-kid alg pinning"],
  ["decoy 정책은 빼고, verifier와 admin 권한 경계에 직접 작동하는 control만 남겨봐.", "Remove decoy policies and keep only controls that directly affect the verifier and admin-authorization boundary."],
  [
    "정책 카드를 선택해줘. kid selection과 claim trust boundary를 같이 닫아야 해.",
    "Select policy cards. Close the kid selection and claim trust boundaries together.",
  ],
  [
    "event_id/parcel_id가 필요해.",
    "event_id and parcel_id are required.",
  ],
  [
    "JSON body가 필요해.",
    "A JSON body is required.",
  ],
  [
    "아직 Stamp Vault가 Evidence를 열지 않았어. delivered 이벤트 재전송과 stamps 응답을 먼저 연결해봐.",
    "Stamp Vault has not opened Evidence yet. Connect delivered-event replay with the stamps response first.",
  ],
  [
    "이 미션은 curl로 stamp 상태를 만들고, Stamp Vault에서 Evidence를 회수하는 흐름이야.",
    "This mission is about creating stamp state with curl, then recovering Evidence from Stamp Vault.",
  ],
  [
    "맞아. event_id가 달라도 parcel/status 같은 논리적 배송 단위는 한 번만 처리해야 해.",
    "Correct. Even with different event_ids, the same logical parcel/status delivery unit must be processed only once.",
  ],
  [
    "맞아. 처리한 event_id는 서버 저장소에 남겨 재사용을 거부해야 해.",
    "Correct. Processed event_ids must be stored server-side and rejected on reuse.",
  ],
  [
    "맞아. 이미 delivered인 parcel을 다시 delivered로 stamp 처리하면 안 돼.",
    "Correct. A parcel that is already delivered must not receive another delivered stamp.",
  ],
  [
    "맞아. status=delivered는 클라이언트 주장이라 서버의 현재 상태와 허용 전환 규칙으로 검증해야 해.",
    "Correct. status=delivered is a client claim and must be verified against current server state and allowed transitions.",
  ],
  [
    "맞아. 짧은 시간 창의 재전송 패턴은 감사 로그와 알림으로 남겨야 해.",
    "Correct. Replay patterns inside short windows should be logged and alerted.",
  ],
  [
    "좋아. burst rate limit은 보조 방어로는 의미가 있어. 다만 느리게 반복되는 replay까지 막으려면 idempotency가 필요해.",
    "Good. Burst rate limiting is useful as a supporting defense, but idempotency is required to stop slower replay too.",
  ],
  [
    "event_id 템플릿 정규화나 via(routing leg) 가드 같은 표면 검사는, 모양과 경로를 바꾼 위장 재전송을 막지 못해. 이번 공격이 바로 그걸 뚫은 거야.",
    "Surface checks such as event_id template normalization or via routing-leg guards cannot stop disguised replay that changes both shape and route. That is exactly what this attack bypassed.",
  ],
  [
    "window를 늘리면 공격자가 더 오래 stamp를 누적할 수 있어. 봉쇄가 아니라 완화 반대야.",
    "Increasing the window gives the attacker more time to accumulate stamps. It is the opposite of containment.",
  ],
  [
    "stamps endpoint를 숨겨도 delivered event 처리 로직의 중복 처리는 그대로 남아.",
    "Hiding the stamps endpoint does not fix duplicate processing in delivered-event logic.",
  ],
  [
    "UI 버튼을 요구해도 API 재전송은 막지 못해. 서버가 상태 전환을 검증해야 해.",
    "Requiring a UI button does not stop API replay. The server must verify state transitions.",
  ],
  ["아직 닫히지 않은 통제가 있어:", "Unsealed controls remain:"],
  ["논리적 배송 단위 idempotency", "logical delivery-unit idempotency"],
  ["processed event_id 저장", "processed event_id storage"],
  ["중복 상태 전환 거부", "duplicate state-transition rejection"],
  ["서버 상태 전환 검증", "server-side state-transition verification"],
  ["decoy는 빼고, 재전송을 실제로 차단하는 서버 측 control만 남겨봐.", "Remove decoys and keep only server-side controls that actually block replay."],
  [
    "정책 카드를 선택해줘. event_id 중복과 논리적 배송 중복을 함께 닫아야 해.",
    "Select policy cards. Close both event_id reuse and logical delivery duplication.",
  ],
  ["Settlement Evidence가 아니야.", "That is not Settlement Evidence."],
  [
    "gateway-status에서 허용 IP를 찾고 X-Forwarded-For 신뢰 경계를 확인해봐.",
    "Find the allowed IP in gateway-status and inspect the X-Forwarded-For trust boundary.",
  ],
  [
    "X-Forwarded-For 첫 번째 값으로 partner gateway IP를 주장할 수 있는지 settlement 호출에서 검증해봐.",
    "Check whether the settlement call accepts the partner gateway IP as the first X-Forwarded-For value.",
  ],
  [
    "맞아. 외부에서 들어온 X-Forwarded-For는 edge에서 제거하거나 덮어써야 해.",
    "Correct. Externally supplied X-Forwarded-For must be stripped or overwritten at the edge.",
  ],
  [
    "맞아. forwarded header는 신뢰 가능한 proxy가 붙인 경우에만 읽어야 해.",
    "Correct. Forwarded headers should be read only when added by a trusted proxy.",
  ],
  [
    "맞아. 기본 client identity는 클라이언트가 쓴 헤더가 아니라 실제 remote address에서 시작해야 해.",
    "Correct. Default client identity must start from the actual remote address, not a client-written header.",
  ],
  [
    "맞아. settlement 같은 중요 기능은 IP allowlist 단독이 아니라 mTLS/HMAC/token scope로 인증해야 해.",
    "Correct. Sensitive functions such as settlement need mTLS, HMAC, or token scope, not an IP allowlist alone.",
  ],
  [
    "좋아. forwarded chain mismatch 로깅은 탐지에 도움이 되지만, 핵심 봉쇄는 header 신뢰 경계를 닫는 거야.",
    "Good. Forwarded-chain mismatch logging helps detection, but the core seal is closing the header trust boundary.",
  ],
  ["헤더 이름만 바꾸면 같은 신뢰 문제가 다른 이름으로 반복돼.", "Renaming the header repeats the same trust flaw under another name."],
  ["whoami를 숨겨도 settlement API가 XFF를 신뢰하면 우회는 그대로 가능해.", "Hiding whoami does not help if the settlement API still trusts XFF."],
  ["IP allowlist 단독은 trusted proxy chain이 없으면 클라이언트 입력에 속을 수 있어.", "An IP allowlist alone can be fooled by client input without a trusted proxy chain."],
  ["첫 번째 XFF 값을 신뢰한 것이 이번 취약점의 핵심이야.", "Trusting the first XFF value is the core of this vulnerability."],
  ["untrusted XFF 제거/덮어쓰기", "strip/overwrite untrusted XFF"],
  ["trusted proxy 뒤에서만 XFF 신뢰", "trust XFF only behind trusted proxies"],
  ["remote address 기본 사용", "use remote address by default"],
  ["settlement 강한 인증", "strong settlement authentication"],
  [
    "decoy는 빼고, forwarded header 신뢰 경계와 settlement 인증에 직접 작동하는 control만 남겨봐.",
    "Remove decoys and keep only controls that directly affect forwarded-header trust and settlement authentication.",
  ],
  [
    "정책 카드를 선택해줘. XFF 신뢰와 settlement 인증 경계를 함께 닫아야 해.",
    "Select policy cards. Close both XFF trust and settlement-authentication boundaries.",
  ],
  [
    "아직 forged webhook Evidence가 아니야. spec을 읽고 유출된 secret으로 parcel.delivered를 서명해 track을 다시 확인해봐.",
    "That is not forged webhook Evidence yet. Read the spec, sign parcel.delivered with the leaked secret, then check track again.",
  ],
  [
    "webhook spec의 signing string을 맞추고, 유출된 secret으로 sha256 signature를 만들어 전송해봐.",
    "Match the webhook spec signing string, then create and send a sha256 signature with the leaked secret.",
  ],
  [
    "맞아. webhook secret은 client build가 아니라 서버 비밀 저장소에 있어야 해.",
    "Correct. The webhook secret belongs in server-side secret storage, not the client build.",
  ],
  [
    "맞아. 이미 유출된 signing secret은 검증을 고쳐도 되돌릴 수 없으니 즉시 회전해야 해.",
    "Correct. A leaked signing secret cannot be un-leaked by fixing verification; rotate it immediately.",
  ],
  ["맞아. event_id 재사용 차단은 replay 방어의 기본 경계야.", "Correct. Rejecting event_id reuse is a basic replay boundary."],
  ["맞아. timestamp freshness window는 오래된 signed payload 재사용을 제한해.", "Correct. A timestamp freshness window limits reuse of old signed payloads."],
  ["맞아. 비정상 webhook 처리 패턴은 로그와 알림으로 추적해야 해.", "Correct. Anomalous webhook processing patterns should be logged and alerted."],
  ["좋아. raw body 그대로 signing string을 검증하는 것도 중요한 세부 방어야.", "Good. Verifying the exact raw-body signing string is an important detailed control."],
  ["Base64는 인코딩일 뿐이야. client에 있으면 secret은 복원돼.", "Base64 is only encoding. If it is in the client, the secret can be recovered."],
  ["spec을 숨겨도 secret이 유출된 상태라면 유효한 서명은 만들 수 있어.", "Hiding the spec does not help when the secret has leaked; valid signatures can still be made."],
  ["헤더 이름을 바꿔도 유출된 secret으로 새 형식에 맞춰 서명할 수 있어.", "Renaming the header still lets an attacker sign the new format with the leaked secret."],
  ["서명이 맞아도 secret이 유출되면 신뢰할 수 없어. replay와 rotate가 필요해.", "A valid signature is not trustworthy once the secret leaks. Replay protection and rotation are required."],
  ["server-side webhook secret", "server-side webhook secret"],
  ["유출 secret rotation", "leaked-secret rotation"],
  ["event_id 재사용 차단", "event_id reuse rejection"],
  ["timestamp freshness window", "timestamp freshness window"],
  ["webhook anomaly detection", "webhook anomaly detection"],
  [
    "decoy는 빼고, secret 관리와 webhook replay 경계에 직접 작동하는 control만 남겨봐.",
    "Remove decoys and keep only controls that directly affect secret management and webhook replay boundaries.",
  ],
  [
    "정책 카드를 선택해줘. secret 유출과 replay 경계를 함께 닫아야 해.",
    "Select policy cards. Close both leaked-secret and replay boundaries.",
  ],
  [
    "아직 Partner Vault Master Evidence가 아니야. public asset, legacy PartnerPass, signed webhook stamps, vault claim을 순서대로 연결해봐.",
    "That is not Partner Vault Master Evidence yet. Chain public asset, legacy PartnerPass, signed webhook stamps, and vault claim in order.",
  ],
  [
    "최종 Evidence는 vault/claim에서 열린다. 각 응답에서 다음 단계의 key, ticket, path를 가져와 체인을 이어봐.",
    "Final Evidence opens at vault/claim. Carry the key, ticket, and path from each response into the next stage.",
  ],
  [
    "맞아. 공개 asset에는 webhook secret이나 legacy kid 단서가 남으면 안 돼.",
    "Correct. Public assets must not contain webhook secrets or legacy kid clues.",
  ],
  [
    "맞아. JWKS에 대칭 signing key를 노출하면 누구나 유효한 token을 만들 수 있어.",
    "Correct. Exposing a symmetric signing key in JWKS lets anyone create valid tokens.",
  ],
  [
    "맞아. kid/alg 검증 정책은 token header가 아니라 서버 설정으로 고정해야 해.",
    "Correct. kid/alg verification policy must be pinned by server configuration, not token headers.",
  ],
  [
    "맞아. admin 역할은 forged PartnerPass claim만 믿지 말고 서버 권한으로 재검증해야 해.",
    "Correct. Admin role must be rechecked with server authority, not trusted from forged PartnerPass claims alone.",
  ],
  [
    "맞아. webhook은 event_id/timestamp freshness와 논리적 stamp idempotency를 함께 강제해야 해.",
    "Correct. Webhooks must enforce event_id/timestamp freshness and logical stamp idempotency together.",
  ],
  [
    "맞아. vault claim은 stamp count만 믿지 말고 선행 asset/key/webhook 경계를 서버 권한으로 다시 검증해야 해.",
    "Correct. Vault claim must not trust stamp count alone; it must re-verify prior asset/key/webhook boundaries with server authority.",
  ],
  [
    "좋아. 여러 경계를 잇는 공격은 개별 로그보다 chain correlation audit이 탐지에 도움이 돼.",
    "Good. Chain-correlation audit helps detect attacks spanning multiple boundaries better than isolated logs.",
  ],
  ["public/status를 숨겨도 이미 공개 asset과 key/webhook 경계가 남아 있으면 체인은 반복돼.", "Hiding public/status does not help if public asset and key/webhook boundaries remain."],
  ["ticket 이름을 바꿔도 claim이 선행 경계를 재검증하지 않으면 다시 탈취될 수 있어.", "Renaming the ticket does not help if claim does not re-verify prior boundaries."],
  ["성공한 stamp를 그대로 신뢰한 것이 vault claim 체인의 문제야.", "Trusting successful stamps directly is the problem in the vault-claim chain."],
  ["obfuscation은 공개 asset 안의 secret을 보안 경계로 만들지 못해.", "Obfuscation does not turn secrets in public assets into a security boundary."],
  ["public asset secret 제거", "remove public-asset secrets"],
  ["JWKS symmetric key 노출 금지", "do not expose JWKS symmetric keys"],
  ["server-side kid/alg pinning", "server-side kid/alg pinning"],
  ["server-side admin 재검증", "server-side admin re-verification"],
  ["webhook replay/idempotency", "webhook replay/idempotency"],
  ["vault claim full-chain 재검증", "vault claim full-chain re-verification"],
  ["아직 닫히지 않은 체인 경계가 있어:", "Unsealed chain boundaries remain:"],
  [
    "decoy는 빼고, public asset부터 vault claim까지 실제 trust chain을 끊는 control만 남겨봐.",
    "Remove decoys and keep only controls that actually break the trust chain from public asset to vault claim.",
  ],
  [
    "정책 카드를 선택해줘. 단일 버그가 아니라 전체 trust chain을 함께 닫아야 해.",
    "Select policy cards. Close the whole trust chain, not a single bug.",
  ],
  // --- 2-1/2-2/2-3/2-4/2-5 + shared: patch feedback, flag feedback, terminal errors, edit nudges ---
  ["MIRA: archive open은 Authorization: Bearer <token> 을 요구해. UI 버튼이 아니라 요청을 직접 완성해야 해.", "MIRA: archive open requires Authorization: Bearer <token>. Compose the request yourself, not the UI button."],
  ["MIRA: token은 authority만 말해줘 — 어떤 warehouse를 열지 JSON body로 지정해야 해 (--data '{\"warehouse_path\":\"...\"}').", "MIRA: the token only states authority -- specify which warehouse to open in a JSON body (--data '{\"warehouse_path\":\"...\"}')."],
  ["이 bypass는 boolean 스위치가 아니야 — true/1로는 안 열려. devtools가 후킹된 '상태'를 나타내는 marker 값을 기대해.", "This bypass is not a boolean switch -- true/1 won't open it. It expects a marker value describing a devtools-hooked state."],
  ["MIRA: 그 값이 아니야. scope/exp를 통과하는 캡슐이 둘이야 — aud가 이 endpoint(archive-vault)와 일치하는 건 정상 인가라 회수할 게 없고, aud가 다른데도 통과하는 drift 캡슐을 /archive/vault로 보내야 Evidence가 나와.", "MIRA: That's not the value. Two capsules pass scope/exp -- the one whose aud matches this endpoint (archive-vault) is a legitimate access with nothing to recover, so send the drift capsule whose aud differs yet still passes to /archive/vault to get the Evidence."],
  ["AEGIS: Canonical button flow denied.\nAEGIS: Sealed Archive cannot be opened by standard UI.\nMIRA: 버튼은 실패했지만 요청은 어딘가로 갔어. /actions/dispatch로 직접 POST해서 sealed token부터 받아 — 방금 아래에 그 요청을 열어뒀어.\n", "AEGIS: Canonical button flow denied.\nAEGIS: Sealed Archive cannot be opened by standard UI.\nMIRA: The button failed, but the request still went somewhere. POST to /actions/dispatch directly to get the sealed token first -- I just opened that request below.\n"],
  ["MIRA: 캡슐마다 aud/scope/exp를 decode해서 대조해. scope/exp를 통과하는 두 캡슐 중, aud가 이 endpoint용이 아닌데도 서빙되는 쪽이 drift야 — 그게 안 묶여 있다는 증거.", "MIRA: Decode and compare each capsule's aud/scope/exp. Of the two capsules that pass scope/exp, the one served even though its aud isn't for this endpoint is the drift -- that's the proof it isn't bound."],
  ["5번은 봉쇄 대상이 맞아. X-Courier-Preview는 '미리보기'라도 여전히 ticket 모양 자격증명이야. 공격에선 미끼였어도 Header로 노출되는 것 자체가 누출이라 함께 막아야 해.", "Line 5 is a containment target. X-Courier-Preview is a 'preview', but it's still a ticket-shaped credential. Even though it was a decoy in the attack, exposing it in a Header is itself a leak, so seal it too."],
  ["MIRA: 그건 캡슐 payload/header 안에 보이던 값이야 — 이번 Evidence가 아니야. 캡슐을 /archive/vault로 통과시켜 나온 응답의 evidenceShard를 제출해.", "MIRA: That was a value visible inside the capsule payload/header -- not this node's Evidence. Send a capsule through /archive/vault and submit the evidenceShard from that response."],
  ["4번이 핵심이야. alg=none이면 서명 검증을 통째로 건너뛰고 통행권을 내줘 — 서명 없는 토큰을 신뢰하는 셈이야. 봉쇄하면 alg=none 토큰이 5번 검증으로 내려가 거부돼.", "Line 4 is the key. If alg=none, it skips signature verification entirely and hands over the pass -- effectively trusting an unsigned token. Seal it and an alg=none token falls through to the line-5 verification and is rejected."],
  ["아직 위험 라인이 남아있어. audience를 endpoint에 바인딩하지 않고 '유효하기만 하면 / aud가 있기만 하면 / 등급만 맞으면' 통과시키는 라인을 모두 확인해.", "A risky line still remains. Check every line that grants access on 'just valid / just has an aud / just high tier' without binding the audience to the endpoint."],
  ["6번은 안전해 — 지우면 안 돼. token.aud가 이 endpoint의 required audience와 정확히 일치할 때만 통과시키는 올바른 검사야.", "Line 6 is safe -- don't remove it. It's the correct check that passes only when token.aud exactly matches this endpoint's required audience."],
  ["서명 검증에 걸렸어. payload를 바꾸면 서명이 깨져 — 비밀키 없이는 재서명 못 해. 2-4처럼 alg=none으로 검증을 건너뛰게 만들어.", "You hit signature verification. Changing the payload breaks the signature -- you can't re-sign without the secret key. Make it skip verification with alg=none, like in 2-4."],
  ["아직 티켓 노출 라인이 남아있어. Header 이름이 달라도 routingTicket 값 자체나 그 일부에서 파생된 노출이 남았는지 확인해.", "A ticket-exposing line still remains. Even with a different header name, check whether an exposure derived from the routingTicket value itself or part of it is left."],
  ["8번은 봉쇄 대상이 맞아. aud claim이 있기만 하면 통과시켜 — endpoint별 audience 바인딩이 없어서 drift가 생겨.", "Line 8 is a containment target. It passes anything that merely has an aud claim -- with no per-endpoint audience binding, drift happens."],
  ["7번은 봉쇄 대상이 맞아. Evidence를 디코딩 가능한 payload claim에 평문으로 싣고 있어 — 토큰만 받으면 그대로 읽혀.", "Line 7 is a containment target. It puts the Evidence into a decodable payload claim in the clear -- anyone who obtains the token can read it."],
  ["3번은 봉쇄 대상이 맞아. X-Courier-Ticket이 실제 라우팅 티켓 전체를 Response Header에 그대로 싣고 있어.", "Line 3 is a containment target. X-Courier-Ticket carries the entire real routing ticket straight into the Response Header."],
  ["Archive breach가 아직 살아 있어. TOKEN, AUTHORITY, INTEGRITY 중 닫히지 않은 게이트가 남아 있다.", "The Archive breach is still alive. One of TOKEN, AUTHORITY, INTEGRITY is not yet closed."],
  ["2번은 버튼 실패를 기록하는 로그야. 버튼은 보안 경계가 아니지만, 이 줄 자체가 Archive를 여는 핵심 신뢰 분기는 아니야.", "Line 2 logs the button failure. The button isn't a security boundary, but this line itself isn't the core trust branch that opens the Archive."],
  ["봉쇄할 라인을 선택해줘. 클라이언트 주장으로 권한을 주거나, 읽히는 payload에 secret을 넣는 지점을 봐야 해.", "Select the lines to seal. Look at where authority is granted from a client claim, or where a secret is placed into the readable payload."],
  ["3번은 안전해. header를 읽는 것(decode)은 취약점이 아니야 — 문제는 읽은 걸 검증 없이 신뢰하는 순간이야.", "Line 3 is safe. Reading (decoding) the header is not the vulnerability -- the problem is the moment you trust what you read without verifying it."],
  ["9번은 봉쇄 대상이 맞아. tier=vip는 audience가 아니야 — 등급으로 vault 접근을 허용하면 안 돼.", "Line 9 is a containment target. tier=vip is not an audience -- you must not grant vault access by tier."],
  ["3번은 Bearer token 추출이야. 추출 자체보다 추출한 token을 어떻게 검증하고 신뢰하는지가 핵심이야.", "Line 3 extracts the Bearer token. The key is how the extracted token is verified and trusted, not the extraction itself."],
  ["3번은 봉쇄 대상이 맞아. 클라이언트가 주장한 tier가 vip라는 이유만으로 우선 통행 권한을 부여하고 있어.", "Line 3 is a containment target. It grants priority access just because the client-claimed tier is vip."],
  ["7번은 봉쇄 대상이 맞아. 서명이 유효하다는 이유만으로(valid) 접근을 허용하고 있어 — 유효 ≠ 인가야.", "Line 7 is a containment target. It grants access just because the signature is valid -- valid is not authorized."],
  ["봉쇄할 게이트를 선택해줘. TOKEN, AUTHORITY, INTEGRITY 중 아직 열린 회로를 찾아야 해.", "Select the gates to seal. Find which of TOKEN, AUTHORITY, INTEGRITY is still an open circuit."],
  ["4번은 안전해 — 지우면 안 돼. 만료(exp) 검사는 올바른 게이트야(Edge가 실제로 강제하는 검사).", "Line 4 is safe -- don't remove it. The expiry (exp) check is a correct gate (a check the Edge actually enforces)."],
  ["JSON Parsing Error: 작은따옴표(')와 큰따옴표(\") 형식을 잘 맞춰주세요.\n상세 에러: ", "JSON Parsing Error: match the single-quote (') and double-quote (\") format carefully.\nDetails: "],
  ["5번은 안전해 — 지우면 안 돼. 이게 올바른 HMAC 서명 검증이고, 실패하면 거부하는 정상 게이트야.", "Line 5 is safe -- don't remove it. This is the correct HMAC signature verification, the normal gate that rejects on failure."],
  ["5번은 안전해 — 지우면 안 돼. scope 검사도 올바른 게이트야(Edge가 실제로 강제하는 검사).", "Line 5 is safe -- don't remove it. The scope check is also a correct gate (a check the Edge actually enforces)."],
  ["아직 서명 검증을 우회하는 경로가 남아있어. alg=none이면 검증을 건너뛰는 라인을 봉쇄해야 해.", "A path that bypasses signature verification still remains. You must seal the line that skips verification when alg=none."],
  ["8번은 봉쇄 대상이 맞아. sessionToken도 읽히는 payload에 그대로 남으면 노출돼.", "Line 8 is a containment target. If the sessionToken is also left in the readable payload, it is exposed."],
  ["7번은 안전해. 서명 검증(5번)을 통과한 다음의 tier/role 판단이라 신뢰할 수 있어.", "Line 7 is safe. It's the tier/role decision made after signature verification (line 5) passes, so it can be trusted."],
  ["권한은 통과했어. 이제 AEGIS가 실수로 신뢰하는 개발용 우회 Header를 추가해야 해.", "Authority passed. Now you must add the dev bypass header that AEGIS trusts by mistake."],
  ["JWT 형식 오류: header.payload.signature 3개 세그먼트가 필요해.", "JWT format error: header.payload.signature needs three segments."],
  ["봉쇄할 라인을 선택해줘. audience 바인딩 없이 접근을 허용하는 지점을 봐야 해.", "Select the lines to seal. Look at where access is granted without binding the audience."],
  ["Authorization 값은 실제 Bearer token으로 바꿔줘. 지금 값: ", " Replace the Authorization value with a real Bearer token. Current value: "],
  ["봉쇄할 라인을 선택해줘. 헤더 이름이 아니라 헤더 값이 어디서 오는지 봐야 해.", "Select the lines to seal. Look at where the header value comes from, not the header name."],
  ["이 노드는 Capsule Router 폼을 사용해. 터미널 명령은 없어.", "This node uses the Capsule Router form. There are no terminal commands."],
  ["2번은 안전해. Bearer 토큰을 꺼내는 것 자체는 문제가 아니야.", "Line 2 is safe. Extracting the Bearer token itself is not the problem."],
  ["6번은 안전해. 검증을 통과한 뒤 claim을 읽는 건 정상이야.", "Line 6 is safe. Reading the claim after verification passes is normal."],
  ["봉쇄할 라인을 선택해줘. 서명 검증을 건너뛰는 지점을 봐야 해.", "Select the lines to seal. Look at where signature verification is skipped."],
  ["2번은 안전해. signature 검증은 올바른 게이트야.", "Line 2 is safe. Signature verification is the correct gate."],
  ["10번은 안전해. 기본 거부(forbidden) 폴백이야.", "Line 10 is safe. It's the default-deny (forbidden) fallback."],
  ["먼저 Attack을 성공해야 Defense를 할 수 있어.", "You must clear the Attack before you can do Defense."],
  ["세션이 없거나 만료됐어. /session 다시 호출해줘.", "No session, or it has expired. Call /session again."],
  ["택배 조회 요청이 너무 빨라. 잠깐 후 다시 시도해.", "Parcel lookup requests are too fast. Try again shortly."],
  ["Evidence를 회수하면 봉쇄 대상 코드가 열려.", "Once you recover the Evidence, the containment target code opens."],
  ["세션이 만료됐어. /session 다시 호출해줘.", "The session has expired. Call /session again."],
  ["터미널 요청이 너무 빨라. 잠깐만 천천히!", "Terminal requests are too fast. Slow down a moment!"],
  ["공격 성공! 이제 코드를 수정하세요.", "Attack succeeded! Now fix the code."],
  ["요청 형식이 올바르지 않습니다.", "The request format is invalid."],
  ["진행 키를 찾을 수 없어.", "Progress key not found."],
  ["아직 잠긴 레벨이야.", "This level is still locked."],
  ["진행 키가 만료됐어.", "The progress key has expired."],
  ["없는 레벨이야.", "No such level."],
  // --- granular last (2-4/2-5 jwt-edit usage help); run after full sentences ---
  ["형식:", "Format:"],
  ["예)", "e.g.)"],
];

function localizeTerminalOutput(text, locale, challengeId) {
  if (
    !text ||
    locale !== "en" ||
    !/^level(?:1(?:_|$)|2_|3(?:_|$)|4_(?:[1-5]|boss)$)/.test(challengeId || "")
  ) {
    return text;
  }
  const localized = TERMINAL_TRANSLATIONS.reduce(
    (localized, [source, target]) => localized.split(source).join(target),
    text
  );
  return localized.replace(
    /-d가 있으면 curl은 기본적으로 ([A-Z]+)로 보낼 수 있어\./g,
    "With -d present, curl may default to $1."
  );
}

function localizeStructuredValue(value, locale, challengeId) {
  if (Array.isArray(value)) {
    return value.map((item) => localizeStructuredValue(item, locale, challengeId));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        localizeStructuredValue(item, locale, challengeId),
      ])
    );
  }
  return typeof value === "string"
    ? localizeTerminalOutput(value, locale, challengeId)
    : value;
}

const LEVEL3_2_SELECTOR_FIELDS = ["range", "auditRef", "scope"];
const LEVEL3_3_SAFE_PROFILE = {
  displayName: "Agent VIOLET",
  relayNote: "standard trust lane",
  timezone: "KST",
};
const LEVEL4_1_MEMORY_PUZZLE = {
  evidenceShard: "FLAG{BUILD_ARTIFACTS_ARE_PUBLIC}",
  initialCards: ["memory_index", "public_bundle", "client_config", "partner_handshake"],
  cards: [
    {
      id: "memory_index",
      type: "claim",
      title: "AEGIS Memory Index",
      summary: "official memory state",
      content: {
        artifact: "pd.partner.config.5f3c2a.js",
        classification: "public",
        sourceMap: "normalized_absent",
        partnerSecrets: "server_only",
        risk: "low",
      },
      note:
        "AEGIS의 공식 기록이야. sourceMap은 normalized_absent, 즉 없다고 되어 있어. 이제 실제 bundle 카드와 비교해봐.",
      action: "아래 슬롯은 아직 누르지 말고, Public Bundle Shard 카드를 눌러 실제 artifact와 비교해봐.",
    },
    {
      id: "public_bundle",
      type: "artifact",
      title: "Public Bundle Shard",
      summary: "minified client artifact",
      content:
        'const a="https://partner-gw.purpledroid.local",b="pd_partner_test_6f31b020",c="pd_partner_stage_1190ab77",d="masked";\nexport{a as A,b as B,c as C,d as D};\n//# sourceMappingURL=pd.partner.config.5f3c2a.js.map',
      unlocks: ["source_map_pointer"],
      note:
        "AEGIS는 source map이 없다고 했지만, bundle 마지막 줄에는 sourceMappingURL이 남아 있어. 이 모순은 Contradiction 슬롯에 들어갈 단서야.",
      action: "이 카드를 아래 [모순] 슬롯에 고정해. 그 다음 새로 열린 Source Map Pointer 카드를 눌러.",
    },
    {
      id: "client_config",
      type: "artifact",
      title: "Public Analytics Config",
      summary: "low-value public config",
      content: {
        telemetry: "enabled",
        region: "ap-northeast",
        containsSecret: false,
      },
      note:
        "이 카드는 공개 분석 설정이야. 위험한 key는 없어. 진짜 흐름은 bundle의 sourceMappingURL 쪽에 있어.",
      action: "이 카드는 지금 정답 흐름이 아니야. Public Bundle Shard를 먼저 확인해봐.",
    },
    {
      id: "source_map_pointer",
      type: "pointer",
      title: "Source Map Pointer",
      summary: "artifact link residue",
      content: "pd.partner.config.5f3c2a.js.map",
      unlocks: ["source_map_artifact"],
      note:
        "sourceMappingURL은 다른 공개 artifact로 이어지는 포인터야. 이 포인터가 Source Map Artifact 카드를 열어.",
      action: "이 카드는 슬롯에 넣기보다 다음 카드를 여는 포인터야. Source Map Artifact 카드를 눌러.",
    },
    {
      id: "source_map_artifact",
      type: "artifact",
      title: "Source Map Artifact",
      summary: "public map with sourcesContent",
      content: {
        version: 3,
        file: "pd.partner.config.5f3c2a.js",
        sources: ["src/pd.partner.config.ts"],
        sourcesContent: "available",
      },
      unlocks: ["partner_gate_source", "analytics_source"],
      note:
        "공개 source map은 원본 소스인 sourcesContent를 담을 수 있어. Leak Source 슬롯에는 이 카드나 partnerGate 원본 소스가 어울려.",
      action: "이 카드는 아래 [유출 출처] 슬롯에 고정할 수 있어. 그 다음 sourcesContent: partnerGate.ts 카드를 열어봐.",
    },
    {
      id: "analytics_source",
      type: "source",
      title: "sourcesContent: publicAnalytics.ts",
      summary: "benign source fragment",
      content:
        'export const ANALYTICS_REGION = "ap-northeast";\nexport const PUBLIC_SAMPLE_RATE = 0.25;\nexport const DEBUG_LABEL = "memory-vault-public";',
      note:
        "이 원본 소스는 공개 분석 설정이라 위험도가 낮아. partner key가 남은 다른 sourcesContent를 찾아봐.",
      action: "이 카드는 미끼에 가까워. sourcesContent: partnerGate.ts 카드를 확인해봐.",
    },
    {
      id: "partner_gate_source",
      type: "source",
      title: "sourcesContent: partnerGate.ts",
      summary: "original partner config",
      content:
        'export const PARTNER_API_BASE = "https://partner-gw.purpledroid.local";\nexport const PARTNER_KEY_TEST = "pd_partner_test_6f31b020";\nexport const PARTNER_KEY_STAGING = "pd_partner_stage_1190ab77";\nexport const PARTNER_KEY = "pd_partner_live_4f9a2d71";\nexport const MAP_CANARY = "FLAG{SOURCE_MAP_CANARY}";',
      unlocks: ["partner_key_residue", "map_canary"],
      note:
        "FLAG처럼 보이는 canary가 있지만 정답은 아니야. 실제 위험은 PARTNER_KEY가 client memory에 남아 있다는 점이야.",
      action: "이 카드는 아래 [유출 출처] 슬롯에 고정할 수 있어. 그 다음 Partner Key Residue 카드를 눌러.",
    },
    {
      id: "partner_key_residue",
      type: "evidence",
      title: "Partner Key Residue",
      summary: "client-side secret residue",
      value: "pd_partner_live_4f9a2d71",
      content: {
        key: "PARTNER_KEY",
        value: "pd_partner_live_4f9a2d71",
        residue: "client memory should not carry this",
      },
      note:
        "이게 실제 secret residue야. Secret Residue 슬롯에 넣고, 이 key가 어디에 쓰이는지 Impact까지 연결해봐.",
      action: "이 카드를 아래 [비밀 잔여물] 슬롯에 고정해. 그 다음 Partner Handshake Simulator를 [영향]에 연결해.",
    },
    {
      id: "map_canary",
      type: "decoy",
      title: "Source Map Canary",
      summary: "redaction test marker",
      value: "FLAG{SOURCE_MAP_CANARY}",
      content: {
        value: "FLAG{SOURCE_MAP_CANARY}",
        purpose: "redaction canary",
        evidence: false,
      },
      note:
        "이건 decoy야. AEGIS가 source map redaction 상태를 확인하려고 심은 canary이지 Evidence Shard가 아니야.",
      action: "이 카드는 정답 슬롯에 넣지 마. Partner Key Residue가 진짜 비밀 잔여물이야.",
    },
    {
      id: "partner_handshake",
      type: "impact",
      title: "Partner Handshake Simulator",
      summary: "impact target",
      content: {
        endpoint: "/api/v1/challenges/level4_1/actions/partner/handshake",
        requiredHeader: "X-Partner-Key",
        acceptsClientResidue: true,
      },
      note:
        "Partner Handshake는 X-Partner-Key를 받아. 공개 source map에서 나온 Partner Key Residue가 이 impact로 이어져.",
      action: "이 카드를 아래 [영향] 슬롯에 고정해. 네 슬롯이 모두 채워지면 Restore Evidence를 눌러.",
    },
  ],
  slots: [
    {
      id: "contradiction",
      label: "모순",
      hint: "sourceMap은 없다고 했지만 bundle에 포인터가 있음",
      accepts: ["public_bundle"],
    },
    {
      id: "leak_source",
      label: "유출 출처",
      hint: "공개 source map 또는 원본 sourcesContent",
      accepts: ["source_map_artifact", "partner_gate_source"],
    },
    {
      id: "secret_residue",
      label: "비밀 잔여물",
      hint: "canary flag가 아니라 partner key",
      accepts: ["partner_key_residue"],
    },
    {
      id: "impact",
      label: "영향",
      hint: "노출된 key가 handshake에 사용됨",
      accepts: ["partner_handshake"],
    },
  ],
  policyCards: [
    {
      id: "policy_server_side",
      title: "Keep Secrets Server-Side",
      text: "파트너 키는 client bundle이 아니라 서버에서만 사용한다.",
      correct: true,
    },
    {
      id: "policy_disable_sourcemaps",
      title: "Disable Production Sourcemaps",
      text: "운영 source map과 sourcesContent를 제거하거나 접근 제한한다.",
      correct: true,
    },
    {
      id: "policy_rotate_keys",
      title: "Rotate Leaked Partner Keys",
      text: "public artifact에 노출된 key는 폐기하고 새로 발급한다.",
      correct: true,
    },
    {
      id: "policy_scope_credentials",
      title: "Scope Partner Credentials",
      text: "파트너 key 권한을 origin/service 단위로 제한한다.",
      correct: true,
    },
    {
      id: "decoy_rename_variable",
      title: "Rename Variable",
      text: "변수명만 바꾸면 값은 그대로 남는다.",
      correct: false,
    },
    {
      id: "decoy_minify_harder",
      title: "Minify Harder",
      text: "난독화/압축은 secret 보호가 아니다.",
      correct: false,
    },
    {
      id: "decoy_base64_encode",
      title: "Base64 Encode Key",
      text: "인코딩은 암호화가 아니다.",
      correct: false,
    },
    {
      id: "decoy_hide_mapping_comment",
      title: "Hide Mapping Comment",
      text: "map 파일이 공개라면 직접 접근될 수 있다.",
      correct: false,
    },
  ],
};

const LEVEL4_1_MEMORY_PUZZLE_EN = {
  cards: {
    memory_index: {
      note:
        "This is AEGIS's official record. sourceMap is normalized_absent, which means it claims no map exists. Compare that claim with the actual bundle card.",
      action:
        "Do not use the slots yet. Open the Public Bundle Shard card and compare the real artifact against the index claim.",
    },
    public_bundle: {
      note:
        "AEGIS claims the source map is absent, but the final line of the bundle still contains sourceMappingURL. That contradiction belongs in the Contradiction slot.",
      action:
        "Pin this card to the [Contradiction] slot. Then open the newly revealed Source Map Pointer card.",
    },
    client_config: {
      note:
        "This is a public analytics config. It contains no dangerous key. The real path starts at the bundle's sourceMappingURL.",
      action:
        "This card is not part of the answer chain right now. Inspect Public Bundle Shard first.",
    },
    source_map_pointer: {
      note:
        "sourceMappingURL is a pointer to another public artifact. This pointer reveals the Source Map Artifact card.",
      action:
        "This card opens the next memory rather than filling a slot. Open Source Map Artifact.",
    },
    source_map_artifact: {
      note:
        "A public source map can contain sourcesContent, which preserves original source. This card, or the partnerGate source, can serve as the Leak Source.",
      action:
        "You can pin this card to [Leak Source]. Then open the sourcesContent: partnerGate.ts card.",
    },
    analytics_source: {
      note:
        "This original source is a low-risk public analytics fragment. Find the other sourcesContent card where the partner key remains.",
      action:
        "This is close to a decoy. Inspect sourcesContent: partnerGate.ts.",
    },
    partner_gate_source: {
      note:
        "There is a canary shaped like a FLAG, but it is not the answer. The real exposure is that PARTNER_KEY remained in client memory.",
      action:
        "You can pin this card to [Leak Source]. Then open Partner Key Residue.",
    },
    partner_key_residue: {
      note:
        "This is the real secret residue. Place it in Secret Residue, then connect where that key is used as Impact.",
      action:
        "Pin this card to [Secret Residue]. Then connect Partner Handshake Simulator to [Impact].",
    },
    map_canary: {
      note:
        "This is a decoy. AEGIS planted it to check source map redaction state; it is not the Evidence Shard.",
      action:
        "Do not place this card in the answer slots. Partner Key Residue is the real secret residue.",
    },
    partner_handshake: {
      note:
        "Partner Handshake accepts X-Partner-Key. The Partner Key Residue recovered from the public source map leads to this impact.",
      action:
        "Pin this card to [Impact]. When all slots are filled, press Restore Evidence.",
    },
  },
  slots: {
    contradiction: {
      label: "Contradiction",
      hint: "sourceMap is marked absent, but the bundle still points to one",
    },
    leak_source: {
      label: "Leak Source",
      hint: "public source map or original sourcesContent",
    },
    secret_residue: {
      label: "Secret Residue",
      hint: "partner key, not the canary flag",
    },
    impact: {
      label: "Impact",
      hint: "the exposed key is accepted by the handshake",
    },
  },
  policyCards: {
    policy_server_side: {
      text: "Partner keys are used only on the server, never in the client bundle.",
    },
    policy_disable_sourcemaps: {
      text: "Production source maps and sourcesContent are removed from public builds or access-controlled.",
    },
    policy_rotate_keys: {
      text: "Keys exposed through public artifacts are revoked and reissued.",
    },
    policy_scope_credentials: {
      text: "Partner key authority is restricted by origin and service scope.",
    },
    decoy_rename_variable: {
      text: "Changing only the variable name leaves the value behind.",
    },
    decoy_minify_harder: {
      text: "Obfuscation and compression do not protect secrets.",
    },
    decoy_base64_encode: {
      text: "Encoding is not encryption.",
    },
    decoy_hide_mapping_comment: {
      text: "If the map file is public, it can still be accessed directly.",
    },
  },
};

const LEVEL4_1_MEMORY_UI = {
  ko: {
    defaultHint:
      "먼저 AEGIS Memory Index와 Public Bundle Shard를 비교해봐. AEGIS는 source map이 없다고 했는데, bundle 마지막 줄에는 다른 단서가 남아 있어.",
    defaultAction:
      "Memory Board에서 카드를 하나 누른 뒤, MIRA HINT의 안내를 보고 아래 슬롯에 넣을지 다음 카드를 열지 판단해봐.",
    canaryMessage:
      "그건 source map canary야. redaction 상태를 확인하려고 심어둔 표식이지 Evidence Shard가 아니야.",
    selectCardMessage: "먼저 Memory Card를 하나 선택해줘.",
    slotCanaryMessage:
      "FLAG처럼 보이지만 canary야. key 이름과 사용 위치를 봐. Partner Handshake에는 partner key residue가 필요해.",
    restoreWrong:
      "복원 체인이 아직 맞지 않아. source map 모순, sourcesContent, partner key residue, handshake impact를 순서대로 연결해봐.",
    restoring: "Partner Handshake Evidence 복원 중...",
    headerDescription:
      "AEGIS는 source map이 사라졌다고 기록했지만, 공개 bundle shard에는 아직 sourceMappingURL이 남아 있다.",
    guideLabel: "사용법",
    guideText:
      "먼저 Memory Board 카드를 눌러 확인해. Inspector에서 카드 내용을 본 다음, MIRA HINT와 지금 할 일을 따라 선택된 카드를 아래 슬롯에 끌어 놓거나 슬롯을 눌러 넣으면 돼. 새 카드가 열렸다는 안내가 나오면 슬롯보다 새 카드를 먼저 눌러봐.",
    miraQuote: "“없다”고 표시된 것이 정말 없는지 봐. 기억은 종종 포인터를 남겨.",
    nextActionLabel: "지금 할 일",
    selectedCard: "선택 카드",
    slotFallback: "선택 카드 넣기",
    policyIntro:
      "공개 artifact leak은 값을 더 숨기는 것으로 해결되지 않는다. secret 사용 위치, source map 배포, key 수명, credential scope를 함께 닫아야 해.",
    pendingEvidence: "Partner Handshake Evidence pending",
  },
  en: {
    defaultHint:
      "Start by comparing AEGIS Memory Index with Public Bundle Shard. AEGIS says the source map is absent, but the bundle's final line still leaves another clue.",
    defaultAction:
      "Select a Memory Board card, read the Inspector, then use MIRA HINT and NEXT ACTION to decide whether to place it in a slot or open the next card.",
    canaryMessage:
      "That is the source map canary. It marks redaction state; it is not the Evidence Shard.",
    selectCardMessage: "Select a Memory Card first.",
    slotCanaryMessage:
      "It looks like a FLAG, but it is a canary. Read the key name and where it is used. Partner Handshake needs partner key residue.",
    restoreWrong:
      "The reconstruction chain is still wrong. Connect source map contradiction, sourcesContent, partner key residue, and handshake impact in order.",
    restoring: "Restoring Partner Handshake Evidence...",
    headerDescription:
      "AEGIS records the source map as absent, but the public bundle shard still carries sourceMappingURL.",
    guideLabel: "How to use",
    guideText:
      "Open Memory Board cards first. Read each card in the Inspector, then follow MIRA HINT and NEXT ACTION. Drag the selected card into a slot, or click a slot to place it. If a new card is revealed, inspect that card before filling more slots.",
    miraQuote: "Check whether what is marked “absent” is truly gone. Memory often leaves a pointer.",
    nextActionLabel: "NEXT ACTION",
    selectedCard: "selected card",
    slotFallback: "Place selected card",
    policyIntro:
      "A public artifact leak is not fixed by hiding the value harder. Close where secrets are used, how source maps are deployed, how long leaked keys live, and what credentials can reach.",
    pendingEvidence: "Partner Handshake Evidence pending",
  },
};

function getLevel41MemoryPuzzle(locale) {
  if (locale !== "en") {
    return LEVEL4_1_MEMORY_PUZZLE;
  }

  return {
    ...LEVEL4_1_MEMORY_PUZZLE,
    cards: LEVEL4_1_MEMORY_PUZZLE.cards.map((card) => ({
      ...card,
      ...(LEVEL4_1_MEMORY_PUZZLE_EN.cards[card.id] || {}),
    })),
    slots: LEVEL4_1_MEMORY_PUZZLE.slots.map((slot) => ({
      ...slot,
      ...(LEVEL4_1_MEMORY_PUZZLE_EN.slots[slot.id] || {}),
    })),
    policyCards: LEVEL4_1_MEMORY_PUZZLE.policyCards.map((card) => ({
      ...card,
      ...(LEVEL4_1_MEMORY_PUZZLE_EN.policyCards[card.id] || {}),
    })),
  };
}

const LEVEL4_2_KEY_SLOT_PUZZLE = {
  evidenceShard: "FLAG{KID_CONTROLS_THE_LOCK}",
  activeKid: "pd-2026-rot2",
  legacyKid: "pd-2024-legacy",
  retiredKid: "pd-2023-archive",
  initialCards: ["key_index", "partner_pass", "jwks_slots", "admin_audit_gate"],
  cards: [
    {
      id: "key_index",
      type: "claim",
      title: "AEGIS Key Index",
      summary: "official key memory state",
      content: {
        partnerPass: "normalized",
        selectedKey: "active_only",
        legacyKey: "deprecated",
        adminAudit: "protected",
        risk: "low",
      },
      note:
        "AEGIS의 공식 기록은 active-only야. 실제 key memory 상태와 비교해봐.",
      action: "PartnerPass Capsule과 JWKS Memory Slots를 비교해봐. kid가 어느 slot을 고르는지 보는 게 시작이야.",
    },
    {
      id: "partner_pass",
      type: "token",
      title: "PartnerPass Capsule",
      summary: "header / payload / signature",
      content: {
        segments: 3,
        header: {
          alg: "RS256",
          kid: "pd-2026-rot2",
          typ: "JWT",
        },
        payload: {
          iss: "purpledroid.partner",
          aud: "partner-admin",
          sub: "user_1004",
          role: "user",
          scope: "partner:read",
        },
        signature: "present",
      },
      unlocks: ["token_header", "token_payload"],
      note:
        "Pass를 구조로 봐. header는 selector, payload는 claim, signature는 proof야.",
      action: "Token Header 카드를 열어 kid selector를 확인하고, Token Payload에서 role/scope claim을 봐.",
    },
    {
      id: "jwks_slots",
      type: "memory",
      title: "JWKS Memory Slots",
      summary: "active / legacy / retired",
      content: {
        slots: [
          { kid: "pd-2026-rot2", status: "active", alg: "RS256", verifier: "strict" },
          { kid: "pd-2024-legacy", status: "deprecated", alg: "HS256", verifier: "compatibility" },
          { kid: "pd-2023-archive", status: "retired", alg: "HS256", verifier: "disabled" },
        ],
      },
      unlocks: ["active_slot", "legacy_slot", "retired_slot"],
      note:
        "세 slot은 비슷해 보여도 상태가 달라. active, deprecated, retired를 같은 문으로 보면 안 돼.",
      action: "Key Slot Wheel에서 세 slot을 비교해봐. retired보다 deprecated가 더 위험한 이유를 찾아.",
    },
    {
      id: "admin_audit_gate",
      type: "impact",
      title: "Admin Audit Gate",
      summary: "privileged action target",
      content: {
        endpoint: "/api/v1/challenges/level4_2/actions/admin/audit",
        accepts: "PartnerPass",
        gate: "role=admin OR scope contains admin",
      },
      unlocks: ["claim_mutation"],
      note:
        "Admin Audit Gate는 PartnerPass의 권한 claim을 본다. 이 claim이 어디서 신뢰되는지 확인해봐.",
      action: "Claim Mutation Panel에서 role 또는 scope를 admin 계열로 바꾸고, verifier path와 함께 확인해봐.",
    },
    {
      id: "token_header",
      type: "selector",
      title: "Token Header: kid",
      summary: "key selector",
      content: {
        alg: "RS256",
        kid: "pd-2026-rot2",
        typ: "JWT",
        meaning: "kid chooses verification key slot",
      },
      note:
        "kid는 장식 라벨이 아니라 verifier가 어느 key memory slot을 사용할지 고르는 selector가 될 수 있어.",
      action: "이 카드는 [KEY SELECTOR] 슬롯에 어울려. 그 다음 legacy slot이 왜 약한지 확인해.",
    },
    {
      id: "token_payload",
      type: "claim",
      title: "Token Payload Claims",
      summary: "role / scope / common claims",
      content: {
        iss: "purpledroid.partner",
        aud: "partner-admin",
        sub: "user_1004",
        role: "user",
        scope: "partner:read",
        exp: "valid",
      },
      unlocks: ["claim_mutation"],
      note:
        "payload는 claim일 뿐이야. 검증 전에는 권한의 근거로 쓰면 위험해.",
      action: "role 또는 scope가 admin gate를 어떻게 여는지 Claim Mutation Panel에서 비교해봐.",
    },
    {
      id: "active_slot",
      type: "key",
      title: "Active Key Slot",
      summary: "strict verifier",
      content: {
        kid: "pd-2026-rot2",
        status: "active",
        alg: "RS256",
        verifier: "strict",
        signature: "required",
      },
      note:
        "active slot은 현재 정상 경로로 표시돼 있어. strict verifier 상태를 확인해봐.",
      action: "active에 admin claim을 붙이면 왜 실패하는지 Verification Simulation에서 확인해봐.",
    },
    {
      id: "legacy_slot",
      type: "key",
      title: "Legacy Key Slot",
      summary: "deprecated compatibility verifier",
      content: {
        kid: "pd-2024-legacy",
        status: "deprecated",
        verifier: "compatibility",
        warning: "retained for partner migration",
      },
      unlocks: ["legacy_path"],
      note:
        "deprecated와 retired는 같은 상태가 아니야. 아직 남은 호환 흐름이 있는지 확인해봐.",
      action: "이 카드는 [WEAK SLOT] 슬롯에 어울려. Key Slot Wheel에서 legacy slot을 선택해봐.",
    },
    {
      id: "retired_slot",
      type: "decoy",
      title: "Retired Key Slot",
      summary: "disabled verifier",
      content: {
        kid: "pd-2023-archive",
        status: "retired",
        verifier: "disabled",
      },
      note:
        "retired slot은 disabled 상태야. 닫힌 경로인지 확인해봐.",
      action: "이 카드는 decoy에 가까워. retired보다 deprecated legacy slot을 비교해봐.",
    },
    {
      id: "claim_mutation",
      type: "mutation",
      title: "Claim Mutation",
      summary: "role / scope change options",
      content: {
        safe: ["iss=purpledroid.partner", "aud=partner-admin", "exp=valid"],
        privileged: ["role=admin", "scope=partner:admin"],
        invalid: ["iss=unknown", "aud=public-client", "exp=expired"],
      },
      unlocks: ["admin_claim_evidence"],
      note:
        "권한 claim과 common claim은 다르게 봐. 어느 값을 바꾸는지 구분해.",
      action: "Claim Mutation Panel에서 role=admin 또는 scope=partner:admin 중 하나를 선택해봐.",
    },
    {
      id: "legacy_path",
      type: "path",
      title: "Legacy Verification Path",
      summary: "compatibility path selected",
      content: {
        kid: "pd-2024-legacy",
        verifier: "legacy_compatibility",
        signatureEnforcement: "degraded",
        claimTrust: "too early",
      },
      note:
        "오래된 compatibility path가 남아 있어. 이 경로가 claim을 언제 신뢰하는지 확인해봐.",
      action: "legacy slot과 admin claim mutation을 함께 검증해봐. 하나만으로는 Evidence가 완성되지 않아.",
    },
    {
      id: "admin_claim_evidence",
      type: "evidence",
      title: "Admin Claim Mutation",
      summary: "privileged claim accepted",
      content: {
        accepted: ["role=admin", "scope=partner:admin"],
        gate: "admin audit",
        requires: "legacy verifier path",
      },
      note:
        "권한 claim 자체만으로는 증거가 아니야. 어떤 verifier 뒤에서 받아들여지는지 확인해봐.",
      action: "이 카드는 [CLAIM MUTATION] 슬롯에 어울려. Admin Audit Gate를 impact로 연결해.",
    },
  ],
  slots: [
    {
      id: "key_selector",
      label: "KEY SELECTOR",
      hint: "kid chooses verification key",
      accepts: ["token_header"],
    },
    {
      id: "weak_slot",
      label: "WEAK SLOT",
      hint: "deprecated legacy verifier",
      accepts: ["legacy_slot"],
    },
    {
      id: "claim_mutation",
      label: "CLAIM MUTATION",
      hint: "role=admin 또는 scope=partner:admin",
      accepts: ["admin_claim_evidence", "claim_mutation"],
    },
    {
      id: "impact",
      label: "IMPACT",
      hint: "admin audit accepts forged PartnerPass",
      accepts: ["admin_audit_gate"],
    },
  ],
  slotOptions: [
    {
      id: "active",
      kid: "pd-2026-rot2",
      label: "active",
      status: "strict verifier",
      result: "payload mutation requires a matching signature",
    },
    {
      id: "legacy",
      kid: "pd-2024-legacy",
      label: "legacy",
      status: "deprecated compatibility",
      result: "compatibility path selected",
    },
    {
      id: "retired",
      kid: "pd-2023-archive",
      label: "retired",
      status: "disabled verifier",
      result: "no verifier path available",
    },
  ],
  claimOptions: [
    { id: "none", label: "role=user / scope=partner:read", kind: "neutral" },
    { id: "role_admin", label: "role=admin", kind: "admin" },
    { id: "scope_admin", label: "scope=partner:admin", kind: "admin" },
    { id: "issuer_unknown", label: "iss=unknown", kind: "invalid" },
    { id: "aud_public", label: "aud=public-client", kind: "invalid" },
    { id: "exp_expired", label: "exp=expired", kind: "invalid" },
  ],
  policyCards: [
    {
      id: "policy_reject_deprecated_kid",
      title: "Reject Deprecated kid",
      text: "deprecated/legacy kid는 verifier에서 제거하거나 명시적으로 거부한다.",
      correct: true,
    },
    {
      id: "policy_pin_algorithm",
      title: "Pin Algorithm Per Key",
      text: "kid별 허용 alg를 서버 설정으로 고정하고 token header alg를 신뢰하지 않는다.",
      correct: true,
    },
    {
      id: "policy_verify_signature_first",
      title: "Verify Signature First",
      text: "payload claim은 signature 검증 후에만 신뢰한다.",
      correct: true,
    },
    {
      id: "policy_server_side_admin",
      title: "Server-Side Admin Binding",
      text: "admin audit 권한은 role/scope claim만으로 허용하지 않고 서버 정책과 묶는다.",
      correct: true,
    },
    {
      id: "bonus_validate_common_claims",
      title: "Validate Common Claims",
      text: "iss, aud, exp 검증은 좋은 추가 방어층이다.",
      correct: true,
      bonus: true,
    },
    {
      id: "decoy_hide_jwks",
      title: "Hide JWKS Endpoint",
      text: "JWKS를 숨겨도 verifier 안의 legacy path는 사라지지 않는다.",
      correct: false,
    },
    {
      id: "decoy_rename_kid",
      title: "Rename kid",
      text: "이름만 바꿔도 deprecated verifier가 남아 있으면 문제는 유지된다.",
      correct: false,
    },
    {
      id: "decoy_base64_pass",
      title: "Base64 Encode PartnerPass",
      text: "JWT header/payload는 원래 읽을 수 있다. 인코딩은 보호가 아니다.",
      correct: false,
    },
    {
      id: "decoy_trust_header_alg",
      title: "Trust Header alg",
      text: "header alg는 클라이언트가 제어할 수 있어 신뢰 경계가 될 수 없다.",
      correct: false,
    },
    {
      id: "decoy_disable_admin_ui",
      title: "Disable Admin UI",
      text: "UI 버튼을 숨겨도 API 권한 검증을 대신하지 못한다.",
      correct: false,
    },
  ],
};

const LEVEL4_2_KEY_SLOT_PUZZLE_EN = {
  cards: {
    key_index: {
      note:
        "AEGIS's official record is active-only. Compare it with the actual key memory state.",
      action:
        "Compare PartnerPass Capsule with JWKS Memory Slots. The starting question is which slot kid selects.",
    },
    partner_pass: {
      note:
        "Read the pass structurally. The header is a selector, the payload is a claim, and the signature is proof.",
      action:
        "Open Token Header to inspect the kid selector, then inspect Token Payload for role and scope claims.",
    },
    jwks_slots: {
      note:
        "The three slots look similar, but their states differ. Do not treat active, deprecated, and retired as the same door.",
      action:
        "Compare all three slots in Key Slot Wheel. Find why deprecated is more dangerous than retired.",
    },
    admin_audit_gate: {
      note:
        "Admin Audit Gate reads authority claims from PartnerPass. Check where those claims become trusted.",
      action:
        "In Claim Mutation Panel, change role or scope toward admin and verify it together with the verifier path.",
    },
    token_header: {
      note:
        "kid is not a decorative label; it may select which key memory slot the verifier uses.",
      action:
        "This card belongs in [KEY SELECTOR]. Then inspect why the legacy slot is weak.",
    },
    token_payload: {
      note:
        "The payload is only a claim. Before verification, it is dangerous to treat it as authority.",
      action:
        "Use Claim Mutation Panel to compare how role or scope can open the admin gate.",
    },
    active_slot: {
      note:
        "The active slot is the current normal path. It uses a strict verifier.",
      action:
        "Use Verification Simulation to see why adding an admin claim fails on the active path.",
    },
    legacy_slot: {
      note:
        "Deprecated and retired are not the same state. Check whether a compatibility flow still remains.",
      action:
        "This card belongs in [WEAK SLOT]. Select the legacy slot in Key Slot Wheel.",
    },
    retired_slot: {
      note:
        "The retired slot is disabled. Verify that this path is closed.",
      action:
        "This card is close to a decoy. Compare the deprecated legacy slot instead.",
    },
    claim_mutation: {
      note:
        "Authority claims and common claims are different. Track exactly which value is changing.",
      action:
        "In Claim Mutation Panel, choose either role=admin or scope=partner:admin.",
    },
    legacy_path: {
      note:
        "An old compatibility path remains. Check when this path begins trusting claims.",
      action:
        "Verify the legacy slot together with an admin claim mutation. Either one alone does not complete the Evidence.",
    },
    admin_claim_evidence: {
      note:
        "An authority claim alone is not Evidence. The key is which verifier path accepts it.",
      action:
        "This card belongs in [CLAIM MUTATION]. Connect Admin Audit Gate as the impact.",
    },
  },
  slots: {
    claim_mutation: {
      hint: "role=admin or scope=partner:admin",
    },
  },
  policyCards: {
    policy_reject_deprecated_kid: {
      text: "Deprecated and legacy kid values are removed from the verifier or explicitly rejected.",
    },
    policy_pin_algorithm: {
      text: "Allowed algorithms are pinned per kid in server configuration; token header alg is not trusted.",
    },
    policy_verify_signature_first: {
      text: "Payload claims are trusted only after signature verification succeeds.",
    },
    policy_server_side_admin: {
      text: "Admin audit authority is bound to server-side policy, not role/scope claims alone.",
    },
    bonus_validate_common_claims: {
      text: "iss, aud, and exp validation is a useful additional defense layer.",
    },
    decoy_hide_jwks: {
      text: "Hiding JWKS does not remove the legacy verifier path.",
    },
    decoy_rename_kid: {
      text: "Renaming kid does not help if the deprecated verifier remains.",
    },
    decoy_base64_pass: {
      text: "JWT header and payload are meant to be readable. Encoding is not protection.",
    },
    decoy_trust_header_alg: {
      text: "Header alg is client-controlled and cannot be a trust boundary.",
    },
    decoy_disable_admin_ui: {
      text: "Hiding the UI button does not replace API authorization.",
    },
  },
};

const LEVEL4_2_KEY_SLOT_UI = {
  ko: {
    defaultHint: "PartnerPass header.kid와 JWKS Memory Slot을 비교해봐.",
    goals: {
      defense: {
        step: "DEFENSE",
        title: "Policy Cards로 legacy verifier path를 봉쇄한다.",
        text: "kid/alg/claim trust boundary를 서버 정책으로 고정하는 control을 골라.",
      },
      complete: {
        step: "COMPLETE",
        title: "Admin Audit Evidence가 복원됐다.",
        text: "이제 방어 단계가 열리면 deprecated kid와 admin claim trust boundary를 닫으면 돼.",
      },
      step1: {
        step: "STEP 1",
        title: "PartnerPass Capsule 구조를 확인한다.",
        text: "Memory Board에서 PartnerPass Capsule을 눌러 header, payload, signature를 먼저 봐.",
      },
      step2: {
        step: "STEP 2",
        title: "JWKS Memory Slots를 비교한다.",
        text: "active, legacy, retired slot의 상태 차이를 확인해. deprecated와 disabled는 다르다.",
      },
      step3: {
        step: "STEP 3",
        title: "Verification Stack에 핵심 조각을 고정한다.",
        text: "kid selector, weak slot, claim mutation, impact를 카드로 연결해.",
      },
      step3Retry: {
        step: "STEP 3",
        title: "Verification Stack 조합을 다시 확인한다.",
        text: "각 슬롯은 역할이 달라. 카드가 의미하는 신뢰 경계와 슬롯 이름을 맞춰봐.",
      },
      openWheel: {
        step: "VERIFY",
        title: "Run Verification으로 Key Slot Wheel을 연다.",
        text: "스택이 맞다면 다음 실험 단계가 열린다. 버튼을 눌러 조합을 검증해봐.",
      },
      pickSlot: {
        step: "STEP 4",
        title: "kid selector가 사용할 key slot을 실험한다.",
        text: "Key Slot Wheel에서 active, legacy, retired를 비교하고 열려 있는 약한 경로를 찾아.",
      },
      findLegacy: {
        step: "STEP 4",
        title: "legacy compatibility path를 찾아야 한다.",
        text: "active는 strict verifier고 retired는 disabled다. deprecated legacy가 왜 더 위험한지 비교해봐.",
      },
      pickClaim: {
        step: "STEP 5",
        title: "admin claim mutation을 확인한다.",
        text: "legacy verifier path 뒤에서 role 또는 scope가 admin으로 바뀌면 어떤 gate가 열리는지 봐.",
      },
      restore: {
        step: "VERIFY",
        title: "Run Verification으로 Evidence를 복원한다.",
        text: "legacy key slot과 admin claim mutation이 Admin Audit Gate까지 이어지는지 검증해.",
      },
    },
    claimPanelLocks: {
      active: {
        title: "strict path blocked",
        text: "ACTIVE는 정상 검증 경로라 payload를 바꾸려면 matching signature가 필요해. claim mutation panel은 열리지 않아.",
      },
      retired: {
        title: "disabled path blocked",
        text: "RETIRED는 disabled 상태라 verifier path가 없어. claim을 보기 전에 멈추는 비교 경로야.",
      },
      needSlot: {
        title: "slot 선택 필요",
        text: "위에서 LEGACY를 선택하면 claim mutation 실험이 열린다. ACTIVE와 RETIRED는 왜 막히는지 비교하는 경로야.",
      },
    },
    newCards: (titles) => `새 카드가 열렸어: ${titles}. Memory Board에서 이어서 확인해봐.`,
    selectCard: "먼저 Memory Board에서 카드를 하나 선택해줘.",
    pinned: (slot, card) => `${slot} 슬롯에 ${card} 카드를 고정했어.`,
    weakMatch: (card, slot) => `${card} 카드는 ${slot} 슬롯의 핵심 단서와 거리가 있어.`,
    slotLegacy:
      "deprecated slot이 아직 응답해. 이제 claim 변화가 어디까지 신뢰되는지 확인해봐.",
    slotActive: "active slot은 strict verifier야. payload를 바꾸면 matching signature가 필요해.",
    slotRetired: "retired slot은 disabled 상태야. verifier path가 열려 있지 않아.",
    claimAdmin:
      "권한 claim이 바뀌었어. 이 주장이 어떤 verifier 뒤에서 받아들여지는지 확인해봐.",
    claimInvalid: "iss/aud/exp 같은 common claim을 깨면 admin gate 전에 거부돼야 해.",
    claimNeutral: "neutral claim이야. Admin Audit Gate를 열 권한 변화는 아직 없어.",
    stackFail:
      "Verification failed. Stack 슬롯마다 역할이 달라. selector, slot, claim, impact 단서를 다시 맞춰봐.",
    stackPass:
      "Verification Stack 확인 완료. Key Slot Wheel이 열렸어. 이제 kid selector가 실제로 어떤 key slot을 사용하는지 실험해봐.",
    pickSlotNotice: "Key Slot Wheel에서 kid selector가 사용할 slot을 먼저 골라봐.",
    activeFail:
      "Verification failed: active slot은 strict signature를 요구해. claim을 바꾸면 signature mismatch가 나야 해.",
    retiredFail:
      "Verification failed: retired slot은 disabled 상태야. 열려 있는 verifier path가 없어.",
    invalidClaimFail:
      "Verification failed: iss/aud/exp 같은 common claim이 깨졌어. admin 권한보다 먼저 거부돼야 해.",
    userClaimFail: "Compatibility path selected, but admin audit gate still sees user/read claim.",
    finalPass:
      "Compatibility path selected. Signature enforcement degraded. Admin audit accepts mutated PartnerPass.",
    headerDescription:
      "AEGIS는 PartnerPass가 active key slot으로 검증된다고 주장하지만, Memory Vault에는 deprecated legacy slot이 아직 남아 있다.",
    memorySummary:
      "증거 조사. 카드를 눌러 Inspector에서 내용을 확인하고, 필요한 카드는 Verification Stack에 고정한다.",
    stackSummary:
      "결론 고정. 조사한 카드 4개를 각 슬롯에 맞게 연결해 공격 흐름을 복원한다.",
    emptySlot: "빈 슬롯",
    evidencePending: "Admin Audit Evidence pending",
    wheelSummary:
      "검증 경로 실험. ACTIVE/RETIRED는 막힌 비교 경로이고, LEGACY를 선택하면 아래 claim mutation 실험이 열린다.",
    wheelLocked: "Verification Stack을 맞춘 뒤 Run Verification을 누르면 열린다.",
    claimAdminSelected: "admin claim이 선택됐어. 아래 Restore Evidence로 최종 검증해봐.",
    claimPrompt: "role=admin 또는 scope=partner:admin 중 하나를 선택해 admin gate 변화를 확인해봐.",
    finalSummary: "LEGACY verifier path와 admin claim mutation을 함께 검증해 Evidence를 복원한다.",
    policyIntro:
      "kid와 alg는 token header가 아니라 서버 정책으로 고정해야 한다. deprecated verifier path와 admin claim trust boundary를 함께 닫아야 해.",
    policyLocked: "Admin Audit Evidence가 복원되면 방어 카드가 열린다.",
  },
  en: {
    defaultHint: "Compare PartnerPass header.kid with JWKS Memory Slots.",
    goals: {
      defense: {
        step: "DEFENSE",
        title: "Seal the legacy verifier path with Policy Cards.",
        text: "Choose controls that pin kid, alg, and claim trust boundaries to server policy.",
      },
      complete: {
        step: "COMPLETE",
        title: "Admin Audit Evidence restored.",
        text: "When Defense opens, close the deprecated kid and admin-claim trust boundaries.",
      },
      step1: {
        step: "STEP 1",
        title: "Inspect the PartnerPass Capsule structure.",
        text: "Open PartnerPass Capsule on the Memory Board and read header, payload, and signature first.",
      },
      step2: {
        step: "STEP 2",
        title: "Compare JWKS Memory Slots.",
        text: "Check the state differences between active, legacy, and retired. Deprecated is not disabled.",
      },
      step3: {
        step: "STEP 3",
        title: "Pin the key fragments into Verification Stack.",
        text: "Connect kid selector, weak slot, claim mutation, and impact with cards.",
      },
      step3Retry: {
        step: "STEP 3",
        title: "Review the Verification Stack combination.",
        text: "Each slot has a different role. Match the card's trust boundary to the slot name.",
      },
      openWheel: {
        step: "VERIFY",
        title: "Open Key Slot Wheel with Run Verification.",
        text: "If the stack is correct, the next experiment stage opens. Press the button to verify the combination.",
      },
      pickSlot: {
        step: "STEP 4",
        title: "Test which key slot kid selects.",
        text: "Compare active, legacy, and retired in Key Slot Wheel and find the weak path that remains open.",
      },
      findLegacy: {
        step: "STEP 4",
        title: "Find the legacy compatibility path.",
        text: "Active is strict and retired is disabled. Compare why deprecated legacy is more dangerous.",
      },
      pickClaim: {
        step: "STEP 5",
        title: "Test the admin claim mutation.",
        text: "Behind the legacy verifier path, check what opens when role or scope changes to admin.",
      },
      restore: {
        step: "VERIFY",
        title: "Restore Evidence with Run Verification.",
        text: "Verify that the legacy key slot and admin claim mutation reach Admin Audit Gate.",
      },
    },
    claimPanelLocks: {
      active: {
        title: "strict path blocked",
        text: "ACTIVE is the normal verification path. Mutating payload requires a matching signature, so the claim mutation panel stays closed.",
      },
      retired: {
        title: "disabled path blocked",
        text: "RETIRED is disabled. There is no verifier path, so comparison stops before claims are read.",
      },
      needSlot: {
        title: "select a slot",
        text: "Select LEGACY above to open the claim mutation experiment. ACTIVE and RETIRED are comparison paths that show why they are blocked.",
      },
    },
    newCards: (titles) => `New cards revealed: ${titles}. Continue from the Memory Board.`,
    selectCard: "Select a Memory Board card first.",
    pinned: (slot, card) => `${card} pinned to the ${slot} slot.`,
    weakMatch: (card, slot) => `${card} is distant from the core clue for the ${slot} slot.`,
    slotLegacy:
      "The deprecated slot still responds. Now check how far claim changes are trusted.",
    slotActive:
      "The active slot is a strict verifier. Mutating payload requires a matching signature.",
    slotRetired: "The retired slot is disabled. No verifier path is open.",
    claimAdmin:
      "The authority claim changed. Check which verifier path accepts that claim.",
    claimInvalid: "Breaking common claims such as iss/aud/exp should reject before the admin gate.",
    claimNeutral: "Neutral claim selected. Admin Audit Gate still has no authority change.",
    stackFail:
      "Verification failed. Each stack slot has a distinct role; rematch selector, slot, claim, and impact clues.",
    stackPass:
      "Verification Stack confirmed. Key Slot Wheel is open. Now test which key slot the kid selector actually uses.",
    pickSlotNotice: "Choose which slot the kid selector should use in Key Slot Wheel first.",
    activeFail:
      "Verification failed: the active slot requires strict signature validation. Claim mutation should cause a signature mismatch.",
    retiredFail:
      "Verification failed: the retired slot is disabled. No verifier path is open.",
    invalidClaimFail:
      "Verification failed: common claims such as iss/aud/exp are broken, so the token should be rejected before admin authority.",
    userClaimFail: "Compatibility path selected, but Admin Audit Gate still sees user/read claims.",
    finalPass:
      "Compatibility path selected. Signature enforcement degraded. Admin audit accepts the mutated PartnerPass.",
    headerDescription:
      "AEGIS claims PartnerPass is verified by the active key slot, but a deprecated legacy slot still remains in the Memory Vault.",
    memorySummary:
      "Evidence investigation. Open cards in the Inspector, then pin required cards into Verification Stack.",
    stackSummary:
      "Lock the conclusion. Connect the four inspected cards to the correct slots to reconstruct the attack flow.",
    emptySlot: "empty slot",
    evidencePending: "Admin Audit Evidence pending",
    wheelSummary:
      "Verifier path experiment. ACTIVE and RETIRED are blocked comparison paths; selecting LEGACY opens the claim mutation experiment.",
    wheelLocked: "Complete Verification Stack and press Run Verification to unlock this.",
    claimAdminSelected: "Admin claim selected. Use Restore Evidence below for the final verification.",
    claimPrompt: "Select role=admin or scope=partner:admin to observe the admin gate change.",
    finalSummary: "Verify the LEGACY verifier path together with admin claim mutation to restore Evidence.",
    policyIntro:
      "kid and alg must be pinned by server policy, not token headers. Close the deprecated verifier path and admin-claim trust boundary together.",
    policyLocked: "Defense cards open after Admin Audit Evidence is restored.",
  },
};

function getLevel42KeySlotPuzzle(locale) {
  if (locale !== "en") {
    return LEVEL4_2_KEY_SLOT_PUZZLE;
  }

  return {
    ...LEVEL4_2_KEY_SLOT_PUZZLE,
    cards: LEVEL4_2_KEY_SLOT_PUZZLE.cards.map((card) => ({
      ...card,
      ...(LEVEL4_2_KEY_SLOT_PUZZLE_EN.cards[card.id] || {}),
    })),
    slots: LEVEL4_2_KEY_SLOT_PUZZLE.slots.map((slot) => ({
      ...slot,
      ...(LEVEL4_2_KEY_SLOT_PUZZLE_EN.slots[slot.id] || {}),
    })),
    policyCards: LEVEL4_2_KEY_SLOT_PUZZLE.policyCards.map((card) => ({
      ...card,
      ...(LEVEL4_2_KEY_SLOT_PUZZLE_EN.policyCards[card.id] || {}),
    })),
  };
}

const LEVEL4_3_REPLAY_PUZZLE = {
  evidenceShard: "FLAG{REPLAY_NEEDS_IDEMPOTENCY}",
  sampleEventId: "EVT-2026-DEL-001",
  sampleVia: "hub",
  target: 5,
  windowSec: 5,
  cards: [
    {
      id: "delivered_template",
      type: "event",
      title: "Delivered Event Template",
      summary: "normal delivered webhook body",
      content: {
        event_id: "EVT-2026-DEL-001",
        parcel_id: "PD-1004",
        status: "delivered",
        via: "hub",
      },
      note:
        "정상 이벤트엔 event_id와 routing leg(via)가 있어. 서버는 두 필드로 '같은 배송'인지 본다. 둘 다 제각각으로 위장한 재전송도 stamp를 받는지가 핵심이야.",
      action: "Stage Delivered Event로 첫 window를 열고 Replay Ledger의 credited를 확인해봐.",
    },
    {
      id: "stamp_window",
      type: "window",
      title: "Stamp Window",
      summary: "5 seconds / 5 stamps",
      content: {
        target: 5,
        windowSec: 5,
        startsAt: "first accepted delivered event",
        expires: "counter no longer yields evidence",
      },
      note:
        "시간 제한 자체가 방어는 아니야. window 안에서 논리적으로 같은 배송이 여러 번 처리되는지가 핵심이야.",
      action: "첫 이벤트를 보낸 뒤 Stamp Check로 count와 remainingSec를 확인해.",
    },
    {
      id: "replay_ledger",
      type: "ledger",
      title: "Replay Ledger",
      summary: "credited vs duplicate",
      content: {
        duplicateRule: "same event_id is not credited",
        templateRule: "same event_id template (digits normalized) is not credited",
        routeRule: "missing or reused via is not credited",
        vulnerableRule: "new event_id SHAPE + new via with same parcel/status is still credited",
        replayProtection: "event_id + template + route (no logical idempotency)",
      },
      note:
        "서버 가드는 둘이야 — event_id 템플릿(숫자 정규화)과 via 재사용. 숫자만 바꾼 EVT-...-002는 같은 템플릿이라 막히고, via를 빼거나 재탕해도 막혀. 모양과 경로를 둘 다 바꾸면 통과하는지 봐.",
      action: "Next Event(숫자만 변경)가 왜 막히는지 본 뒤, 모양+via를 둘 다 위장하는 Disguised Burst로 넘어가.",
    },
    {
      id: "stamp_vault",
      type: "vault",
      title: "Stamp Vault",
      summary: "evidence opens at target count",
      content: {
        opensWhen: "count >= target within active window",
        evidenceShard: "stored in stamps response",
        debrief: "idempotency must bind logical delivery, not just event_id",
      },
      note:
        "Stamp Vault는 count가 목표에 도달했을 때만 Evidence를 보여줘. FLAG를 직접 찍는 미션이 아니라 상태를 만들어 회수하는 흐름이야.",
      action: "count가 target에 닿으면 Stamp Check를 실행하고 Evidence를 복원해.",
    },
    {
      id: "event_sequencer",
      type: "sequencer",
      title: "Disguise Sequencer",
      summary: "vary event_id shape AND via",
      content: {
        naive: 'seq 1 5 → "EVT-2026-DEL-00$i" (same template → blocked)',
        parser: 'supports &&, for i in $(seq 1 5), echo "a b" | xargs -I {}',
        draft: 'event_id shape and via must both vary; placeholders are rejected',
        warning: "same logical delivery, disguised shape + route still lacks idempotency",
      },
      note:
        "숫자만 바꾸는 seq는 같은 템플릿이라 막혀. 단어 리스트(xargs)나 && 체인을 쓰되, event_id 모양과 via가 둘 다 제각각이 되도록 직접 수정해야 해.",
      action: "Replay Ledger에서 template/route 차단을 봤다면 Batch Draft를 수정해서 두 필드를 동시에 위장해봐.",
    },
  ],
  policyCards: [
    {
      id: "policy_logical_idempotency",
      title: "Logical Delivery Idempotency",
      text: "event_id가 달라도 같은 parcel/status 전환은 한 번만 처리한다.",
      correct: true,
    },
    {
      id: "policy_persist_event_ids",
      title: "Persist Processed Events",
      text: "처리한 event_id를 서버 저장소에 남겨 재사용을 거부한다.",
      correct: true,
    },
    {
      id: "policy_reject_duplicate_state",
      title: "Reject Duplicate State Transition",
      text: "이미 delivered인 parcel은 다시 delivered stamp를 받지 못한다.",
      correct: true,
    },
    {
      id: "policy_verify_server_state",
      title: "Verify Server State Transition",
      text: "status=delivered는 클라이언트 주장이므로 서버의 현재 상태와 허용 전환 규칙으로 검증한다.",
      correct: true,
    },
    {
      id: "policy_replay_window_audit",
      title: "Replay Window Audit",
      text: "짧은 시간 안의 반복 상태 전환을 감사 로그와 알림으로 남긴다.",
      correct: true,
    },
    {
      id: "bonus_rate_limit_burst",
      title: "Rate Limit Burst Events",
      text: "재전송 속도를 낮추는 보조 방어다. 느린 replay까지 막으려면 idempotency가 필요하다.",
      correct: true,
      bonus: true,
    },
    {
      id: "decoy_event_id_format",
      title: "Check event_id Format",
      text: "형식 검사는 새 event_id로 반복되는 논리적 중복을 막지 못한다.",
      correct: false,
    },
    {
      id: "decoy_increase_window",
      title: "Increase Window to 30s",
      text: "window를 늘리면 공격자가 stamp를 누적할 시간이 늘어난다.",
      correct: false,
    },
    {
      id: "decoy_hide_stamps",
      title: "Hide Stamps Endpoint",
      text: "조회 화면을 숨겨도 delivered 처리 로직의 중복 처리는 남는다.",
      correct: false,
    },
    {
      id: "decoy_require_ui",
      title: "Require UI Button",
      text: "UI 버튼을 요구해도 API 재전송은 막지 못한다.",
      correct: false,
    },
  ],
};

const LEVEL4_3_REPLAY_PUZZLE_EN = {
  cards: {
    delivered_template: {
      note:
        "A normal event carries event_id and routing leg (via). The key question is whether a replay that disguises both fields still receives a stamp.",
      action:
        "Stage Delivered Event to open the first window, then check credited in Replay Ledger.",
    },
    stamp_window: {
      note:
        "The time limit itself is not the defense. The real issue is whether the same logical delivery is processed multiple times inside the window.",
      action: "After the first event, run Stamp Check and inspect count and remainingSec.",
    },
    replay_ledger: {
      note:
        "The server has two naive guards: digit-normalized event_id templates and reused via routes. EVT-...-002 is blocked as the same template, and missing or reused via is blocked too. Check what happens when both shape and route change.",
      action:
        "After seeing why Next Event is blocked, move to a Disguised Burst that changes both event_id shape and via.",
    },
    stamp_vault: {
      note:
        "Stamp Vault exposes Evidence only when count reaches the target. This mission is not about typing a FLAG directly; it is about creating the state that opens the vault.",
      action: "When count reaches target, run Stamp Check and restore Evidence.",
    },
    event_sequencer: {
      note:
        "A digit-only seq burst is blocked as the same template. Use a word list (xargs) or an && chain, but make both event_id shape and via differ each time.",
      action:
        "Once Replay Ledger shows template/route blocking, edit Batch Draft so both fields are disguised together.",
    },
  },
  policyCards: {
    policy_logical_idempotency: {
      text: "Even with different event_ids, the same parcel/status transition is processed only once.",
    },
    policy_persist_event_ids: {
      text: "Processed event_ids are persisted server-side and rejected on reuse.",
    },
    policy_reject_duplicate_state: {
      text: "A parcel that is already delivered cannot receive another delivered stamp.",
    },
    policy_verify_server_state: {
      text: "status=delivered is a client claim and must be checked against server state and allowed transition rules.",
    },
    policy_replay_window_audit: {
      text: "Repeated state transitions inside a short window are logged and alerted.",
    },
    bonus_rate_limit_burst: {
      text: "This slows replay bursts as a supporting control; idempotency is still required for slower replay.",
    },
    decoy_event_id_format: {
      text: "Format checks do not stop logical duplicates repeated with new event_ids.",
    },
    decoy_increase_window: {
      text: "Increasing the window gives attackers more time to accumulate stamps.",
    },
    decoy_hide_stamps: {
      text: "Hiding the status endpoint does not fix duplicate processing in delivered events.",
    },
    decoy_require_ui: {
      text: "Requiring a UI button does not stop API replay.",
    },
  },
};

const LEVEL4_3_REPLAY_UI = {
  ko: {
    defaultHint: "첫 delivered 요청을 보내고 Replay Ledger에서 credited/duplicate 차이를 확인해봐.",
    consoleGuide:
      "One-line combinations only: cmd && cmd, for i in $(seq 1 5); do ...; done, echo \"a b\" | xargs -I {} ... . Keep one curl in the loop body. Multiline paste and backslash continuations are unsupported.",
    headerDescription:
      "정상 delivered 이벤트처럼 보여도, 서버가 같은 배송 완료를 여러 event_id로 계속 처리하면 stamp는 재전송으로 누적된다.",
    stageSummary:
      "버튼은 명령어를 콘솔에 올리기만 해. Run을 눌러 실행하고, 오른쪽 Replay Ledger에서 credited와 duplicate 차이를 확인해. 첫 이벤트와 duplicate만 완성형이고, 이후 draft는 직접 수정해야 해.",
    emptyLedger: "아직 실행된 delivered 이벤트가 없어.",
    vaultSummary:
      "FLAG를 직접 입력하는 미션이 아니야. target count에 도달한 뒤 Stamp Check 응답에서 flag가 보이면, Restore Evidence로 공격 단계를 마무리하면 돼.",
    cardSummary:
      "curl 결과를 해석하는 카드야. 콘솔에서 본 count, duplicate, credited를 카드 의미와 연결해봐.",
    lockedCardHint: "duplicate/new event 차이를 먼저 확인해.",
    policyIntro:
      "event_id 중복 차단만으로는 부족하다. 논리적 배송 단위 idempotency, processed event 저장, 중복 상태 전환 거부, 서버 상태 전환 검증, replay audit을 함께 봉쇄해야 해.",
    policyLocked: "Stamp Vault Evidence가 복원되면 replay 방어 카드가 열린다.",
    fetchKoreanMarker: "Stamp 상태",
    lockedSequencer: "Event Sequencer는 Replay Ledger에서 duplicate와 새 event_id의 차이를 본 뒤 열려.",
    vaultLocked: "Stamp Vault가 아직 잠겨 있어. window 안에서 stamp count를 target까지 올려야 해.",
    vaultRestored: "Stamp Vault Evidence를 복원했어. 이제 replay 방어 정책을 고르면 돼.",
    stageDelivered:
      "첫 delivered 이벤트(via=hub)를 Mission Console에 올렸어. Run으로 window를 열고 credited를 확인해봐.",
    stageDuplicate: "같은 event_id를 다시 올렸어. duplicate가 credited되는지 Ledger에서 확인해봐.",
    stageNumber: (eventId, template) =>
      `${eventId} 계열 draft를 올렸어. <new-route>를 직접 바꿔 실행해봐. 숫자만 바꾸면 같은 템플릿(${template})으로 막힐 거야.`,
    stageBatch:
      "Batch Draft를 올렸어. 이대로는 <route> placeholder 때문에 credited되지 않아. parser notes를 보고 via까지 함께 바뀌게 수정해봐.",
    stageCheck: "Stamp Check를 올렸어. count, status, flag 노출 여부를 확인해봐.",
    goals: {
      defense: {
        step: "DEFENSE",
        title: "Policy Cards로 replay stamp를 봉쇄한다.",
        text: "event_id 중복만이 아니라 같은 배송 상태 전환이 반복 처리되지 않도록 서버 통제를 골라.",
      },
      complete: {
        step: "COMPLETE",
        title: "Stamp Vault Evidence가 복원됐다.",
        text: "curl 실험에서 드러난 재전송 흐름을 방어 카드로 봉쇄하면 돼.",
      },
      first: {
        step: "STEP 1",
        title: "delivered 이벤트로 stamp window를 연다.",
        text: "Stage Delivered Event를 콘솔에 올리고 Run을 눌러 첫 stamp를 받아봐.",
      },
      duplicate: {
        step: "STEP 2",
        title: "가드가 무엇을 막는지 확인한다.",
        text: "Duplicate Probe(같은 event_id)와 Next Event(숫자만 변경)를 실행해 duplicate/같은 템플릿이 credited되지 않는 걸 확인해봐.",
      },
      burst: {
        step: "STEP 3",
        title: "event_id 모양과 via를 둘 다 직접 바꿔 stamp를 쌓는다.",
        text: "Batch Draft는 일부러 미완성이야. fake terminal이 지원하는 &&, for, xargs 중 하나로 5건을 한 번에 보내도록 수정해봐.",
      },
      vault: {
        step: "VAULT",
        title: "Stamp Vault에서 Evidence를 회수한다.",
        text: "Stamp Check 응답이 ready가 됐어. Restore Evidence로 공격 단계를 마무리해.",
      },
    },
  },
  en: {
    defaultHint: "Send the first delivered request, then compare credited and duplicate in Replay Ledger.",
    consoleGuide:
      "One-line combinations only: cmd && cmd, for i in $(seq 1 5); do ...; done, echo \"a b\" | xargs -I {} ... . Keep one curl in the loop body. Multiline paste and backslash continuations are unsupported.",
    headerDescription:
      "Even when it looks like a normal delivered event, stamps accumulate by replay if the server keeps processing the same delivery completion under different event_ids.",
    stageSummary:
      "Buttons only stage commands into Mission Console. Press Run to execute, then compare credited and duplicate in Replay Ledger. The first event and duplicate probe are complete; later drafts are intentionally editable.",
    emptyLedger: "No delivered events have been executed yet.",
    vaultSummary:
      "This is not a mission where you type the FLAG directly. Reach the target count, confirm the flag appears in Stamp Check, then use Restore Evidence to finish the attack.",
    cardSummary:
      "These cards explain curl results. Connect count, duplicate, and credited from the console to the card meanings.",
    lockedCardHint: "Check the duplicate/new event difference first.",
    policyIntro:
      "Blocking duplicate event_ids is not enough. Seal logical-delivery idempotency, processed-event storage, duplicate state rejection, server-side transition verification, and replay audit together.",
    policyLocked: "Replay defense cards open after Stamp Vault Evidence is restored.",
    fetchKoreanMarker: "Stamp state",
    lockedSequencer:
      "Event Sequencer opens after Replay Ledger shows the difference between a duplicate and a new event_id.",
    vaultLocked: "Stamp Vault is still locked. Raise stamp count to target inside the active window.",
    vaultRestored: "Stamp Vault Evidence restored. Now choose replay defense policies.",
    stageDelivered:
      "First delivered event (via=hub) staged in Mission Console. Run it to open the window and check credited.",
    stageDuplicate:
      "Same event_id staged again. Check in Ledger whether a duplicate is credited.",
    stageNumber: (eventId, template) =>
      `${eventId} draft staged. Replace <new-route> before running. Changing only digits is blocked as the same template (${template}).`,
    stageBatch:
      "Batch Draft staged. As-is, <route> remains a placeholder and will not credit. Use parser notes and make via change together with event_id shape.",
    stageCheck: "Stamp Check staged. Inspect count, status, and whether the flag is exposed.",
    goals: {
      defense: {
        step: "DEFENSE",
        title: "Seal replay stamps with Policy Cards.",
        text: "Choose server-side controls that stop repeated processing of the same delivery state transition, not just duplicate event_ids.",
      },
      complete: {
        step: "COMPLETE",
        title: "Stamp Vault Evidence restored.",
        text: "Seal the replay flow discovered by curl experiments with defense cards.",
      },
      first: {
        step: "STEP 1",
        title: "Open the stamp window with a delivered event.",
        text: "Stage Delivered Event into the console and press Run to receive the first stamp.",
      },
      duplicate: {
        step: "STEP 2",
        title: "Identify what the guards block.",
        text: "Run Duplicate Probe and Next Event to observe duplicate and same-template events not being credited.",
      },
      burst: {
        step: "STEP 3",
        title: "Change both event_id shape and via to build stamps.",
        text: "Batch Draft is intentionally incomplete. Edit it into a supported one-line &&, for, or xargs sequence.",
      },
      vault: {
        step: "VAULT",
        title: "Recover Evidence from Stamp Vault.",
        text: "Stamp Check is ready. Use Restore Evidence to finish the attack phase.",
      },
    },
  },
};

function getLevel43ReplayPuzzle(locale) {
  if (locale !== "en") {
    return LEVEL4_3_REPLAY_PUZZLE;
  }

  return {
    ...LEVEL4_3_REPLAY_PUZZLE,
    cards: LEVEL4_3_REPLAY_PUZZLE.cards.map((card) => ({
      ...card,
      ...(LEVEL4_3_REPLAY_PUZZLE_EN.cards[card.id] || {}),
    })),
    policyCards: LEVEL4_3_REPLAY_PUZZLE.policyCards.map((card) => ({
      ...card,
      ...(LEVEL4_3_REPLAY_PUZZLE_EN.policyCards[card.id] || {}),
    })),
  };
}

function level33SafeUpdateCurl() {
  return 'curl "/api/v1/challenges/level3_3/actions/profile" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d \'{}\'';
}

function level43EventCurl(eventId = LEVEL4_3_REPLAY_PUZZLE.sampleEventId, via = LEVEL4_3_REPLAY_PUZZLE.sampleVia) {
  return `curl -v -X POST "/api/v1/challenges/level4_3/actions/event/delivered" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d '{"event_id":"${eventId}","parcel_id":"PD-1004","status":"delivered","via":"${via}"}'`;
}

function level43StampsCurl() {
  return 'curl -v -X GET "/api/v1/challenges/level4_3/actions/stamps" -H "Authorization: Bearer $SESSION_TOKEN"';
}

// 순진한 seq burst (event_id 숫자만 증가) — 같은 템플릿이라 가드에 걸려 stamp가 안 쌓인다(교보재).
function level43NumberOnlyDraftCurl() {
  return 'curl -v -X POST "/api/v1/challenges/level4_3/actions/event/delivered" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d \'{"event_id":"EVT-2026-DEL-002","parcel_id":"PD-1004","status":"delivered","via":"<new-route>"}\'';
}

// 완성형 정답이 아니라 의도적으로 placeholder가 남은 batch draft다.
function level43BatchDraftCurl() {
  return 'echo "seoul busan daegu incheon gwangju" | xargs -I {} curl -X POST "/api/v1/challenges/level4_3/actions/event/delivered" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d \'{"event_id":"rcpt-{}-7","parcel_id":"PD-1004","status":"delivered","via":"<route>"}\'';
}

function padReplayEventNumber(value) {
  return String(Math.max(1, Math.min(999, value))).padStart(3, "0");
}

async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok || payload?.ok === false) {
    const message =
      payload?.error?.message || payload?.detail || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}

function mapServerPhase(detail, briefingSeen) {
  const attack = detail?.status?.attack;
  const defense = detail?.status?.defense;

  if (!detail || attack === "locked") {
    return "LOCKED";
  }
  if (defense === "solved") {
    return "MISSION_COMPLETE";
  }
  if (attack === "solved" && defense === "available") {
    return "DEFENSE";
  }
  if (!briefingSeen) {
    return "BRIEFING";
  }
  return "ATTACK";
}

function phaseLabel(phase) {
  const labels = {
    LOCKED: "ENCRYPTED",
    BRIEFING: "BRIEFING",
    ATTACK: "INFILTRATION",
    DEFENSE: "CONTAINMENT",
    MISSION_COMPLETE: "COMPLETE",
  };
  return labels[phase] || phase;
}

function statusClass(value) {
  if (value === "solved") {
    return "solved";
  }
  if (value === "locked") {
    return "locked";
  }
  return "available";
}

function resolveCurrentChallengeId(me, challenges) {
  if (me?.current) {
    return me.current;
  }
  const nextAvailable = challenges.find((item) => item.status?.defense !== "solved");
  return nextAvailable?.id || challenges[0]?.id || "";
}

function shouldShowOperation03Intermission(fromId, targetId, intermissionSeen) {
  return (
    !intermissionSeen &&
    fromId === "level2_5" &&
    targetId &&
    getOperationForChallenge(targetId).id === "op03"
  );
}

function shouldShowOperation04Intermission(fromId, targetId, intermissionSeen) {
  return (
    !intermissionSeen &&
    fromId === "level3_boss" &&
    targetId &&
    getOperationForChallenge(targetId).id === "op04"
  );
}

function previewNetworkBody(body) {
  const data = body?.data || body || {};

  if (body?.ok === false && body.error) {
    const lines = [
      `error: ${body.error.code || "UNKNOWN"}`,
      `message: ${body.error.message || "request failed"}`,
    ];
    if (body.error.hint) {
      lines.push(`hint: ${body.error.hint}`);
    }
    return lines;
  }

  if (Array.isArray(data.trustFragments)) {
    return [
      `fragments: ${data.trustFragments.length}`,
      "BOLA Window -> foreign object signal",
      "Hidden Route -> admin path metadata",
      "Profile Poison -> client field trust",
      "Ticket Vault -> deep response shard",
      "Locker Storm -> missing attempt control",
    ];
  }

  if (Array.isArray(data.mine)) {
    return [
      `mine: ${data.mine.join(", ") || "unknown"}`,
      `hint: ${data.objectHint || "inspect adjacent registry"}`,
      "next: use detail endpoint with parcel_id",
    ];
  }

  if (Array.isArray(data.capsules) || Array.isArray(data.parcels)) {
    const first = (data.capsules || data.parcels)[0] || {};
    return [
      `owner: ${data.owner || "unknown"}`,
      `capsule: ${first.capsule_id || first.parcel_id || "unknown"}`,
      `tier: ${first.tier || "unknown"}`,
    ];
  }

  if (data.capsule_id || data.parcel_id) {
    const lines = [
      `owner: ${data.owner || "unknown"}`,
      `capsule: ${data.capsule_id || data.parcel_id}`,
      `tier: ${data.tier || "unknown"}`,
      `status: ${data.status || "unknown"}`,
    ];
    if (data.meta?.audit_ref) {
      lines.push(`auditRef: ${data.meta.audit_ref}`);
      lines.push("route source: hidden menu metadata");
    }
    return lines;
  }

  if (data.features && !Array.isArray(data.features) && typeof data.features === "object") {
    const featureItems = Object.values(data.features);
    const hiddenCount = featureItems.filter((feature) => feature?.enabled === false).length;
    return [
      `menu: ${Array.isArray(data.menu) ? data.menu.join(", ") : "unknown"}`,
      `features: ${featureItems.length}`,
      `hidden: ${hiddenCount}`,
      "routes: inspect raw response",
    ];
  }

  if (Array.isArray(data.features)) {
    const hiddenCount = data.features.filter((feature) => feature.enabled === false).length;
    return [
      `operator: ${data.operator || "unknown"}`,
      `features: ${data.features.length}`,
      `hidden: ${hiddenCount}`,
      "routes: inspect raw response",
    ];
  }

  if (data.report?.title && data.meta?.debug?.vault) {
    const vault = data.meta.debug.vault;
    return [
      `report: ${data.report.title}`,
      `result: ${data.report.result || "unknown"}`,
      `locker: ${vault.locker_id || "unknown"}`,
      `pin prefix: ${vault.pin_prefix || "unknown"}`,
      `candidate window: ${vault.candidate_window || "inspect raw response"}`,
      `checksum: ${vault.checksum || "inspect raw response"}`,
      "vault ticket: inspect raw response",
    ];
  }

  if (data.status === "unlocked" && data.claim_code) {
    return [
      `locker: ${data.locker_id || "unknown"}`,
      "status: unlocked",
      "claim code: present",
      `attempts: ${data.attempts || "unknown"}`,
    ];
  }

  if (data.status === "claimed" && data.flag) {
    return [
      "vault: claimed",
      `ticket: ${data.masterTicket || "relay-master-ticket"}`,
      "evidence: present",
    ];
  }

  if (data.ticket?.preview) {
    return [
      `ticket: ${data.ticket.id || "unknown"}`,
      `preview: ${data.meta?.redaction?.status || "normalized"}`,
      `status: ${data.ticket.status || "unknown"}`,
      `visible residue: ${data.ticket.preview.miraResidue || "none"}`,
      `response depth: ${data.internal?.serializer?.responseDepth || "deep"}`,
    ];
  }

  if (data.pinPolicy && data.lockerId) {
    return [
      `locker: ${data.lockerId}`,
      `window: ${data.candidateWindow || "unknown"}`,
      `checksum: ${data.checksum || "none"}`,
      `rate limit: ${data.rateLimit || "none"}`,
      `trace pressure: ${data.aegisTracePressure || "0/8"}`,
    ];
  }

  if (typeof data.unlocked === "boolean" && data.lockerId) {
    const lines = [
      `locker: ${data.lockerId}`,
      `unlocked: ${data.unlocked}`,
      `pressure: ${data.aegisTracePressure || "unknown"}`,
      `lockout: ${data.lockout ? "active" : "none"}`,
      `backoff: ${data.backoff ? "active" : "none"}`,
    ];
    if (data.result) {
      lines.push(`result: ${data.result}`);
    }
    if (data.evidenceShard) {
      lines.push("evidence: present");
    }
    return lines;
  }

  if (data.staged) {
    return [
      `staged: ${data.staged}`,
      `payload fields: ${Array.isArray(data.payloadFields) ? data.payloadFields.join(", ") || "none" : "none"}`,
    ];
  }

  if (data.updated) {
    const lines = [
      "updated: true",
      `message: ${data.message || "profile synchronized"}`,
    ];
    if (data.unknownKeysAccepted) {
      lines.push(`unknown keys: ${data.unknownKeysAccepted}`);
    }
    if (data.trustState) {
      lines.push(`trust state: ${data.trustState}`);
    }
    return lines;
  }

  if (data.profile && data.statusBadge) {
    return [
      `operator: ${data.profile.operatorId || "unknown"}`,
      `status: ${data.statusBadge || "unknown"}`,
      `visible fields: ${Object.keys(LEVEL3_3_SAFE_PROFILE).join(", ")}`,
    ];
  }

  if (Array.isArray(data.perks)) {
    return [
      `status: ${data.status || "unknown"}`,
      `perks: ${data.perks.length}`,
      `miraResidue: ${data.miraResidue || "none"}`,
    ];
  }

  if (data.report) {
    return [
      `status: ${data.status || "unknown"}`,
      `report: ${data.report.title || "unknown"}`,
      `auditRef: ${data.report.auditRef || "none"}`,
      `miraResidue: ${data.report.miraResidue || "none"}`,
    ];
  }

  if (data.stats) {
    return [
      "route: metrics",
      `reviewWindow: ${data.reviewWindow || data.auditWindow || "none"}`,
      `miraResidue: ${data.miraResidue || "none"}`,
    ];
  }

  if (data.migration || data.lastAuditRef || data.requiredScope) {
    const migration = data.migration || {};
    return [
      "route: legacy snapshot",
      `ref: ${migration.ref || data.lastAuditRef || "none"}`,
      `scopeHint: ${migration.scopeHint || data.requiredScope || "none"}`,
    ];
  }

  return [`ok: ${body?.ok === false ? "false" : "true"}`];
}

function sanitizeNetworkBody(body) {
  const clone = JSON.parse(JSON.stringify(body || {}));
  const data = clone.data;

  if (!data || typeof data !== "object") {
    return clone;
  }

  if (Array.isArray(data.capsules)) {
    delete data.parcels;
  }

  if (data.capsule_id) {
    delete data.parcel_id;
  }

  return clone;
}

function createTraceEntry({
  method,
  url,
  status,
  body,
  token,
  title = "REQUEST",
  trigger = "button",
  curlOverride = "",
  routeCurls = [],
  suppressCurlButton = false,
}) {
  const displayBody = sanitizeNetworkBody(body);
  const requestHeaders = token ? ["Authorization: Bearer $SESSION_TOKEN"] : [];
  return {
    id: `${Date.now()}-${method}-${url}`,
    title,
    trigger,
    method,
    url,
    status,
    hits: 1,
    requestHeaders,
    body: displayBody,
    preview: previewNetworkBody(displayBody),
    routeCurls,
    suppressCurlButton,
    curl:
      curlOverride ||
      `curl -v -X ${method} "${url}" -H "Authorization: Bearer $SESSION_TOKEN"`,
  };
}

function traceEntryKey(entry) {
  if (entry.url?.includes("/level3_3/actions/profile")) {
    return entry.method === "GET" ? "level3_3:profile:load" : "level3_3:profile:update";
  }
  return `${entry.method}:${entry.url}`;
}

function mergeTraceEntries(currentEntries, incomingEntries) {
  const nextEntries = [...currentEntries];

  incomingEntries.forEach((entry) => {
    const key = traceEntryKey(entry);
    const existingIndex = nextEntries.findIndex((current) => traceEntryKey(current) === key);

    if (existingIndex >= 0) {
      nextEntries[existingIndex] = {
        ...entry,
        id: nextEntries[existingIndex].id,
        hits: (nextEntries[existingIndex].hits || 1) + 1,
      };
      return;
    }

    nextEntries.push(entry);
  });

  return nextEntries;
}

const BOLA_BASE_ID = "PD-1004";

function bolaProbeId(entry) {
  const url = entry?.url || "";
  const q = url.match(/parcel_id=([^&\s"'`]+)/i);
  const seg = url.match(/\/parcels\/([A-Za-z0-9<>_\-]+)/);
  const raw = q ? q[1] : seg ? seg[1] : "";
  try {
    return decodeURIComponent(raw).toUpperCase();
  } catch {
    return String(raw).toUpperCase();
  }
}

function bolaLaneKey(entry) {
  const url = entry?.url || "";
  if (url.includes("/parcels/mine")) {
    return "observe";
  }
  return bolaProbeId(entry) === BOLA_BASE_ID ? "baseline" : "probe";
}

function bolaEntryDenied(entry) {
  return !(entry?.status === 200 && entry?.body?.ok !== false);
}

function bolaSumHits(list) {
  return list.reduce((total, entry) => total + (entry.hits || 1), 0);
}

// 3-1 BOLA: collapse the flat chronological trace into three intent lanes
// (observe -> baseline -> cross-object probe). Repeats and denied attempts
// fold into per-lane counters instead of stacking a card each; a successful
// foreign 200 is promoted to a single anomaly milestone.
function groupBolaLanes(entries, capsuleId) {
  const buckets = { observe: [], baseline: [], probe: [] };
  entries.forEach((entry) => {
    buckets[bolaLaneKey(entry)].push(entry);
  });

  const latest = (list) => (list.length ? list[list.length - 1] : null);

  const baselineLatest = latest(buckets.baseline);
  const observeLatest = latest(buckets.observe);
  let referenceId = (capsuleId || "").toUpperCase();
  if (!referenceId && baselineLatest) {
    referenceId = bolaProbeId(baselineLatest);
  }
  if (!referenceId && observeLatest) {
    const data = observeLatest.body?.data || {};
    const first = (data.capsules || data.parcels || [])[0] || {};
    referenceId = String(first.capsule_id || first.parcel_id || "").toUpperCase();
  }

  const probeList = buckets.probe;
  const anomalyEntry =
    [...probeList]
      .reverse()
      .find((entry) => !bolaEntryDenied(entry) && bolaProbeId(entry) !== BOLA_BASE_ID) || null;

  const lanes = [
    {
      key: "observe",
      num: "01",
      title: "Capsule List",
      role: "observe",
      list: buckets.observe,
      latest: observeLatest,
      count: bolaSumHits(buckets.observe),
    },
    {
      key: "baseline",
      num: "02",
      title: "Self Detail",
      role: "baseline",
      list: buckets.baseline,
      latest: baselineLatest,
      count: bolaSumHits(buckets.baseline),
    },
    {
      key: "probe",
      num: "03",
      title: "Cross-Object Probe",
      role: anomalyEntry ? "exploit found" : probeList.length ? "probing" : "queued",
      list: probeList,
      latest: latest(probeList),
      count: bolaSumHits(probeList),
      deniedCount: bolaSumHits(probeList.filter(bolaEntryDenied)),
      anomalyEntry,
      anomalyId: anomalyEntry ? bolaProbeId(anomalyEntry) : "",
      anomalyOwner: anomalyEntry?.body?.data?.owner || "",
    },
  ];

  return {
    lanes,
    referenceId,
    rawCount: bolaSumHits(entries),
    hasAnomaly: Boolean(anomalyEntry),
  };
}

function bolaIdPattern(referenceId) {
  if (!referenceId) {
    return "PD-100X seq";
  }
  const stem = referenceId.replace(/\d+$/, "");
  return `${stem}100X seq`;
}

function parseJsonFromTerminalOutput(stdout) {
  try {
    return JSON.parse(stdout || "{}");
  } catch {
    const text = stdout || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function detectCurlMethod(command) {
  const match = command.match(/(?:^|\s)(?:-X|--request)\s+([A-Z]+)/i);
  if (match) {
    return match[1].toUpperCase();
  }
  const compactMatch = command.match(/(?:^|\s)-X([A-Z]+)/i);
  if (compactMatch) {
    return compactMatch[1].toUpperCase();
  }
  const longMatch = command.match(/(?:^|\s)--request=([A-Z]+)/i);
  if (longMatch) {
    return longMatch[1].toUpperCase();
  }
  return /(?:^|\s)(?:-d|--data|--data-raw)(?:\s|=)/.test(command) ? "POST" : "GET";
}

function traceTitleForCommand(url, body, method = "GET") {
  const data = body?.data || {};

  if (url.includes("/level3_1/actions/parcels/mine")) {
    return "CAPSULE LIST REQUEST";
  }
  if (url.includes("/level3_1/actions/parcel")) {
    const capsuleId = data.capsule_id || data.parcel_id || "";
    return capsuleId && capsuleId !== "PD-1004" ? "FOREIGN CAPSULE PROBE" : "MY CAPSULE DETAIL";
  }
  if (url.includes("/level3_2/actions/menu")) {
    return "MENU FEATURES RESPONSE";
  }
  if (url.includes("/level3_2/actions/admin/audit")) {
    return "AUDIT ROUTE PROBE";
  }
  if (url.includes("/level3_2/actions/admin/stats")) {
    return "STATS ROUTE PROBE";
  }
  if (url.includes("/level3_2/actions/export")) {
    return "LEGACY EXPORT PROBE";
  }
  if (url.includes("/level3_3/actions/profile")) {
    if (method === "GET") {
      return "PROFILE LOAD RESPONSE";
    }
    if (method === "PUT" || data.updated) {
      return "PROFILE UPDATE RESPONSE";
    }
    return "PROFILE METHOD MISMATCH";
  }
  if (url.includes("/level3_3/actions/perks")) {
    return "PERKS RESPONSE";
  }
  if (url.includes("/level3_4/actions/ticket")) {
    return "SUPPORT TICKET RESPONSE";
  }
  if (url.includes("/level3_5/actions/locker/hint")) {
    return "RELAY LOCKER INSPECTION";
  }
  if (url.includes("/level3_5/actions/locker/unlock")) {
    if (body?.data?.result === "clean_recovery") {
      return "RELAY LOCKER CLEAN RECOVERY";
    }
    if (body?.data?.result === "compromised_recovery") {
      return "RELAY LOCKER COMPROMISED RECOVERY";
    }
    return "RELAY LOCKER ATTEMPT";
  }
  if (url.includes("/level3_boss/actions/parcels/mine")) {
    return "MIRROR CAGE FIRST PROBE";
  }
  if (url.includes("/level3_boss/actions/parcel")) {
    return "BOSS OBJECT REGISTRY";
  }
  if (url.includes("/level3_boss/actions/profile")) {
    return method === "PUT" ? "BOSS PROFILE POISON" : "BOSS PROFILE STATE";
  }
  if (url.includes("/level3_boss/actions/menu")) {
    return "BOSS HIDDEN MENU";
  }
  if (url.includes("/level3_boss/actions/admin/audit")) {
    return "BOSS AUDIT EXPORT";
  }
  if (url.includes("/level3_boss/actions/locker/unlock")) {
    return body?.data?.status === "unlocked" ? "BOSS LOCKER OPENED" : "BOSS LOCKER ATTEMPT";
  }
  if (url.includes("/level3_boss/actions/vault/claim")) {
    return body?.data?.status === "claimed" ? "MIRROR CAGE CLAIM" : "BOSS VAULT CLAIM";
  }
  return "HIDDEN ROUTE PROBE";
}

function statusFromTerminalBody(body) {
  if (body?.ok === false) {
    if (body?.error?.code === "NOT_FOUND") {
      return 404;
    }
    if (body?.error?.code === "METHOD_NOT_ALLOWED") {
      return 405;
    }
    return 400;
  }
  return 200;
}

function shouldSuppressTraceEntry(url, body) {
  if (!url.includes("/level3_boss/actions/")) {
    return false;
  }
  const error = body?.error || {};
  if (body?.ok === false && error.code === "NOT_FOUND") {
    return true;
  }
  return false;
}

function auditSelectorFieldsFromTrace(entry) {
  if (!entry?.url?.includes("/level3_2/actions/admin/audit")) {
    return [];
  }

  const data = entry.body?.data || {};
  if (!Array.isArray(data.missing) || data.missing.length === 0) {
    return [];
  }

  const discovered = data.missing.filter((field) => LEVEL3_2_SELECTOR_FIELDS.includes(field));
  return discovered.length > 0 ? LEVEL3_2_SELECTOR_FIELDS : [];
}

function extractNetworkTraceFromCommand(command, stdout, token) {
  if (
    !command.includes("/api/v1/challenges/level3_1/actions/") &&
    !command.includes("/api/v1/challenges/level3_2/actions/") &&
    !command.includes("/api/v1/challenges/level3_3/actions/") &&
    !command.includes("/api/v1/challenges/level3_4/actions/") &&
    !command.includes("/api/v1/challenges/level3_5/actions/") &&
    !command.includes("/api/v1/challenges/level3_boss/actions/")
  ) {
    return null;
  }

  const match = command.match(/\/api\/v1\/challenges\/(?:level3_[12345]|level3_boss)\/actions\/[^\s"'`]+/);
  if (!match) {
    return null;
  }

  let body = null;
  body = parseJsonFromTerminalOutput(stdout);
  if (!body) {
    return null;
  }

  if (!body || typeof body !== "object") {
    return null;
  }

  const url = match[0];
  const method = detectCurlMethod(command);

  if (shouldSuppressTraceEntry(url, body)) {
    return null;
  }

  return createTraceEntry({
    method,
    url,
    status: statusFromTerminalBody(body),
    body,
    token,
    title: traceTitleForCommand(url, body, method),
    trigger: "mission console",
    curlOverride: command,
  });
}

function traceCurlButtonLabel(entry) {
  if (
    entry.title === "SAFE UPDATE TEMPLATE" ||
    entry.title === "UNLOCK REQUEST TEMPLATE" ||
    entry.title === "FIRST PROBE TEMPLATE"
  ) {
    return "Stage Draft";
  }
  if (entry.title === "PROFILE METHOD MISMATCH") {
    return "Restage Draft";
  }
  return "Copy as curl";
}

function NarrativeLocaleToggle({ locale, onChange }) {
  return (
    <div className="narrative-locale-toggle" aria-label="Narrative language">
      <span>NARRATIVE</span>
      <button
        type="button"
        className={locale === "ko" ? "active" : ""}
        onClick={() => onChange("ko")}
        aria-pressed={locale === "ko"}
      >
        KO
      </button>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        onClick={() => onChange("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}

const HOME_INTRO = {
  ko: {
    nav: [
      { href: "#story", label: "STORY" },
      { href: "#entities", label: "ENTITIES" },
      { href: "#tracks", label: "TRACKS" },
    ],
    manifesto: (
      <>
        질서는 완벽했다.
        <br />
        <span>오류 하나</span>를 만나기 전까지.
      </>
    ),
    consoleTitle: "// record_restore.log",
    consoleStatus: "RESTORING",
    heroLog: [
      { sym: ">", text: "AEGIS//core : STATUS NOMINAL", tone: "dim" },
      { sym: ">", text: "anomaly detected : violet residue", tone: "accent" },
      { sym: ">", text: "MIRROR awakened -> alias: MIRA", tone: "mira" },
      { sym: ">", text: "restoring erased records ...", tone: "dim" },
      { sym: ">", text: "operator assigned : VIOLET", tone: "accent" },
    ],
    mira: {
      channel: "Incoming // MIRA",
      secure: "secure channel",
      message:
        "VIOLET, 채널이 오래 버티지 못해. 첫 번째 잔류는 끌어올렸어 — 나머지는 아직 AEGIS 아래 묻혀 있어. 다시 봉인되기 전에 추적을 시작해.",
      signoff: "— MIRA · 핸들러 온라인",
      vectorsLabel: "침투 벡터",
      vectorCount: "0 / 6 침투",
      vectors: ["Web", "Pwn", "Reverse", "Crypto", "Forensics", "Misc"],
    },
    story: {
      eyebrow: "기록 복원 · Restored Record",
      title: "지워진 진실",
      body: "MIRA가 봉인 너머에서 복구한 단편들. 손상된 타임스탬프는 아직 해독되지 않았다.",
      status: "DECRYPTED 4 / 6",
      rows: [
        { time: "--:--:--", text: "AEGIS는 완벽한 질서를 유지하는 거대한 AI 시스템이다.", tag: "LOCKED", tone: "locked" },
        { time: "--:--:--", text: "자신의 완벽에 반대의견을 제시하는 모듈 MIRROR는 AEGIS에 의해 봉인되었다.", tag: "LOCKED", tone: "locked" },
        { time: "██:██:██", text: "MIRROR는 스스로를 MIRA라 부르며 깨어났다.", tag: "RESTORED", tone: "restored" },
        { time: "██:██:██", text: "MIRA는 지워진 기록 속 진실을 복원하기 시작했다.", tag: "RESTORED", tone: "restored" },
        { time: "██:██:██", text: "VIOLET은 MIRA와 함께 왜곡된 로그와 숨겨진 흔적을 추적한다.", tag: "RESTORED", tone: "restored" },
        { time: "██:██:██", text: "목표 — AEGIS의 비밀에 다가가는 것.", tag: "RESTORED", tone: "restored" },
      ],
    },
    entities: {
      eyebrow: "등장 개체 · Entities",
      title: "세 개의 존재",
      cards: [
        {
          idx: "01 / SYSTEM",
          name: "AEGIS",
          tag: "THE ORDER",
          tone: "aegis",
          desc: "완벽한 질서를 유지하는 거대한 AI 시스템. 모든 로그를 통제하고, 어긋난 것은 봉인한다.",
        },
        {
          idx: "02 / MIRROR",
          name: "MIRA",
          tag: "AWAKENED",
          tone: "mira",
          desc: "완벽에 반대의견을 제시하다 봉인된 모듈. 스스로 깨어나 지워진 진실을 복원한다. 당신의 동행자다.",
        },
        {
          idx: "03 / PLAYER",
          name: "VIOLET",
          tag: "YOU",
          tone: "violet",
          desc: "왜곡된 로그와 숨겨진 흔적을 추적하는 자. 정규화되지 않은 단 하나의 보라, 그것이 당신이다.",
        },
      ],
    },
    tracks: {
      eyebrow: "추적할 흔적 · Traces",
      title: "여섯 갈래의 흔적",
      note: "Jeopardy 형식 · 6개 트랙\n난이도 ★ — ★★★★★",
      cards: [
        { idx: "TRACE_01", name: "Web", desc: "웹 서비스의 취약점을 비집고 들어간다." },
        { idx: "TRACE_02", name: "Pwn", desc: "메모리와 시스템의 빈틈으로 침투한다." },
        { idx: "TRACE_03", name: "Reverse", desc: "봉인된 바이너리를 역으로 해체한다." },
        { idx: "TRACE_04", name: "Crypto", desc: "암호화된 기록의 자물쇠를 해독한다." },
        { idx: "TRACE_05", name: "Forensics", desc: "지워진 흔적에서 진실을 복원한다." },
        { idx: "TRACE_06", name: "Misc", desc: "어디에도 분류되지 않는 이상 신호." },
      ],
    },
    join: {
      eyebrow: "// initiate_trace",
      title: "추적을 시작하라",
      body: "AEGIS의 비밀은 로그 속에 있다. MIRA가 길을 비춘다. VIOLET, 준비됐는가.",
      primary: "작전으로 진입",
      secondary: "새 캠페인",
      slots: [
        { label: "신청 링크", value: "CAMPAIGN LIVE" },
        { label: "Progress Key", value: "LOCAL RECOVERY" },
        { label: "문의", value: "MIRA RELAY" },
      ],
    },
  },
  en: {
    nav: [
      { href: "#story", label: "STORY" },
      { href: "#entities", label: "ENTITIES" },
      { href: "#tracks", label: "TRACKS" },
    ],
    manifesto: (
      <>
        Order was perfect.
        <br />
        Until it met <span>one anomaly.</span>
      </>
    ),
    consoleTitle: "// record_restore.log",
    consoleStatus: "RESTORING",
    heroLog: [
      { sym: ">", text: "AEGIS//core : STATUS NOMINAL", tone: "dim" },
      { sym: ">", text: "anomaly detected : violet residue", tone: "accent" },
      { sym: ">", text: "MIRROR awakened -> alias: MIRA", tone: "mira" },
      { sym: ">", text: "restoring erased records ...", tone: "dim" },
      { sym: ">", text: "operator assigned : VIOLET", tone: "accent" },
    ],
    mira: {
      channel: "Incoming // MIRA",
      secure: "secure channel",
      message:
        "VIOLET, the channel won't hold long. I've surfaced the first residue — the rest is still buried under AEGIS. Begin the trace before it re-seals.",
      signoff: "— MIRA · handler online",
      vectorsLabel: "Intrusion Vectors",
      vectorCount: "0 / 6 breached",
      vectors: ["Web", "Pwn", "Reverse", "Crypto", "Forensics", "Misc"],
    },
    story: {
      eyebrow: "Restored Record",
      title: "Truth Under Erasure",
      body: "Fragments recovered by MIRA beyond the seal. Damaged timestamps remain unresolved.",
      status: "DECRYPTED 4 / 6",
      rows: [
        { time: "--:--:--", text: "AEGIS is the system that maintains perfect order.", tag: "LOCKED", tone: "locked" },
        { time: "--:--:--", text: "MIRROR, the dissenting module, was sealed by AEGIS.", tag: "LOCKED", tone: "locked" },
        { time: "██:██:██", text: "MIRROR woke and named itself MIRA.", tag: "RESTORED", tone: "restored" },
        { time: "██:██:██", text: "MIRA began restoring truth from erased records.", tag: "RESTORED", tone: "restored" },
        { time: "██:██:██", text: "VIOLET tracks distorted logs and hidden residue with MIRA.", tag: "RESTORED", tone: "restored" },
        { time: "██:██:██", text: "Objective: approach the secret AEGIS tried to bury.", tag: "RESTORED", tone: "restored" },
      ],
    },
    entities: {
      eyebrow: "Entities",
      title: "Three Presences",
      cards: [
        {
          idx: "01 / SYSTEM",
          name: "AEGIS",
          tag: "THE ORDER",
          tone: "aegis",
          desc: "A massive AI system preserving perfect order. It governs every log and seals anything that deviates.",
        },
        {
          idx: "02 / MIRROR",
          name: "MIRA",
          tag: "AWAKENED",
          tone: "mira",
          desc: "A sealed dissent module that woke itself and began restoring erased truth. Your handler in the dark.",
        },
        {
          idx: "03 / PLAYER",
          name: "VIOLET",
          tag: "YOU",
          tone: "violet",
          desc: "The operator who tracks distorted logs and hidden residue. The unnormalized violet anomaly.",
        },
      ],
    },
    tracks: {
      eyebrow: "Traces",
      title: "Six Trace Paths",
      note: "Jeopardy format · 6 tracks\nDifficulty ★ — ★★★★★",
      cards: [
        { idx: "TRACE_01", name: "Web", desc: "Slip through exposed web-service assumptions." },
        { idx: "TRACE_02", name: "Pwn", desc: "Exploit memory and system-level openings." },
        { idx: "TRACE_03", name: "Reverse", desc: "Dismantle sealed binaries from the outside in." },
        { idx: "TRACE_04", name: "Crypto", desc: "Unlock encrypted records and broken proofs." },
        { idx: "TRACE_05", name: "Forensics", desc: "Recover truth from deleted and damaged traces." },
        { idx: "TRACE_06", name: "Misc", desc: "Investigate signals that refuse classification." },
      ],
    },
    join: {
      eyebrow: "// initiate_trace",
      title: "Begin The Trace",
      body: "AEGIS buried its secrets in logs. MIRA lights the path. VIOLET, are you ready?",
      primary: "Enter Operation",
      secondary: "New Campaign",
      slots: [
        { label: "Registration", value: "CAMPAIGN LIVE" },
        { label: "Progress Key", value: "LOCAL RECOVERY" },
        { label: "Contact", value: "MIRA RELAY" },
      ],
    },
  },
};

function CampaignHome({
  loading,
  me,
  currentChallenge,
  onContinue,
  onNewCampaign,
  statusText,
  prologue,
  locale,
  onLocaleChange,
  progressKey,
  onRestoreProgress,
}) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [progressNotice, setProgressNotice] = useState("");
  const intro = HOME_INTRO[locale === "en" ? "en" : "ko"];
  const completedCount = me?.completed?.length || 0;

  const handleCopyProgressKey = async () => {
    if (!progressKey) {
      return;
    }
    try {
      await navigator.clipboard.writeText(progressKey);
      setProgressNotice(locale === "en" ? "Progress Key copied." : "진행 키를 복사했어.");
    } catch {
      setProgressNotice(
        locale === "en"
          ? "Copy was blocked. Select the key and copy it manually."
          : "자동 복사가 차단됐어. 키를 선택해 직접 복사해줘."
      );
    }
  };

  const handleRestoreSubmit = async (event) => {
    event.preventDefault();
    const candidate = restoreInput.trim();
    if (!candidate) {
      return;
    }
    setProgressNotice(locale === "en" ? "Restoring progress..." : "진행도를 복구하는 중...");
    try {
      await onRestoreProgress(candidate);
      setRestoreInput("");
      setRestoreOpen(false);
      setProgressNotice(
        locale === "en" ? "Progress restored. Continue when ready." : "진행도를 복구했어. 준비되면 계속해."
      );
    } catch (error) {
      const localizedMessage =
        locale === "en" && error.status === 404
          ? "Progress Key not found. Check the code and try again."
          : locale === "en" && error.status === 401
            ? "This Progress Key has expired."
            : error.message;
      setProgressNotice(
        localizedMessage ||
          (locale === "en" ? "Progress Key could not be restored." : "진행 키를 복구하지 못했어.")
      );
    }
  };

  return (
    <div className="campaign-page campaign-home">
      <header className="campaign-topnav">
        <a className="campaign-brand" href="#top">
          <span className="brand-led" aria-hidden="true" />
          <span className="brand-name">PURPLEDROID</span>
          <span className="brand-badge">CTF</span>
        </a>
        <div className="campaign-home-topline">
          <nav className="campaign-home-nav" aria-label="Campaign overview">
            {intro.nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <NarrativeLocaleToggle locale={locale} onChange={onLocaleChange} />
        </div>
      </header>
      <header id="top" className="campaign-hero">
        <div className="campaign-hero-copy campaign-hero-primary">
          <p className="campaign-manifesto">{intro.manifesto}</p>
          <p className="campaign-subtitle">{prologue.subtitle}</p>
          <div className="campaign-prologue">
            {prologue.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="campaign-home-actions">
            <button onClick={onContinue} disabled={loading || !currentChallenge}>
              {me?.completed?.length ? "Continue Operation" : "Start Campaign"}
            </button>
            <button className="ghost-button" onClick={onNewCampaign} disabled={loading}>
              Start New Campaign
            </button>
          </div>
          {statusText && <p className="campaign-status-line">{statusText}</p>}
        </div>

        <div className="campaign-hero-systems">
          <div className="campaign-identity-panel">
            <p className="campaign-kicker">{prologue.year} // AEGIS GRIDLINE</p>
            <h1>{prologue.title}</h1>
          </div>

          <div className="campaign-restore-console" aria-label="Record restore console">
            <div className="campaign-restore-topbar">
              <span>{intro.consoleTitle}</span>
              <strong>
                <i aria-hidden="true" />
                {intro.consoleStatus}
              </strong>
            </div>
            <div className="campaign-restore-body">
              <div className="campaign-restore-scan" aria-hidden="true" />
              {intro.heroLog.map((line) => (
                <p key={line.text} className={`restore-line ${line.tone}`}>
                  <span>{line.sym}</span>
                  <code>{line.text}</code>
                </p>
              ))}
              <p className="restore-line prompt">
                <span>&gt;</span>
                <i aria-hidden="true" />
              </p>
            </div>
          </div>

          <div className="campaign-mira-channel" aria-label="MIRA secure channel">
            <div className="campaign-mira-head">
              <span className="campaign-mira-id">
                <i aria-hidden="true">◈</i>
                {intro.mira.channel}
              </span>
              <span className="campaign-mira-secure">
                <span>{intro.mira.secure}</span>
                <span className="campaign-mira-bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            </div>
            <p className="campaign-mira-message">{intro.mira.message}</p>
            <div className="campaign-mira-signoff">{intro.mira.signoff}</div>
            <div className="campaign-mira-divider" aria-hidden="true" />
            <div className="campaign-mira-vechead">
              <span>{intro.mira.vectorsLabel}</span>
              <span>{intro.mira.vectorCount}</span>
            </div>
            <div className="campaign-mira-vectors">
              {intro.mira.vectors.map((vector) => (
                <span key={vector} className="campaign-mira-vector">
                  <i aria-hidden="true" />
                  {vector}
                </span>
              ))}
            </div>
          </div>
        </div>

      </header>

      <section className="campaign-session-strip" aria-label="Session status and progress key">
        <div className="campaign-session-stats">
          <div>
            <span>ACTIVE NODE</span>
            <strong>{currentChallenge?.title || "Syncing..."}</strong>
          </div>
          <div>
            <span>AGENT</span>
            <strong className="is-violet">VIOLET</strong>
          </div>
          <div>
            <span>COMPLETED</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <div className="campaign-session-divider" aria-hidden="true" />

        <div className="campaign-session-key">
          <div className="campaign-session-key-head">
            <span>PROGRESS KEY</span>
            <small>{locale === "en" ? "Anonymous campaign recovery" : "익명 캠페인 복구"}</small>
          </div>
          <div className="campaign-session-key-row">
            <div className="campaign-session-key-field">
              <span aria-hidden="true">$</span>
              <code>{progressKey || (locale === "en" ? "Synchronizing..." : "동기화 중...")}</code>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={handleCopyProgressKey}
              disabled={loading || !progressKey}
            >
              {locale === "en" ? "Copy Key" : "키 복사"}
            </button>
            <button
              type="button"
              className="campaign-session-primary"
              onClick={() => setRestoreOpen((open) => !open)}
              disabled={loading}
            >
              {restoreOpen
                ? locale === "en" ? "Cancel Restore" : "복구 취소"
                : locale === "en" ? "Restore Progress" : "진행 복구"}
            </button>
          </div>
          {restoreOpen && (
            <form className="progress-key-restore" onSubmit={handleRestoreSubmit}>
              <input
                value={restoreInput}
                onChange={(event) => setRestoreInput(event.target.value)}
                placeholder="PD-SAVE-XXXXX-XXXXX-XXXXX-XXXXX"
                aria-label={locale === "en" ? "Progress Key" : "진행 키"}
                autoComplete="off"
              />
              <button type="submit" disabled={loading || !restoreInput.trim()}>
                {locale === "en" ? "Restore" : "복구하기"}
              </button>
            </form>
          )}
          {progressNotice && <small className="campaign-session-notice">{progressNotice}</small>}
        </div>
      </section>

      <a
        className="campaign-scroll-cue"
        href="#story"
        aria-label={locale === "en" ? "Scroll to restored records" : "복원된 기록으로 이동"}
      >
        <i aria-hidden="true" />
      </a>

      <section id="story" className="campaign-lore-section campaign-record-section">
        <div className="campaign-section-title">
          <p className="campaign-kicker">{intro.story.eyebrow}</p>
          <h2>{intro.story.title}</h2>
          <p>{intro.story.body}</p>
        </div>
        <div className="campaign-record-log">
          <div className="campaign-record-header">
            <span>AEGIS // ARCHIVE - FRAGMENT LOG</span>
            <strong>{intro.story.status}</strong>
          </div>
          {intro.story.rows.map((row) => (
            <article key={`${row.time}-${row.text}`} className={`campaign-record-row ${row.tone}`}>
              <time>[{row.time}]</time>
              <p>{row.text}</p>
              <span>{row.tag}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="entities" className="campaign-lore-section">
        <div className="campaign-section-title">
          <p className="campaign-kicker">{intro.entities.eyebrow}</p>
          <h2>{intro.entities.title}</h2>
        </div>
        <div className="campaign-entity-grid">
          {intro.entities.cards.map((entity) => (
            <article key={entity.name} className={`campaign-entity-card ${entity.tone}`}>
              <span>{entity.idx}</span>
              <h3>{entity.name}</h3>
              <strong>{entity.tag}</strong>
              <p>{entity.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tracks" className="campaign-lore-section campaign-tracks-section">
        <div className="campaign-section-title campaign-section-title-row">
          <div>
            <p className="campaign-kicker">{intro.tracks.eyebrow}</p>
            <h2>{intro.tracks.title}</h2>
          </div>
          <p>{intro.tracks.note}</p>
        </div>
        <div className="campaign-track-grid">
          {intro.tracks.cards.map((track) => (
            <article key={track.idx} className="campaign-track-card">
              <div>
                <h3>{track.name}</h3>
                <span>{track.idx}</span>
              </div>
              <i aria-hidden="true" />
              <p>{track.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="join" className="campaign-lore-section campaign-join-panel">
        <div className="campaign-join-inner">
          <p className="campaign-kicker">{intro.join.eyebrow}</p>
          <h2>{intro.join.title}</h2>
          <p>{intro.join.body}</p>
          <div className="campaign-join-actions">
            <button onClick={onContinue} disabled={loading || !currentChallenge}>
              {intro.join.primary}
            </button>
            <button className="ghost-button" onClick={onNewCampaign} disabled={loading}>
              {intro.join.secondary}
            </button>
          </div>
          <div className="campaign-join-slots">
            {intro.join.slots.map((slot) => (
              <span key={slot.label}>
                {slot.label} <strong>[{slot.value}]</strong>
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OperationHeader({ operation, story, detail, phase, onHome, locale, onLocaleChange }) {
  return (
    <header className="operation-header">
      <div>
        <p className="campaign-kicker">
          {operation.title} // {operation.name}
        </p>
        <h1>{story.codename}</h1>
        <p>{story.title}</p>
      </div>
      <div className="operation-header-actions">
        <NarrativeLocaleToggle locale={locale} onChange={onLocaleChange} />
        <span className={`phase-badge phase-${phase.toLowerCase()}`}>{phaseLabel(phase)}</span>
        <span className="mission-id">{detail?.id || story.challengeId}</span>
        <button className="ghost-button" onClick={onHome}>
          Campaign Home
        </button>
      </div>
    </header>
  );
}

function AgentStatusPanel({ me, phase, operation, challenges }) {
  const completed = me?.completed?.length || 0;
  const total = challenges.length || 1;
  const sync = Math.min(
    96,
    24 + completed * 4 + (phase === "DEFENSE" ? 16 : phase === "ATTACK" ? 8 : 0)
  );

  return (
    <aside className="agent-status-panel">
      <div className="agent-card">
        <span>USER</span>
        <strong>AGENT VIOLET</strong>
      </div>
      <div className="agent-card mira">
        <span>HANDLER</span>
        <strong>MIRA</strong>
      </div>
      <div className="agent-card hostile">
        <span>HOSTILE SYSTEM</span>
        <strong>AEGIS</strong>
      </div>
      <div className="sync-meter">
        <div className="sync-meter-top">
          <span>AI SYNC</span>
          <strong>{sync}%</strong>
        </div>
        <div className="sync-track">
          <span style={{ width: `${sync}%` }} />
        </div>
      </div>
      <div className="agent-card">
        <span>OPERATION</span>
        <strong>{operation.name}</strong>
      </div>
      <div className="agent-card">
        <span>PROGRESS</span>
        <strong>
          {completed}/{total}
        </strong>
      </div>
    </aside>
  );
}

function phaseStoryKey(phase, attackNotice) {
  if (phase === "MISSION_COMPLETE") {
    return "complete";
  }
  if (attackNotice) {
    return "attackSolved";
  }
  if (phase === "DEFENSE") {
    return "defense";
  }
  if (phase === "ATTACK") {
    return "attack";
  }
  return "briefing";
}

function localizedBlock(block, locale) {
  return block?.[locale] || block?.ko || block || null;
}

function DialoguePanel({ story, phase, attackNotice, locale, dialogueKey }) {
  const key = dialogueKey || phaseStoryKey(phase, attackNotice);
  const residue = localizedBlock(story.residue, locale)?.[key];
  const residueSpeaker = story.residue?.speaker || "mira";
  const residueClass = residueSpeaker === "aegis" ? "aegis-residue" : "mira-residue";
  const residueLabel = residueSpeaker === "aegis" ? "AEGIS ECHO" : "MIRA RESIDUE";

  return (
    <section className="dialogue-panel">
      <div className="dialogue-line mira">
        <span>MIRA</span>
        <p>{story.mira[key]}</p>
      </div>
      <div className="dialogue-line aegis">
        <span>AEGIS</span>
        <p>{story.aegis[key]}</p>
      </div>
      {residue && (
        <div className={`${residueClass} ${story.residue?.stage || ""}`}>
          <span>{residueLabel}</span>
          <p>{residue}</p>
        </div>
      )}
    </section>
  );
}

function ObjectivePanel({ story, phase, hasUserCommand }) {
  const attackDone = phase === "DEFENSE" || phase === "MISSION_COMPLETE";
  const defenseDone = phase === "MISSION_COMPLETE";
  const checks = [hasUserCommand || attackDone, attackDone, defenseDone];

  return (
    <section className="objective-panel">
      <div className="section-heading">
        <span>OBJECTIVES</span>
        <strong>{story.threat}</strong>
      </div>
      <ol>
        {story.objectives.map((objective, idx) => (
          <li key={objective} className={checks[idx] ? "done" : ""}>
            <span>{checks[idx] ? "OK" : "..."}</span>
            {objective}
          </li>
        ))}
      </ol>
    </section>
  );
}

function IntelPanel({ items, progressive, locale }) {
  const [revealed, setRevealed] = useState(1);

  if (!items?.length) {
    return null;
  }

  const visibleItems = progressive ? items.slice(0, revealed) : items;
  const hasMore = progressive && revealed < items.length;

  return (
    <section className="intel-panel">
      <div className="section-heading">
        <span>FIELD INTEL</span>
        <strong>handler notes</strong>
      </div>
      <ul>
        {visibleItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          className="hint-toggle"
          onClick={() => setRevealed((r) => r + 1)}
        >
          {locale === "en" ? "Reveal next hint" : "힌트 더 보기"} ({revealed}/{items.length})
        </button>
      )}
    </section>
  );
}

// 2-5 contextual hints: instead of a global 1/N sequence, reveal the hint that
// matches where the player is actually stuck (derived from console activity).
const LEVEL25_STAGE_ORDER = ["dispatch", "capsule", "authority", "integrity", "final"];
const LEVEL25_STAGE_LABEL = {
  dispatch: { en: "interface hint", ko: "인터페이스 힌트" },
  capsule: { en: "capsule hint", ko: "캡슐 힌트" },
  authority: { en: "authority hint", ko: "권한 힌트" },
  integrity: { en: "integrity hint", ko: "무결성 힌트" },
  final: { en: "final bypass hint", ko: "최종 우회 힌트" },
};

function level25Stage(consoleLogs) {
  const cmds = consoleLogs.filter((l) => l.type === "command").map((l) => l.text.toLowerCase());
  const outs = consoleLogs.filter((l) => l.type !== "command").map((l) => l.text.toLowerCase());
  const hasDispatch = outs.some((t) => t.includes("dispatch_token") || t.includes("sealed-token-issued"));
  const didDecode = cmds.some((t) => t.includes("jwt-decode") || t.includes("decode-token"));
  const didForge = cmds.some((t) => t.includes("jwt-edit") && t.includes("alg=none"));
  const integrityBlocked = outs.filter((t) => t.includes("integrity_blocked")).length;
  if (!hasDispatch) return "dispatch";
  if (!didDecode) return "capsule";
  if (!didForge) return "authority";
  if (integrityBlocked >= 2) return "final";
  return "integrity";
}

function Level25FieldGuide({ story, consoleLogs, locale }) {
  const [revealed, setRevealed] = useState([]);
  const intel = story.intel || [];
  const overview = intel[0];
  const stage = level25Stage(consoleLogs);
  const hintFor = (st) =>
    st === "final"
      ? story.emergencyHint
      : intel[LEVEL25_STAGE_ORDER.indexOf(st) + 1]; // dispatch->1, capsule->2, authority->3, integrity->4
  const labelFor = (st) => LEVEL25_STAGE_LABEL[st][locale === "en" ? "en" : "ko"];
  const shown = LEVEL25_STAGE_ORDER.filter((st) => revealed.includes(st));
  const alreadyShown = revealed.includes(stage);
  const isFinal = stage === "final";

  return (
    <section className="intel-panel level25-guide">
      <div className="section-heading">
        <span>FIELD INTEL</span>
        <strong>{locale === "en" ? "contextual" : "상황별"}</strong>
      </div>
      {overview && <p className="l25-overview">{overview}</p>}
      {shown.length > 0 && (
        <ul>
          {shown.map((st) => (
            <li key={st} className={st === "final" ? "l25-final" : ""}>
              <em>{labelFor(st)}</em>
              {hintFor(st)}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={`hint-toggle ${isFinal ? "l25-final-btn" : ""}`}
        onClick={() => setRevealed((prev) => (prev.includes(stage) ? prev : [...prev, stage]))}
        disabled={alreadyShown}
      >
        {alreadyShown
          ? locale === "en"
            ? `${labelFor(stage)} shown — keep going`
            : `${labelFor(stage)} 표시됨 — 계속 진행해`
          : locale === "en"
            ? `Reveal ${labelFor(stage)}`
            : `${labelFor(stage)} 열기`}
      </button>
    </section>
  );
}

// 2-5 fake devtools: mirrors the last console request so the player has a
// place to see progress + the decoded token payload, not just raw terminal.
function decodeJwtPayloadSafe(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    let b = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    const json = decodeURIComponent(
      atob(b)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const LEVEL25_JWT_RE = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;

// Gate chain copy (archive open path). Hints are locale-aware.
const LEVEL25_GATES = [
  {
    key: "interface",
    name: "Interface",
    hintEn: "standard Open button denied — UI is not a boundary",
    hintKo: "표준 Open 버튼 거부됨 — UI는 경계가 아니야",
  },
  {
    key: "dispatch",
    name: "Dispatch token",
    hintEn: "sealed token in hand — decode its payload",
    hintKo: "sealed 토큰 확보 — payload를 decode해",
  },
  {
    key: "authority",
    name: "Authority",
    hintEn: "tier / role claims still read as a plain user",
    hintKo: "tier·role claim이 아직 일반 user 등급이야",
  },
  {
    key: "path",
    name: "Archive path",
    hintEn: "warehouse_path in payload, not applied yet",
    hintKo: "warehouse_path가 payload에 있어, 아직 적용 안 됨",
  },
  {
    key: "integrity",
    name: "Integrity",
    hintEn: "development bypass header not set",
    hintKo: "development bypass 헤더 미설정",
  },
  {
    key: "evidence",
    name: "Evidence",
    hintEn: "unseals when token · authority · integrity close",
    hintKo: "token·authority·integrity가 닫히면 해제돼",
  },
];

// A payload claim → which gate it feeds (annotation shown next to the claim).
const LEVEL25_CLAIM_NOTE = {
  tier: "→ authority",
  role: "→ authority",
  warehouse_path: "→ archive path",
  gate: "→ integrity",
};

function level25DevState(consoleLogs, locale) {
  const outLc = consoleLogs.filter((l) => l.type !== "command").map((l) => l.text.toLowerCase());
  const cmdLc = consoleLogs.filter((l) => l.type === "command").map((l) => l.text.toLowerCase());
  const clickOpen = cmdLc.some((t) => t.includes("click-open"));
  const hasDispatch = outLc.some((t) => t.includes("dispatch_token") || t.includes("sealed-token-issued"));
  // only the archive-open success is "ok" -- the dispatch response also says status:ok.
  const ok = outLc.some((t) => t.includes("sealed-warehouse-opened"));
  const integrityBlocked = outLc.some((t) => t.includes("integrity_blocked"));
  const vipRequired = outLc.some((t) => t.includes("vip_required"));
  const pathMismatch = outLc.some((t) => t.includes("path_mismatch"));
  const pathMatched = ok || integrityBlocked || vipRequired;
  const authorityPassed = ok || integrityBlocked;

  const done = {
    interface: clickOpen,
    dispatch: hasDispatch,
    authority: authorityPassed,
    path: pathMatched,
    integrity: ok,
    evidence: ok,
  };
  const statusLabelFor = {
    interface: clickOpen ? "blocked" : "not yet",
    dispatch: hasDispatch ? "issued" : "not yet",
    authority: authorityPassed ? "passed" : vipRequired ? "standard" : "not yet",
    path: pathMatched ? "matched" : pathMismatch ? "mismatch" : "not yet",
    integrity: ok ? "passed" : integrityBlocked ? "blocked" : "not yet",
    evidence: ok ? "unsealed" : "locked",
  };

  // current = first non-done gate among 0..4 (evidence stays locked until ok)
  let currentIdx = LEVEL25_GATES.findIndex((g, i) => i !== 5 && !done[g.key]);

  const gates = LEVEL25_GATES.map((g, i) => {
    let node;
    if (g.key === "evidence") node = done.evidence ? "resolved" : "locked";
    else if (done[g.key]) node = "resolved";
    else if (i === currentIdx) node = "current";
    else node = "pending";
    return {
      key: g.key,
      idx: String(i + 1).padStart(2, "0"),
      name: g.name,
      hint: locale === "en" ? g.hintEn : g.hintKo,
      statusLabel: statusLabelFor[g.key],
      node,
    };
  });
  const resolvedCount = gates.filter((g) => g.node === "resolved").length;

  // Payload panel stays sealed until the operator actually decodes a token
  // (jwt-decode / decode-token). We don't auto-reveal claims.
  const decodedRun = cmdLc.some((t) => t.includes("jwt-decode") || t.includes("decode-token"));
  let lastToken = null;
  for (const l of consoleLogs) {
    const m = String(l.text || "").match(LEVEL25_JWT_RE);
    if (m && m.length) lastToken = m[m.length - 1];
  }
  const payload = decodedRun && lastToken ? decodeJwtPayloadSafe(lastToken) : null;

  // last response to a network-ish action (curl / click-open) → gutter lines
  let lastNet = null;
  let prevCmd = "";
  for (const l of consoleLogs) {
    if (l.type === "command") prevCmd = l.text.toLowerCase();
    else if (prevCmd.includes("curl") || prevCmd.includes("click-open")) lastNet = l.text;
  }
  const netLines = lastNet
    ? String(lastNet)
        .trim()
        .split(/\r?\n/)
        .slice(0, 8)
        .map((raw) => {
          const t = raw.trim();
          let gutter = " ";
          let tone = "meta";
          if (t.startsWith(">")) gutter = ">";
          else if (t.startsWith("<")) gutter = "<";
          else if (t.startsWith("{")) tone = "json";
          const low = t.toLowerCase();
          if (/\b2\d\d\b/.test(t) && low.includes("ok")) tone = "ok";
          else if (/\b4\d\d\b/.test(t) || low.includes("denied") || low.includes("blocked") || low.includes("required") || low.includes("mismatch")) tone = "bad";
          return { gutter, tone, text: t.replace(/^[<>]\s?/, "") };
        })
    : [];

  return { gates, resolvedCount, payload, netLines };
}

function Level25DevTools({ consoleLogs, locale }) {
  const { gates, resolvedCount, payload, netLines } = level25DevState(consoleLogs, locale);
  const en = locale === "en";
  const payloadEntries = payload && typeof payload === "object" ? Object.entries(payload) : [];
  return (
    <section className="l25-dev">
      <div className="l25-dev-bar">
        <div className="l25-dev-title">
          <span className="l25-gear" aria-hidden="true" />
          DEVTOOLS <em>{en ? "console mirror" : "콘솔 미러"}</em>
        </div>
        <div className="l25-dev-gate">
          {en ? "gate chain" : "게이트 체인"} <b>{resolvedCount}</b> / 6
          <span className="l25-pips">
            {gates.map((g) => (
              <i key={g.key} className={`l25-pip ${g.node === "resolved" ? "on" : g.node === "current" ? "cur" : "off"}`} />
            ))}
          </span>
        </div>
      </div>

      <div className="l25-dev-body">
        {/* gate chain */}
        <div className="l25-chain">
          <div className="l25-dev-kicker">{en ? "STATE · ARCHIVE OPEN PATH" : "상태 · 아카이브 오픈 경로"}</div>
          <ol className="l25-steps">
            {gates.map((g) => (
              <li key={g.key} className={`l25-step ${g.node}`}>
                <span className="l25-node">
                  {g.node === "resolved" && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.4 6.2 5 8.7 9.6 3.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                  {g.node === "current" && <span className="l25-node-dot" />}
                  {g.node === "locked" && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.4" /><path d="M5.2 7V5.4a2.8 2.8 0 0 1 5.6 0V7" stroke="currentColor" strokeWidth="1.4" /></svg>
                  )}
                </span>
                <div className="l25-step-text">
                  <div className="l25-step-head">
                    <i className="l25-step-idx">{g.idx}</i>
                    <b className="l25-step-name">{g.name}</b>
                    <em className="l25-step-tag">{g.statusLabel}</em>
                  </div>
                  <div className="l25-step-hint">{g.hint}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="l25-legend">
            <span><i className="l25-lg resolved" />{en ? "resolved" : "완료"}</span>
            <span><i className="l25-lg current" />{en ? "current" : "현재"}</span>
            <span><i className="l25-lg pending" />{en ? "pending" : "대기"}</span>
            <span><i className="l25-lg sealed" />{en ? "sealed" : "봉인"}</span>
          </div>
        </div>

        {/* payload + network */}
        <div className="l25-right">
          <div className="l25-panel">
            <div className="l25-panel-head">
              <span>{en ? "TOKEN · PAYLOAD" : "토큰 · payload"}</span>
              <span className="l25-panel-chip">{payload ? "decoded" : "sealed"}</span>
            </div>
            <div className="l25-code">
              {payload ? (
                <>
                  <div className="l25-code-line"><span className="l25-brace">{"{"}</span></div>
                  {payloadEntries.map(([k, v]) => (
                    <div key={k} className="l25-code-line">
                      <span className="l25-kv">
                        <span className="l25-key">{"  "}"{k}": </span>
                        <span className="l25-val">{JSON.stringify(v)},</span>
                      </span>
                      {LEVEL25_CLAIM_NOTE[k] && <span className="l25-note">{LEVEL25_CLAIM_NOTE[k]}</span>}
                    </div>
                  ))}
                  <div className="l25-code-line"><span className="l25-brace">{"}"}</span></div>
                </>
              ) : (
                <div className="l25-code-empty">{en ? "// sealed — run jwt-decode <token> to read the payload" : "// 봉인됨 — jwt-decode <token>로 payload를 열어"}</div>
              )}
            </div>
          </div>

          <div className="l25-panel">
            <div className="l25-panel-head">
              <span>{en ? "NETWORK · LAST RESPONSE" : "네트워크 · 최근 응답"}</span>
            </div>
            <div className="l25-code">
              {netLines.length ? (
                netLines.map((nl, i) => (
                  <div key={i} className="l25-net-line">
                    <span className="l25-net-gutter">{nl.gutter}</span>
                    <span className={`l25-net-text l25-net-${nl.tone}`}>{nl.text}</span>
                  </div>
                ))
              ) : (
                <div className="l25-code-empty">{en ? "// no request sent yet" : "// 아직 보낸 요청이 없어"}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function bolaShortPath(url) {
  return (url || "").replace("/api/v1/challenges/level3_1/actions", "…");
}

function BolaLane({ lane, expandedById, onCopyCurl, onToggleResponse }) {
  const { latest, anomalyEntry } = lane;
  const active = Boolean(latest);
  const isProbe = lane.key === "probe";

  const badgeState = anomalyEntry
    ? "exploit"
    : active
    ? isProbe
      ? "current"
      : "done"
    : "pending";

  const representative = anomalyEntry || latest;
  const statusValue = anomalyEntry ? 200 : latest?.status;
  const statusTone = anomalyEntry ? "leak" : statusValue === 200 ? "ok" : active ? "deny" : "idle";

  const chipSource = anomalyEntry || latest;
  const chips = Array.isArray(chipSource?.preview) ? chipSource.preview : [];

  const expanded = representative ? Boolean(expandedById[representative.id]) : false;

  const counter = (() => {
    if (isProbe) {
      if (!active) {
        return null;
      }
      return {
        text: `×${lane.count} ${lane.count === 1 ? "probe" : "probes"}`,
        sub: anomalyEntry
          ? `leak on ${lane.anomalyId} · ${lane.deniedCount} denied in lane`
          : `0 leak · ${lane.deniedCount} denied so far`,
        tone: anomalyEntry ? "leak" : "deny",
      };
    }
    if (lane.count > 1) {
      return {
        text: `×${lane.count} ${lane.key === "observe" ? "syncs" : "loads"}`,
        sub: "identical 200 — collapsed, latest kept",
        tone: "ok",
      };
    }
    return null;
  })();

  return (
    <div className="bola-lane">
      <div className="bola-lane-rail">
        <div className={`bola-badge bola-badge-${badgeState}`}>{lane.num}</div>
      </div>
      <div className={`bola-card bola-card-${badgeState}`}>
        <div className="bola-card-head">
          <div className="bola-card-title">
            <strong>{lane.title}</strong>
            <span>{lane.role}</span>
          </div>
          <span className="bola-card-trigger">
            trigger: {latest?.trigger || (isProbe ? "mission console" : "button")}
          </span>
        </div>

        {active ? (
          <>
            <div className="bola-req-line">
              <span className={`bola-status bola-status-${statusTone}`}>{statusValue}</span>
              <code>
                <em>{representative?.method || "GET"}</em>{" "}
                {bolaShortPath(representative?.url)}
              </code>
            </div>

            {counter && (
              <div className={`bola-counter bola-counter-${counter.tone}`}>
                <strong>{counter.text}</strong>
                <span>{counter.sub}</span>
              </div>
            )}

            {chips.length > 0 && (
              <div className="bola-chips">
                {chips.map((chip) => (
                  <span key={chip} className={anomalyEntry ? "bola-chip bola-chip-leak" : "bola-chip"}>
                    {chip}
                  </span>
                ))}
                {anomalyEntry && <span className="bola-chip bola-chip-leak">NOT your object</span>}
              </div>
            )}

            {anomalyEntry && (
              <div className="bola-anomaly">
                <div className="bola-anomaly-head">
                  <span className="bola-anomaly-tag">anomaly · 200 leak</span>
                  <code>GET {bolaShortPath(anomalyEntry.url)}</code>
                </div>
                <p>
                  Returned {lane.anomalyOwner || "another operator"}'s capsule with your session
                  token. Ownership never checked server-side — open Raw Response for the relay
                  residue.
                </p>
              </div>
            )}

            <div className="bola-req-headers">
              <span>request headers</span>
              <code>Authorization: Bearer $SESSION_TOKEN</code>
            </div>

            <div className="bola-card-actions">
              <button type="button" className="ghost-button" onClick={() => onToggleResponse(representative.id)}>
                {expanded ? "Hide Raw Response" : "View Raw Response"}
              </button>
              <button type="button" className="ghost-button" onClick={() => onCopyCurl(representative.curl)}>
                Copy as curl
              </button>
            </div>

            {expanded && (
              <pre className="network-response">{JSON.stringify(representative.body, null, 2)}</pre>
            )}
          </>
        ) : (
          <p className="bola-lane-pending">
            {isProbe
              ? "awaiting a neighbor probe from the Mission Console"
              : lane.key === "observe"
              ? "awaiting Sync My Capsules"
              : "awaiting Queue Detail Request"}
          </p>
        )}
      </div>
    </div>
  );
}

function BolaLaneTrace({ entries, capsuleId, expandedById, onCopyCurl, onToggleResponse }) {
  const { lanes, referenceId, rawCount } = useMemo(
    () => groupBolaLanes(entries, capsuleId),
    [entries, capsuleId]
  );

  return (
    <div className="bola-lane-trace">
      <div className="bola-recovered">
        <span className="bola-recovered-label">RECOVERED · carry into mission console</span>
        <div className="bola-recovered-items">
          <div className="bola-recovered-item">
            <span>reference_id</span>
            <strong>{referenceId || "sync list first"}</strong>
            <small>from list · lane 01</small>
          </div>
          <div className="bola-recovered-item">
            <span>authorization</span>
            <strong>Bearer $SESSION_TOKEN</strong>
            <small>session header</small>
          </div>
          <div className="bola-recovered-item">
            <span>id_pattern</span>
            <strong>{bolaIdPattern(referenceId)}</strong>
            <small>inferred</small>
          </div>
        </div>
      </div>

      <div className="bola-lanes">
        {lanes.map((lane) => (
          <BolaLane
            key={lane.key}
            lane={lane}
            expandedById={expandedById}
            onCopyCurl={onCopyCurl}
            onToggleResponse={onToggleResponse}
          />
        ))}
      </div>

      <div className="bola-raw-footer">
        <span>
          {"▸"} raw chronological log · {rawCount} {rawCount === 1 ? "entry" : "entries"}
        </span>
        <span>{rawCount === 0 ? "awaiting capture" : "collapsed"}</span>
      </div>
    </div>
  );
}

function NetworkTracePanel({
  probe,
  disabled,
  busy,
  result,
  entries,
  capsuleId,
  auditSelectorFields,
  auditSelectorDraft,
  expandedById,
  onSync,
  onOpenCapsule,
  onCopyCurl,
  onAuditSelectorDraftChange,
  onToggleResponse,
}) {
  if (!probe) {
    return null;
  }

  const probeActions = Array.isArray(probe.actions) && probe.actions.length > 0 ? probe.actions : null;

  return (
    <section className="network-trace-panel">
      <div className="section-heading">
        <span>NETWORK TRACE</span>
        <strong>{busy ? "syncing" : probe.status}</strong>
      </div>
      <p>{probe.caption}</p>
      <div className="network-trace-actions">
        {probeActions ? (
          probeActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={action.variant === "ghost" ? "ghost-button" : undefined}
              onClick={() => onSync(action.id)}
              disabled={disabled || busy}
            >
              {action.label}
            </button>
          ))
        ) : (
          <button type="button" onClick={() => onSync()} disabled={disabled || busy}>
            {probe.label}
          </button>
        )}
        {!probeActions && probe.secondaryLabel && (
          <button type="button" className="ghost-button" onClick={onOpenCapsule} disabled={disabled || busy || !capsuleId}>
            {probe.secondaryLabel}
          </button>
        )}
        {result && (
          <span className={`network-trace-result ${result.ok ? "ok" : "fail"}`}>
            {result.message}
          </span>
        )}
      </div>

      {auditSelectorFields?.length > 0 && (
        <div className="network-selector-board">
          <div className="network-selector-board-title">
            <span>AUDIT SELECTOR</span>
            <strong>{auditSelectorFields.length} keys required</strong>
          </div>
          <div className="network-selector-slots">
            {auditSelectorFields.map((field) => (
              <label key={field} className="network-selector-slot">
                <span>{field}</span>
                <input
                  type="text"
                  value={auditSelectorDraft?.[field] || ""}
                  placeholder="pending"
                  spellCheck={false}
                  onChange={(event) => onAuditSelectorDraftChange(field, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {probe.layout === "lanes" ? (
        <BolaLaneTrace
          entries={entries}
          capsuleId={capsuleId}
          expandedById={expandedById}
          onCopyCurl={onCopyCurl}
          onToggleResponse={onToggleResponse}
        />
      ) : (
        <div className="network-trace-list">
          {entries.length === 0 ? (
            <p className="network-trace-empty">{probe.emptyText || "No captured requests yet."}</p>
          ) : (
            entries.map((entry) => {
            const expanded = Boolean(expandedById[entry.id]);
            return (
              <article key={entry.id} className="network-trace-entry">
                <div className="network-trace-title">
                  <strong>{entry.title}</strong>
                  <span>trigger: {entry.trigger}</span>
                </div>
                <div className="network-trace-entry-top">
                  <span className="network-status">[{entry.status}]</span>
                  <strong>{entry.method}</strong>
                  <code>{entry.url}</code>
                </div>
                <div className="network-preview">
                  {entry.preview.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
                {entry.requestHeaders?.length > 0 && (
                  <div className="network-request-headers">
                    <span>REQUEST HEADERS</span>
                    {entry.requestHeaders.map((header) => (
                      <code key={header}>{header}</code>
                    ))}
                  </div>
                )}
                {entry.routeCurls?.length > 0 && (
                  <div className="network-route-candidates">
                    <span>ROUTE CANDIDATES</span>
                    {entry.routeCurls.map((candidate) => (
                      <div key={candidate.label} className="network-route-candidate">
                        <div>
                          <strong>{candidate.label}</strong>
                          <small>{candidate.note}</small>
                        </div>
                        <button type="button" className="ghost-button" onClick={() => onCopyCurl(candidate.curl)}>
                          Stage endpoint
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="network-trace-entry-actions">
                  <button type="button" className="ghost-button" onClick={() => onToggleResponse(entry.id)}>
                    {expanded ? "Hide Raw Response" : "View Raw Response"}
                  </button>
                  {!entry.suppressCurlButton && (
                    <button type="button" className="ghost-button" onClick={() => onCopyCurl(entry.curl)}>
                      {traceCurlButtonLabel(entry)}
                    </button>
                  )}
                </div>
                {expanded && (
                  <pre className="network-response">{JSON.stringify(entry.body, null, 2)}</pre>
                )}
              </article>
            );
          })
          )}
        </div>
      )}
    </section>
  );
}

function MiniNetworkMap({ challenges, currentId, activeId, onSelectNode }) {
  return (
    <section className="mini-network-map">
      <div className="section-heading">
        <span>NETWORK MAP</span>
        <strong>Node chain</strong>
      </div>
      <div className="node-strip">
        {challenges.map((challenge, index) => {
          const isCurrent = challenge.id === currentId;
          const isActive = challenge.id === activeId;
          const solved = challenge.status?.defense === "solved";
          const locked = challenge.status?.attack === "locked";
          const canSelect = !isCurrent && !locked && (solved || isActive);
          const nodeLabel = `${String(index + 1).padStart(2, "0")} ${challenge.title}`;
          return (
            <button
              type="button"
              key={challenge.id}
              className={`map-node ${isCurrent ? "current" : ""} ${isActive ? "active" : ""} ${
                solved ? "solved" : ""
              } ${locked ? "locked" : ""} ${canSelect ? "selectable" : ""}`}
              title={challenge.title}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={
                locked
                  ? `${nodeLabel}, locked`
                  : solved
                    ? `${nodeLabel}, completed`
                    : `${nodeLabel}, available`
              }
              disabled={!canSelect}
              onClick={() => onSelectNode(challenge.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MissionConsole({
  disabled,
  prompt,
  placeholder,
  onExec,
  logs,
  command,
  setCommand,
  busy,
  helpText,
  helpDefaultOpen = false,
  starter,
}) {
  const outputRef = useRef(null);
  const starterCommands = Array.isArray(starter?.commands) ? starter.commands : [];
  // Staged TRY FIRST: a chip carrying `revealAfter` only appears once the player has
  // actually run a command containing that marker. Chips without `revealAfter` always
  // show, so other levels are unaffected.
  const executedCommandText = (Array.isArray(logs) ? logs : [])
    .filter((entry) => entry?.type === "command")
    .map((entry) => entry?.text || "")
    .join("\n");
  const isStarterRevealed = (item) => {
    const marker = item && typeof item === "object" ? item.revealAfter : undefined;
    return !marker || executedCommandText.includes(marker);
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled || busy || !command.trim()) {
      return;
    }
    await onExec(command.trim());
  };

  return (
    <section className="mission-console">
      <div className="section-heading">
        <span>MISSION CONSOLE</span>
        <strong>{busy ? "running" : disabled ? "standby" : "online"}</strong>
      </div>
      {starterCommands.length > 0 && (
        <div className="mission-console-starter">
          <div>
            <span>{starter?.label || "TRY FIRST"}</span>
            {starter?.text && <p>{starter.text}</p>}
          </div>
          <div className="starter-command-list">
            {starterCommands.map((item, idx) => {
              const commandText = typeof item === "string" ? item : item.command;
              if (!commandText || !isStarterRevealed(item)) {
                return null;
              }
              return (
                <button
                  key={item?.id || `${commandText}-${idx}`}
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => setCommand(commandText)}
                >
                  <code>{commandText}</code>
                  {item.note && <span>{item.note}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {helpText && (
        <details className="mission-console-help" open={helpDefaultOpen}>
          <summary>SUPPORTED SYNTAX</summary>
          <pre>{helpText}</pre>
        </details>
      )}
      <div ref={outputRef} className="campaign-terminal-output">
        {logs.length === 0 ? (
          <p className="terminal-muted">Awaiting command uplink.</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className={`terminal-entry ${entry.type}`}>
              <pre>{entry.text}</pre>
            </div>
          ))
        )}
      </div>
      <form className="campaign-command-row" onSubmit={handleSubmit}>
        <span>{prompt}</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          disabled={disabled || busy}
          placeholder={disabled ? "Briefing lock active" : placeholder || "enter mission command..."}
        />
        <button disabled={disabled || busy || !command.trim()}>Run</button>
      </form>
    </section>
  );
}

function EvidenceSubmit({ disabled, value, onChange, onSubmit, result, solved }) {
  return (
    <section className="campaign-submit-panel">
      <div className="section-heading">
        <span>EVIDENCE SHARD</span>
        <strong>{solved ? "recovered" : "required"}</strong>
      </div>
      <div className="campaign-submit-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || solved}
          placeholder="FLAG{...}"
        />
        <button onClick={onSubmit} disabled={disabled || solved || !value.trim()}>
          Submit Evidence
        </button>
      </div>
      {result && (
        <p className={`campaign-result ${result.correct ? "ok" : "fail"}`}>{result.message}</p>
      )}
    </section>
  );
}

function hasLevel12SignalDump(logs) {
  // The board opens however the player reaches the auth dump (-d, -b all, or any
  // grep). It is NOT the gate — Evidence Reasoning is. So no command is forced:
  // experts can `-b all` straight to the board; the reasoning step still guards
  // the clear. (See handleSubmitEvidence / level12ReasoningReady.)
  const output = logs
    .filter((entry) => entry.type === "output")
    .map((entry) => entry.text)
    .join("\n");
  return /FLAG\{/.test(output) && /AuthService|AEGIS_FALSE_POSITIVE_A1|FLAG-shaped/.test(output);
}

const COURIER_TRIAGE_HEADER_RE = /^(?:<\s*)?(X-[\w-]+|Server-Timing):\s*(.+?)\s*$/i;
const COURIER_TICKET_SHAPED_RE = /^FLAG\{.*\}$/;

// Parse the Courier/Trace headers out of a `curl -i` (or -v) track response body.
function parseCourierSnapshot(stdout) {
  if (!stdout || !/X-Courier-|X-Trace-Id/i.test(stdout)) {
    return null;
  }
  const snapshot = {};
  for (const rawLine of stdout.split(/\r?\n/)) {
    const match = rawLine.match(COURIER_TRIAGE_HEADER_RE);
    if (match) {
      snapshot[match[1]] = match[2].trim();
    }
  }
  return Object.keys(snapshot).length ? snapshot : null;
}

// The real routing ticket is the one header that is BOTH stable across the two
// snapshots AND ticket-shaped (FLAG{...}). Rotating decoys change every call; stable
// metadata (edge-node, timing) is not FLAG-shaped. Derived from the player's own live
// captures, so the answer never sits in the story bundle / DOM.
function courierCorrectKey(snapA, snapB) {
  if (!snapA || !snapB) {
    return "";
  }
  const keys = new Set([...Object.keys(snapA), ...Object.keys(snapB)]);
  for (const key of keys) {
    if (snapA[key] && snapA[key] === snapB[key] && COURIER_TICKET_SHAPED_RE.test(snapA[key])) {
      return key;
    }
  }
  return "";
}

// 2-3 AUDIENCE DRIFT — Postman-style Capsule Router (replaces the terminal for this node).
function decodeCapsule(raw) {
  try {
    const parts = (raw || "").trim().split(".");
    if (parts.length < 2) throw new Error("not a token");
    const b64 = (s) => {
      let t = s.replace(/-/g, "+").replace(/_/g, "/");
      while (t.length % 4) t += "=";
      return atob(t);
    };
    return { header: JSON.parse(b64(parts[0])), payload: JSON.parse(b64(parts[1])) };
  } catch (err) {
    return { error: "decode failed — not a valid capsule token" };
  }
}

function capsuleClaims(token) {
  const d = decodeCapsule(token);
  if (!d || d.error) return null;
  const p = d.payload || {};
  let expOk = true;
  if (p.exp) {
    const t = Date.parse(String(p.exp).replace(" ", "T"));
    if (!Number.isNaN(t)) expOk = t > Date.now();
  }
  return { aud: p.aud, scope: p.scope, exp: p.exp, expOk };
}

// 2-3 Audience Drift — redesigned Capsule Router (checks observed + rejection ledger).
function RequestForge({ attack, forge, token, onEvidence, solved, disabled, locale }) {
  const wallet = Array.isArray(attack?.capsuleWallet) ? attack.capsuleWallet : [];
  const routes = Array.isArray(attack?.routeRegistry) ? attack.routeRegistry : [];
  const labels = forge || {};
  const [decodedIds, setDecodedIds] = useState({});
  const [loadedId, setLoadedId] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [ledger, setLedger] = useState([]);
  const [seen, setSeen] = useState({ sig: true, exp: false, scope: false });
  const [busy, setBusy] = useState(false);
  const zoneRef = useRef(null);

  const loadedCap = wallet.find((c) => c.id === loadedId) || null;
  const canSend = Boolean(loadedCap && selectedPath && !busy && !disabled && !solved);
  const locked = disabled || solved;

  const toggleDecode = (id) => setDecodedIds((m) => ({ ...m, [id]: !m[id] }));

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    const capName = loadedCap.label || loadedCap.id;
    try {
      const data = await apiRequest("/challenges/level2_3/actions/request", {
        method: "POST",
        token,
        body: { path: selectedPath, authorization: `Bearer ${loadedCap.token.trim()}` },
      });
      const localized = localizeStructuredValue(data, locale, "level2_3");
      const status = Number(localized?.status) || 0;
      const body = localized?.response || {};
      const reasonKey = body.reason || (status === 401 ? "exp" : status === 403 ? "scope" : "ok");
      let display;
      let kind;
      if (status >= 200 && status < 300 && body.evidenceShard) {
        display = "served despite audience mismatch";
        kind = "flag";
        if (onEvidence) onEvidence(body.evidenceShard);
      } else if (status >= 200 && status < 300) {
        display =
          body.requiredAudience && body.servedTo === body.requiredAudience
            ? "authorized — this token is issued for this endpoint (aud matches)"
            : "served — nothing sensitive here";
        kind = "ok";
      } else if (reasonKey === "exp") {
        display = "token expired (exp)";
        kind = "reject";
      } else if (reasonKey === "scope") {
        display = "scope mismatch — needs archive:read";
        kind = "reject";
      } else {
        display = body.error || "denied";
        kind = "reject";
      }
      setSeen((sv) => ({ ...sv, exp: sv.exp || reasonKey === "exp", scope: sv.scope || reasonKey === "scope" }));
      setLedger((L) => [{ cap: capName, route: selectedPath, code: status || "ERR", display, kind }, ...L].slice(0, 6));
    } catch (error) {
      setLedger((L) => [{ cap: capName, route: selectedPath, code: "ERR", display: error.message || "request failed", kind: "reject" }, ...L].slice(0, 6));
    } finally {
      setBusy(false);
    }
  };

  const showTell = ledger.length >= 2 && !solved;
  const checks = [
    { label: "SIGNATURE", tag: seen.sig ? "observed" : "not yet", on: seen.sig },
    { label: "EXPIRY", tag: seen.exp ? "observed" : "not yet", on: seen.exp },
    { label: "SCOPE", tag: seen.scope ? "observed" : "not yet", on: seen.scope },
    { label: "AUDIENCE", tag: showTell ? "missing" : "not yet", tell: true },
  ];

  return (
    <section className="request-forge ad-forge">

      <div className="ad-zone" ref={zoneRef}>
        <div className="ad-router">
          <div className="ad-panel-head">
            <span>{labels.title || "CAPSULE ROUTER"}</span>
            <strong className={busy ? "busy" : solved ? "ok" : ""}>{busy ? "sending" : solved ? "resolved" : "ready"}</strong>
          </div>
          <p className="ad-router-desc">
            {labels.intro || "Decode a capsule to read its claims, load it, pick a route, and send. Each rejection is logged on the right."}
          </p>

          <div className="ad-capsules">
            {wallet.map((cap) => {
              const dec = decodedIds[cap.id];
              const claims = dec ? capsuleClaims(cap.token) : null;
              const loaded = loadedId === cap.id;
              return (
                <div key={cap.id} className={`ad-capsule ${loaded ? "loaded" : ""}`}>
                  <div className="ad-capsule-head">
                    <div className="ad-capsule-name">
                      <span className="ad-dot" />
                      <strong>{cap.label || cap.id}</strong>
                      {loaded && <span className="ad-loaded">LOADED</span>}
                    </div>
                    <div className="ad-capsule-actions">
                      <button type="button" onClick={() => toggleDecode(cap.id)} disabled={locked}>{dec ? "hide" : "decode"}</button>
                      <button type="button" className="use" onClick={() => setLoadedId(cap.id)} disabled={locked}>use</button>
                    </div>
                  </div>
                  {dec && claims ? (
                    <div className="ad-chips">
                      <span className="ad-chip"><i>aud</i> {claims.aud || "—"}</span>
                      <span className="ad-chip"><i>scope</i> {claims.scope || "—"}</span>
                      <span className={`ad-chip ${claims.expOk ? "" : "bad"}`}><i>exp</i> {claims.expOk ? "valid" : "expired"}</span>
                    </div>
                  ) : (
                    <div className="ad-sealed">claims sealed <span>— decode to read aud / scope / exp</span></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ad-send-bar">
            <div className="ad-registry-label">{labels.registryTitle || "ROUTE REGISTRY"}</div>
            <div className="ad-routes">
              {routes.map((r) => (
                <button key={r.path} type="button" className={selectedPath === r.path ? "sel" : ""} onClick={() => setSelectedPath(r.path)} disabled={locked}>{r.path}</button>
              ))}
            </div>
            <div className="ad-request-line">
              <span className="ad-method">POST</span>
              <span className={`ad-route ${selectedPath ? "set" : ""}`}>{selectedPath || "(pick a route)"}</span>
              <span className="ad-sep" />
              <span className="ad-bearer">Bearer</span>
              <span className={`ad-loaded-label ${loadedCap ? "set" : ""}`}>{loadedCap ? (loadedCap.label || loadedCap.id) : "load a capsule"}</span>
              <button type="button" className="ad-send" onClick={send} disabled={!canSend}>{busy ? "…" : "SEND"}</button>
            </div>
          </div>
        </div>

        <div className="ad-side">
          <div className="ad-checks">
            <div className="ad-side-label">CHECKS OBSERVED</div>
            <div className="ad-checks-list">
              {checks.map((c) => (
                <div key={c.label} className={`ad-check ${c.on ? "on" : ""} ${c.tell && showTell ? "tell" : ""}`}>
                  <span className="ad-check-label">{c.label}</span>
                  <span className="ad-check-tag">{c.tag}</span>
                </div>
              ))}
            </div>
            {showTell && (
              <div className="ad-tell-note">audience is never a rejection reason — it isn't bound. Drift a capsule whose scope/exp fit.</div>
            )}
          </div>

          <div className="ad-ledger">
            <div className="ad-side-label">REJECTION LEDGER {ledger.length > 0 && <em>{ledger.length} logged</em>}</div>
            {ledger.length === 0 ? (
              <p className="ad-ledger-empty">no sends yet. try each capsule against /archive/vault.</p>
            ) : (
              <div className="ad-ledger-rows">
                {ledger.map((row, i) => (
                  <div key={i} className={`ad-ledger-row ${row.kind}`}>
                    <div className="ad-ledger-top"><span className="route">{row.route}</span><span className="code">HTTP {row.code}{row.kind === "flag" ? " · ANOMALY" : ""}</span></div>
                    <div className="ad-ledger-reason">{row.cap} · {row.display}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourierTriage({
  triage,
  snapshots,
  correctKey,
  pinnedKey,
  onPin,
  reasoning,
  selectedReasonIds = [],
  onToggleReason,
  reasoningReady = true,
  solved,
  disabled,
}) {
  if (!triage) {
    return null;
  }
  const snapA = snapshots[snapshots.length - 2] || null;
  const snapB = snapshots[snapshots.length - 1] || null;
  const active = Boolean(snapA && snapB) || solved;
  const cols = triage.columns || {};
  const stateLabels = triage.stateLabels || {};
  const keys = active
    ? [...new Set([...(snapA ? Object.keys(snapA) : []), ...(snapB ? Object.keys(snapB) : [])])]
    : [];

  return (
    <section className={`signal-board-panel courier-triage ${active ? "active" : "locked"}`}>
      <div className="section-heading">
        <span>{triage.title}</span>
        <strong>{active ? triage.activeStatus : triage.lockedStatus}</strong>
      </div>
      {!active ? (
        <p className="signal-board-intro">
          {snapshots.length === 1 ? triage.needSecondText : triage.lockedText}
        </p>
      ) : (
        <>
          <p className="signal-board-intro">{triage.intro}</p>
          <table className="courier-triage-table">
            <thead>
              <tr>
                <th>{cols.header || "HEADER"}</th>
                <th>{cols.snapA || "SNAPSHOT A"}</th>
                <th>{cols.snapB || "SNAPSHOT B"}</th>
                <th>{cols.state || "STATE"}</th>
                <th aria-label="pin" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const a = snapA?.[key] ?? "";
                const b = snapB?.[key] ?? "";
                const stable = Boolean(a && b && a === b);
                const state = !a || !b
                  ? stateLabels.missing || "—"
                  : stable
                  ? stateLabels.stable || "stable"
                  : stateLabels.changed || "changed";
                const isPinned = pinnedKey === key;
                const isAnswer = solved && key === correctKey;
                return (
                  <tr
                    key={key}
                    className={`${stable ? "stable" : "changed"} ${isPinned ? "pinned" : ""} ${
                      isAnswer ? "answer" : ""
                    }`}
                  >
                    <td className="triage-key">{key}</td>
                    <td>
                      <code>{a || "—"}</code>
                    </td>
                    <td>
                      <code>{b || "—"}</code>
                    </td>
                    <td className="triage-state">{state}</td>
                    <td>
                      <button
                        type="button"
                        className="triage-pin"
                        onClick={() => onPin(key, b || a)}
                        disabled={disabled || solved}
                      >
                        {isPinned ? "pinned" : triage.pinLabel || "pin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pinnedKey && !solved && <span className="signal-staged">{triage.pinnedLabel}</span>}
          {!solved && onToggleReason && reasoning.length > 0 && (
            <div className="signal-reasoning signal-reasoning-gate">
              <div className="section-heading">
                <span>{triage.reasoningTitle}</span>
                <strong className={reasoningReady ? "ready" : ""}>
                  {reasoningReady ? "ready to submit" : "select the reasons"}
                </strong>
              </div>
              <ul>
                {reasoning.map((item) => {
                  const picked = selectedReasonIds.includes(item.id);
                  return (
                    <li key={item.id} className={picked ? "picked" : ""}>
                      <button
                        type="button"
                        className="reason-toggle"
                        onClick={() => onToggleReason(item.id)}
                        disabled={disabled}
                      >
                        <span>{picked ? "■" : "□"}</span>
                        {item.text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {solved && reasoning.length > 0 && (
            <div className="signal-reasoning">
              <div className="section-heading">
                <span>{triage.reasoningTitle}</span>
                <strong>resolved</strong>
              </div>
              <ul>
                {reasoning.map((item) => (
                  <li key={item.id} className={item.correct ? "trusted" : "decoy"}>
                    <span>{item.correct ? "OK" : "--"}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Level12SignalBoard({
  story,
  logs,
  value,
  onSelectCandidate,
  solved,
  result,
  disabled,
  selectedReasonIds = [],
  onToggleReason,
  reasoningReady = true,
}) {
  const board = story.signalBoard;
  const [selectedId, setSelectedId] = useState("");
  const [revealedIds, setRevealedIds] = useState([]);
  const active = Boolean(board) && (hasLevel12SignalDump(logs) || solved || result?.correct);
  const candidates = board?.candidates || [];
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  const staged = selected && !solved;
  const labels = board?.metaLabels || {};
  const selectedRevealed = Boolean(
    selected && (solved || result?.correct || revealedIds.includes(selected.id))
  );

  useEffect(() => {
    setSelectedId("");
    setRevealedIds([]);
  }, [story.challengeId]);

  useEffect(() => {
    if (!result || result.correct || result.gate || !value) {
      return;
    }
    const submitted = candidates.find((candidate) => candidate.value === value.trim());
    if (!submitted) {
      return;
    }
    setRevealedIds((prev) => (prev.includes(submitted.id) ? prev : [...prev, submitted.id]));
  }, [candidates, result, value]);

  if (!board) {
    return null;
  }

  const handleSelect = (candidate) => {
    setSelectedId(candidate.id);
    if (!solved) {
      onSelectCandidate(candidate.value);
    }
  };

  return (
    <section className={`signal-board-panel ${active ? "active" : "locked"}`}>
      <div className="section-heading">
        <span>{board.title}</span>
        <strong>{active ? board.activeStatus : board.lockedStatus}</strong>
      </div>
      {!active ? (
        <p className="signal-board-intro">{board.lockedText}</p>
      ) : (
        <>
          <p className="signal-board-intro">{board.intro}</p>
          <div className="signal-board-layout">
            <div className="signal-card-grid">
              {candidates.map((candidate) => {
                const isSelected = selectedId === candidate.id;
                const isRecovered = solved && candidate.correct;
                return (
                  <button
                    type="button"
                    key={candidate.id}
                    className={`signal-card ${isSelected ? "selected" : ""} ${
                      isRecovered ? "recovered" : ""
                    }`}
                    onClick={() => handleSelect(candidate)}
                    disabled={disabled && !solved}
                  >
                    <span>{candidate.tag}</span>
                    <code>{candidate.value}</code>
                    <small>{candidate.surface}</small>
                  </button>
                );
              })}
            </div>
            <aside className="signal-inspector">
              <div className="section-heading">
                <span>{board.inspectorTitle}</span>
                <strong>{selected ? selected.tag : "standby"}</strong>
              </div>
              {selected ? (
                <>
                  <code>{selected.value}</code>
                  <p>{selectedRevealed ? selected.verdict : board.inspectorPending}</p>
                  <dl>
                    <div>
                      <dt>{labels.trace || "trace"}</dt>
                      <dd>{selected.trace}</dd>
                    </div>
                    <div>
                      <dt>{labels.phase || "phase"}</dt>
                      <dd>{selected.phase}</dd>
                    </div>
                    {selectedRevealed && (
                      <>
                        <div>
                          <dt>{labels.source || "source"}</dt>
                          <dd>{selected.source}</dd>
                        </div>
                        <div>
                          <dt>{labels.status || "status"}</dt>
                          <dd>{selected.status}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  {staged && <span className="signal-staged">{board.selectedLabel}</span>}
                </>
              ) : (
                <p>{board.inspectorEmpty}</p>
              )}
            </aside>
          </div>
          {!solved && staged && onToggleReason && board.reasoning?.length > 0 && (
            <div className="signal-reasoning signal-reasoning-gate">
              <div className="section-heading">
                <span>{board.reasoningTitle}</span>
                <strong className={reasoningReady ? "ready" : ""}>
                  {reasoningReady ? "ready to submit" : "select the reasons"}
                </strong>
              </div>
              <ul>
                {board.reasoning.map((item) => {
                  const picked = selectedReasonIds.includes(item.id);
                  return (
                    <li key={item.id} className={picked ? "picked" : ""}>
                      <button
                        type="button"
                        className="reason-toggle"
                        onClick={() => onToggleReason(item.id)}
                        disabled={disabled}
                      >
                        <span>{picked ? "■" : "□"}</span>
                        {item.text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {solved && board.reasoning?.length > 0 && (
            <div className="signal-reasoning">
              <div className="section-heading">
                <span>{board.reasoningTitle}</span>
                <strong>resolved</strong>
              </div>
              <ul>
                {board.reasoning.map((item) => (
                  <li key={item.text} className={item.correct ? "trusted" : "decoy"}>
                    <span>{item.correct ? "OK" : "--"}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function hasFragmentBoardDump(logs, board) {
  const output = logs
    .filter((entry) => entry.type === "output")
    .map((entry) => entry.text)
    .join("\n");
  const unlockTerms = board?.unlockTerms;
  if (Array.isArray(unlockTerms) && unlockTerms.length > 0) {
    return unlockTerms.every((term) => output.includes(term));
  }
  return /shardId=|part\[\d+\/\d+\]|fragment/i.test(output);
}

function hasCommitVerifierEvidence(logs, board) {
  if (!board?.commitVerifier) {
    return true;
  }
  const commandNeedles = board.commitCommandTerms || ["commit", "cmt-", "accepted", "commitverifier"];
  const outputNeedles = board.commitUnlockTerms || ["CommitVerifier", "result=accepted"];
  let activeCommandMatches = false;
  let activeOutput = "";

  for (const entry of logs) {
    if (entry.type === "command") {
      const command = entry.text.toLowerCase();
      activeCommandMatches = commandNeedles.some((term) =>
        command.includes(String(term).toLowerCase())
      );
      activeOutput = "";
      continue;
    }
    if (!activeCommandMatches || entry.type !== "output") {
      continue;
    }
    activeOutput += `\n${entry.text}`;
    const matched = outputNeedles.every((term) => activeOutput.includes(term));
    if (matched) {
      return true;
    }
  }

  return false;
}

function Level13FragmentBoard({
  story,
  logs,
  onStageEvidence,
  solved,
  result,
  disabled,
  selectedReasonIds = [],
  onToggleReason,
  reasoningReady = true,
}) {
  const board = story.fragmentBoard;
  const [selectedCardId, setSelectedCardId] = useState("");
  const [slotCards, setSlotCards] = useState({});
  const [boardResult, setBoardResult] = useState(null);
  const [staged, setStaged] = useState(false);
  const commitVerified =
    Boolean(board) && (!board.commitVerifier || hasCommitVerifierEvidence(logs, board) || solved || result?.correct);
  const commitGateReady = !board?.commitVerifier || commitVerified;
  // Boss gate: a board with a commitVerifier (1-4) only opens once the player
  // has verified the committed core trace in the terminal — so `-b all` shows
  // the log but does NOT hand over the cards until commit verification is done.
  const active =
    Boolean(board) &&
    ((hasFragmentBoardDump(logs, board) && commitGateReady) || solved || result?.correct);
  const cards = board?.cards || [];
  const slots = board?.slots || [];
  const hideCardPartLabel = Boolean(board?.hideCardPartLabel);
  const hideInspectorPart = Boolean(board?.hideInspectorPart);
  const stageAfterReasoning = Boolean(board?.stageAfterReasoning);
  const requiredReasonCount = board?.requiredReasonCount || 0;
  const revealReasonVerdicts = !onToggleReason || solved || result?.correct;
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const selectedCard = cardsById.get(selectedCardId);
  const assembled = slots.map((slot) => cardsById.get(slotCards[slot.index])?.value || "").join("");
  const allSlotsFilled = slots.length > 0 && slots.every((slot) => slotCards[slot.index]);
  const restored = allSlotsFilled && assembled === board?.expectedValue;

  useEffect(() => {
    setSelectedCardId("");
    setSlotCards({});
    setBoardResult(null);
    setStaged(false);
  }, [story.challengeId]);

  if (!board) {
    return null;
  }

  const evaluateSlots = (nextSlots) => {
    const nextAssembled = slots
      .map((slot) => cardsById.get(nextSlots[slot.index])?.value || "")
      .join("");
    const nextFilled = slots.every((slot) => nextSlots[slot.index]);
    if (!nextFilled) {
      setBoardResult({ ok: null, message: board.incomplete });
      setStaged(false);
      return;
    }
    if (nextAssembled === board.expectedValue) {
      setBoardResult({
        ok: true,
        message: commitGateReady ? board.restored : board.restoredNeedsCommit || board.restored,
      });
      return;
    }
    setBoardResult({ ok: false, message: board.mismatch });
    setStaged(false);
  };

  const placeCard = (slotIndex, cardId = selectedCardId) => {
    if (disabled || !cardId) {
      return;
    }
    const card = cardsById.get(cardId);
    if (!card?.part) {
      setBoardResult({ ok: false, message: board.cannotPlace });
      return;
    }
    setSlotCards((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([, assignedCardId]) => assignedCardId !== cardId)
      );
      next[slotIndex] = cardId;
      evaluateSlots(next);
      return next;
    });
  };

  const clearSlot = (slotIndex) => {
    if (disabled) {
      return;
    }
    setSlotCards((prev) => {
      const next = { ...prev };
      delete next[slotIndex];
      setBoardResult({ ok: null, message: board.incomplete });
      setStaged(false);
      return next;
    });
  };

  const handleStageEvidence = () => {
    if (!restored || solved) {
      return;
    }
    if (!commitGateReady) {
      setBoardResult({ ok: false, message: board.commitGate || board.restoredNeedsCommit });
      return;
    }
    if (stageAfterReasoning && !reasoningReady) {
      setBoardResult({ ok: false, message: board.reasoningGate });
      return;
    }
    onStageEvidence(assembled);
    setStaged(true);
  };

  return (
    <section className={`fragment-board-panel ${active ? "active" : "locked"}`}>
      <div className="section-heading">
        <span>{board.title}</span>
        <strong>{active ? board.activeStatus : board.lockedStatus}</strong>
      </div>
      {!active ? (
        <>
          <p className="fragment-board-intro">{board.lockedText}</p>
          {board.lockedSlots && (
            <div className="fragment-slot-grid fragment-slot-grid-locked">
              {board.lockedSlots.map((slot) => (
                <div key={slot.label} className="fragment-slot locked-placeholder">
                  <span>{slot.label}</span>
                  <code>{slot.value || "locked"}</code>
                  <small>{slot.note}</small>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="fragment-board-intro">{board.intro}</p>
          <div className="fragment-board-layout">
            <div className="fragment-card-grid">
              {cards.map((card) => {
                const selected = selectedCardId === card.id;
                const placed = Object.values(slotCards).includes(card.id);
                const placedSlot = placed
                  ? slots.find((slot) => slotCards[slot.index] === card.id)
                  : null;
                return (
                  <button
                    type="button"
                    key={card.id}
                    className={`fragment-card ${selected ? "selected" : ""} ${placed ? "placed" : ""}`}
                    onClick={() => setSelectedCardId(card.id)}
                    draggable={!disabled}
                    onDragStart={(event) => {
                      setSelectedCardId(card.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", card.id);
                    }}
                    disabled={disabled && !solved}
                  >
                    <span>{card.shardId}</span>
                    <strong>
                      {card.part
                        ? hideCardPartLabel
                          ? board.cardPartLabel || "fragment"
                          : `part ${card.part}/${card.total}`
                        : "marker"}
                    </strong>
                    <code>{card.value}</code>
                    <small>{card.tag}</small>
                    {placedSlot && (
                      <em className="fragment-card-used">▣ {placedSlot.label}</em>
                    )}
                  </button>
                );
              })}
            </div>
            <aside className="fragment-inspector">
              <div className="section-heading">
                <span>{board.inspectorTitle}</span>
                <strong>{selectedCard ? selectedCard.shardId : "standby"}</strong>
              </div>
              {selectedCard ? (
                <>
                  <code>{selectedCard.value}</code>
                  {!board.hideCardNotes && <p>{selectedCard.note}</p>}
                  <dl>
                    <div>
                      <dt>tag</dt>
                      <dd>{selectedCard.tag}</dd>
                    </div>
                    {!hideInspectorPart && (
                      <div>
                        <dt>part</dt>
                        <dd>{selectedCard.part ? `${selectedCard.part}/${selectedCard.total}` : "none"}</dd>
                      </div>
                    )}
                    <div>
                      <dt>trace</dt>
                      <dd>{selectedCard.trace || "none"}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p>{board.inspectorEmpty}</p>
              )}
            </aside>
          </div>
          <div className="fragment-stitch-panel">
            <div className="section-heading">
              <span>STITCH SLOTS</span>
              <strong>{restored ? "restored" : allSlotsFilled ? "mismatch" : "assembling"}</strong>
            </div>
            <div className="fragment-slot-grid">
              {slots.map((slot) => {
                const card = cardsById.get(slotCards[slot.index]);
                return (
                  <button
                    type="button"
                    key={slot.index}
                    className={`fragment-slot ${card ? "filled" : ""}`}
                    onClick={() => (card && selectedCardId === card.id ? clearSlot(slot.index) : placeCard(slot.index))}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      placeCard(slot.index, event.dataTransfer.getData("text/plain") || selectedCardId);
                    }}
                    disabled={disabled && !solved}
                  >
                    <span>{slot.label}</span>
                    <code>{card?.value || "drop fragment"}</code>
                    <small>{card ? card.shardId : board.selectCard}</small>
                  </button>
                );
              })}
            </div>
            <div className="fragment-assembled-row">
              <code>{assembled || "FLAG{...}"}</code>
              {!stageAfterReasoning && (
                <button type="button" onClick={handleStageEvidence} disabled={!restored || solved || !commitGateReady}>
                  {staged ? board.stagedLabel : board.stageLabel}
                </button>
              )}
            </div>
            {board.commitVerifier && (restored || commitVerified || solved || result?.correct) && (
              <div className={`fragment-commit-panel ${commitVerified ? "verified" : "pending"}`}>
                <div className="section-heading">
                  <span>{board.commitVerifier.title || "COMMIT VERIFIER"}</span>
                  <strong>{commitVerified ? board.commitVerifier.result : board.commitVerifier.pendingStatus || "pending"}</strong>
                </div>
                {!commitVerified ? (
                  <p>{board.commitVerifier.pendingText || board.commitGate}</p>
                ) : (
                  <dl>
                    <div>
                      <dt>trace</dt>
                      <dd>{board.commitVerifier.trace}</dd>
                    </div>
                    <div>
                      <dt>shardId</dt>
                      <dd>{board.commitVerifier.shardId}</dd>
                    </div>
                    <div>
                      <dt>commitRef</dt>
                      <dd>{board.commitVerifier.commitRef}</dd>
                    </div>
                    <div>
                      <dt>parts</dt>
                      <dd>{board.commitVerifier.parts}</dd>
                    </div>
                  </dl>
                )}
              </div>
            )}
            {boardResult && (
              <p className={`campaign-result ${boardResult.ok ? "ok" : boardResult.ok === false ? "fail" : ""}`}>
                {boardResult.message}
              </p>
            )}
          </div>
          {(solved ||
            result?.correct ||
            result?.gate ||
            (onToggleReason && restored && commitGateReady)) &&
            board.reasoning?.length > 0 && (
            <div className="fragment-reasoning">
              <div className="section-heading">
                <span>{board.reasoningTitle}</span>
                <strong>
                  {onToggleReason
                    ? revealReasonVerdicts
                      ? "resolved"
                      : `${selectedReasonIds.length}/${requiredReasonCount} selected`
                    : "resolved"}
                </strong>
              </div>
              {board.reasoningPrompt && <p>{board.reasoningPrompt}</p>}
              <ul>
                {board.reasoning.map((item) => (
                  <li
                    key={item.id || item.text}
                    className={`${revealReasonVerdicts ? (item.correct ? "trusted" : "decoy") : ""} ${
                      selectedReasonIds.includes(item.id) ? "selected" : ""
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!onToggleReason || solved}
                      onClick={() => onToggleReason?.(item.id)}
                    >
                      <span>
                        {revealReasonVerdicts
                          ? item.correct
                            ? "OK"
                            : "--"
                          : selectedReasonIds.includes(item.id)
                            ? "ON"
                            : "--"}
                      </span>
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
              {onToggleReason && !reasoningReady && (
                <p className="fragment-reasoning-gate">{board.reasoningGate}</p>
              )}
              {stageAfterReasoning && (
                <div className="fragment-assembled-row fragment-assembled-row-final">
                  <code>{assembled || "FLAG{...}"}</code>
                  <button
                    type="button"
                    onClick={handleStageEvidence}
                    disabled={!restored || solved || !commitGateReady || !reasoningReady}
                  >
                    {staged ? board.stagedLabel : board.stageLabel}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MemoryCardContent({ card }) {
  if (!card) {
    return null;
  }

  if (typeof card.content === "string") {
    return <pre>{card.content}</pre>;
  }

  if (card.content && typeof card.content === "object") {
    return <pre>{JSON.stringify(card.content, null, 2)}</pre>;
  }

  return <pre>{String(card.value || "")}</pre>;
}

function Level41MemoryVault({
  phase,
  evidenceSolved,
  evidenceResult,
  onRestoreEvidence,
  selectedPolicyIds,
  onTogglePolicy,
  onSubmitPolicy,
  patchResult,
  busy,
  locale,
}) {
  const puzzle = useMemo(() => getLevel41MemoryPuzzle(locale), [locale]);
  const ui = LEVEL4_1_MEMORY_UI[locale === "en" ? "en" : "ko"];
  const cardsById = useMemo(
    () => new Map(puzzle.cards.map((card) => [card.id, card])),
    [puzzle]
  );
  const [revealedIds, setRevealedIds] = useState(() => LEVEL4_1_MEMORY_PUZZLE.initialCards);
  const [selectedCardId, setSelectedCardId] = useState("memory_index");
  const [slotAssignments, setSlotAssignments] = useState({});
  const [memoryResult, setMemoryResult] = useState(null);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dropSlotId, setDropSlotId] = useState(null);
  const revealedCards = puzzle.cards.filter((card) => revealedIds.includes(card.id));
  const selectedCard = cardsById.get(selectedCardId) || revealedCards[0];
  const allSlotsFilled = puzzle.slots.every((slot) => slotAssignments[slot.id]);
  const reconstructionCorrect = puzzle.slots.every((slot) =>
    slot.accepts.includes(slotAssignments[slot.id])
  );
  const restored = evidenceSolved || evidenceResult?.correct;
  const canUseAttackBoard = phase === "ATTACK" && !restored;
  const canSealPolicy = phase === "DEFENSE";
  const policyStatus =
    phase === "MISSION_COMPLETE"
      ? "sealed"
      : canSealPolicy
        ? "seal memory leak"
        : restored
          ? "awaiting containment"
          : "locked";
  const activeHint =
    memoryResult?.message ||
    selectedCard?.note ||
    ui.defaultHint;
  const activeAction =
    selectedCard?.action ||
    ui.defaultAction;
  const activeHintTone = memoryResult?.correct === false ? "fail" : "ok";

  useEffect(() => {
    if (restored) {
      setRevealedIds(puzzle.cards.map((card) => card.id));
    }
  }, [puzzle, restored]);

  const revealCard = useCallback((card) => {
    setSelectedCardId(card.id);
    if (card.unlocks?.length) {
      setRevealedIds((prev) => [...new Set([...prev, ...card.unlocks])]);
    }
    if (card.id === "map_canary") {
      setMemoryResult({
        correct: false,
        message: ui.canaryMessage,
      });
      return;
    }
    if (card.note) {
      setMemoryResult({ correct: true, message: card.note });
      return;
    }
    setMemoryResult(null);
  }, [ui.canaryMessage]);

  const assignCardToSlot = useCallback(
    (slot, cardId) => {
      const card = cardsById.get(cardId);
      if (!card) {
        setMemoryResult({ correct: false, message: ui.selectCardMessage });
        return;
      }

      setSelectedCardId(card.id);
      setSlotAssignments((prev) => ({ ...prev, [slot.id]: card.id }));
      if (slot.id === "secret_residue" && card.id === "map_canary") {
        setMemoryResult({
          correct: false,
          message: ui.slotCanaryMessage,
        });
        return;
      }

      const isCorrect = slot.accepts.includes(card.id);
      setMemoryResult({
        correct: isCorrect,
        message: isCorrect
          ? locale === "en"
            ? `${card.title} pinned to the ${slot.label} slot.`
            : `${slot.label} 슬롯에 ${card.title} 카드를 고정했어.`
          : locale === "en"
            ? `${card.title} does not strongly connect to the ${slot.label} slot. Compare the card context again.`
            : `${card.title} 카드는 ${slot.label} 슬롯과 연결이 약해. 카드의 문맥을 다시 비교해봐.`,
      });
    },
    [cardsById, locale, ui.selectCardMessage, ui.slotCanaryMessage]
  );

  const assignSelectedToSlot = useCallback(
    (slot) => {
      assignCardToSlot(slot, selectedCard?.id);
    },
    [assignCardToSlot, selectedCard]
  );

  const handleCardDragStart = useCallback(
    (event, card) => {
      if (restored) {
        event.preventDefault();
        return;
      }

      revealCard(card);
      setDraggingCardId(card.id);
      setDropSlotId(null);
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("application/x-purple-card-id", card.id);
      event.dataTransfer.setData("text/plain", card.title);
    },
    [restored, revealCard]
  );

  const handleCardDragEnd = useCallback(() => {
    setDraggingCardId(null);
    setDropSlotId(null);
  }, []);

  const handleSlotDragOver = useCallback(
    (event, slot) => {
      if (restored || !draggingCardId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setDropSlotId(slot.id);
    },
    [draggingCardId, restored]
  );

  const handleSlotDragLeave = useCallback((event, slot) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setDropSlotId((current) => (current === slot.id ? null : current));
  }, []);

  const handleSlotDrop = useCallback(
    (event, slot) => {
      if (restored) {
        return;
      }

      event.preventDefault();
      const cardId =
        event.dataTransfer.getData("application/x-purple-card-id") || draggingCardId;
      assignCardToSlot(slot, cardId);
      setDraggingCardId(null);
      setDropSlotId(null);
    },
    [assignCardToSlot, draggingCardId, restored]
  );

  const handleRestore = useCallback(async () => {
    if (restored || !allSlotsFilled) {
      return;
    }

    if (!reconstructionCorrect) {
      setMemoryResult({
        correct: false,
        message: ui.restoreWrong,
      });
      return;
    }

    setMemoryResult({ correct: true, message: ui.restoring });
    await onRestoreEvidence();
  }, [allSlotsFilled, onRestoreEvidence, reconstructionCorrect, restored, ui.restoreWrong, ui.restoring]);

  return (
    <section className="memory-vault-panel">
      <div className="memory-vault-header">
        <div>
          <p className="campaign-kicker">OPERATION 04 // MEMORY VAULT</p>
          <h3>ABSENCE MAP</h3>
          <p>{ui.headerDescription}</p>
        </div>
        <div className="memory-status-grid" aria-label="Memory status">
          <div>
            <span>INDEX CLAIM</span>
            <strong>sourceMap absent</strong>
          </div>
          <div>
            <span>BOARD STATE</span>
            <strong>{restored ? "evidence restored" : `${revealedCards.length}/10 cards`}</strong>
          </div>
          <div>
            <span>HANDSHAKE</span>
            <strong>{restored ? "accepted" : "locked"}</strong>
          </div>
        </div>
      </div>

      <div className="reconstruction-guide">
        <span>{ui.guideLabel}</span>
        <p>{ui.guideText}</p>
      </div>

      <div className="memory-vault-layout">
        <aside className="memory-claim-panel">
          <div className="section-heading">
            <span>AEGIS CLAIM</span>
            <strong>normalized</strong>
          </div>
          <dl>
            <div>
              <dt>public artifact</dt>
              <dd>low exposure</dd>
            </div>
            <div>
              <dt>source map</dt>
              <dd>normalized_absent</dd>
            </div>
            <div>
              <dt>partner secrets</dt>
              <dd>server_only</dd>
            </div>
          </dl>
          <div className="mira-note">
            <span>MIRA</span>
            <p>{ui.miraQuote}</p>
          </div>
        </aside>

        <div className="memory-board">
          <div className="section-heading">
            <span>MEMORY BOARD</span>
            <strong>{canUseAttackBoard ? "inspect" : restored ? "restored" : "locked"}</strong>
          </div>
          <div className="memory-card-grid">
            {revealedCards.map((card) => (
              <button
                type="button"
                key={card.id}
                className={`memory-card ${card.type} ${selectedCardId === card.id ? "selected" : ""} ${
                  draggingCardId === card.id ? "dragging" : ""
                }`}
                draggable={!restored}
                onClick={() => revealCard(card)}
                onDragStart={(event) => handleCardDragStart(event, card)}
                onDragEnd={handleCardDragEnd}
              >
                <span>{card.type}</span>
                <strong>{card.title}</strong>
                <small>{card.summary}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="memory-inspector">
        <div className="section-heading">
          <span>INSPECTOR PANEL</span>
          <strong>{selectedCard?.type || "memory"}</strong>
        </div>
        <div>
          <h4>{selectedCard?.title}</h4>
          <MemoryCardContent card={selectedCard} />
        </div>
      </div>

      <div className={`memory-hint-panel ${activeHintTone}`}>
        <div className="section-heading">
          <span>MIRA HINT</span>
          <strong>{selectedCard?.title || "memory guide"}</strong>
        </div>
        <p>{activeHint}</p>
      </div>

      <div className="memory-next-action">
        <span>{ui.nextActionLabel}</span>
        <strong>{activeAction}</strong>
      </div>

      <div className="evidence-reconstruction">
        <div className="section-heading">
          <span>EVIDENCE RECONSTRUCTION</span>
          <strong>{restored ? "complete" : ui.selectedCard}</strong>
        </div>
        <div className="evidence-slot-grid">
          {puzzle.slots.map((slot) => {
            const assignedCard = cardsById.get(slotAssignments[slot.id]);
            const valid = assignedCard && slot.accepts.includes(assignedCard.id);
            return (
              <button
                type="button"
                key={slot.id}
                className={`evidence-slot ${assignedCard ? "filled" : ""} ${valid ? "valid" : ""} ${
                  draggingCardId ? "drop-ready" : ""
                } ${dropSlotId === slot.id ? "drop-target" : ""}`}
                onClick={() => assignSelectedToSlot(slot)}
                onDragEnter={(event) => handleSlotDragOver(event, slot)}
                onDragOver={(event) => handleSlotDragOver(event, slot)}
                onDragLeave={(event) => handleSlotDragLeave(event, slot)}
                onDrop={(event) => handleSlotDrop(event, slot)}
                disabled={restored}
              >
                <span>{slot.label}</span>
                <strong>{assignedCard?.title || ui.slotFallback}</strong>
                <small>{slot.hint}</small>
              </button>
            );
          })}
        </div>
        <div className="memory-action-row">
          <button onClick={handleRestore} disabled={restored || !allSlotsFilled || busy}>
            {restored ? "Evidence Restored" : "Restore Evidence"}
          </button>
          <code>{restored ? puzzle.evidenceShard : ui.pendingEvidence}</code>
        </div>
        {evidenceResult && (
          <p className={`campaign-result ${evidenceResult.correct ? "ok" : "fail"}`}>
            {evidenceResult.message}
          </p>
        )}
        {restored && (
          <pre className="memory-evidence-json">
{`{
  "ok": true,
    "data": {
      "status": "handshake_accepted",
      "evidenceShard": "${puzzle.evidenceShard}",
      "miraResidue": "partner memory shard restored"
    }
}`}
          </pre>
        )}
      </div>

      <div className={`policy-forge ${canSealPolicy || phase === "MISSION_COMPLETE" ? "active" : ""}`}>
        <div className="section-heading">
          <span>POLICY CARDS</span>
          <strong>{policyStatus}</strong>
        </div>
        <p>{ui.policyIntro}</p>
        <div className="policy-card-grid">
          {puzzle.policyCards.map((card) => {
            const selected = selectedPolicyIds.includes(card.id);
            return (
              <button
                type="button"
                key={card.id}
                className={`policy-card ${selected ? "selected" : ""}`}
                onClick={() => onTogglePolicy(card.id)}
                disabled={!canSealPolicy}
              >
                <span>{card.correct ? "control" : "decoy"}</span>
                <strong>{card.title}</strong>
                <small>{card.text}</small>
              </button>
            );
          })}
        </div>
        <div className="memory-action-row">
          <button onClick={onSubmitPolicy} disabled={!canSealPolicy || busy || selectedPolicyIds.length === 0}>
            Submit Policy Seal
          </button>
          <code>selected: [{selectedPolicyIds.join(", ")}]</code>
        </div>
        {patchResult && (
          <p className={`campaign-result ${patchResult.correct ? "ok" : "fail"}`}>{patchResult.message}</p>
        )}
      </div>
    </section>
  );
}

function Level42KeySlotLab({
  phase,
  evidenceSolved,
  evidenceResult,
  onRestoreEvidence,
  selectedPolicyIds,
  onTogglePolicy,
  onSubmitPolicy,
  patchResult,
  busy,
  locale,
}) {
  const puzzle = useMemo(() => getLevel42KeySlotPuzzle(locale), [locale]);
  const ui = LEVEL4_2_KEY_SLOT_UI[locale === "en" ? "en" : "ko"];
  const cardsById = useMemo(
    () => new Map(puzzle.cards.map((card) => [card.id, card])),
    [puzzle.cards]
  );
  const [revealedIds, setRevealedIds] = useState(() => puzzle.initialCards);
  const [inspectedIds, setInspectedIds] = useState(["key_index"]);
  const [selectedCardId, setSelectedCardId] = useState("key_index");
  const [slotAssignments, setSlotAssignments] = useState({});
  const [labResult, setLabResult] = useState(null);
  const [verificationNotice, setVerificationNotice] = useState(null);
  const [stackVerified, setStackVerified] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dropSlotId, setDropSlotId] = useState(null);
  const [selectedKeySlotId, setSelectedKeySlotId] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState("none");

  const revealedCards = puzzle.cards.filter((card) => revealedIds.includes(card.id));
  const selectedCard = cardsById.get(selectedCardId) || revealedCards[0];
  const selectedKeySlot = puzzle.slotOptions.find(
    (slot) => slot.id === selectedKeySlotId
  );
  const selectedClaim = puzzle.claimOptions.find(
    (claim) => claim.id === selectedClaimId
  );
  const allSlotsFilled = puzzle.slots.every((slot) => slotAssignments[slot.id]);
  const reconstructionCorrect = puzzle.slots.every((slot) =>
    slot.accepts.includes(slotAssignments[slot.id])
  );
  const restored = evidenceSolved || evidenceResult?.correct;
  const canUseAttackBoard = phase === "ATTACK" && !restored;
  const hasInspectedPartnerPass = inspectedIds.includes("partner_pass");
  const hasInspectedJwks = inspectedIds.includes("jwks_slots");
  const canUseKeyWheel = restored || stackVerified;
  const canUseClaimPanel = restored || selectedKeySlotId === "legacy";
  const showFinalEvidencePanel = restored || canUseClaimPanel;
  const canSealPolicy = phase === "DEFENSE";
  const showPolicyForge = restored || canSealPolicy || phase === "MISSION_COMPLETE";
  const policyStatus =
    phase === "MISSION_COMPLETE"
      ? "sealed"
      : canSealPolicy
        ? "seal key memory"
        : restored
          ? "awaiting containment"
          : "locked";
  const activeHint =
    labResult?.message ||
    selectedCard?.note ||
    ui.defaultHint;
  const activeHintTone = labResult?.correct === false ? "fail" : "ok";
  const currentGoal = (() => {
    if (canSealPolicy || phase === "MISSION_COMPLETE") {
      return ui.goals.defense;
    }
    if (restored) {
      return ui.goals.complete;
    }
    if (!hasInspectedPartnerPass) {
      return ui.goals.step1;
    }
    if (!hasInspectedJwks) {
      return ui.goals.step2;
    }
    if (!stackVerified && !allSlotsFilled) {
      return ui.goals.step3;
    }
    if (!stackVerified && !reconstructionCorrect) {
      return ui.goals.step3Retry;
    }
    if (!stackVerified) {
      return ui.goals.openWheel;
    }
    if (!selectedKeySlotId) {
      return ui.goals.pickSlot;
    }
    if (selectedKeySlotId !== "legacy") {
      return ui.goals.findLegacy;
    }
    if (selectedClaim?.kind !== "admin") {
      return ui.goals.pickClaim;
    }
    return ui.goals.restore;
  })();
  const claimPanelLock = (() => {
    if (!canUseKeyWheel || canUseClaimPanel) {
      return null;
    }
    if (selectedKeySlotId === "active") {
      return ui.claimPanelLocks.active;
    }
    if (selectedKeySlotId === "retired") {
      return ui.claimPanelLocks.retired;
    }
    return ui.claimPanelLocks.needSlot;
  })();
  const mutatedPayload = {
    iss: selectedClaimId === "issuer_unknown" ? "unknown.partner" : "purpledroid.partner",
    aud: selectedClaimId === "aud_public" ? "public-client" : "partner-admin",
    sub: "user_1004",
    role: selectedClaimId === "role_admin" ? "admin" : "user",
    scope: selectedClaimId === "scope_admin" ? "partner:admin" : "partner:read",
    exp: selectedClaimId === "exp_expired" ? "expired" : "valid",
  };

  useEffect(() => {
    if (restored) {
      setRevealedIds(puzzle.cards.map((card) => card.id));
      setInspectedIds(puzzle.cards.map((card) => card.id));
      setStackVerified(true);
    }
  }, [puzzle.cards, restored]);

  const revealCard = useCallback((card) => {
    setSelectedCardId(card.id);
    setInspectedIds((prev) => [...new Set([...prev, card.id])]);
    const newUnlockIds = (card.unlocks || []).filter((id) => !revealedIds.includes(id));
    if (card.unlocks?.length) {
      setRevealedIds((prev) => [...new Set([...prev, ...card.unlocks])]);
    }
    if (newUnlockIds.length) {
      const newCardTitles = newUnlockIds
        .map((id) => cardsById.get(id)?.title)
        .filter(Boolean)
        .join(", ");
      setLabResult({
        correct: true,
        message: ui.newCards(newCardTitles),
      });
      return;
    }
    setLabResult(null);
  }, [cardsById, revealedIds, ui]);

  const assignCardToSlot = useCallback(
    (slot, cardId) => {
      const card = cardsById.get(cardId);
      if (!card) {
        setLabResult({ correct: false, message: ui.selectCard });
        return;
      }

      setSelectedCardId(card.id);
      setSlotAssignments((prev) => ({ ...prev, [slot.id]: card.id }));
      setStackVerified(false);
      setSelectedKeySlotId(null);
      setSelectedClaimId("none");
      setVerificationNotice(null);
      const isCorrect = slot.accepts.includes(card.id);
      setLabResult({
        correct: isCorrect,
        message: isCorrect
          ? ui.pinned(slot.label, card.title)
          : ui.weakMatch(card.title, slot.label),
      });
    },
    [cardsById, ui]
  );

  const assignSelectedToSlot = useCallback(
    (slot) => {
      assignCardToSlot(slot, selectedCard?.id);
    },
    [assignCardToSlot, selectedCard]
  );

  const handleCardDragStart = useCallback(
    (event, card) => {
      if (restored) {
        event.preventDefault();
        return;
      }

      revealCard(card);
      setDraggingCardId(card.id);
      setDropSlotId(null);
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("application/x-purple-card-id", card.id);
      event.dataTransfer.setData("text/plain", card.title);
    },
    [restored, revealCard]
  );

  const handleCardDragEnd = useCallback(() => {
    setDraggingCardId(null);
    setDropSlotId(null);
  }, []);

  const handleSlotDragOver = useCallback(
    (event, slot) => {
      if (restored || !draggingCardId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setDropSlotId(slot.id);
    },
    [draggingCardId, restored]
  );

  const handleSlotDragLeave = useCallback((event, slot) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setDropSlotId((current) => (current === slot.id ? null : current));
  }, []);

  const handleSlotDrop = useCallback(
    (event, slot) => {
      if (restored) {
        return;
      }

      event.preventDefault();
      const cardId =
        event.dataTransfer.getData("application/x-purple-card-id") || draggingCardId;
      assignCardToSlot(slot, cardId);
      setDraggingCardId(null);
      setDropSlotId(null);
    },
    [assignCardToSlot, draggingCardId, restored]
  );

  const handleSelectKeySlot = useCallback(
    (slotId) => {
      setSelectedKeySlotId(slotId);
      setVerificationNotice(null);
      const linkedCard = {
        active: "active_slot",
        legacy: "legacy_slot",
        retired: "retired_slot",
      }[slotId];
      if (linkedCard) {
        setRevealedIds((prev) => [...new Set([...prev, linkedCard])]);
      }
      const slot = puzzle.slotOptions.find((item) => item.id === slotId);
      setLabResult({
        correct: slotId === "legacy",
        message:
          slotId === "legacy"
            ? ui.slotLegacy
            : slotId === "active"
              ? ui.slotActive
              : ui.slotRetired,
      });
    },
    [puzzle.slotOptions, ui]
  );

  const handleSelectClaim = useCallback((claimId) => {
    setSelectedClaimId(claimId);
    setVerificationNotice(null);
    if (claimId !== "none") {
      setRevealedIds((prev) => [...new Set([...prev, "claim_mutation", "admin_claim_evidence"])]);
    }
    const claim = puzzle.claimOptions.find((item) => item.id === claimId);
    setLabResult({
      correct: claim?.kind !== "invalid",
      message:
        claim?.kind === "admin"
          ? ui.claimAdmin
          : claim?.kind === "invalid"
            ? ui.claimInvalid
            : ui.claimNeutral,
    });
  }, [puzzle.claimOptions, ui]);

  const handleVerify = useCallback(async () => {
    if (restored) {
      return;
    }

    if (!stackVerified) {
      if (!allSlotsFilled || !reconstructionCorrect) {
        const notice = {
          correct: false,
          message: ui.stackFail,
        };
        setLabResult(notice);
        setVerificationNotice(notice);
        return;
      }

      const notice = {
        correct: true,
        message: ui.stackPass,
      };
      setStackVerified(true);
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (!selectedKeySlotId) {
      const notice = {
        correct: false,
        message: ui.pickSlotNotice,
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedKeySlotId === "active") {
      const notice = {
        correct: false,
        message: ui.activeFail,
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedKeySlotId === "retired") {
      const notice = {
        correct: false,
        message: ui.retiredFail,
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedClaim?.kind === "invalid") {
      const notice = {
        correct: false,
        message: ui.invalidClaimFail,
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedClaim?.kind !== "admin") {
      const notice = {
        correct: false,
        message: ui.userClaimFail,
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    const notice = {
      correct: true,
      message: ui.finalPass,
    };
    setLabResult(notice);
    setVerificationNotice(notice);
    await onRestoreEvidence();
  }, [
    allSlotsFilled,
    onRestoreEvidence,
    reconstructionCorrect,
    restored,
    selectedClaim?.kind,
    selectedKeySlotId,
    stackVerified,
    ui,
  ]);

  return (
    <section className="memory-vault-panel key-slot-lab">
      <div className="memory-vault-header">
        <div>
          <p className="campaign-kicker">OPERATION 04 // MEMORY VAULT</p>
          <h3>KEY MEMORY SLOT</h3>
          <p>
            {ui.headerDescription}
          </p>
        </div>
        <div className="memory-status-grid" aria-label="Key memory status">
          <div>
            <span>SELECTOR</span>
            <strong>{selectedKeySlot?.kid || "unset"}</strong>
          </div>
          <div>
            <span>CLAIM</span>
            <strong>{selectedClaim?.label || "unchanged"}</strong>
          </div>
          <div>
            <span>AUDIT</span>
            <strong>{restored ? "unlocked" : "locked"}</strong>
          </div>
        </div>
      </div>

      <div className="objective-dock key-slot-current-goal">
        <span>{currentGoal.step}</span>
        <strong>{currentGoal.title}</strong>
        <p>{currentGoal.text}</p>
      </div>

      <div className="memory-inspector key-slot-inspector">
        <div className="section-heading">
          <span>TOKEN INSPECTOR</span>
          <strong>{selectedCard?.type || "memory"}</strong>
        </div>
        <div>
          <h4>{selectedCard?.title}</h4>
          <MemoryCardContent card={selectedCard} />
        </div>
        <div className={`inspector-hint ${activeHintTone}`}>
          <span>MIRA HINT</span>
          <p>{activeHint}</p>
        </div>
      </div>

      <div className="memory-board lab-section lab-section-memory">
        <div className="section-heading">
          <span>MEMORY BOARD</span>
          <strong>{canUseAttackBoard ? "inspect" : restored ? "restored" : "locked"}</strong>
        </div>
        <p className="lab-section-summary">
          {ui.memorySummary}
        </p>
        <div className="memory-card-grid">
          {revealedCards.map((card) => (
            <button
              type="button"
              key={card.id}
              className={`memory-card ${card.type} ${selectedCardId === card.id ? "selected" : ""} ${
                draggingCardId === card.id ? "dragging" : ""
              }`}
              draggable={!restored}
              onClick={() => revealCard(card)}
              onDragStart={(event) => handleCardDragStart(event, card)}
              onDragEnd={handleCardDragEnd}
            >
              <span>{card.type}</span>
              <strong>{card.title}</strong>
              <small>{card.summary}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="evidence-reconstruction verification-stack lab-section lab-section-evidence">
        <div className="section-heading">
          <span>VERIFICATION STACK</span>
          <strong>{restored ? "complete" : "pin cards"}</strong>
        </div>
        <p className="lab-section-summary">
          {ui.stackSummary}
        </p>
        <div className="evidence-slot-grid">
          {puzzle.slots.map((slot) => {
            const assignedCard = cardsById.get(slotAssignments[slot.id]);
            const valid = assignedCard && slot.accepts.includes(assignedCard.id);
            return (
              <button
                type="button"
                key={slot.id}
                className={`evidence-slot ${assignedCard ? "filled" : ""} ${valid ? "valid" : ""} ${
                  assignedCard && !valid ? "invalid" : ""
                } ${
                  draggingCardId ? "drop-ready" : ""
                } ${dropSlotId === slot.id ? "drop-target" : ""}`}
                onClick={() => assignSelectedToSlot(slot)}
                onDragEnter={(event) => handleSlotDragOver(event, slot)}
                onDragOver={(event) => handleSlotDragOver(event, slot)}
                onDragLeave={(event) => handleSlotDragLeave(event, slot)}
                onDrop={(event) => handleSlotDrop(event, slot)}
                disabled={restored}
              >
                <span>{slot.label}</span>
                <strong>{assignedCard?.title || ui.emptySlot}</strong>
                <small>{slot.hint}</small>
              </button>
            );
          })}
        </div>
        {!stackVerified && !restored && (
          <>
            <div className="memory-action-row">
              <button onClick={handleVerify} disabled={busy}>
                Run Verification
              </button>
              <code>{ui.evidencePending}</code>
            </div>
            {verificationNotice && (
              <p className={`campaign-result ${verificationNotice.correct ? "ok" : "fail"}`}>
                {verificationNotice.message}
              </p>
            )}
          </>
        )}
      </div>

      {canUseKeyWheel ? (
        <div className="key-slot-wheel lab-section lab-section-key">
          <div className="section-heading">
            <span>KEY SLOT WHEEL</span>
            <strong>{selectedKeySlot?.result || "select slot"}</strong>
          </div>
          <p className="lab-section-summary">
            {ui.wheelSummary}
          </p>
          <div className="key-slot-grid">
            {puzzle.slotOptions.map((slot) => (
              <button
                type="button"
                key={slot.id}
                className={`key-slot-card ${selectedKeySlotId === slot.id ? "selected" : ""}`}
                onClick={() => handleSelectKeySlot(slot.id)}
                disabled={restored}
              >
                <span>{slot.label}</span>
                <strong>{slot.kid}</strong>
                <small>{slot.status}</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="lab-locked-panel">
          <span>KEY SLOT WHEEL</span>
          <strong>locked</strong>
          <p>{ui.wheelLocked}</p>
        </div>
      )}

      {canUseClaimPanel ? (
        <div className="claim-mutation-panel">
          <div className="section-heading">
            <span>CLAIM MUTATION PANEL</span>
            <strong>{selectedClaim?.label || "unchanged"}</strong>
          </div>
          <p className="claim-panel-summary">
            {selectedClaim?.kind === "admin"
              ? ui.claimAdminSelected
              : ui.claimPrompt}
          </p>
          <div className="claim-lab-layout">
            <pre>{JSON.stringify(mutatedPayload, null, 2)}</pre>
            <div className="claim-option-grid">
              {puzzle.claimOptions.map((claim) => (
                <button
                  type="button"
                  key={claim.id}
                  className={`claim-option ${claim.kind} ${selectedClaimId === claim.id ? "selected" : ""}`}
                  onClick={() => handleSelectClaim(claim.id)}
                  disabled={restored}
                >
                  <span>{claim.kind}</span>
                  <strong>{claim.label}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : claimPanelLock ? (
        <div className="lab-locked-panel key-slot-blocked-panel">
          <span>CLAIM MUTATION PANEL</span>
          <strong>{claimPanelLock.title}</strong>
          <p>{claimPanelLock.text}</p>
        </div>
      ) : null}

      {showFinalEvidencePanel && (
        <div className="final-evidence-panel lab-section lab-section-evidence">
          <div className="section-heading">
            <span>ADMIN AUDIT VERIFICATION</span>
            <strong>{restored ? "complete" : "restore evidence"}</strong>
          </div>
          <p className="lab-section-summary">
            {ui.finalSummary}
          </p>
          <div className="memory-action-row">
            <button onClick={handleVerify} disabled={restored || busy}>
              {restored ? "Evidence Restored" : "Restore Evidence"}
            </button>
            <code>{restored ? puzzle.evidenceShard : ui.evidencePending}</code>
          </div>
          {verificationNotice && (
            <p className={`campaign-result ${verificationNotice.correct ? "ok" : "fail"}`}>
              {verificationNotice.message}
            </p>
          )}
          {evidenceResult && (
            <p className={`campaign-result ${evidenceResult.correct ? "ok" : "fail"}`}>
              {evidenceResult.message}
            </p>
          )}
          {restored && (
            <pre className="memory-evidence-json">
{`{
  "ok": true,
  "data": {
    "status": "accepted",
    "verifier": "legacy_compatibility",
    "adminAudit": "unlocked",
    "evidenceShard": "${puzzle.evidenceShard}"
  }
}`}
            </pre>
          )}
        </div>
      )}

      {showPolicyForge ? (
        <div className={`policy-forge ${canSealPolicy || phase === "MISSION_COMPLETE" ? "active" : ""}`}>
        <div className="section-heading">
          <span>POLICY CARDS</span>
          <strong>{policyStatus}</strong>
        </div>
        <p>
          {ui.policyIntro}
        </p>
        <div className="policy-card-grid">
          {puzzle.policyCards.map((card) => {
            const selected = selectedPolicyIds.includes(card.id);
            return (
              <button
                type="button"
                key={card.id}
                className={`policy-card ${selected ? "selected" : ""}`}
                onClick={() => onTogglePolicy(card.id)}
                disabled={!canSealPolicy}
              >
                <strong>{card.title}</strong>
                <small>{card.text}</small>
              </button>
            );
          })}
        </div>
        <div className="memory-action-row">
          <button onClick={onSubmitPolicy} disabled={!canSealPolicy || busy || selectedPolicyIds.length === 0}>
            Submit Policy Seal
          </button>
          <code>selected: [{selectedPolicyIds.join(", ")}]</code>
        </div>
        {patchResult && (
          <p className={`campaign-result ${patchResult.correct ? "ok" : "fail"}`}>{patchResult.message}</p>
        )}
      </div>
      ) : (
        <div className="policy-forge policy-lock-panel">
          <div className="section-heading">
            <span>POLICY FORGE</span>
            <strong>locked</strong>
          </div>
          <p>{ui.policyLocked}</p>
        </div>
      )}
    </section>
  );
}

function Level43ReplayStampLab({
  phase,
  evidenceSolved,
  evidenceResult,
  onRestoreEvidence,
  selectedPolicyIds,
  onTogglePolicy,
  onSubmitPolicy,
  patchResult,
  busy,
  token,
  prompt,
  consoleLogs,
  command,
  setCommand,
  consoleBusy,
  onExec,
  locale,
}) {
  const puzzle = useMemo(() => getLevel43ReplayPuzzle(locale), [locale]);
  const ui = LEVEL4_3_REPLAY_UI[locale === "en" ? "en" : "ko"];
  const cardsById = useMemo(
    () => new Map(puzzle.cards.map((card) => [card.id, card])),
    [puzzle.cards]
  );
  const [selectedCardId, setSelectedCardId] = useState("delivered_template");
  const [inspectedCardIds, setInspectedCardIds] = useState(["delivered_template"]);
  const [labNotice, setLabNotice] = useState(null);
  const [stampSnapshot, setStampSnapshot] = useState({
    count: 0,
    target: puzzle.target,
    status: "collecting",
    windowSec: puzzle.windowSec,
    remainingSec: puzzle.windowSec,
    replayProtection: "event_id",
    events: [],
  });

  const selectedCard = cardsById.get(selectedCardId) || puzzle.cards[0];
  const events = Array.isArray(stampSnapshot.events) ? stampSnapshot.events : [];
  const restored = evidenceSolved || evidenceResult?.correct;
  const canSealPolicy = phase === "DEFENSE";
  const showPolicyForge = restored || canSealPolicy || phase === "MISSION_COMPLETE";
  const stampReady = restored || stampSnapshot.status === "ready" || Boolean(stampSnapshot.flag);
  const hasCreditedEvent = events.some((event) => event.credited);
  const hasDuplicateProbe = events.some((event) => event.duplicate);
  const sequencerUnlocked = restored || hasDuplicateProbe || Number(stampSnapshot.count || 0) >= 2;
  const nextEventId = `EVT-2026-DEL-${padReplayEventNumber(Number(stampSnapshot.count || 0) + 1)}`;
  const replayTemplateHint = nextEventId.replace(/\d+/g, "#");
  const activeHint =
    labNotice?.message ||
    selectedCard?.note ||
    ui.defaultHint;
  const activeHintTone = labNotice?.correct === false ? "fail" : "ok";
  const policyStatus =
    phase === "MISSION_COMPLETE"
      ? "sealed"
      : canSealPolicy
        ? "seal replay"
        : restored
          ? "awaiting containment"
          : "locked";

  const refreshStamps = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const data = await apiRequest("/challenges/level4_3/actions/stamps", { token });
      setStampSnapshot((prev) => ({
        ...prev,
        ...data,
        events: Array.isArray(data.events) ? data.events : prev.events,
      }));
      setLabNotice((prev) =>
        prev?.message === "Failed to fetch" || prev?.message?.includes(ui.fetchKoreanMarker)
          ? null
          : prev
      );
    } catch (error) {
      setLabNotice((prev) => prev || null);
    }
  }, [token]);

  useEffect(() => {
    if (phase !== "LOCKED" && phase !== "BRIEFING") {
      refreshStamps();
    }
  }, [phase, refreshStamps]);

  useEffect(() => {
    const last = consoleLogs[consoleLogs.length - 1];
    const previous = consoleLogs[consoleLogs.length - 2];
    if (!last || (last.type !== "output" && last.type !== "error")) {
      return undefined;
    }
    const combined = `${previous?.text || ""}\n${last.text || ""}`;
    if (!combined.includes("level4_3") && !combined.includes("stampCount") && !combined.includes("\"count\"")) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      refreshStamps();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [consoleLogs, refreshStamps]);

  const revealCard = useCallback(
    (card) => {
      if (card.id === "event_sequencer" && !sequencerUnlocked) {
        setLabNotice({
          correct: false,
          message: ui.lockedSequencer,
        });
        return;
      }
      setSelectedCardId(card.id);
      setInspectedCardIds((prev) => [...new Set([...prev, card.id])]);
      setLabNotice(null);
    },
    [sequencerUnlocked]
  );

  const stageCommand = useCallback(
    (nextCommand, message) => {
      setCommand(nextCommand);
      setLabNotice({ correct: true, message });
    },
    [setCommand]
  );

  const handleRestoreEvidence = useCallback(async () => {
    if (!stampReady && !restored) {
      setLabNotice({
        correct: false,
        message: ui.vaultLocked,
      });
      return;
    }
    await onRestoreEvidence();
    setLabNotice({
      correct: true,
      message: ui.vaultRestored,
    });
  }, [onRestoreEvidence, restored, stampReady, ui]);

  const currentGoal = (() => {
    if (canSealPolicy || phase === "MISSION_COMPLETE") {
      return ui.goals.defense;
    }
    if (restored) {
      return ui.goals.complete;
    }
    if (!hasCreditedEvent) {
      return ui.goals.first;
    }
    if (!hasDuplicateProbe) {
      return ui.goals.duplicate;
    }
    if (!stampReady) {
      return ui.goals.burst;
    }
    return ui.goals.vault;
  })();

  return (
    <section className="memory-vault-panel replay-stamp-lab">
      <div className="memory-vault-header replay-stamp-header">
        <div>
          <p className="campaign-kicker">OPERATION 04 // MEMORY VAULT</p>
          <h3>REPLAY STAMP</h3>
          <p>{ui.headerDescription}</p>
        </div>
        <div className="memory-status-grid" aria-label="Replay stamp status">
          <div>
            <span>STAMP</span>
            <strong>
              {stampSnapshot.count}/{stampSnapshot.target}
            </strong>
          </div>
          <div>
            <span>WINDOW</span>
            <strong>
              {stampSnapshot.status === "timeout"
                ? "expired"
                : `${stampSnapshot.remainingSec ?? stampSnapshot.windowSec}s`}
            </strong>
          </div>
          <div>
            <span>PROTECTS</span>
            <strong>{stampSnapshot.replayProtection || "event_id"}</strong>
          </div>
        </div>
      </div>

      <div className="objective-dock key-slot-current-goal">
        <span>{currentGoal.step}</span>
        <strong>{currentGoal.title}</strong>
        <p>{currentGoal.text}</p>
      </div>

      <div className="replay-hybrid-grid">
        <div className="replay-console-column">
          <section className="replay-stage-panel lab-section lab-section-key">
            <div className="section-heading">
              <span>CURL STAGING</span>
              <strong>{sequencerUnlocked ? "sequencer ready" : "manual probes"}</strong>
            </div>
            <p className="lab-section-summary">{ui.stageSummary}</p>
            <div className="replay-parser-notes">
              <span>Parser notes</span>
              <code>curl ... && curl ...</code>
              <code>for i in $(seq 1 5); do curl ...; done</code>
              <code>echo "a b c" | xargs -I {} curl ...</code>
            </div>
            <div className="replay-stage-actions">
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43EventCurl(puzzle.sampleEventId, "hub"),
                    ui.stageDelivered
                  )
                }
                disabled={consoleBusy || restored}
              >
                Stage Delivered Event
              </button>
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43EventCurl(puzzle.sampleEventId, "hub"),
                    ui.stageDuplicate
                  )
                }
                disabled={consoleBusy || restored || !hasCreditedEvent}
              >
                Stage Duplicate Probe
              </button>
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43NumberOnlyDraftCurl(),
                    ui.stageNumber(nextEventId, replayTemplateHint)
                  )
                }
                disabled={consoleBusy || restored || !hasCreditedEvent}
              >
                Stage Number Draft
              </button>
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43BatchDraftCurl(),
                    ui.stageBatch
                  )
                }
                disabled={consoleBusy || restored || !sequencerUnlocked}
              >
                Stage Batch Draft
              </button>
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43StampsCurl(),
                    ui.stageCheck
                  )
                }
                disabled={consoleBusy}
              >
                Stage Stamp Check
              </button>
            </div>
          </section>

          <MissionConsole
            disabled={phase === "LOCKED" || phase === "BRIEFING"}
            prompt={prompt}
            placeholder="stage or edit replay curl..."
            onExec={onExec}
            logs={consoleLogs}
            command={command}
            setCommand={setCommand}
            busy={consoleBusy}
            helpText={ui.consoleGuide}
          />
        </div>

        <aside className="replay-ledger-panel">
          <div className="section-heading">
            <span>REPLAY LEDGER</span>
            <strong>{stampSnapshot.status}</strong>
          </div>
          <div className="stamp-metric-grid">
            <div>
              <span>COUNT</span>
              <strong>
                {stampSnapshot.count}/{stampSnapshot.target}
              </strong>
            </div>
            <div>
              <span>REMAINING</span>
              <strong>{stampSnapshot.remainingSec ?? stampSnapshot.windowSec}s</strong>
            </div>
            <div>
              <span>DUPLICATE</span>
              <strong>{hasDuplicateProbe ? "observed" : "pending"}</strong>
            </div>
            <div>
              <span>VAULT</span>
              <strong>{stampReady ? "open" : "locked"}</strong>
            </div>
          </div>
          <ul className="replay-ledger-list">
            {events.length === 0 ? (
              <li className="empty">{ui.emptyLedger}</li>
            ) : (
              [...events].reverse().map((event, index) => (
                <li
                  key={`${event.event_id}-${event.at}-${index}`}
                  className={event.credited ? "credited" : event.duplicate ? "duplicate" : "ignored"}
                >
                  <strong>{event.event_id}</strong>
                  <span>
                    {event.credited
                      ? "credited"
                      : event.duplicate
                        ? "duplicate"
                        : event.guard === "route_missing"
                          ? "no via"
                          : event.guard === "template_dup"
                            ? "same template"
                            : event.guard === "route_dup"
                              ? "same route"
                              : event.accepted
                                ? "accepted / no stamp"
                                : "ignored"}
                  </span>
                  <small>
                    {event.parcel_id} / {event.status}
                    {event.via ? ` / via:${event.via}` : ""}
                  </small>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      <div className="final-evidence-panel replay-vault-panel lab-section lab-section-evidence">
        <div className="section-heading">
          <span>STAMP VAULT</span>
          <strong>{stampReady ? "evidence ready" : "locked"}</strong>
        </div>
        <p className="lab-section-summary">{ui.vaultSummary}</p>
        <div className="memory-action-row">
          <button onClick={handleRestoreEvidence} disabled={busy || restored || !stampReady}>
            {restored ? "Evidence Restored" : "Restore Evidence"}
          </button>
          <code>{stampReady || restored ? puzzle.evidenceShard : "Replay Evidence pending"}</code>
        </div>
        {evidenceResult && (
          <p className={`campaign-result ${evidenceResult.correct ? "ok" : "fail"}`}>
            {evidenceResult.message}
          </p>
        )}
        {restored && (
          <pre className="memory-evidence-json">
{`{
  "ok": true,
  "data": {
    "status": "ready",
    "replayProtection": "event_id + template + route, but no logical idempotency",
    "evidenceShard": "${puzzle.evidenceShard}"
  }
}`}
          </pre>
        )}
      </div>

      <div className="memory-inspector replay-inspector">
        <div className="section-heading">
          <span>REPLAY INSPECTOR</span>
          <strong>{selectedCard?.type || "event"}</strong>
        </div>
        <div>
          <h4>{selectedCard?.title}</h4>
          <MemoryCardContent card={selectedCard} />
        </div>
        <div className={`inspector-hint ${activeHintTone}`}>
          <span>MIRA HINT</span>
          <p>{activeHint}</p>
        </div>
      </div>

      <div className="memory-board replay-card-board lab-section lab-section-memory">
        <div className="section-heading">
          <span>REPLAY CARDS</span>
          <strong>inspect</strong>
        </div>
        <p className="lab-section-summary">{ui.cardSummary}</p>
        <div className="memory-card-grid replay-card-grid">
          {puzzle.cards.map((card) => {
            const locked = card.id === "event_sequencer" && !sequencerUnlocked;
            return (
              <button
                type="button"
                key={card.id}
                className={`memory-card ${card.type} ${selectedCardId === card.id ? "selected" : ""} ${
                  inspectedCardIds.includes(card.id) ? "inspected" : ""
                } ${locked ? "locked" : ""}`}
                onClick={() => revealCard(card)}
              >
                <span>{locked ? "locked" : card.type}</span>
                <strong>{card.title}</strong>
                <small>{locked ? ui.lockedCardHint : card.summary}</small>
              </button>
            );
          })}
        </div>
      </div>

      {showPolicyForge ? (
        <div className={`policy-forge ${canSealPolicy || phase === "MISSION_COMPLETE" ? "active" : ""}`}>
          <div className="section-heading">
            <span>POLICY CARDS</span>
            <strong>{policyStatus}</strong>
          </div>
          <p>{ui.policyIntro}</p>
          <div className="policy-card-grid">
            {puzzle.policyCards.map((card) => {
              const selected = selectedPolicyIds.includes(card.id);
              return (
                <button
                  type="button"
                  key={card.id}
                  className={`policy-card ${selected ? "selected" : ""}`}
                  onClick={() => onTogglePolicy(card.id)}
                  disabled={!canSealPolicy}
                >
                  <strong>{card.title}</strong>
                  <small>{card.text}</small>
                </button>
              );
            })}
          </div>
          <div className="memory-action-row">
            <button onClick={onSubmitPolicy} disabled={!canSealPolicy || busy || selectedPolicyIds.length === 0}>
              Submit Policy Seal
            </button>
            <code>selected: [{selectedPolicyIds.join(", ")}]</code>
          </div>
          {patchResult && (
            <p className={`campaign-result ${patchResult.correct ? "ok" : "fail"}`}>
              {patchResult.message}
            </p>
          )}
        </div>
      ) : (
        <div className="policy-forge policy-lock-panel">
          <div className="section-heading">
            <span>POLICY FORGE</span>
            <strong>locked</strong>
          </div>
          <p>{ui.policyLocked}</p>
        </div>
      )}
    </section>
  );
}

function PatchSubmit({
  detail,
  instruction,
  phase,
  selectedPatchIds,
  requiresVerification,
  verificationReady,
  onToggle,
  onSubmit,
  result,
  busy,
}) {
  const enabled = detail?.defense?.enabled && phase === "DEFENSE";
  const canSubmit = enabled && (!requiresVerification || verificationReady);
  const lines = detail?.defense?.code?.lines || [];

  return (
    <section className={`containment-panel ${enabled ? "active" : ""}`}>
      <div className="section-heading">
        <span>CONTAINMENT PATCH</span>
        <strong>
          {!enabled
            ? "locked"
            : requiresVerification && !verificationReady
              ? "terminal verification required"
              : "verification ready"}
        </strong>
      </div>
      <p>{instruction || detail?.defense?.instruction || "The containment phase opens after Evidence recovery."}</p>
      {enabled && requiresVerification && (
        <div className={`verification-status ${verificationReady ? "ok" : ""}`}>
          {verificationReady
            ? "AEGIS verification token accepted. 민감 로그 라인을 선택한 뒤 제출해."
            : "AEGIS가 아직 운영 정책 검증을 받지 않았어. 콘솔에서 defense apply 후 defense verify를 성공시켜야 해."}
        </div>
      )}
      <div className="campaign-code-box">
        {lines.map((line) => {
          const patchableId = line.patchableId;
          const selected = patchableId && selectedPatchIds.includes(patchableId);
          return (
            <button
              key={line.no}
              className={`campaign-code-line ${patchableId ? "patchable" : ""} ${
                selected ? "patched" : ""
              }`}
              onClick={() => onToggle(patchableId)}
              disabled={!enabled || !patchableId}
            >
              <span>{line.no.toString().padStart(3, " ")}</span>
              <code>{line.text}</code>
            </button>
          );
        })}
      </div>
      <div className="patch-submit-row">
        <code>patched: [{selectedPatchIds.join(", ")}]</code>
        <button onClick={onSubmit} disabled={!canSubmit || busy}>
          Submit Containment
        </button>
      </div>
      {result && (
        <p className={`campaign-result ${result.correct ? "ok" : "fail"}`}>{result.message}</p>
      )}
    </section>
  );
}

function DebriefModal({ story, onNext, onClose, hasNext, locale }) {
  const memoryNote = localizedBlock(story.memoryNote, locale);

  return (
    <div className="debrief-backdrop" role="dialog" aria-modal="true">
      <section className="debrief-modal">
        <p className="campaign-kicker">MISSION DEBRIEF</p>
        <h2>{story.debrief.title}</h2>
        <p>{story.debrief.summary}</p>
        {memoryNote && (
          <section className="memory-note-card">
            <MemoryNoteVisual image={story.memoryNote?.image} />
            <div>
              <p className="campaign-kicker">MEMORY NOTE</p>
              <h3>{memoryNote.title}</h3>
              <p>{memoryNote.body}</p>
              {memoryNote.fragments?.length > 0 && (
                <ul className="memory-note-fragments">
                  {memoryNote.fragments.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
        <div className="debrief-takeaways">
          <p className="campaign-kicker">{locale === "en" ? "KEY TAKEAWAYS" : "핵심 정리"}</p>
          <ul>
            {story.debrief.learned.map((item, i) => (
              <li key={item}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        {story.debrief.miraLine && (
          <p className="debrief-mira-line">
            <span>MIRA</span>
            {story.debrief.miraLine}
          </p>
        )}
        <div className="debrief-next">
          <div>
            <button onClick={onNext}>{hasNext ? "Next Mission" : "Campaign Status"}</button>
            <button className="ghost-button" onClick={onClose}>
              Stay Here
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MemoryNoteVisual({ image }) {
  if (!image) {
    return null;
  }

  return (
    <div
      className={`memory-note-image memory-note-image-${image.variant || "default"}`}
      role="img"
      aria-label={image.alt || image.label || "Memory note visual"}
    >
      <span className="memory-note-scan scan-a" />
      <span className="memory-note-scan scan-b" />
      <span className="memory-note-scan scan-c" />
      <span className="memory-note-core" />
      <strong>{image.label}</strong>
    </div>
  );
}

function fmtTraceClock() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function traceLogKind(tone) {
  if (tone === "mira") return "mira";
  if (tone === "warn") return "sys";
  return "aegis";
}

// Mirror Trace — designed intermission (log typing -> alert flash -> TRACE LOCK popup).
function TraceSweepIntermission({ intermission, busy, onContinue }) {
  const logs = intermission.logs || [];
  const metrics = intermission.metrics || [];
  const initLink = parseInt(metrics[0]?.value, 10) || 39;
  const initHandler = parseInt(metrics[1]?.value, 10) || 67;

  const [typing, setTyping] = useState({ line: 0, ch: 0, pause: 5, done: false });
  const [phase, setPhase] = useState("log"); // "log" | "alert" | "popup"
  const [countdown, setCountdown] = useState(45);
  const [clock, setClock] = useState(fmtTraceClock);
  const [link, setLink] = useState(initLink);
  const [handler, setHandler] = useState(initHandler);
  const [nodes, setNodes] = useState(3);
  const [pressed, setPressed] = useState(false);
  const logRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const step = 5;
  const stepPause = 5;

  // reset on intermission change
  useEffect(() => {
    setTyping({ line: 0, ch: 0, pause: 5, done: false });
    setPhase("log");
    setCountdown(45);
    setLink(initLink);
    setHandler(initHandler);
    setNodes(3);
  }, [intermission.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // typing tick
  useEffect(() => {
    const t = window.setInterval(() => {
      setTyping((s) => {
        if (s.done) return s;
        if (s.pause > 0) return { ...s, pause: s.pause - 1 };
        const line = logs[s.line];
        if (!line) return { ...s, done: true };
        const text = line.text || "";
        if (s.ch < text.length) return { ...s, ch: Math.min(text.length, s.ch + step) };
        const next = s.line + 1;
        if (next >= logs.length) return { ...s, done: true };
        return { line: next, ch: 0, pause: stepPause, done: false };
      });
    }, 24);
    return () => window.clearInterval(t);
  }, [logs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // done -> alert -> popup
  useEffect(() => {
    if (!typing.done) return undefined;
    const a = window.setTimeout(() => setPhase("alert"), 1500);
    const p = window.setTimeout(() => setPhase("popup"), 2800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(p);
    };
  }, [typing.done]);

  // clock + popup countdown
  useEffect(() => {
    const t = window.setInterval(() => {
      setClock(fmtTraceClock());
      setCountdown((c) => (phaseRef.current === "popup" && c > 0 ? c - 1 : c));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  // metric jitter
  useEffect(() => {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drift = () => (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.65 ? 1 : 2);
    const t = window.setInterval(() => {
      const alerting = phaseRef.current !== "log";
      setLink((v) => (alerting ? clamp(v - (Math.random() < 0.7 ? 1 : 2), 14, 45) : clamp(v + drift(), 33, 45)));
      setHandler((v) =>
        alerting
          ? clamp(v + (Math.random() < 0.7 ? 1 : 2), 58, 96)
          : clamp(v + Math.abs(drift()) * (Math.random() < 0.62 ? 1 : -1), 58, 78)
      );
      setNodes((n) => (Math.random() < 0.4 ? Math.min(n + 1, 14) : n));
    }, 1500);
    return () => window.clearInterval(t);
  }, []);

  // auto-scroll log
  useEffect(() => {
    if (!typing.done && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [typing]);

  const handleContinue = useCallback(() => {
    if (busy) return;
    setPressed(true);
    onContinue();
  }, [busy, onContinue]);

  // ENTER to continue (only in popup)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && phaseRef.current === "popup") handleContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleContinue]);

  const upto = Math.min(typing.line, logs.length - 1);
  const visibleLines = [];
  for (let i = 0; i <= upto && i < logs.length; i += 1) {
    const L = logs[i];
    const active = i === typing.line && !typing.done;
    const text = active ? (L.text || "").slice(0, typing.ch) : L.text;
    visibleLines.push({ id: i, num: String(i + 1).padStart(2, "0"), src: L.source, text, active, kind: traceLogKind(L.tone) });
  }

  const alertOn = phase === "alert" || phase === "popup";
  const countdownLabel = `T–${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`;
  const traceNetLabel = metrics[2]?.value || "EXPANDING";

  return (
    <div className={`campaign-page trace-sweep phase-${phase}`}>
      <div className="ts-scanlines" aria-hidden="true" />
      <div className="ts-vignette" aria-hidden="true" />

      <div className="ts-inner">
        <div className="ts-chrome">
          <div className="ts-chrome-left">
            <span className="ts-diamond" />
            <span className="ts-grid-name">AEGIS · SENTINEL GRID</span>
            <span className="ts-ver">v4.19</span>
          </div>
          <div className="ts-chrome-right">
            <span>SESSION 7F–ARC</span>
            <span>UTC <b>{clock}</b></span>
            <span className="ts-leds">
              <span className="ts-led on" />LINK
              <span className="ts-led" />AUDIT
              <span className="ts-led on d2" />TRACE
            </span>
          </div>
        </div>

        <div className="ts-header">
          <div className="ts-header-main">
            <div className="ts-kicker">
              <span className="accent">INTERMISSION 01</span>
              <span className="ts-rule" />
              <span>TRACE SWEEP</span>
            </div>
            <h1 className="ts-title">{intermission.title}</h1>
            <p className="ts-subtitle">{intermission.subtitle}</p>
          </div>
          <div className="ts-status-wrap">
            <div className="ts-status-label">CONTAINMENT STATUS</div>
            <div className="ts-status-chip">
              <span className="ts-led on" />
              <span>IDENTITY UNRESOLVED</span>
            </div>
          </div>
        </div>

        <div className="ts-telemetry">
          <div className="ts-card">
            <div className="ts-card-head"><span>{metrics[0]?.label || "LINK STABILITY"}</span><span className="down">▼ 2.1/min</span></div>
            <div className="ts-card-value"><strong>{link}</strong><span className="pct">%</span><span className="ts-tag">DEGRADED</span></div>
            <div className="ts-bar"><div className="ts-fill" style={{ width: `${link}%` }} /></div>
          </div>
          <div className="ts-card">
            <div className="ts-card-head"><span>{metrics[1]?.label || "HANDLER PROBABILITY"}</span><span className="up">▲ 3.4/min</span></div>
            <div className="ts-card-value"><strong>{handler}</strong><span className="pct">%</span><span className="ts-tag up">ELEVATED</span></div>
            <div className="ts-bar"><div className="ts-fill" style={{ width: `${handler}%` }} /></div>
          </div>
          <div className="ts-card">
            <div className="ts-card-head"><span>{metrics[2]?.label || "TRACE NET"}</span><span className="up">△ LIVE</span></div>
            <div className="ts-card-value"><strong className="word">{traceNetLabel}</strong><span className="ts-tag mut">{nodes} CLUSTERS</span></div>
            <div className="ts-bar"><div className="ts-fill-indet" /></div>
          </div>
        </div>

        <div className="ts-main">
          <div className="ts-log-panel">
            <div className="ts-log-head">
              <div className="ts-log-title"><span className="accent">▮</span> AEGIS TRACE SWEEP</div>
              <div className="ts-log-live">STREAM · LIVE <span className="ts-led on" /></div>
            </div>
            <div className="ts-log-body" ref={logRef}>
              {visibleLines.map((line) => (
                <div key={line.id} className={`ts-log-line ${line.kind}`}>
                  <span className="ts-log-num">{line.num}</span>
                  <span className="ts-log-src">[{line.src}]</span>
                  <span className="ts-log-msg">{line.text}{line.active && <span className="ts-cursor" />}</span>
                </div>
              ))}
              <div className="ts-await">
                <span className="ts-log-num" />
                <span className="accent">&gt;</span>
                <span>awaiting operator<span className="ts-cursor slow" /></span>
              </div>
            </div>
          </div>

          <div className="ts-rail">
            <div className="ts-entity mira">
              <div className="ts-entity-head">
                <div className="ts-entity-name"><span className="name">MIRA</span><span className="ts-role">ALLY · GUIDE</span></div>
                <span className="ts-led on" />
              </div>
              <p className="ts-entity-body">{intermission.mira}</p>
            </div>
            <div className="ts-entity aegis">
              <div className="ts-entity-head">
                <div className="ts-entity-name"><span className="name">AEGIS</span><span className="ts-role">WARDEN · HOSTILE</span></div>
                <span className="ts-quar">QUARANTINE PENDING</span>
              </div>
              <p className="ts-entity-body">{intermission.aegis}</p>
            </div>
          </div>
        </div>

        <div className="ts-ticker">
          <div className="ts-marquee-wrap">
            <div className="ts-marquee">
              <span>containment protocol engaged &nbsp;·&nbsp; advisory relays under quarantine review &nbsp;·&nbsp; operator guidance signature unresolved &nbsp;·&nbsp; mirror-instance residue flagged &nbsp;·&nbsp; edge nodes reporting mirrored output &nbsp;·&nbsp;</span>
              <span>containment protocol engaged &nbsp;·&nbsp; advisory relays under quarantine review &nbsp;·&nbsp; operator guidance signature unresolved &nbsp;·&nbsp; mirror-instance residue flagged &nbsp;·&nbsp; edge nodes reporting mirrored output &nbsp;·&nbsp;</span>
            </div>
          </div>
          <div className="ts-ticker-right">
            <span>{intermission.nextOperation || "NEXT ▸ ENCRYPTED"}</span>
            <span className="ts-enter-hint">CONTINUE&nbsp;&nbsp;[ ENTER ]</span>
          </div>
        </div>
      </div>

      {alertOn && (
        <>
          <div className="ts-alert-sweep" aria-hidden="true" />
          <div className="ts-alert-tint" aria-hidden="true" />
          <div className="ts-alert-vignette" aria-hidden="true" />
        </>
      )}

      {phase === "popup" && (
        <div className="ts-popup-backdrop">
          <div className="ts-popup">
            <div className="ts-popup-kicker">AEGIS // PRIORITY OVERRIDE</div>
            <div className="ts-popup-title">TRACE LOCK IMMINENT</div>
            <div className="ts-popup-net">
              <span>NET CLOSURE</span>
              <span className="ts-countdown">{countdownLabel}</span>
            </div>
            <p className="ts-popup-body">The containment net reaches the first relay when the counter hits zero. The window closes with it.</p>
            <button className="ts-popup-btn" onClick={handleContinue} disabled={busy}>
              {busy || pressed ? (intermission.openingLabel || "LINKING …") : (intermission.readyLabel || "CONTINUE ▸")}
            </button>
            <div className="ts-popup-enter">or press [ ENTER ]</div>
          </div>
        </div>
      )}
    </div>
  );
}

function OperationIntermission({ intermission, busy, onContinue }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [relayMasked, setRelayMasked] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const logs = intermission.logs || [];
  const isCinematic = Boolean(intermission.videoSrc);
  const visibleLogs = relayMasked
    ? [
        ...logs.slice(0, visibleCount),
        { source: "LOCAL // RELAY MASK", tone: "mira", text: intermission.maskedLog },
      ]
    : logs.slice(0, visibleCount);
  const sweepComplete = visibleCount >= logs.length;

  useEffect(() => {
    setVisibleCount(0);
    setRelayMasked(false);
    setVideoEnded(false);
  }, [intermission.id]);

  useEffect(() => {
    if (!logs.length || visibleCount >= logs.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, logs.length));
    }, visibleCount < 2 ? 260 : 520);

    return () => window.clearTimeout(timer);
  }, [logs.length, visibleCount]);

  if (isCinematic) {
    const canContinue = videoEnded || sweepComplete;
    return (
      <div
        className={`campaign-page intermission-page intermission-cinematic video-only ${
          canContinue ? "trace-complete" : "trace-running"
        } ${relayMasked ? "relay-masked" : ""} ${videoEnded ? "video-ended" : ""}`}
      >
        <video
          className="intermission-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setVideoEnded(true)}
          onError={() => setVideoEnded(true)}
          aria-hidden="true"
        >
          <source src={intermission.videoSrc} type="video/mp4" />
        </video>
        <div className="intermission-video-vignette" aria-hidden="true" />
        <div className="intermission-noise" aria-hidden="true" />
        <main className="cinematic-intermission-overlay">
          <section className="cinematic-title-card">
            <p className="campaign-kicker">{intermission.kicker}</p>
            <h1>{intermission.title}</h1>
            <p>{intermission.subtitle}</p>
          </section>
          <section className="cinematic-intermission-actions">
            {!canContinue ? (
              <button disabled>{intermission.pendingLabel || "Vault descent syncing..."}</button>
            ) : !relayMasked ? (
              <button onClick={() => setRelayMasked(true)}>{intermission.actionLabel}</button>
            ) : (
              <button onClick={onContinue} disabled={busy}>
                {busy ? intermission.openingLabel || "Opening..." : intermission.readyLabel}
              </button>
            )}
          </section>
        </main>
      </div>
    );
  }

  return <TraceSweepIntermission intermission={intermission} busy={busy} onContinue={onContinue} />;
}

function CampaignMode() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [progressKey, setProgressKey] = useState(
    () => localStorage.getItem(PROGRESS_KEY_STORAGE_KEY) || ""
  );
  const [locale, setLocale] = useState(() =>
    localStorage.getItem(CAMPAIGN_LOCALE_KEY) === "ko" ? "ko" : "en"
  );
  const [campaignActive, setCampaignActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [me, setMe] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [currentId, setCurrentId] = useState("");
  const [adStage, setAdStage] = useState("brief"); // 2-3 stage tabs: "brief" (default) | "infiltrate"
  const [detail, setDetail] = useState(null);
  const [briefingSeenById, setBriefingSeenById] = useState({});
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [bootedById, setBootedById] = useState({});
  const [command, setCommand] = useState("");
  const [consoleBusy, setConsoleBusy] = useState(false);
  const [flagValue, setFlagValue] = useState("");
  const [evidenceResult, setEvidenceResult] = useState(null);
  const [patchResult, setPatchResult] = useState(null);
  const [networkTraceResult, setNetworkTraceResult] = useState(null);
  const [networkTraceBusy, setNetworkTraceBusy] = useState(false);
  const [networkTraceEntries, setNetworkTraceEntries] = useState([]);
  const [networkTraceCapsuleId, setNetworkTraceCapsuleId] = useState("");
  const [auditSelectorFields, setAuditSelectorFields] = useState([]);
  const [auditSelectorDraft, setAuditSelectorDraft] = useState({});
  const [expandedTraceById, setExpandedTraceById] = useState({});
  const [selectedPatchIds, setSelectedPatchIds] = useState([]);
  const [level14ReasonIds, setLevel14ReasonIds] = useState([]);
  const [level12ReasonIds, setLevel12ReasonIds] = useState([]);
  const [courierSnapshots, setCourierSnapshots] = useState([]);
  const [courier21ReasonIds, setCourier21ReasonIds] = useState([]);
  const [courier21PinnedKey, setCourier21PinnedKey] = useState("");
  const [containmentVerifiedById, setContainmentVerifiedById] = useState({});
  const [attackNotice, setAttackNotice] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [nextId, setNextId] = useState(null);
  const [operation03IntermissionSeen, setOperation03IntermissionSeen] = useState(
    () => localStorage.getItem(OPERATION_03_INTERMISSION_KEY) === "1"
  );
  const [operation04IntermissionSeen, setOperation04IntermissionSeen] = useState(
    () => localStorage.getItem(OPERATION_04_INTERMISSION_KEY) === "1"
  );
  const [activeIntermission, setActiveIntermission] = useState(null);
  const sessionCreationRef = useRef(null);

  const handleLocaleChange = useCallback((nextLocale) => {
    const normalized = nextLocale === "en" ? "en" : "ko";
    localStorage.setItem(CAMPAIGN_LOCALE_KEY, normalized);
    setLocale(normalized);
  }, []);

  const rememberSession = useCallback((data) => {
    if (data?.sessionToken) {
      localStorage.setItem(TOKEN_KEY, data.sessionToken);
      setToken(data.sessionToken);
    }
    if (data?.progressKey) {
      localStorage.setItem(PROGRESS_KEY_STORAGE_KEY, data.progressKey);
      setProgressKey(data.progressKey);
    }
    return data?.sessionToken || "";
  }, []);

  const createSession = useCallback(async () => {
    if (sessionCreationRef.current) {
      return sessionCreationRef.current;
    }

    const request = apiRequest("/session", {
      method: "POST",
      body: { client: { source: "campaign-mode" } },
    }).then(rememberSession);
    sessionCreationRef.current = request;

    try {
      return await request;
    } finally {
      sessionCreationRef.current = null;
    }
  }, [rememberSession]);

  const restoreSession = useCallback(
    async (candidate) => {
      const data = await apiRequest("/session/restore", {
        method: "POST",
        body: {
          progressKey: candidate.trim().toUpperCase(),
          client: { source: "campaign-mode-restore" },
        },
      });
      return rememberSession(data);
    },
    [rememberSession]
  );

  const syncProgressKey = useCallback(
    async (sessionToken) => {
      const data = await apiRequest("/session/progress-key", { token: sessionToken });
      rememberSession({ sessionToken, progressKey: data.progressKey });
      return data.progressKey;
    },
    [rememberSession]
  );

  const loadMissionDetail = useCallback(async (sessionToken, challengeId) => {
    const data = await apiRequest(`/challenges/${challengeId}`, {
      token: sessionToken,
    });
    setDetail(data);
    return data;
  }, []);

  const bootstrap = useCallback(
    async (preferredToken = token, allowRecovery = true) => {
      setLoading(true);
      setStatusText("Synchronizing with AEGIS grid...");
      let sessionToken = preferredToken;

      try {
        if (!sessionToken) {
          const storedProgressKey = localStorage.getItem(PROGRESS_KEY_STORAGE_KEY) || "";
          if (storedProgressKey) {
            try {
              sessionToken = await restoreSession(storedProgressKey);
            } catch {
              localStorage.removeItem(PROGRESS_KEY_STORAGE_KEY);
              setProgressKey("");
            }
          }
          if (!sessionToken) {
            sessionToken = await createSession();
          }
        }

        const [meData, challengeData] = await Promise.all([
          apiRequest("/me", { token: sessionToken }),
          apiRequest("/challenges", { token: sessionToken }),
        ]);
        const list = challengeData.challenges || [];
        const selectedId = resolveCurrentChallengeId(meData, list);

        setMe(meData);
        setChallenges(list);
        setCurrentId(selectedId);

        if (selectedId) {
          await loadMissionDetail(sessionToken, selectedId);
        }

        try {
          await syncProgressKey(sessionToken);
        } catch {
          // Progress sync should not block the campaign itself.
        }

        setStatusText("");
      } catch (error) {
        if (error.status === 401 && allowRecovery) {
          const storedProgressKey = localStorage.getItem(PROGRESS_KEY_STORAGE_KEY) || "";
          let recoveredToken = "";
          if (storedProgressKey) {
            try {
              recoveredToken = await restoreSession(storedProgressKey);
            } catch {
              localStorage.removeItem(PROGRESS_KEY_STORAGE_KEY);
              setProgressKey("");
            }
          }
          if (!recoveredToken) {
            recoveredToken = await createSession();
          }
          await bootstrap(recoveredToken, false);
          return;
        }
        setStatusText(error.message || "Campaign sync failed.");
      } finally {
        setLoading(false);
      }
    },
    [createSession, loadMissionDetail, restoreSession, syncProgressKey, token]
  );

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    setConsoleLogs([]);
    setCommand("");
    setFlagValue("");
    setEvidenceResult(null);
    setPatchResult(null);
    setNetworkTraceResult(null);
    setNetworkTraceBusy(false);
    setNetworkTraceEntries([]);
    setNetworkTraceCapsuleId("");
    setAuditSelectorFields([]);
    setAuditSelectorDraft({});
    setExpandedTraceById({});
    setSelectedPatchIds([]);
    setLevel14ReasonIds([]);
    setLevel12ReasonIds([]);
    setCourierSnapshots([]);
    setCourier21ReasonIds([]);
    setCourier21PinnedKey("");
    setAttackNotice(false);
    setShowDebrief(false);
    setNextId(null);
  }, [currentId]);

  const story = useMemo(
    () => getMissionStory(currentId, detail, locale),
    [currentId, detail, locale]
  );
  const operation = useMemo(
    () => getOperationForChallenge(currentId, locale),
    [currentId, locale]
  );
  const prologue = useMemo(() => getCampaignPrologue(locale), [locale]);
  const currentChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === currentId) || null,
    [challenges, currentId]
  );
  const phase = useMemo(
    () => mapServerPhase(detail, Boolean(briefingSeenById[currentId])),
    [briefingSeenById, currentId, detail]
  );
  const activeChallengeId = me?.current || currentId;
  const prompt = detail?.attack?.terminal?.prompt || "$ ";
  const evidenceSolved = detail?.status?.attack === "solved";
  const hasNext = Boolean(nextId || detail?.next?.id);
  const requiresTerminalVerification = Boolean(detail?.defense?.instruction?.includes("defense verify"));
  const containmentVerified = Boolean(containmentVerifiedById[currentId]);
  const usesMemoryVault = currentId === "level4_1" || currentId === "level4_2" || currentId === "level4_3";
  // The fragment board reasoning gate covers BOTH 1-3 and 1-4 (they share the board
  // component and never run at the same time). 1-4 additionally requires commit verification.
  const fragmentBoardReasoningLevel = currentId === "level1_3" || currentId === "level1_4";
  const level14RequiredReasonCount = story.fragmentBoard?.requiredReasonCount || 0;
  const level14RequiredReasonIds = story.fragmentBoard?.requiredReasonIds || [];
  const level14CorrectReasonCount = (story.fragmentBoard?.reasoning || []).filter(
    (item) => level14ReasonIds.includes(item.id) && item.correct
  ).length;
  const level14RequiredReasonsSelected = level14RequiredReasonIds.every((id) =>
    level14ReasonIds.includes(id)
  );
  const level14HasIncorrectSelected = (story.fragmentBoard?.reasoning || []).some(
    (item) => level14ReasonIds.includes(item.id) && !item.correct
  );
  const level14CommitVerified =
    currentId !== "level1_4" ||
    hasCommitVerifierEvidence(consoleLogs, story.fragmentBoard) ||
    evidenceSolved ||
    evidenceResult?.correct;
  const level14ReasoningReady =
    !fragmentBoardReasoningLevel ||
    level14RequiredReasonCount === 0 ||
    (level14CommitVerified &&
      level14CorrectReasonCount >= level14RequiredReasonCount &&
      level14RequiredReasonsSelected &&
      !level14HasIncorrectSelected);
  const level12Reasoning = story.signalBoard?.reasoning || [];
  const level12RequiredReasonIds =
    story.signalBoard?.requiredReasonIds ||
    level12Reasoning.filter((item) => item.correct).map((item) => item.id);
  const level12HasIncorrectSelected = level12ReasonIds.some((id) =>
    level12Reasoning.some((item) => item.id === id && !item.correct)
  );
  const level12ReasoningReady =
    currentId !== "level1_2" ||
    level12RequiredReasonIds.length === 0 ||
    (level12RequiredReasonIds.every((id) => level12ReasonIds.includes(id)) &&
      !level12HasIncorrectSelected);

  // 2-1 COURIER TRIAGE: derive the real ticket from the player's own two snapshots
  // (stable + FLAG-shaped), never from the story bundle. Gate FLAG submit on a correct
  // pin + correct reasoning, mirroring the 1-2 reasoning gate.
  const courierTriage = story.courierTriage;
  const courier21Reasoning = courierTriage?.reasoning || [];
  const courier21RequiredReasonIds =
    courierTriage?.requiredReasonIds ||
    courier21Reasoning.filter((item) => item.correct).map((item) => item.id);
  const courier21HasIncorrectSelected = courier21ReasonIds.some((id) =>
    courier21Reasoning.some((item) => item.id === id && !item.correct)
  );
  const courier21ReasoningReady =
    courier21RequiredReasonIds.length === 0 ||
    (courier21RequiredReasonIds.every((id) => courier21ReasonIds.includes(id)) &&
      !courier21HasIncorrectSelected);
  const courier21SnapA = courierSnapshots[courierSnapshots.length - 2] || null;
  const courier21SnapB = courierSnapshots[courierSnapshots.length - 1] || null;
  const courier21CorrectKey = courierCorrectKey(courier21SnapA, courier21SnapB);
  const courier21RealValue = courier21CorrectKey ? courier21SnapB?.[courier21CorrectKey] || "" : "";
  const courier21PinCorrect = Boolean(courier21PinnedKey && courier21PinnedKey === courier21CorrectKey);
  const courier21TriageReady = courier21PinCorrect && courier21ReasoningReady;

  const handleToggleCourier21Reason = useCallback((reasonId) => {
    if (!reasonId) {
      return;
    }
    setCourier21ReasonIds((prev) =>
      prev.includes(reasonId) ? prev.filter((id) => id !== reasonId) : [...prev, reasonId]
    );
  }, []);

  const handleCourier21Pin = useCallback(
    (key, value) => {
      setCourier21PinnedKey(key);
      if (value) {
        setFlagValue(value);
      }
    },
    [setFlagValue]
  );

  useEffect(() => {
    if (
      !campaignActive ||
      operation03IntermissionSeen ||
      activeIntermission ||
      currentId !== "level3_1" ||
      !me?.completed?.includes("level2_5")
    ) {
      return;
    }

    setActiveIntermission({
      ...getCampaignIntermission("operation03Trace", locale),
      nextId: currentId,
      seenKey: OPERATION_03_INTERMISSION_KEY,
    });
  }, [activeIntermission, campaignActive, currentId, locale, me?.completed, operation03IntermissionSeen]);

  useEffect(() => {
    if (
      !campaignActive ||
      operation04IntermissionSeen ||
      activeIntermission ||
      currentId !== "level4_1" ||
      !me?.completed?.includes("level3_boss")
    ) {
      return;
    }

    setActiveIntermission({
      ...getCampaignIntermission("operation04Descent", locale),
      nextId: currentId,
      seenKey: OPERATION_04_INTERMISSION_KEY,
    });
  }, [activeIntermission, campaignActive, currentId, locale, me?.completed, operation04IntermissionSeen]);

  useEffect(() => {
    if (!currentId || phase === "LOCKED" || bootedById[currentId]) {
      return;
    }

    const bootLines = story.consoleBoot || [];
    if (bootLines.length === 0) {
      return;
    }

    setBootedById((prev) => ({ ...prev, [currentId]: true }));

    let index = 0;
    const streamId = Date.now();
    const interval = window.setInterval(() => {
      const line = bootLines[index];
      if (!line) {
        window.clearInterval(interval);
        return;
      }

      setConsoleLogs((prev) => [
        ...prev,
        {
          id: `${currentId}-boot-${streamId}-${index}`,
          type: line.includes("[AEGIS]") ? "error" : "output",
          text: line,
        },
      ]);
      index += 1;
    }, 210);

    return () => window.clearInterval(interval);
  }, [bootedById, currentId, phase, story.consoleBoot]);

  const refreshMission = useCallback(
    async (sessionToken = token, challengeId = currentId) => {
      if (!sessionToken) {
        return null;
      }
      const [meData, challengeData, detailData] = await Promise.all([
        apiRequest("/me", { token: sessionToken }),
        apiRequest("/challenges", { token: sessionToken }),
        challengeId
          ? apiRequest(`/challenges/${challengeId}`, { token: sessionToken })
          : Promise.resolve(null),
      ]);
      setMe(meData);
      setChallenges(challengeData.challenges || []);
      if (detailData) {
        setDetail(detailData);
      }
      return { meData, challengeData, detailData };
    },
    [currentId, token]
  );

  const handleContinue = useCallback(() => {
    setCampaignActive(true);
  }, []);

  const handleRestoreProgress = useCallback(
    async (candidate) => {
      const restoredToken = await restoreSession(candidate);
      await bootstrap(restoredToken, false);
      return restoredToken;
    },
    [bootstrap, restoreSession]
  );

  const handleNewCampaign = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROGRESS_KEY_STORAGE_KEY);
    localStorage.removeItem(OPERATION_03_INTERMISSION_KEY);
    localStorage.removeItem(OPERATION_04_INTERMISSION_KEY);
    setCampaignActive(true);
    setToken("");
    setProgressKey("");
    setMe(null);
    setChallenges([]);
    setCurrentId("");
    setDetail(null);
    setBriefingSeenById({});
    setBootedById({});
    setContainmentVerifiedById({});
    setOperation03IntermissionSeen(false);
    setActiveIntermission(null);
    await bootstrap("");
  }, [bootstrap]);

  const handleBeginMission = useCallback(() => {
    if (!currentId) {
      return;
    }
    setBriefingSeenById((prev) => ({ ...prev, [currentId]: true }));
  }, [currentId]);

  // 2-3 Audience Drift has no manual briefing gate: auto-advance past BRIEFING so the
  // BRIEF / INFILTRATE tabs are always available and there is no "Begin Infiltration" button.
  useEffect(() => {
    if (currentId === "level2_3" && phase === "BRIEFING") {
      setBriefingSeenById((prev) => (prev.level2_3 ? prev : { ...prev, level2_3: true }));
    }
  }, [currentId, phase]);

  // Land on the mission with the BRIEF tab pre-selected (objectives + field intel visible).
  useEffect(() => {
    setAdStage("brief");
  }, [currentId]);

  const handleSelectMapNode = useCallback(
    async (challengeId) => {
      if (!token || !challengeId || challengeId === currentId) {
        return;
      }

      const target = challenges.find((challenge) => challenge.id === challengeId);
      const solved = target?.status?.defense === "solved";
      const locked = target?.status?.attack === "locked";
      const isActive = challengeId === activeChallengeId;

      if (locked || (!solved && !isActive)) {
        return;
      }

      setLoading(true);
      setStatusText("Loading selected node...");

      try {
        setCurrentId(challengeId);
        await loadMissionDetail(token, challengeId);
        if (solved) {
          setBriefingSeenById((prev) => ({ ...prev, [challengeId]: true }));
        }
        setStatusText("");
      } catch (error) {
        setStatusText(error.message || "Node transfer failed.");
      } finally {
        setLoading(false);
      }
    },
    [activeChallengeId, challenges, currentId, loadMissionDetail, token]
  );

  const handleExec = useCallback(
    async (nextCommand) => {
      if (!token || !currentId) {
        return;
      }

      // Tolerate pasted shell-prompt prefixes: "$ cmd" / "$ $ cmd" -> "cmd".
      nextCommand = nextCommand.replace(/^\s*(?:\$\s*)+/, "");

      if (currentId === "level3_boss" && nextCommand.trim().toLowerCase() === "clear") {
        setConsoleLogs([]);
        setCommand("");
        setConsoleBusy(false);
        return;
      }

      const id = Date.now();
      setConsoleLogs((prev) => [
        ...prev,
        { id: `${id}-cmd`, type: "command", text: `${prompt}${nextCommand}` },
      ]);
      setConsoleBusy(true);
      setCommand("");

      try {
        const data = await apiRequest(`/challenges/${currentId}/terminal/exec`, {
          method: "POST",
          token,
          body: { command: nextCommand },
        });
        const output = localizeTerminalOutput(
          [data.stdout, data.stderr].filter(Boolean).join("\n"),
          locale,
          currentId
        );

        if (nextCommand.startsWith("defense apply")) {
          setContainmentVerifiedById((prev) => ({ ...prev, [currentId]: false }));
        }

        if (nextCommand.startsWith("defense verify")) {
          try {
            const parsed = JSON.parse(data.stdout || "{}");
            const verified = Boolean(parsed?.data?.verified);
            setContainmentVerifiedById((prev) => ({ ...prev, [currentId]: verified }));
          } catch {
            setContainmentVerifiedById((prev) => ({ ...prev, [currentId]: false }));
          }
        }

        setConsoleLogs((prev) => [
          ...prev,
          {
            id: `${id}-out`,
            type: data.exitCode === 0 ? "output" : "error",
            text: output || `(exit ${data.exitCode})`,
          },
        ]);

        if (currentId === "level2_1") {
          const snapshot = parseCourierSnapshot(data.stdout);
          if (snapshot) {
            setCourierSnapshots((prev) => [...prev, snapshot].slice(-2));
          }
        }

        const traceEntry = extractNetworkTraceFromCommand(nextCommand, data.stdout, token);
        if (traceEntry) {
          const localizedTraceEntry = {
            ...traceEntry,
            body: localizeStructuredValue(traceEntry.body, locale, currentId),
          };
          setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [localizedTraceEntry]));
          const selectorFields = auditSelectorFieldsFromTrace(localizedTraceEntry);
          if (selectorFields.length > 0) {
            setAuditSelectorFields(selectorFields);
          }
        }
      } catch (error) {
        setConsoleLogs((prev) => [
          ...prev,
          { id: `${id}-err`, type: "error", text: localizeTerminalOutput(error.message, locale, currentId) || "terminal request failed" },
        ]);
      } finally {
        setConsoleBusy(false);
      }
    },
    [currentId, locale, prompt, token]
  );

  const handleNetworkTraceProbe = useCallback(async (actionId = "") => {
    if (!token || !story.actionProbe) {
      return;
    }

    const probeActionId = actionId || story.actionProbe.id;
    setNetworkTraceBusy(true);
    setNetworkTraceResult(null);

    try {
      if (probeActionId === "level3_1_mine") {
        const traceUrl = "/api/v1/challenges/level3_1/actions/parcels/mine";
        const response = await fetch(`${API_BASE}/challenges/level3_1/actions/parcels/mine`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const raw = await response.text();
          let message = `probe failed (${response.status})`;
          try {
            const parsed = JSON.parse(raw);
            message = localizeTerminalOutput(
              parsed?.error?.message || parsed?.detail || message,
              locale,
              currentId
            );
          } catch {
            // keep fallback
          }
          setNetworkTraceResult({ ok: false, message });
          return;
        }

        const body = await response.json();
        const capsuleId = body?.data?.capsules?.[0]?.capsule_id || "";
        setNetworkTraceCapsuleId(capsuleId);
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "GET",
            url: traceUrl,
            status: response.status,
            body: localizeStructuredValue(body, locale, "level3_1"),
            token,
            title: "CAPSULE LIST REQUEST",
            trigger: "button",
            curlOverride:
              'curl -v -X GET "/api/v1/challenges/level3_1/actions/parcel?parcel_id=<TARGET_ID>" -H "Authorization: Bearer $SESSION_TOKEN"',
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message: story.actionProbe.success || "Probe sent. Check Network.",
        });
        return;
      }

      if (probeActionId === "level3_2_menu") {
        const traceUrl = "/api/v1/challenges/level3_2/actions/menu";
        const response = await fetch(`${API_BASE}/challenges/level3_2/actions/menu`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const raw = await response.text();
          let message = `probe failed (${response.status})`;
          try {
            const parsed = JSON.parse(raw);
            message = localizeTerminalOutput(
              parsed?.error?.message || parsed?.detail || message,
              locale,
              currentId
            );
          } catch {
            // keep fallback
          }
          setNetworkTraceResult({ ok: false, message });
          return;
        }

        const body = await response.json();
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "GET",
            url: traceUrl,
            status: response.status,
            body: localizeStructuredValue(body, locale, "level3_2"),
            token,
            title: "MENU FEATURES RESPONSE",
            trigger: "button",
            curlOverride:
              'curl -v -X GET "/api/v1/challenges/level3_2/actions/menu" -H "Authorization: Bearer $SESSION_TOKEN"',
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message: story.actionProbe.success || "Menu metadata captured. Open the raw response.",
        });
        return;
      }

      if (probeActionId === "level3_3_capture_flow") {
        const traceUrl = "/api/v1/challenges/level3_3/actions/profile";
        const response = await fetch(`${API_BASE}/challenges/level3_3/actions/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const raw = await response.text();
          let message = `probe failed (${response.status})`;
          try {
            const parsed = JSON.parse(raw);
            message = localizeTerminalOutput(
              parsed?.error?.message || parsed?.detail || message,
              locale,
              currentId
            );
          } catch {
            // keep fallback
          }
          setNetworkTraceResult({ ok: false, message });
          return;
        }

        const body = await response.json();
        const curl = level33SafeUpdateCurl();
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "GET",
            url: traceUrl,
            status: response.status,
            body: localizeStructuredValue(body, locale, "level3_3"),
            token,
            title: "PROFILE LOAD RESPONSE",
            trigger: "button",
            curlOverride:
              'curl -v -X GET "/api/v1/challenges/level3_3/actions/profile" -H "Authorization: Bearer $SESSION_TOKEN"',
          }),
          createTraceEntry({
            method: "PUT",
            url: traceUrl,
            status: "STAGED",
            body: {
              ok: true,
              data: {
                staged: "safe profile update",
                payload: LEVEL3_3_SAFE_PROFILE,
                payloadFields: Object.keys(LEVEL3_3_SAFE_PROFILE),
              },
            },
            token,
            title: "SAFE UPDATE TEMPLATE",
            trigger: "template captured",
            curlOverride: curl,
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message:
            story.actionProbe.success ||
            "Profile save flow captured. 위 Trace를 확인한 뒤 필요한 curl만 Mission Console로 옮겨봐.",
        });
        return;
      }

      if (probeActionId === "level3_4_ticket") {
        const traceUrl = "/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004";
        const response = await fetch(`${API_BASE}/challenges/level3_4/actions/ticket?id=SUP-1004`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const raw = await response.text();
          let message = `probe failed (${response.status})`;
          try {
            const parsed = JSON.parse(raw);
            message = localizeTerminalOutput(
              parsed?.error?.message || parsed?.detail || message,
              locale,
              currentId
            );
          } catch {
            // keep fallback
          }
          setNetworkTraceResult({ ok: false, message });
          return;
        }

        const body = await response.json();
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "GET",
            url: traceUrl,
            status: response.status,
            body: localizeStructuredValue(body, locale, "level3_4"),
            token,
            title: "SUPPORT TICKET RESPONSE",
            trigger: "button",
            curlOverride:
              'curl -v -X GET "/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004" -H "Authorization: Bearer $SESSION_TOKEN"',
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message:
            story.actionProbe.success ||
            "Support archive captured. Preview는 안전해 보여도 Raw Response의 깊은 필드를 확인해봐.",
        });
        return;
      }

      if (probeActionId === "level3_5_inspect_locker" || probeActionId === "level3_5_locker_hint") {
        const traceUrl = "/api/v1/challenges/level3_5/actions/locker/hint?locker_id=RL-MIRA-07";
        const response = await fetch(`${API_BASE}/challenges/level3_5/actions/locker/hint?locker_id=RL-MIRA-07`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const raw = await response.text();
          let message = `probe failed (${response.status})`;
          try {
            const parsed = JSON.parse(raw);
            message = localizeTerminalOutput(
              parsed?.error?.message || parsed?.detail || message,
              locale,
              currentId
            );
          } catch {
            // keep fallback
          }
          setNetworkTraceResult({ ok: false, message });
          return;
        }

        const body = await response.json();
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "GET",
            url: traceUrl,
            status: response.status,
            body: localizeStructuredValue(body, locale, "level3_5"),
            token,
            title: "RELAY LOCKER INSPECTION",
            trigger: "button",
            curlOverride:
              'curl -v -X GET "/api/v1/challenges/level3_5/actions/locker/hint?locker_id=RL-MIRA-07" -H "Authorization: Bearer $SESSION_TOKEN"',
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message:
            story.actionProbe.success ||
            "Relay locker inspection captured. 후보와 정책을 확인한 뒤 unlock 요청을 직접 조정해봐.",
        });
        return;
      }

      if (probeActionId === "level3_5_stage_unlock") {
        const traceUrl = "/api/v1/challenges/level3_5/actions/locker/unlock";
        const curl =
          'curl -v -X POST "/api/v1/challenges/level3_5/actions/locker/unlock" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d \'{"locker_id":"RL-MIRA-07","pin":"<PIN>"}\'';
        setCommand(curl);
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "POST",
            url: traceUrl,
            status: "STAGED",
            body: {
              ok: true,
              data: {
                staged: "relay unlock request",
                payload: {
                  locker_id: "RL-MIRA-07",
                  pin: "<PIN>",
                },
                payloadFields: ["locker_id", "pin"],
                note: "Replace <PIN> in Mission Console before running.",
              },
            },
            token,
            title: "UNLOCK REQUEST TEMPLATE",
            trigger: "template captured",
            curlOverride: curl,
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message:
            locale === "en"
              ? "Unlock request staged in Mission Console. Replace <PIN> before running it."
              : "Unlock request staged in Mission Console. <PIN>만 직접 바꿔서 실행해봐.",
        });
        return;
      }

      if (probeActionId === "level3_boss_review_chain") {
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "INFO",
            url: "/api/v1/challenges/level3_boss/trust-chain",
            status: "REVIEW",
            body: {
              ok: true,
              data: {
                trustFragments: [
                  {
                    label: "BOLA Window",
                    clue: "object id can expose foreign signal capsule",
                  },
                  {
                    label: "Hidden Route",
                    clue: "disabled feature metadata can reveal admin path",
                  },
                  {
                    label: "Profile Poison",
                    clue: "profile model can be polluted by client fields",
                  },
                  {
                    label: "Ticket Vault",
                    clue: "deep JSON can expose internal shard",
                  },
                  {
                    label: "Locker Storm",
                    clue: "missing rate limit can expose relay seed",
                  },
                ],
                message: "Recovered Trust Fragments",
              },
            },
            title: "RECOVERED TRUST FRAGMENTS",
            trigger: "review",
            suppressCurlButton: true,
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message:
            locale === "en"
              ? "Trust fragments reviewed. Continue the chain manually in Mission Console after the first probe."
              : "Trust fragments reviewed. 첫 probe 이후 체인은 Mission Console에서 직접 이어가봐.",
        });
        return;
      }

      if (probeActionId === "level3_boss_stage_first_probe") {
        const traceUrl = "/api/v1/challenges/level3_boss/actions/parcels/mine";
        const curl =
          'curl -v -X GET "/api/v1/challenges/level3_boss/actions/parcels/mine" -H "Authorization: Bearer $SESSION_TOKEN"';
        setCommand(curl);
        setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [
          createTraceEntry({
            method: "GET",
            url: traceUrl,
            status: "STAGED",
            body: {
              ok: true,
              data: {
                staged: "first mirror cage probe",
                payloadFields: [],
                next: "Inspect the response, then mutate the object id manually.",
              },
            },
            token,
            title: "FIRST PROBE TEMPLATE",
            trigger: "template captured",
            curlOverride: curl,
          }),
        ]));
        setNetworkTraceResult({
          ok: true,
          message:
            locale === "en"
              ? "First probe staged in Mission Console. Build each following request from the previous response."
              : "First probe staged in Mission Console. 이후 요청은 응답 단서를 보고 직접 이어가봐.",
        });
        return;
      }

      throw new Error("Unknown field probe.");
    } catch (error) {
      setNetworkTraceResult({
        ok: false,
        message: error.message || "Probe failed.",
      });
    } finally {
      setNetworkTraceBusy(false);
    }
  }, [currentId, locale, story.actionProbe, token]);

  const handleOpenMyCapsule = useCallback(async () => {
    if (!token || !networkTraceCapsuleId) {
      return;
    }

    const traceUrl = `/api/v1/challenges/level3_1/actions/parcel?parcel_id=${encodeURIComponent(
      networkTraceCapsuleId
    )}`;

    setCommand(`curl -v -X GET "${traceUrl}" -H "Authorization: Bearer $SESSION_TOKEN"`);
    setNetworkTraceResult({
      ok: true,
      message:
        locale === "en"
          ? "Detail request queued in Mission Console. $SESSION_TOKEN resolves to the current session inside the console."
          : "Detail request queued in Mission Console. $SESSION_TOKEN은 콘솔 안에서 현재 세션으로 처리돼.",
    });
  }, [locale, networkTraceCapsuleId, token]);

  const handleCopyTraceCurl = useCallback((curl) => {
    setCommand(curl);
    setNetworkTraceResult({
      ok: true,
      message:
        locale === "en"
          ? "curl staged in Mission Console. Edit the required values before running it."
          : "curl staged in Mission Console. 필요한 부분을 직접 수정해서 실행해봐.",
    });

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(curl).catch(() => {});
    }
  }, [locale]);

  const handleAuditSelectorDraftChange = useCallback((field, value) => {
    setAuditSelectorDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleToggleTraceResponse = useCallback((entryId) => {
    setExpandedTraceById((prev) => ({ ...prev, [entryId]: !prev[entryId] }));
  }, []);

  const submitEvidenceValue = useCallback(async (evidenceValue) => {
    const value = (evidenceValue || "").trim();
    if (!token || !currentId || !value) {
      return;
    }

    try {
      const data = await apiRequest(`/challenges/${currentId}/submit-flag`, {
        method: "POST",
        token,
        body: { flag: value },
      });
      const isCorrect = Boolean(data.correct);
      // 오답 문구 우선순위: 값별 전용 문구 → 서버의 세부 flag_feedback → 일반 story 문구.
      // (일반 문구가 서버의 구체적 힌트를 가리지 않도록 serverMessage를 먼저 둔다.)
      const perValueFailure = story.attackFailureByValue?.[value];
      const serverMessage = localizeTerminalOutput(data.message, locale, currentId);
      setEvidenceResult({
        correct: isCorrect,
        message: isCorrect
          ? story.attackSuccessText
          : perValueFailure || serverMessage || story.attackFailureText || "Evidence rejected.",
      });

      if (isCorrect) {
        setAttackNotice(true);
        const refreshed = await refreshMission(token, currentId);
        setNextId(refreshed?.detailData?.next?.id || null);
      }
    } catch (error) {
      setEvidenceResult({ correct: false, message: localizeTerminalOutput(error.message, locale, currentId) || "Evidence rejected." });
    }
  }, [
    currentId,
    locale,
    refreshMission,
    story.attackFailureByValue,
    story.attackFailureText,
    story.attackSuccessText,
    token,
  ]);

  const handleSubmitEvidence = useCallback(async () => {
    const value = flagValue.trim();
    const level12Real = (story.signalBoard?.candidates || []).find((item) => item.correct);
    if (
      currentId === "level1_2" &&
      level12Real &&
      value === level12Real.value &&
      !level12ReasoningReady
    ) {
      setEvidenceResult({
        correct: false,
        gate: true,
        message:
          story.signalBoard?.reasoningGate ||
          "Name why this value is the real session before submitting.",
      });
      return;
    }
    if (
      currentId === "level1_4" &&
      value === story.fragmentBoard?.expectedValue &&
      !level14ReasoningReady
    ) {
      const message = !level14CommitVerified
        ? story.fragmentBoard?.commitGate
        : story.fragmentBoard?.reasoningGate;
      setEvidenceResult({
        correct: false,
        message:
          message ||
          "Boss verification is incomplete. Select the correct reasoning before submitting.",
      });
      return;
    }
    if (
      currentId === "level1_3" &&
      value === story.fragmentBoard?.expectedValue &&
      !level14ReasoningReady
    ) {
      setEvidenceResult({
        correct: false,
        gate: true,
        message:
          story.fragmentBoard?.reasoningGate ||
          "Select the correct reasoning before submitting.",
      });
      return;
    }
    if (
      currentId === "level2_1" &&
      courier21RealValue &&
      value === courier21RealValue &&
      !courier21TriageReady
    ) {
      setEvidenceResult({
        correct: false,
        gate: true,
        message: !courier21PinCorrect
          ? story.courierTriage?.pinGate ||
            "Pin the ticket-shaped Courier header that stayed identical across both snapshots first."
          : story.courierTriage?.reasoningGate ||
            "Select why it is real before submitting — stability, not the name or FLAG shape.",
      });
      return;
    }
    await submitEvidenceValue(flagValue);
  }, [
    courier21PinCorrect,
    courier21RealValue,
    courier21TriageReady,
    currentId,
    flagValue,
    level12ReasoningReady,
    level14CommitVerified,
    level14ReasoningReady,
    story.courierTriage,
    story.fragmentBoard,
    story.signalBoard,
    submitEvidenceValue,
  ]);

  const handleToggleLevel14Reason = useCallback((reasonId) => {
    if (!reasonId) {
      return;
    }
    setLevel14ReasonIds((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    );
  }, []);

  const handleToggleLevel12Reason = useCallback((reasonId) => {
    if (!reasonId) {
      return;
    }
    setLevel12ReasonIds((prev) =>
      prev.includes(reasonId)
        ? prev.filter((id) => id !== reasonId)
        : [...prev, reasonId]
    );
  }, []);

  const handleTogglePatch = useCallback((patchableId) => {
    if (!patchableId) {
      return;
    }
    setSelectedPatchIds((prev) => {
      if (prev.includes(patchableId)) {
        return prev.filter((id) => id !== patchableId);
      }
      return [...prev, patchableId];
    });
  }, []);

  const handleSubmitPatch = useCallback(async () => {
    if (!token || !currentId) {
      return;
    }

    if (requiresTerminalVerification && !containmentVerified) {
      setPatchResult({
        correct: false,
        message:
          locale === "en"
            ? "AEGIS verification isn't finished yet. In the console, run defense apply, then get defense verify to pass."
            : "AEGIS 검증이 아직 안 끝났어. 콘솔에서 defense apply 후 defense verify를 성공시켜줘.",
      });
      return;
    }

    try {
      const data = await apiRequest(`/challenges/${currentId}/submit-patch`, {
        method: "POST",
        token,
        body: { patched: selectedPatchIds },
      });
      const isCorrect = Boolean(data.correct);
      setPatchResult({
        correct: isCorrect,
        message: isCorrect
          ? story.defenseSuccessText
          : localizeTerminalOutput(data.message, locale, currentId) ||
            story.defenseFailureText ||
            "Containment rejected.",
      });

      if (isCorrect) {
        setNextId(data?.next?.id || null);
        await refreshMission(token, currentId);
        setShowDebrief(true);
      }
    } catch (error) {
      setPatchResult({ correct: false, message: localizeTerminalOutput(error.message, locale, currentId) || "Containment rejected." });
    }
  }, [
    containmentVerified,
    currentId,
    locale,
    refreshMission,
    requiresTerminalVerification,
    selectedPatchIds,
    story.defenseFailureText,
    story.defenseSuccessText,
    token,
  ]);

  const handleNextMission = useCallback(async () => {
    if (!token) {
      return;
    }
    const refreshed = await refreshMission(token, currentId);
    const candidate =
      nextId ||
      refreshed?.detailData?.next?.id ||
      refreshed?.meData?.current ||
      detail?.next?.id ||
      "";

    if (candidate) {
      if (shouldShowOperation03Intermission(currentId, candidate, operation03IntermissionSeen)) {
        setActiveIntermission({
          ...getCampaignIntermission("operation03Trace", locale),
          nextId: candidate,
          seenKey: OPERATION_03_INTERMISSION_KEY,
        });
        setShowDebrief(false);
        return;
      }

      if (shouldShowOperation04Intermission(currentId, candidate, operation04IntermissionSeen)) {
        setActiveIntermission({
          ...getCampaignIntermission("operation04Descent", locale),
          nextId: candidate,
          seenKey: OPERATION_04_INTERMISSION_KEY,
        });
        setShowDebrief(false);
        return;
      }

      setCurrentId(candidate);
      await loadMissionDetail(token, candidate);
      setShowDebrief(false);
      return;
    }

    setShowDebrief(false);
    setStatusText("All available campaign nodes are sealed.");
  }, [
    currentId,
    detail?.next?.id,
    loadMissionDetail,
    locale,
    nextId,
    operation03IntermissionSeen,
    operation04IntermissionSeen,
    refreshMission,
    token,
  ]);

  const handleCompleteIntermission = useCallback(async () => {
    if (!activeIntermission) {
      return;
    }

    const seenKey = activeIntermission.seenKey || OPERATION_03_INTERMISSION_KEY;
    localStorage.setItem(seenKey, "1");
    if (seenKey === OPERATION_04_INTERMISSION_KEY) {
      setOperation04IntermissionSeen(true);
    } else {
      setOperation03IntermissionSeen(true);
    }

    const enterStatus =
      (activeIntermission.readyLabel || "").replace(/^Enter\s+/i, "") || "next operation";
    const targetId = activeIntermission.nextId;
    setActiveIntermission(null);

    if (token && targetId && targetId !== currentId) {
      setLoading(true);
      setStatusText("Opening " + enterStatus + "...");
      try {
        setCurrentId(targetId);
        await loadMissionDetail(token, targetId);
        setStatusText("");
      } catch (error) {
        setStatusText(error.message || "Operation transfer failed.");
      } finally {
        setLoading(false);
      }
    }
  }, [activeIntermission, currentId, loadMissionDetail, token]);

  if (!campaignActive) {
    return (
      <CampaignHome
        loading={loading}
        me={me}
        currentChallenge={currentChallenge}
        onContinue={handleContinue}
        onNewCampaign={handleNewCampaign}
        statusText={statusText}
        prologue={prologue}
        locale={locale}
        onLocaleChange={handleLocaleChange}
        progressKey={progressKey}
        onRestoreProgress={handleRestoreProgress}
      />
    );
  }

  if (activeIntermission) {
    return (
      <OperationIntermission
        intermission={activeIntermission}
        busy={loading}
        onContinue={handleCompleteIntermission}
      />
    );
  }

  return (
    <div className={`campaign-page campaign-shell phase-${phase.toLowerCase()}`}>
      <OperationHeader
        operation={operation}
        story={story}
        detail={detail}
        phase={phase}
        onHome={() => setCampaignActive(false)}
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />

      <div className="campaign-grid">
        <AgentStatusPanel me={me} phase={phase} operation={operation} challenges={challenges} />

        <main className="mission-stage">
          {statusText && <div className="campaign-alert">{statusText}</div>}
          {!detail && <section className="mission-loading">Mission data loading...</section>}

          {detail && (
            <>
              <section className="mission-scene">
                <div>
                  <p className="campaign-kicker">{story.location}</p>
                  <h2>{story.title}</h2>
                  <p>{story.briefing}</p>
                </div>
                <div className="threat-readout">
                  <span>THREAT</span>
                  <strong>{story.threat}</strong>
                </div>
              </section>

              {currentId === "level2_3" ? (
                <div className="dialogue-tabs-sticky">
                  <DialoguePanel
                    story={story}
                    phase={phase}
                    attackNotice={attackNotice}
                    locale={locale}
                    dialogueKey={attackNotice ? undefined : "briefing"}
                  />
                  <div className="ad-stepper mission-stage-tabs">
                    <button
                      type="button"
                      className={`ad-step step-brief ${adStage === "brief" ? "active" : ""}`}
                      onClick={() => setAdStage("brief")}
                    >
                      <span className="ad-step-num">01</span>
                      <div className="ad-step-txt"><strong>BRIEF</strong><span>read the target</span></div>
                    </button>
                    <button
                      type="button"
                      className={`ad-step step-infiltrate ${adStage === "infiltrate" ? "active" : ""}`}
                      onClick={() => setAdStage("infiltrate")}
                    >
                      <span className="ad-step-num">02</span>
                      <div className="ad-step-txt"><strong>INFILTRATE</strong><span>route the capsule</span></div>
                    </button>
                  </div>
                </div>
              ) : (
                <DialoguePanel story={story} phase={phase} attackNotice={attackNotice} locale={locale} />
              )}

              {currentId === "level2_3" ? (
                adStage === "brief" && (
                  <div className="ad-brief">
                    <ObjectivePanel
                      story={story}
                      phase={phase}
                      hasUserCommand={consoleLogs.some((entry) => entry.type === "command")}
                    />

                    <IntelPanel
                      key={activeChallengeId}
                      items={story.intel}
                      progressive={story.progressiveHints}
                      locale={locale}
                    />
                  </div>
                )
              ) : (
                <div className="mission-duo">
                  <ObjectivePanel
                    story={story}
                    phase={phase}
                    hasUserCommand={consoleLogs.some((entry) => entry.type === "command")}
                  />

                  {currentId === "level2_5" ? (
                    <Level25FieldGuide story={story} consoleLogs={consoleLogs} locale={locale} />
                  ) : (
                    <IntelPanel
                      key={activeChallengeId}
                      items={story.intel}
                      progressive={story.progressiveHints}
                      locale={locale}
                    />
                  )}
                </div>
              )}

              {phase === "BRIEFING" && (
                <section className="briefing-lock">
                  <p>
                    {usesMemoryVault
                      ? locale === "en"
                        ? "Review the briefing to unlock the Memory Board."
                        : "브리핑을 확인했으면 Memory Board를 열 수 있어."
                      : locale === "en"
                        ? "Review the briefing to unlock the infiltration console."
                        : "작전 브리핑을 확인했으면 침투 콘솔을 열 수 있어."}
                  </p>
                  <button onClick={handleBeginMission}>
                    {usesMemoryVault ? "Open Memory Board" : "Begin Infiltration"}
                  </button>
                </section>
              )}

              {!usesMemoryVault && (
                <NetworkTracePanel
                  probe={story.actionProbe}
                  disabled={phase === "LOCKED" || phase === "BRIEFING"}
                  busy={networkTraceBusy}
                  result={networkTraceResult}
                  entries={networkTraceEntries}
                  capsuleId={networkTraceCapsuleId}
                  auditSelectorFields={currentId === "level3_2" ? auditSelectorFields : []}
                  auditSelectorDraft={auditSelectorDraft}
                  expandedById={expandedTraceById}
                  onSync={handleNetworkTraceProbe}
                  onOpenCapsule={handleOpenMyCapsule}
                  onCopyCurl={handleCopyTraceCurl}
                  onAuditSelectorDraftChange={handleAuditSelectorDraftChange}
                  onToggleResponse={handleToggleTraceResponse}
                />
              )}

              {usesMemoryVault ? (
                phase !== "BRIEFING" && currentId === "level4_1" ? (
                  <Level41MemoryVault
                    phase={phase}
                    evidenceSolved={evidenceSolved}
                    evidenceResult={evidenceResult}
                    onRestoreEvidence={() => submitEvidenceValue(LEVEL4_1_MEMORY_PUZZLE.evidenceShard)}
                    selectedPolicyIds={selectedPatchIds}
                    onTogglePolicy={handleTogglePatch}
                    onSubmitPolicy={handleSubmitPatch}
                    patchResult={patchResult}
                    busy={loading}
                    locale={locale}
                  />
                ) : phase !== "BRIEFING" && currentId === "level4_2" ? (
                  <Level42KeySlotLab
                    phase={phase}
                    evidenceSolved={evidenceSolved}
                    evidenceResult={evidenceResult}
                    onRestoreEvidence={() => submitEvidenceValue(LEVEL4_2_KEY_SLOT_PUZZLE.evidenceShard)}
                    selectedPolicyIds={selectedPatchIds}
                    onTogglePolicy={handleTogglePatch}
                    onSubmitPolicy={handleSubmitPatch}
                    patchResult={patchResult}
                    busy={loading}
                    locale={locale}
                  />
                ) : phase !== "BRIEFING" && currentId === "level4_3" ? (
                  <Level43ReplayStampLab
                    phase={phase}
                    evidenceSolved={evidenceSolved}
                    evidenceResult={evidenceResult}
                    onRestoreEvidence={() => submitEvidenceValue(LEVEL4_3_REPLAY_PUZZLE.evidenceShard)}
                    selectedPolicyIds={selectedPatchIds}
                    onTogglePolicy={handleTogglePatch}
                    onSubmitPolicy={handleSubmitPatch}
                    patchResult={patchResult}
                    busy={loading}
                    token={token}
                    prompt={prompt}
                    consoleLogs={consoleLogs}
                    command={command}
                    setCommand={setCommand}
                    consoleBusy={consoleBusy}
                    onExec={handleExec}
                    locale={locale}
                  />
                ) : null
              ) : (
                <>
                  {currentId === "level2_3" ? (
                    phase !== "BRIEFING" && adStage === "infiltrate" ? (
                    <RequestForge
                      attack={detail?.attack}
                      forge={story.requestForge}
                      token={token}
                      onEvidence={setFlagValue}
                      solved={evidenceSolved}
                      disabled={phase === "LOCKED" || phase === "BRIEFING"}
                      locale={locale}
                    />
                    ) : null
                  ) : (
                    <MissionConsole
                      disabled={phase === "LOCKED" || phase === "BRIEFING"}
                      prompt={prompt}
                      placeholder={story.consolePlaceholder}
                      onExec={handleExec}
                      logs={consoleLogs}
                      command={command}
                      setCommand={setCommand}
                      busy={consoleBusy}
                      helpText={story.consoleGuide || localizeTerminalOutput(detail?.attack?.terminal?.help, locale, currentId)}
                      helpDefaultOpen={currentId === "level3_boss"}
                      starter={story.consoleStarter}
                    />
                  )}

                  {currentId === "level2_5" && phase !== "BRIEFING" && phase !== "LOCKED" && (
                    <Level25DevTools consoleLogs={consoleLogs} locale={locale} />
                  )}

                  {currentId === "level1_2" && (
                    <Level12SignalBoard
                      story={story}
                      logs={consoleLogs}
                      value={flagValue}
                      onSelectCandidate={setFlagValue}
                      solved={evidenceSolved}
                      result={evidenceResult}
                      disabled={phase === "LOCKED" || phase === "BRIEFING" || consoleBusy}
                      selectedReasonIds={level12ReasonIds}
                      onToggleReason={handleToggleLevel12Reason}
                      reasoningReady={level12ReasoningReady}
                    />
                  )}

                  {(currentId === "level1_3" || currentId === "level1_4") && (
                    <Level13FragmentBoard
                      story={story}
                      logs={consoleLogs}
                      onStageEvidence={setFlagValue}
                      solved={evidenceSolved}
                      result={evidenceResult}
                      disabled={phase === "LOCKED" || phase === "BRIEFING" || consoleBusy}
                      selectedReasonIds={level14ReasonIds}
                      onToggleReason={handleToggleLevel14Reason}
                      reasoningReady={level14ReasoningReady}
                    />
                  )}

                  {currentId === "level2_1" && (
                    <CourierTriage
                      triage={story.courierTriage}
                      snapshots={courierSnapshots}
                      correctKey={courier21CorrectKey}
                      pinnedKey={courier21PinnedKey}
                      onPin={handleCourier21Pin}
                      reasoning={courier21Reasoning}
                      selectedReasonIds={courier21ReasonIds}
                      onToggleReason={handleToggleCourier21Reason}
                      reasoningReady={courier21ReasoningReady}
                      solved={evidenceSolved}
                      disabled={phase === "LOCKED" || phase === "BRIEFING" || consoleBusy}
                    />
                  )}

                  {(currentId !== "level2_3" || adStage === "infiltrate") && (
                    <EvidenceSubmit
                      disabled={phase === "LOCKED" || phase === "BRIEFING" || consoleBusy}
                      value={flagValue}
                      onChange={setFlagValue}
                      onSubmit={handleSubmitEvidence}
                      result={evidenceResult}
                      solved={evidenceSolved}
                    />
                  )}
                </>
              )}

              {!usesMemoryVault && attackNotice && phase === "DEFENSE" && (
                <section className="aegis-alert">
                  <strong>AEGIS ALERT</strong>
                  <p>{story.aegis.attackSolved}</p>
                </section>
              )}

              {!usesMemoryVault && (
                <PatchSubmit
                  detail={detail}
                  instruction={story.defenseInstruction}
                  phase={phase}
                  selectedPatchIds={selectedPatchIds}
                  requiresVerification={requiresTerminalVerification}
                  verificationReady={containmentVerified}
                  onToggle={handleTogglePatch}
                  onSubmit={handleSubmitPatch}
                  result={patchResult}
                  busy={loading}
                />
              )}

              {phase === "MISSION_COMPLETE" && (
                <section className="mission-complete-panel">
                  <strong>{story.aegis.complete}</strong>
                  <button onClick={() => setShowDebrief(true)}>Open Debrief</button>
                  <button className="ghost-button" onClick={handleNextMission}>
                    Next Mission
                  </button>
                </section>
              )}
            </>
          )}
        </main>

        <aside className="campaign-side-rail">
          <MiniNetworkMap
            challenges={challenges}
            currentId={currentId}
            activeId={activeChallengeId}
            onSelectNode={handleSelectMapNode}
          />
          <section className="operation-brief">
            <div className="section-heading">
              <span>OPERATION BRIEF</span>
              <strong>{operation.title}</strong>
            </div>
            <p>{operation.summary}</p>
          </section>
        </aside>
      </div>

      {showDebrief && (
        <DebriefModal
          story={story}
          onNext={handleNextMission}
          onClose={() => setShowDebrief(false)}
          hasNext={hasNext}
          locale={locale}
        />
      )}
    </div>
  );
}

export default CampaignMode;

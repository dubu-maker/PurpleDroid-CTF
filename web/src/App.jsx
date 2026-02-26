import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";
import { LESSON_NOTES } from "./content/lessonNotes";

const TOKEN_KEY = "purpledroid_session_token";
const API_BASE_RAW =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8000";

function normalizeApiBase(raw) {
  const trimmed = (raw || "").replace(/\/$/, "");
  if (!trimmed) {
    return "http://localhost:8000/api/v1";
  }
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
}

const API_BASE = normalizeApiBase(API_BASE_RAW);

const FALLBACK_HINTS = {
  level1: [
    { platform: "windows", text: 'adb logcat -d | findstr "PurpleDroid_"' },
    { platform: "unix", text: 'adb logcat -d | grep "PurpleDroid_"' },
  ],
  level1_2: [
    { platform: "windows", text: 'adb logcat -d | findstr "AuthService"' },
    { platform: "unix", text: 'adb logcat -d | grep "AuthService"' },
  ],
  level1_3: [
    { platform: "windows", text: 'adb logcat -d | findstr "part["' },
    { platform: "unix", text: 'adb logcat -d | grep "part["' },
  ],
  level2_3: [
    {
      platform: "windows",
      text: 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data "{\\"parcel_id\\":\\"PD-2026-0001\\"}"',
    },
    {
      platform: "unix",
      text: 'curl -v -X POST http://localhost:8000/api/v1/challenges/level2_3/actions/dispatch --data \'{"parcel_id":"PD-2026-0001"}\'',
    },
    { platform: "all", text: "dispatch_token의 점(.) 2개를 확인하고 payload를 디코딩해." },
  ],
  level2_4: [
    { platform: "all", text: "2-3에서 얻은 dispatch_token을 위조해서 다시 보내봐." },
    {
      platform: "windows",
      text: 'curl.exe -v -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
    },
    {
      platform: "unix",
      text: 'curl -v -X POST http://localhost:8000/api/v1/challenges/level2_4/actions/express -H "Authorization: Bearer <forged_token>"',
    },
    { platform: "all", text: "서버가 signature를 검증하지 않으면 tier/role 변조가 통과할 수 있어." },
  ],
  level2_5: [
    { platform: "all", text: "이 보스는 2-1~2-4 Attack 해결 후 열린다." },
    { platform: "all", text: "버튼 클릭으로는 실패한다. Network 요청을 복제해 직접 재조합해봐." },
    { platform: "all", text: "dispatch_token을 decode해서 warehouse_path를 확인하고 open 요청을 완성해." },
  ],
  level3_1: [
    { platform: "web", text: "F12 Network에서 /actions/parcels/mine 과 /actions/parcel 요청을 확인해." },
    { platform: "all", text: "내 owner와 내 parcel_id suffix 패턴을 비교해봐." },
    { platform: "all", text: "내 번호 주변의 작은 범위를 탐색해봐." },
    {
      platform: "windows",
      text: 'curl.exe -v -X GET "http://localhost:8000/api/v1/challenges/level3_1/actions/parcel?parcel_id=<parcel_id>" -H "Authorization: Bearer <token>"',
    },
    {
      platform: "unix",
      text: "curl -v -X GET 'http://localhost:8000/api/v1/challenges/level3_1/actions/parcel?parcel_id=<parcel_id>' -H 'Authorization: Bearer <token>'",
    },
    { platform: "all", text: "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해." },
  ],
  level3_2: [
    { platform: "web", text: "F12 Network에서 /actions/menu 응답을 열고 features.routeHint를 확인해." },
    { platform: "all", text: "직접 path는 안 나온다. 패턴/키워드 단서로 경로를 추론해야 한다." },
    { platform: "all", text: "숨겨진 기능이 여러 개면 결과를 비교해 진짜 경로를 찾아야 한다." },
    {
      platform: "windows",
      text: 'curl.exe -v http://localhost:8000/api/v1/challenges/level3_2/actions/menu -H "Authorization: Bearer <token>"',
    },
    {
      platform: "unix",
      text: "curl -v http://localhost:8000/api/v1/challenges/level3_2/actions/menu -H 'Authorization: Bearer <token>'",
    },
    { platform: "all", text: "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해." },
  ],
  level3_3: [
    { platform: "web", text: "F12 Network에서 프로필 저장 요청의 Request Payload를 확인해." },
    { platform: "all", text: "UI에 없는 JSON 키를 추가해도 전송은 가능하다." },
    { platform: "all", text: "tier 대신 role 또는 account_info.is_admin을 주입해 /actions/perks 응답을 다시 확인해." },
    {
      platform: "windows",
      text: 'curl -v -X PUT http://localhost:8000/api/v1/challenges/level3_3/actions/profile -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"address\\":\\"Busan\\",\\"role\\":\\"admin\\"}"',
    },
    {
      platform: "unix",
      text: "curl -v -X PUT http://localhost:8000/api/v1/challenges/level3_3/actions/profile -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"address\":\"Busan\",\"role\":\"admin\"}'",
    },
    { platform: "all", text: "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해." },
  ],
  level3_4: [
    { platform: "web", text: "F12 Network에서 /actions/ticket 응답(JSON)을 끝까지 펼쳐봐." },
    { platform: "all", text: "2-1은 Header였다. 이번엔 Body(JSON)다." },
    { platform: "all", text: "debug / meta / internal 키워드를 찾아봐. 값이 FLAG 형태가 아닐 수도 있다." },
    {
      platform: "windows",
      text: 'curl -v "http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004" -H "Authorization: Bearer <token>"',
    },
    {
      platform: "windows",
      text: 'curl -s "http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004" -H "Authorization: Bearer <token>" | findstr RkxB',
    },
    {
      platform: "unix",
      text: "curl -v 'http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004' -H 'Authorization: Bearer <token>'",
    },
    {
      platform: "unix",
      text: "curl -s 'http://localhost:8000/api/v1/challenges/level3_4/actions/ticket?id=SUP-1004' -H 'Authorization: Bearer <token>' | grep RkxB",
    },
    { platform: "all", text: "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해." },
  ],
  level3_5: [
    { platform: "all", text: "PIN은 77** 형태다. 남은 경우의 수는 100개." },
    { platform: "web", text: "Network에서 반복 요청 시 서버가 차단(429/lockout)하는지 확인해." },
    { platform: "all", text: "핵심은 반복 시도 통제의 부재다." },
    {
      platform: "windows",
      text: 'curl -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"locker_id\\":\\"SL-01\\",\\"pin\\":\\"7700\\"}"',
    },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"locker_id\\":\\"SL-01\\",\\"pin\\":\\"7700\\"}" | findstr unlocked',
    },
    {
      platform: "unix",
      text: "curl -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"SL-01\",\"pin\":\"7700\"}'",
    },
    {
      platform: "unix",
      text: "curl -s -X POST http://localhost:8000/api/v1/challenges/level3_5/actions/locker/unlock -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{\"locker_id\":\"SL-01\",\"pin\":\"7700\"}' | grep unlocked",
    },
    { platform: "all", text: "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해." },
    { platform: "all", text: "자동화: seq 7700 7799 | xargs -I{} ... 또는 for i in $(seq 7700 7799); do ...; done" },
  ],
  level3_boss: [
    { platform: "web", text: "택배 상세 조회 요청에서 parcel_id가 어디에 붙는지 먼저 확인해." },
    { platform: "all", text: "VIP 택배 응답에는 audit 단서가 있다. 내 택배에는 없을 수 있다." },
    { platform: "web", text: "menu 응답에는 UI에 숨겨진 관리자 path가 들어있다." },
    { platform: "all", text: "프로필 업데이트는 address 화면이지만 서버가 role까지 저장할 수 있다." },
    { platform: "all", text: "audit 응답 JSON을 끝까지 펼쳐 debug/meta/internal 구조를 확인해." },
    { platform: "all", text: "locker PIN은 78** 형태다. 남은 경우의 수는 100개." },
    {
      platform: "windows",
      text: 'curl -H "Authorization: Bearer <token>" "http://localhost:8000/api/v1/challenges/level3_boss/actions/parcel?parcel_id=PD-1006"',
    },
    {
      platform: "windows",
      text: 'curl -X POST http://localhost:8000/api/v1/challenges/level3_boss/actions/vault/claim -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"vault_ticket\\":\\"<ticket>\\",\\"claim_code\\":\\"<code>\\"}"',
    },
    { platform: "all", text: "DevTools의 Request Headers에서 Authorization 값을 확인해 재사용해." },
  ],
  level4_1: [
    { platform: "web", text: "Network/Sources에서 공개 자산(.js/.map/config) 요청을 찾아봐." },
    { platform: "all", text: "bundle-hint 응답은 어떤 파일을 봐야 하는지 알려준다." },
    { platform: "all", text: "js 본문에 키가 바로 안 보이면 sourceMappingURL 주석을 따라 .map 파일을 열어봐." },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_1/actions/public/bundle-hint',
    },
    {
      platform: "windows",
      text: "curl -s http://localhost:8000/api/v1/challenges/level4_1/actions/public/assets/pd.partner.config.5f3c2a.js",
    },
    {
      platform: "windows",
      text: "curl -s http://localhost:8000/api/v1/challenges/level4_1/actions/public/assets/pd.partner.config.5f3c2a.js.map",
    },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_1/actions/partner/handshake -H "Authorization: Bearer <token>" -H "X-Partner-Key: <key>"',
    },
    { platform: "all", text: "유출된 키로 partner/handshake를 호출해 FLAG를 획득해." },
  ],
  level4_2: [
    { platform: "all", text: "pass/issue로 PartnerPass를 받아 header.kid와 payload.role을 먼저 확인해." },
    { platform: "all", text: "keys/jwks를 열어 active/legacy kid 목록을 확인해." },
    { platform: "all", text: "kid는 서버가 어떤 키로 검증할지 고르는 단서다." },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_2/actions/pass/issue -H "Authorization: Bearer <token>"',
    },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_2/actions/keys/jwks -H "Authorization: Bearer <token>"',
    },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_2/actions/admin/audit -H "Authorization: Bearer <token>" -H "X-Partner-Pass: <forged_pass>"',
    },
    { platform: "all", text: "jwt-decode로 kid/role/scope를 확인하고 forged pass를 넣어 admin/audit를 시도해." },
  ],
  level4_3: [
    { platform: "all", text: "유효한 요청과 새로운 요청은 다르다. event_id 재사용이 막히는지 확인해." },
    { platform: "web", text: "같은 /actions/event/delivered 요청을 재전송해서 count가 계속 증가하는지 봐." },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_3/actions/event/delivered -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"event_id\\":\\"EVT-2026-DEL-001\\",\\"parcel_id\\":\\"PD-1004\\",\\"status\\":\\"delivered\\"}"',
    },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_3/actions/stamps -H "Authorization: Bearer <token>"',
    },
    { platform: "all", text: "같은 event_id로 stamp가 누적되면 replay 방어(idempotency)가 빠진 상태다." },
  ],
  level4_4: [
    { platform: "all", text: "차단 응답의 seenClientIp/hint를 먼저 확인해. 서버가 어떤 IP를 믿는지 단서가 있다." },
    { platform: "web", text: "whoami에서 remoteAddr/seenClientIp/xff를 비교하고 XFF 넣었을 때 변화를 확인해." },
    {
      platform: "windows",
      text: 'curl -i -s http://localhost:8000/api/v1/challenges/level4_4/actions/public/gateway-status',
    },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_4/actions/whoami -H "Authorization: Bearer <token>" -H "X-Forwarded-For: <gateway_ip>, 10.0.0.1"',
    },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_4/actions/partner/settlement -H "Authorization: Bearer <token>" -H "X-Forwarded-For: <gateway_ip>, 10.0.0.1" -H "Content-Type: application/json" -d "{}"',
    },
    { platform: "all", text: "XFF가 여러 개면 첫 번째 IP를 client로 쓰는 서버가 많다." },
  ],
  level4_5: [
    { platform: "all", text: "webhook은 사용자 세션 버튼이 아니라 서버 입력 채널이다. 먼저 /webhook/spec을 확인해." },
    { platform: "all", text: "signing string은 '<timestamp>.<raw_body>' 형태다." },
    { platform: "all", text: "시크릿은 4-1 공개 자산에서 유출됐을 수 있다. PARTNER_WEBHOOK_SECRET 키워드를 찾아봐." },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_5/actions/webhook/spec',
    },
    {
      platform: "windows",
      text: 'sign-webhook <timestamp> "{\\"type\\":\\"parcel.delivered\\",\\"parcel_id\\":\\"PD-1004\\",\\"delivered_at\\":1739999999,\\"meta\\":{\\"courier\\":\\"PurpleDroid\\"}}"',
    },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_5/actions/webhook/receive -H "X-Webhook-Timestamp: <ts>" -H "X-Webhook-Event-Id: EVT-9001" -H "X-Webhook-Signature: <sig>" -H "Content-Type: application/json" --data-raw "{\\"type\\":\\"parcel.delivered\\",\\"parcel_id\\":\\"PD-1004\\",\\"delivered_at\\":1739999999,\\"meta\\":{\\"courier\\":\\"PurpleDroid\\"}}"',
    },
    {
      platform: "windows",
      text: 'curl -s "http://localhost:8000/api/v1/challenges/level4_5/actions/track?parcel_id=PD-1004" -H "Authorization: Bearer <token>"',
    },
  ],
  level4_boss: [
    { platform: "web", text: "public/status에서 assetHint를 먼저 찾고 공개 자산 파일을 확인해." },
    { platform: "all", text: "asset에서 LEGACY_KID와 WEBHOOK_SECRET_B64 단서를 확보해." },
    { platform: "all", text: "jwks로 legacy kid/k 값을 확인하고 admin PartnerPass를 위조해 admin/config를 열어." },
    { platform: "all", text: "config JSON에서 ticket/webhookReceive/vaultClaim 경로를 추출해." },
    { platform: "all", text: "webhook은 accepted가 아니라 credited가 올라가야 스탬프가 누적된다." },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_boss/actions/public/status',
    },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_boss/actions/keys/jwks -H "Authorization: Bearer <token>"',
    },
    {
      platform: "windows",
      text: "jwt-sign-hs256 pd-2024-legacy <legacy_secret> '{\"iss\":\"PurpleDroid\",\"aud\":\"partner-hub\",\"sub\":\"user_1004\",\"role\":\"admin\",\"iat\":<now>,\"exp\":<future>}'",
    },
    {
      platform: "windows",
      text: 'curl -s http://localhost:8000/api/v1/challenges/level4_boss/actions/admin/config -H "Authorization: Bearer <token>" -H "X-Partner-Pass: <jwt>"',
    },
    {
      platform: "windows",
      text: "sign-webhook <timestamp> '<raw_json>'",
    },
    {
      platform: "windows",
      text: 'curl -s -X POST http://localhost:8000/api/v1/challenges/level4_boss/actions/vault/claim -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"ticket\\":\\"VT-8F3D-2C9A-2026\\"}"',
    },
  ],
};

const TERMINAL_INTRO_HINTS = {
  level1: "로그를 직접 조회해서 FLAG 패턴을 찾아봐.",
  level1_2: "로그 안의 여러 후보 중 문맥상 진짜 값을 골라봐.",
  level1_3: "조각난 문자열을 찾아 순서를 맞춰 이어붙여봐.",
  level2_1: "curl로 요청을 보내고 응답 헤더를 확인해.",
  level2_2: "curl POST의 JSON body 값을 바꿔서 다시 보내봐.",
  level2_3: "응답의 dispatch_token을 디코딩해서 payload를 확인해.",
  level2_4: "위조한 토큰을 Authorization 헤더로 보내 Express Lane 응답을 확인해.",
  level2_5: "클릭은 실패한다. 토큰/헤더/바디를 직접 조합해 봉인 창고를 열어봐.",
  level3_1: "내 택배(owner/parcel 패턴)를 확인하고 주변 parcel_id를 탐색해봐.",
  level3_2: "menu 응답의 routeHint 단서로 숨은 경로를 추론해 호출해봐.",
  level3_3: "프로필 저장 body를 변조해 role/is_admin을 주입한 뒤 perks를 조회해봐.",
  level3_4: "지원 티켓 응답 JSON을 끝까지 펼쳐 debug/internal 필드를 확인해봐.",
  level3_5: "PIN은 77**. seq/xargs/for 루프로 자동화해 unlock 응답 변화를 관찰해봐.",
  level3_boss: "체인 공격: parcel -> profile -> menu/audit -> locker -> vault claim",
  level4_1: "공개 번들의 sourceMappingURL 단서를 따라 .map에서 원본 설정을 확인한 뒤 handshake를 호출해봐.",
  level4_2: "PartnerPass의 kid를 관찰하고 legacy 경로를 이용해 admin/audit를 호출해봐.",
  level4_3: "같은 delivered 이벤트를 반복 전송하고 stamps count가 누적되는지 확인해봐.",
  level4_4: "whoami와 settlement를 비교해 서버가 신뢰하는 client ip 결정을 관찰해봐.",
  level4_5: "webhook spec을 확인하고 sign-webhook으로 서명을 만든 뒤 receive -> track 흐름을 연결해봐.",
  level4_boss: "public/status -> jwks -> admin/config -> signed webhook -> vault claim 체인을 완성해봐.",
};

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

function StatusPill({ value }) {
  return <span className={`pill pill-${value}`}>{value}</span>;
}

function challengeShortLabel(challenge, index) {
  const fromTitle = challenge?.title?.match(/\b\d-\d\b/)?.[0];
  if (fromTitle) {
    return fromTitle;
  }
  if (challenge?.id === "level1") {
    return "1-1";
  }
  if (challenge?.id === "level1_2") {
    return "1-2";
  }
  if (challenge?.id === "level1_3") {
    return "1-3";
  }
  if (challenge?.id === "level3_boss") {
    return "3-B";
  }
  if (challenge?.id === "level4_boss") {
    return "4-B";
  }
  return `L${index + 1}`;
}

function deriveLevelNumber(challenge, index) {
  const level = Number(challenge?.level);
  if (Number.isFinite(level) && level > 0) {
    return level;
  }
  const label = challengeShortLabel(challenge, index);
  const matched = label.match(/^(\d+)/);
  return matched ? Number(matched[1]) : 1;
}

function resolveHints(detail, challengeId) {
  const serverHints = detail?.attack?.hints;
  if (Array.isArray(serverHints) && serverHints.length > 0) {
    return serverHints;
  }
  return FALLBACK_HINTS[challengeId] || [];
}

function XTermPanel({ disabled, prompt, introHint, onExec, busy, onBusyChange }) {
  const hostRef = useRef(null);
  const bufferRef = useRef("");
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const busyRef = useRef(false);
  const autoFollowRef = useRef(true);
  const viewportRef = useRef(null);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 13,
      scrollback: 20000,
      scrollOnUserInput: true,
      scrollOnPaste: true,
      theme: {
        background: "#0f172a",
        foreground: "#d1fae5",
      },
    });

    const ensureScrollBottom = (force = false) => {
      if (!force && !autoFollowRef.current) {
        return;
      }
      if (force) {
        autoFollowRef.current = true;
      }
      term.scrollToBottom();
      const scrollToEnd = () => {
        const viewport = viewportRef.current || hostRef.current?.querySelector(".xterm-viewport");
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
          const gap = viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
          autoFollowRef.current = gap <= 4;
        }
        term.scrollToBottom();
      };
      requestAnimationFrame(scrollToEnd);
      setTimeout(scrollToEnd, 0);
    };

    const sanitizePastedText = (text) => {
      if (!text) {
        return "";
      }
      return text.replace(/\r\n/g, "\n").replace(/\n/g, " ");
    };

    const clearCurrentInput = () => {
      const text = bufferRef.current;
      if (!text) {
        return;
      }
      for (let i = 0; i < text.length; i += 1) {
        term.write("\b \b");
      }
      bufferRef.current = "";
      ensureScrollBottom(false);
    };

    const resetInputState = () => {
      bufferRef.current = "";
      historyIndexRef.current = -1;
    };

    const writePrompt = () => {
      term.write(prompt);
      ensureScrollBottom(true);
    };

    term.open(hostRef.current);
    term.focus();
    const viewport = hostRef.current?.querySelector(".xterm-viewport");
    viewportRef.current = viewport || null;
    const handleViewportScroll = () => {
      const node = viewportRef.current;
      if (!node) {
        return;
      }
      const gap = node.scrollHeight - (node.scrollTop + node.clientHeight);
      autoFollowRef.current = gap <= 4;
    };
    viewportRef.current?.addEventListener("scroll", handleViewportScroll, { passive: true });
    handleViewportScroll();

    term.writeln("PurpleDroid fake terminal");
    if (introHint) {
      term.writeln(`Type: ${introHint}`);
    }
    writePrompt();

    const copySelection = async () => {
      const selected = term.getSelection();
      if (!selected) {
        return;
      }
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(selected);
      } catch {
        // Ignore clipboard permission failures.
      }
    };

    const pasteFromClipboard = async () => {
      if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
        return;
      }
      try {
        const text = await navigator.clipboard.readText();
        const clean = sanitizePastedText(text);
        if (!clean) {
          return;
        }
        bufferRef.current += clean;
        term.write(clean);
        ensureScrollBottom(false);
      } catch {
        // Ignore clipboard permission failures.
      }
    };

    const keySub = term.onKey(({ domEvent }) => {
      const key = domEvent.key.toLowerCase();
      const hasMod = domEvent.ctrlKey || domEvent.metaKey;

      if (hasMod && key === "v") {
        domEvent.preventDefault();
        pasteFromClipboard();
        return;
      }

      if (hasMod && key === "c" && term.hasSelection()) {
        domEvent.preventDefault();
        copySelection();
      }
    });

    const onDataSub = term.onData((data) => {
      if (data === "\x1b[A" || data === "\x1bOA") {
        const history = historyRef.current;
        if (!history.length) {
          return;
        }
        if (historyIndexRef.current === -1) {
          historyIndexRef.current = history.length - 1;
        } else {
          historyIndexRef.current = Math.max(0, historyIndexRef.current - 1);
        }
        clearCurrentInput();
        bufferRef.current = history[historyIndexRef.current] || "";
        term.write(bufferRef.current);
        ensureScrollBottom(true);
        return;
      }

      if (data === "\x1b[B" || data === "\x1bOB") {
        const history = historyRef.current;
        if (!history.length || historyIndexRef.current === -1) {
          return;
        }
        if (historyIndexRef.current >= history.length - 1) {
          historyIndexRef.current = -1;
          clearCurrentInput();
        } else {
          historyIndexRef.current += 1;
          clearCurrentInput();
          bufferRef.current = history[historyIndexRef.current] || "";
          term.write(bufferRef.current);
        }
        ensureScrollBottom(true);
        return;
      }

      if (data === "\x1b[D" || data === "\x1bOD" || data === "\x1b[C" || data === "\x1bOC") {
        return;
      }

      if (data === "\x1b[H" || data === "\x1bOH" || data === "\u0001") {
        return;
      }

      if (data === "\x1b[F" || data === "\x1bOF" || data === "\u0005") {
        return;
      }

      if (data === "\u0003") {
        if (term.hasSelection()) {
          copySelection();
          return;
        }
        term.write("^C\r\n");
        resetInputState();
        writePrompt();
        ensureScrollBottom();
        return;
      }

      // Ctrl+U: 현재 입력 라인 전체 삭제
      if (data === "\u0015") {
        clearCurrentInput();
        return;
      }

      if (data.startsWith("\x1b")) {
        return;
      }

      if (data.length > 1) {
        const clean = sanitizePastedText(data);
        if (!clean) {
          return;
        }
        bufferRef.current += clean;
        term.write(clean);
        ensureScrollBottom(false);
        return;
      }

      if (data === "\r") {
        const command = bufferRef.current.trim();
        term.write("\r\n");
        resetInputState();

        if (!command) {
          writePrompt();
          ensureScrollBottom();
          return;
        }

        const history = historyRef.current;
        if (history[history.length - 1] !== command) {
          history.push(command);
          if (history.length > 100) {
            history.shift();
          }
        }

        if (command === "clear" || command === "cls") {
          historyRef.current = [];
          resetInputState();
          autoFollowRef.current = true;
          term.writeln("clear is disabled in this terminal.");
          writePrompt();
          term.focus();
          return;
        }

        if (busyRef.current) {
          term.writeln("busy...");
          writePrompt();
          ensureScrollBottom();
          return;
        }

        if (disabled) {
          term.writeln("Attack is locked for this challenge.");
          writePrompt();
          ensureScrollBottom();
          return;
        }

        onBusyChange(true);
        onExec(command)
          .then((result) => {
            if (result.stdout) {
              term.write(result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\r\n`);
            }
            if (result.stderr) {
              term.writeln(`[stderr] ${result.stderr}`);
            }
            term.writeln(`[exit ${result.exitCode}]`);
            if (result.truncated) {
              term.writeln("[output truncated]");
            }
            ensureScrollBottom(true);
          })
          .catch((error) => {
            if (error.status === 429) {
              term.writeln("[error] Too many requests. Slow down.");
            } else {
              term.writeln(`[error] ${error.message}`);
            }
            ensureScrollBottom(true);
          })
          .finally(() => {
            onBusyChange(false);
            writePrompt();
            ensureScrollBottom(true);
          });
        return;
      }

      if (data === "\x1b[3~" || data === "\u007F") {
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write("\b \b");
          ensureScrollBottom(false);
        }
        return;
      }

      if (data >= " ") {
        bufferRef.current += data;
        term.write(data);
        ensureScrollBottom(false);
      }
    });

    return () => {
      viewportRef.current?.removeEventListener("scroll", handleViewportScroll);
      keySub.dispose();
      onDataSub.dispose();
      term.dispose();
      viewportRef.current = null;
    };
  }, [disabled, introHint, onBusyChange, onExec, prompt]);

  return <div className="terminal-host" ref={hostRef} />;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [challenges, setChallenges] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detailsById, setDetailsById] = useState({});
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState("attack");
  const [flagById, setFlagById] = useState({});
  const [resultById, setResultById] = useState({});
  const [terminalBusyById, setTerminalBusyById] = useState({});
  const [actionMessageById, setActionMessageById] = useState({});
  const [hintOpenById, setHintOpenById] = useState({});
  const [unixHintOpenById, setUnixHintOpenById] = useState({});
  const [deepHintOpenById, setDeepHintOpenById] = useState({});
  const [lessonOpenById, setLessonOpenById] = useState({});
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);

  const detailsRef = useRef({});
  const prefetchedTicketRef = useRef({});

  const updateDetailCache = useCallback((id, detail) => {
    setDetailsById((prev) => {
      const next = { ...prev, [id]: detail };
      detailsRef.current = next;
      return next;
    });
  }, []);

  const createSession = useCallback(async () => {
    const data = await apiRequest("/session", {
      method: "POST",
      body: { client: { source: "vite-react" } },
    });
    localStorage.setItem(TOKEN_KEY, data.sessionToken);
    setToken(data.sessionToken);
    return data.sessionToken;
  }, []);

  const loadChallenges = useCallback(async (sessionToken) => {
    const data = await apiRequest("/challenges", {
      token: sessionToken,
    });
    const list = data.challenges || [];
    setChallenges(list);
    setSelectedId((prev) => {
      if (prev && list.some((item) => item.id === prev)) {
        return prev;
      }
      return list[0]?.id || "";
    });
    return list;
  }, []);

  const loadMe = useCallback(async (sessionToken) => {
    const data = await apiRequest("/me", { token: sessionToken });
    setMe(data);
  }, []);

  const loadDetail = useCallback(
    async (sessionToken, challengeId, force = false) => {
      if (!force && detailsRef.current[challengeId]) {
        return detailsRef.current[challengeId];
      }
      const data = await apiRequest(`/challenges/${challengeId}`, {
        token: sessionToken,
      });
      updateDetailCache(challengeId, data);
      return data;
    },
    [updateDetailCache]
  );

  const refreshAll = useCallback(
    async (sessionToken) => {
      await Promise.all([loadChallenges(sessionToken), loadMe(sessionToken)]);
    },
    [loadChallenges, loadMe]
  );

  useEffect(() => {
    if (token) {
      return;
    }
    createSession().catch((error) => {
      setStatusText(error.message);
    });
  }, [createSession, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    refreshAll(token)
      .catch(async (error) => {
        if (error.status === 401) {
          const newToken = await createSession();
          await refreshAll(newToken);
          return;
        }
        throw error;
      })
      .catch((error) => {
        setStatusText(error.message);
      })
      .finally(() => setLoading(false));
  }, [createSession, refreshAll, token]);

  useEffect(() => {
    if (!token || !selectedId) {
      return;
    }
    setActiveTab("attack");
    loadDetail(token, selectedId, true).catch((error) => setStatusText(error.message));
  }, [loadDetail, selectedId, token]);

  useEffect(() => {
    if (!token || selectedId !== "level3_4") {
      return;
    }
    const cacheKey = `${token}:SUP-1004`;
    if (prefetchedTicketRef.current[cacheKey]) {
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/challenges/level3_4/actions/ticket?id=SUP-1004`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then(async (response) => {
        const raw = await response.text();
        if (cancelled) {
          return;
        }
        prefetchedTicketRef.current[cacheKey] = {
          ok: response.ok,
          status: response.status,
          raw,
          fetchedAt: Date.now(),
        };
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        prefetchedTicketRef.current[cacheKey] = {
          ok: false,
          status: 0,
          raw: "",
          fetchedAt: Date.now(),
        };
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, token]);

  const detail = detailsById[selectedId] || null;
  const currentFlag = flagById[selectedId] || "";
  const currentResult = resultById[selectedId] || null;
  const currentTerminalBusy = terminalBusyById[selectedId] || false;
  const currentActionMessage = actionMessageById[selectedId] || "";
  const hintOpen = Boolean(hintOpenById[selectedId]);
  const unixHintOpen = Boolean(unixHintOpenById[selectedId]);
  const deepHintOpen = Boolean(deepHintOpenById[selectedId]);
  const lessonNote = LESSON_NOTES[selectedId] || null;
  const lessonOpen = Boolean(lessonOpenById[selectedId]);
  const solvedFromServer = detail?.status?.attack === "solved";
  const effectiveSolved = Boolean(currentResult?.correct || solvedFromServer);
  const selectedChallenge = useMemo(
    () => challenges.find((item) => item.id === selectedId) || null,
    [challenges, selectedId]
  );
  const selectedLevel = useMemo(() => {
    const detailLevel = Number(detail?.level);
    if (Number.isFinite(detailLevel) && detailLevel > 0) {
      return detailLevel;
    }
    if (!selectedChallenge) {
      return 1;
    }
    const idx = challenges.findIndex((item) => item.id === selectedChallenge.id);
    return deriveLevelNumber(selectedChallenge, idx >= 0 ? idx : 0);
  }, [challenges, detail?.level, selectedChallenge]);
  const challengeGroups = useMemo(() => {
    const grouped = new Map();
    challenges.forEach((item, idx) => {
      const level = deriveLevelNumber(item, idx);
      if (!grouped.has(level)) {
        grouped.set(level, []);
      }
      grouped.get(level).push({ item, idx });
    });
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, entries]) => ({ level, entries }));
  }, [challenges]);
  const showGuidedActions =
    selectedId === "level2_1" ||
    selectedId === "level2_2" ||
    selectedId === "level2_3" ||
    selectedId === "level2_5" ||
    selectedId === "level3_1" ||
    selectedId === "level3_2" ||
    selectedId === "level3_4" ||
    selectedId === "level3_5" ||
    selectedId === "level3_boss" ||
    selectedId === "level4_1" ||
    selectedId === "level4_2" ||
    selectedId === "level4_3" ||
    selectedId === "level4_4" ||
    selectedId === "level4_5" ||
    selectedId === "level4_boss";

  const selectedPatchIds = useMemo(
    () => (Array.isArray(resultById[`patch:${selectedId}`]) ? resultById[`patch:${selectedId}`] : []),
    [resultById, selectedId]
  );

  const hints = useMemo(() => resolveHints(detail, selectedId), [detail, selectedId]);
  const displayHints = useMemo(() => {
    if (selectedId !== "level2_1") {
      return hints;
    }
    return hints.filter((hint) => hint.platform !== "android");
  }, [hints, selectedId]);
  const progressiveHints = useMemo(() => {
    if (selectedId !== "level2_2") {
      return { main: displayHints, extra: [] };
    }
    return {
      main: displayHints.filter((hint) => hint.platform !== "all"),
      extra: displayHints.filter((hint) => hint.platform === "all"),
    };
  }, [displayHints, selectedId]);
  const unixHints = useMemo(
    () => progressiveHints.main.filter((hint) => hint.platform === "unix"),
    [progressiveHints.main]
  );
  const primaryHints = useMemo(
    () => progressiveHints.main.filter((hint) => hint.platform !== "unix"),
    [progressiveHints.main]
  );
  const primaryHint = useMemo(
    () => TERMINAL_INTRO_HINTS[selectedId] || "터미널에 명령을 입력해 단서를 수집해.",
    [selectedId]
  );

  useEffect(() => {
    if (!selectedId || !lessonNote || !effectiveSolved) {
      return;
    }
    setLessonOpenById((prev) => (prev[selectedId] ? prev : { ...prev, [selectedId]: true }));
  }, [effectiveSolved, lessonNote, selectedId]);

  const setCurrentFlag = useCallback(
    (value) => {
      if (!selectedId) {
        return;
      }
      setFlagById((prev) => ({ ...prev, [selectedId]: value }));
    },
    [selectedId]
  );

  const togglePatch = useCallback(
    (patchableId) => {
      if (!selectedId || !patchableId) {
        return;
      }
      setResultById((prev) => {
        const patchKey = `patch:${selectedId}`;
        const current = new Set(Array.isArray(prev[patchKey]) ? prev[patchKey] : []);
        if (current.has(patchableId)) {
          current.delete(patchableId);
        } else {
          current.add(patchableId);
        }
        return {
          ...prev,
          [patchKey]: Array.from(current),
        };
      });
    },
    [selectedId]
  );

  const updateTerminalBusy = useCallback(
    (isBusy) => {
      if (!selectedId) {
        return;
      }
      setTerminalBusyById((prev) => ({ ...prev, [selectedId]: isBusy }));
    },
    [selectedId]
  );

  const handleExec = useCallback(
    async (command) => {
      if (!token || !selectedId) {
        throw new Error("Session or challenge is missing");
      }
      return apiRequest(`/challenges/${selectedId}/terminal/exec`, {
        method: "POST",
        token,
        body: { command },
      });
    },
    [selectedId, token]
  );

  const resolveNextId = useCallback(
    (challengeId, preferredNextId) => {
      if (preferredNextId) {
        return preferredNextId;
      }
      const detailNextId = detailsRef.current[challengeId]?.next?.id;
      if (detailNextId) {
        return detailNextId;
      }
      const idx = challenges.findIndex((item) => item.id === challengeId);
      if (idx < 0 || idx + 1 >= challenges.length) {
        return null;
      }
      return challenges[idx + 1].id;
    },
    [challenges]
  );
  const nextChallengeId = useMemo(
    () => resolveNextId(selectedId, currentResult?.nextId || detail?.next?.id || null),
    [currentResult?.nextId, detail?.next?.id, resolveNextId, selectedId]
  );
  const nextButtonLabel = useMemo(() => {
    const shouldGoDefense =
      activeTab === "attack" &&
      Boolean(detail?.defense?.enabled) &&
      detail?.status?.defense !== "solved";
    if (shouldGoDefense) {
      return "Defense ->";
    }
    return nextChallengeId ? "Next Level ->" : "Finish";
  }, [activeTab, detail?.defense?.enabled, detail?.status?.defense, nextChallengeId]);

  const handleSubmitFlag = useCallback(async () => {
    if (!token || !selectedId || !currentFlag.trim()) {
      return;
    }

    try {
      const data = await apiRequest(`/challenges/${selectedId}/submit-flag`, {
        method: "POST",
        token,
        body: { flag: currentFlag.trim() },
      });

      const refreshedDetail = await loadDetail(token, selectedId, true);
      await Promise.all([loadChallenges(token), loadMe(token)]);

      const nextId = resolveNextId(selectedId, data?.next?.id || refreshedDetail?.next?.id || null);
      const isCorrect = Boolean(data?.correct);

      setResultById((prev) => ({
        ...prev,
        [selectedId]: {
          correct: isCorrect,
          nextId,
          message: isCorrect
            ? nextId
              ? "Correct! Level Cleared 🎉"
              : "All Challenges Cleared! 🏆"
            : "Wrong Flag ❌",
        },
      }));
    } catch (error) {
      setResultById((prev) => ({
        ...prev,
        [selectedId]: {
          correct: false,
          nextId: null,
          message: error.message || "Wrong Flag ❌",
        },
      }));
    }
  }, [currentFlag, loadChallenges, loadDetail, loadMe, resolveNextId, selectedId, token]);

  const handleNextLevel = useCallback(() => {
    if (!selectedId) {
      return;
    }
    const shouldGoDefense =
      activeTab === "attack" &&
      Boolean(detail?.defense?.enabled) &&
      detail?.status?.defense !== "solved";
    if (shouldGoDefense) {
      setActiveTab("defense");
      return;
    }
    const current = resultById[selectedId];
    const nextId = resolveNextId(selectedId, current?.nextId || null);
    if (nextId) {
      setSelectedId(nextId);
      setActiveTab("attack");
      return;
    }
    setResultById((prev) => ({
      ...prev,
      [selectedId]: {
        correct: true,
        nextId: null,
        message: "All Challenges Cleared! 🏆",
      },
    }));
  }, [activeTab, detail?.defense?.enabled, detail?.status?.defense, resolveNextId, resultById, selectedId]);

  const handleSubmitPatch = useCallback(async () => {
    if (!token || !selectedId) {
      return;
    }
    const patchKey = `patch:${selectedId}`;
    const patched = Array.isArray(resultById[patchKey]) ? resultById[patchKey] : [];
    const data = await apiRequest(`/challenges/${selectedId}/submit-patch`, {
      method: "POST",
      token,
      body: { patched },
    });
    setStatusText(data.message);
    await Promise.all([refreshAll(token), loadDetail(token, selectedId, true)]);
  }, [loadDetail, refreshAll, resultById, selectedId, token]);

  const handleTrackRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level2_1/actions/track`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback message
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "요청 전송 완료. DevTools Network에서 /actions/track 요청을 클릭하고 Response Headers에서 X-Courier-Ticket을 확인해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleOrderRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level2_2/actions/order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: "A102", tier: "standard" }),
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback message
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "요청 전송 완료. DevTools Network에서 /actions/order 요청의 Request Payload를 열고 tier 값을 확인해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleDispatchRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level2_3/actions/dispatch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parcel_id: "PD-2026-0001" }),
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback message
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "요청 전송 완료. DevTools Network에서 /actions/dispatch 응답 body의 dispatch_token을 확인해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleBossGateAttempt = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const dispatchResponse = await fetch(`${API_BASE}/challenges/level2_5/actions/dispatch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parcel_id: "PD-2026-0001" }),
        cache: "no-store",
      });

      if (!dispatchResponse.ok) {
        const raw = await dispatchResponse.text();
        let message = `요청 실패 (${dispatchResponse.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }

      const dispatchData = await dispatchResponse.json();
      const dispatchToken = dispatchData?.dispatch_token;
      if (!dispatchToken) {
        setActionMessageById((prev) => ({
          ...prev,
          [selectedId]: "dispatch_token을 받지 못했어. 서버 응답을 확인해줘.",
        }));
        return;
      }

      const openResponse = await fetch(`${API_BASE}/challenges/level2_5/actions/open`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dispatchToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ warehouse_path: "sealed-warehouse-7f3", tier: "standard" }),
        cache: "no-store",
      });

      const openRaw = await openResponse.text();
      let openPayload = null;
      try {
        openPayload = openRaw ? JSON.parse(openRaw) : null;
      } catch {
        openPayload = null;
      }

      const reason = openPayload?.message || `blocked (${openResponse.status})`;
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          `클릭 요청 차단됨: ${reason}. Network에서 dispatch_token을 꺼내고, 토큰/헤더/바디를 직접 조합해서 다시 호출해.`,
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleMyParcelRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const mineResponse = await fetch(`${API_BASE}/challenges/level3_1/actions/parcels/mine`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!mineResponse.ok) {
        const raw = await mineResponse.text();
        let message = `요청 실패 (${mineResponse.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }

      const mineRaw = await mineResponse.text();
      let mineParsed = null;
      try {
        mineParsed = mineRaw ? JSON.parse(mineRaw) : null;
      } catch {
        mineParsed = null;
      }
      const mineData = mineParsed?.data || mineParsed || {};
      const mineParcelId = mineData?.parcels?.[0]?.parcel_id || "PD-1004";

      const detailResponse = await fetch(
        `${API_BASE}/challenges/level3_1/actions/parcel?parcel_id=${encodeURIComponent(mineParcelId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );
      if (!detailResponse.ok) {
        const raw = await detailResponse.text();
        let message = `요청 실패 (${detailResponse.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }

      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "내 택배 흐름 조회 완료. Network에서 owner/parcel 패턴을 확인하고 parcel_id를 주변 범위로 바꿔 재요청해봐.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleMenuProbeRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level3_2/actions/menu`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "menu 조회 완료. Network 응답의 routeHint/키워드를 보고 숨은 경로를 추론해 직접 호출해봐.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleTicketProbeRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    const cacheKey = `${token}:SUP-1004`;
    const cached = prefetchedTicketRef.current[cacheKey];
    if (!cached) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "아직 캐시가 없어. 페이지를 새로고침한 뒤 초기 로딩 구간의 Network 요청을 먼저 확인해.",
      }));
      return;
    }
    if (!cached.ok) {
      let message = `요청 실패 (${cached.status || "prefetch"})`;
      try {
        const parsed = cached.raw ? JSON.parse(cached.raw) : null;
        message = parsed?.error?.message || parsed?.detail || message;
      } catch {
        // keep fallback
      }
      setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
      return;
    }
    setActionMessageById((prev) => ({
      ...prev,
      [selectedId]:
        "버튼은 캐시된 데이터를 사용한다. 새 요청이 안 보이면 정상이다. 새로고침 직후 초기 Network 로그에서 /actions/ticket 응답을 확인해.",
    }));
  }, [selectedId, token]);

  const handleProfileFetchRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level3_3/actions/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "프로필 조회 완료. 응답 데이터 구조를 관찰하고 저장 요청을 변조해봐.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handlePerksFetchRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level3_3/actions/perks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "perks 조회 완료. standard 결과라면 프로필 저장 요청 body를 변조한 뒤 다시 확인해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleLockerHintRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/challenges/level3_5/actions/locker/hint?locker_id=SL-01`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "락커 힌트 조회 완료. Network에서 77** 단서를 확인하고 unlock 요청을 반복해봐.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleBossMineRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level3_boss/actions/parcels/mine`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "내 택배 조회 완료. 이제 Network에서 parcel_id를 바꿔 VIP 택배, audit_ref, admin path, vault 단서를 순서대로 연결해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleBundleHintRequest = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/challenges/level4_1/actions/public/bundle-hint`, {
        method: "GET",
        cache: "no-store",
      });
      const raw = await response.text();
      if (!response.ok) {
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      let assetPath = "";
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        assetPath = parsed?.data?.assetPath || "";
      } catch {
        // keep empty
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: assetPath
          ? `힌트 조회 완료. 이제 ${assetPath} 파일을 열어 PARTNER_KEY를 찾고 handshake를 호출해.`
          : "힌트 조회 완료. 공개 자산 파일을 열어 PARTNER_KEY를 찾고 handshake를 호출해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId]);

  const handlePartnerPassIssueRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level4_2/actions/pass/issue`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const raw = await response.text();
      if (!response.ok) {
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "PartnerPass 발급 완료. 이제 keys/jwks를 확인하고 kid를 관찰해 legacy 검증 경로를 추론해봐.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleReplayEventRequest = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/challenges/level4_3/actions/event/delivered`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: "EVT-2026-DEL-001",
          parcel_id: "PD-1004",
          status: "delivered",
        }),
        cache: "no-store",
      });
      const raw = await response.text();
      if (!response.ok) {
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "event 전송 완료. 동일 event_id를 반복 재전송한 뒤 /actions/stamps로 count 누적 여부를 확인해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId, token]);

  const handleGatewayStatusRequest = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/challenges/level4_4/actions/public/gateway-status`, {
        method: "GET",
        cache: "no-store",
      });
      const gatewayIp = response.headers.get("x-gateway-ip");
      const raw = await response.text();
      if (!response.ok) {
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: gatewayIp
          ? `gateway-status 조회 완료. 응답 헤더 X-Gateway-IP=${gatewayIp}. whoami/settlement에서 X-Forwarded-For 첫 번째 IP로 넣어 비교해봐.`
          : "gateway-status 조회 완료. 응답 헤더를 열어 X-Gateway-IP를 확인하고 whoami/settlement를 비교해봐.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId]);

  const handleWebhookSpecRequest = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/challenges/level4_5/actions/webhook/spec`, {
        method: "GET",
        cache: "no-store",
      });
      const raw = await response.text();
      if (!response.ok) {
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]:
          "spec 조회 완료. timestamp/raw_body 기반 서명을 만든 뒤 webhook/receive를 호출하고 track로 상태 변화를 확인해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId]);

  const handleLevel4BossStatusRequest = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/challenges/level4_boss/actions/public/status`, {
        method: "GET",
        cache: "no-store",
      });
      const raw = await response.text();
      if (!response.ok) {
        let message = `요청 실패 (${response.status})`;
        try {
          const parsed = raw ? JSON.parse(raw) : null;
          message = parsed?.error?.message || parsed?.detail || message;
        } catch {
          // keep fallback
        }
        setActionMessageById((prev) => ({ ...prev, [selectedId]: message }));
        return;
      }
      let assetHint = "";
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        assetHint = parsed?.data?.assetHint || "";
      } catch {
        // keep empty
      }
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: assetHint
          ? `status 조회 완료. 다음은 ${assetHint} 공개 자산에서 LEGACY_KID/WEBHOOK_SECRET_B64 단서를 찾고 jwks -> admin/config로 이어가.`
          : "status 조회 완료. public asset -> jwks -> admin/config -> webhook -> claim 순서로 체인을 연결해.",
      }));
    } catch (error) {
      setActionMessageById((prev) => ({
        ...prev,
        [selectedId]: error.message || "요청 전송 실패",
      }));
    }
  }, [selectedId]);

  const handleResetSession = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setChallenges([]);
    setSelectedId("");
    setDetailsById({});
    detailsRef.current = {};
    setMe(null);
    setFlagById({});
    setResultById({});
    setTerminalBusyById({});
    setActionMessageById({});
    setHintOpenById({});
    setUnixHintOpenById({});
    setDeepHintOpenById({});
    setLessonOpenById({});
    setStatusText("Session reset. Creating a new one...");
    await createSession();
  }, [createSession]);

  const toggleLesson = useCallback(() => {
    if (!selectedId || !lessonNote) {
      return;
    }
    setLessonOpenById((prev) => ({ ...prev, [selectedId]: !prev[selectedId] }));
  }, [lessonNote, selectedId]);

  const toggleHints = useCallback(() => {
    if (!selectedId) {
      return;
    }
    setHintOpenById((prev) => ({ ...prev, [selectedId]: !prev[selectedId] }));
  }, [selectedId]);

  const toggleUnixHints = useCallback(() => {
    if (!selectedId) {
      return;
    }
    setUnixHintOpenById((prev) => ({ ...prev, [selectedId]: !prev[selectedId] }));
  }, [selectedId]);

  const toggleDeepHints = useCallback(() => {
    if (!selectedId) {
      return;
    }
    setDeepHintOpenById((prev) => ({ ...prev, [selectedId]: !prev[selectedId] }));
  }, [selectedId]);

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>PurpleDroid CTF</h1>
        <p className="caption">API: {API_BASE}</p>
        <p className="caption">Token: {token ? `${token.slice(0, 14)}...` : "none"}</p>
        <button className="ghost-button" onClick={handleResetSession}>
          Reset Session
        </button>

        <h2>Player</h2>
        <p className="caption">
          score: {me?.score ?? 0} | current: {me?.current || "-"} | completed:{" "}
          {me?.completed?.join(", ") || "-"}
        </p>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>Level {selectedLevel} Missions</h2>
            <p className="caption">탭을 클릭해서 Level {selectedLevel} 미션을 전환하세요.</p>
          </div>
          <button
            className="ghost-button"
            onClick={() => token && refreshAll(token)}
            disabled={!token || loading}
          >
            Refresh
          </button>
        </header>

        <section className="panel">
          <div className="level-group-list">
            {challengeGroups.map((group) => (
              <div className="level-group" key={group.level}>
                <div className="level-group-header">
                  <h4 className={`level-module-title ${selectedLevel === group.level ? "active" : ""}`}>
                    {`// LEVEL ${group.level} MODULES`}
                  </h4>
                  <div className="level-divider" />
                </div>
                <div className="challenge-tabs">
                  {group.entries.map(({ item, idx }) => (
                    <button
                      key={item.id}
                      className={`challenge-tab ${selectedId === item.id ? "active" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span>{challengeShortLabel(item, idx)}</span>
                      <StatusPill value={item.status.attack} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {!detail && <section className="panel">Challenge loading...</section>}

        {detail && (
          <section className="panel">
            <h3>{detail.title}</h3>
            <p>{detail.summary}</p>
            <p className="caption">{detail.description}</p>

            <div className="tab-row">
              <button
                className={activeTab === "attack" ? "tab active" : "tab"}
                onClick={() => setActiveTab("attack")}
              >
                Attack
              </button>
              <button
                className={activeTab === "defense" ? "tab active" : "tab"}
                onClick={() => setActiveTab("defense")}
                disabled={!detail.defense?.enabled}
              >
                Defense
              </button>
            </div>

            {activeTab === "attack" && (
              <div className="stack">
                {(showGuidedActions || selectedId === "level3_3") && (
                  <div className="action-row">
                    {selectedId === "level3_3" ? (
                      <div className="flag-row">
                        <button
                          onClick={handleProfileFetchRequest}
                          disabled={currentTerminalBusy || !detail.attack?.enabled}
                        >
                          프로필 불러오기
                        </button>
                        <button
                          onClick={handlePerksFetchRequest}
                          disabled={currentTerminalBusy || !detail.attack?.enabled}
                        >
                          혜택 보기
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={
                          selectedId === "level2_1"
                            ? handleTrackRequest
                            : selectedId === "level2_2"
                              ? handleOrderRequest
                              : selectedId === "level2_3"
                                ? handleDispatchRequest
                                : selectedId === "level2_5"
                                  ? handleBossGateAttempt
                                  : selectedId === "level3_1"
                                    ? handleMyParcelRequest
                                    : selectedId === "level3_2"
                                      ? handleMenuProbeRequest
                                      : selectedId === "level3_4"
                                        ? handleTicketProbeRequest
                                        : selectedId === "level3_5"
                                          ? handleLockerHintRequest
                                          : selectedId === "level4_1"
                                            ? handleBundleHintRequest
                                            : selectedId === "level4_2"
                                              ? handlePartnerPassIssueRequest
                                              : selectedId === "level4_3"
                                                ? handleReplayEventRequest
                                                : selectedId === "level4_4"
                                                  ? handleGatewayStatusRequest
                                                  : selectedId === "level4_5"
                                                    ? handleWebhookSpecRequest
                                                    : selectedId === "level4_boss"
                                                      ? handleLevel4BossStatusRequest
                                            : handleBossMineRequest
                        }
                        disabled={currentTerminalBusy || !detail.attack?.enabled}
                      >
                        {selectedId === "level2_1"
                          ? "배송 조회 요청 보내기"
                          : selectedId === "level2_2"
                            ? "일반 배송 요청 보내기"
                            : selectedId === "level2_3"
                              ? "발송 토큰 요청 보내기"
                              : selectedId === "level2_5"
                                ? "봉인 창고 열기 시도"
                                : selectedId === "level3_1"
                                  ? "내 택배 조회"
                                  : selectedId === "level3_2"
                                    ? "메뉴 동기화"
                                    : selectedId === "level3_4"
                                      ? "지원 티켓 불러오기"
                                        : selectedId === "level3_5"
                                          ? "락커 힌트 조회"
                                        : selectedId === "level4_1"
                                          ? "번들 힌트 조회"
                                          : selectedId === "level4_2"
                                            ? "PartnerPass 발급"
                                            : selectedId === "level4_3"
                                              ? "배송 완료 이벤트 전송"
                                              : selectedId === "level4_4"
                                                ? "게이트웨이 상태 조회"
                                                : selectedId === "level4_5"
                                                  ? "웹훅 명세 조회"
                                                  : selectedId === "level4_boss"
                                                    ? "보스 상태 조회"
                                           : "내 택배 보기"}
                      </button>
                    )}
                    <p className="caption">
                      {selectedId === "level2_1" ? (
                        <>
                          버튼을 누른 직후 DevTools Network에서 <code>/actions/track</code> 요청을 확인해.
                        </>
                      ) : selectedId === "level2_2" ? (
                        <>
                          버튼을 누른 직후 DevTools Network에서 <code>/actions/order</code> 요청을 확인해.
                        </>
                      ) : selectedId === "level2_3" ? (
                        <>
                          버튼을 누른 직후 DevTools Network에서 <code>/actions/dispatch</code> 요청을 확인해.
                        </>
                      ) : selectedId === "level2_5" ? (
                        <>
                          이 버튼은 항상 막힌 흐름이다. Network에서 <code>/actions/dispatch</code> 와{" "}
                          <code>/actions/open</code> 요청을 분석해.
                        </>
                      ) : selectedId === "level3_1" ? (
                        <>
                          버튼을 누른 직후 Network에서 <code>/actions/parcels/mine</code> 과{" "}
                          <code>/actions/parcel?parcel_id=...</code> 요청을 확인해.
                        </>
                      ) : selectedId === "level3_2" ? (
                        <>
                          버튼을 누른 직후 Network에서 <code>/actions/menu</code> 응답의 routeHint 단서를 확인해.
                        </>
                      ) : selectedId === "level3_3" ? (
                        <>
                          먼저 <code>/actions/profile</code>과 <code>/actions/perks</code> 응답을 확인하고, 이후
                          저장 요청 body를 변조해 결과 변화를 비교해.
                        </>
                      ) : selectedId === "level3_4" ? (
                        <>
                          이 버튼은 캐시된 데이터를 표시한다. 새로고침 직후 초기 Network에서{" "}
                          <code>/actions/ticket?id=SUP-1004</code> 응답 JSON을 확인해.
                        </>
                      ) : selectedId === "level3_5" ? (
                        <>
                          버튼을 누른 직후 Network에서 <code>/actions/locker/hint</code> 응답을 확인하고,{" "}
                          <code>/actions/locker/unlock</code> 반복 요청을 시도해.
                        </>
                      ) : selectedId === "level4_1" ? (
                        <>
                          버튼으로 <code>/actions/public/bundle-hint</code>를 확인한 뒤, 공개 js의{" "}
                          <code>sourceMappingURL</code> 단서를 따라 <code>.map</code>에서 키를 찾고{" "}
                          <code>/actions/partner/handshake</code>를 호출해.
                        </>
                      ) : selectedId === "level4_2" ? (
                        <>
                          버튼으로 <code>/actions/pass/issue</code>를 먼저 호출해 PartnerPass를 관찰하고,{" "}
                          <code>/actions/keys/jwks</code>와 <code>/actions/admin/audit</code>를 연결해 kid 검증 흐름을 분석해.
                        </>
                      ) : selectedId === "level4_3" ? (
                        <>
                          버튼으로 <code>/actions/event/delivered</code>를 한 번 보낸 뒤, 같은 요청을 반복 재전송해서{" "}
                          <code>/actions/stamps</code> count가 누적되는지 확인해.
                        </>
                      ) : selectedId === "level4_4" ? (
                        <>
                          버튼으로 <code>/actions/public/gateway-status</code>를 확인한 뒤{" "}
                          <code>/actions/whoami</code> 와 <code>/actions/partner/settlement</code>를 비교해 서버가 신뢰하는 IP 결정을 확인해.
                        </>
                      ) : selectedId === "level4_5" ? (
                        <>
                          버튼으로 <code>/actions/webhook/spec</code>을 확인한 뒤, 서명된 webhook/receive 요청을 직접 보내고{" "}
                          <code>/actions/track?parcel_id=PD-1004</code> 결과를 확인해.
                        </>
                      ) : selectedId === "level4_boss" ? (
                        <>
                          버튼으로 <code>/actions/public/status</code>를 먼저 확인하고, 이후{" "}
                          <code>public asset -&gt; jwks -&gt; admin/config -&gt; webhook/receive -&gt; vault/claim</code> 체인을 완성해.
                        </>
                      ) : (
                        <>
                          버튼을 누른 직후 Network에서 <code>/actions/parcels/mine</code> 요청을 확인하고, 체인 단계별로{" "}
                          <code>parcel</code> -&gt; <code>profile</code> -&gt; <code>menu/admin/audit</code> -&gt;{" "}
                          <code>locker/unlock</code> -&gt; <code>vault/claim</code> 흐름을 연결해.
                        </>
                      )}
                    </p>
                    {selectedId === "level3_1" && (
                      <div className="action-note">
                        📢 [시스템 공지] VIP 전용 택배가 오늘 허브를 통과할 예정입니다. (추적번호 일부 마스킹)
                      </div>
                    )}
                    {selectedId === "level3_2" && (
                      <div className="action-note">
                        관리자 메뉴는 UI에서 숨김 처리되어 있습니다. (enabled=false)
                      </div>
                    )}
                    {selectedId === "level3_3" && (
                      <div className="action-note">
                        UI에서는 address만 수정 가능해 보인다. Network의 Request Payload를 변조해서 role/is_admin 주입을 시도해.
                      </div>
                    )}
                    {selectedId === "level3_4" && (
                      <div className="action-note">
                        화면에는 일부 필드만 표시된다. 원본 Response(JSON)를 끝까지 펼쳐서 확인해.
                      </div>
                    )}
                    {selectedId === "level3_5" && (
                      <div className="action-note">
                        자동화 버튼은 없다. 터미널에서 seq/xargs/for로 반복 요청 자동화를 직접 시도해.
                      </div>
                    )}
                    {selectedId === "level3_boss" && (
                      <div className="action-note">
                        FINAL BOSS: 한 가지가 아니라 취약점 체인이다. 단계 단서를 연결해서 최종 claim을 완성해.
                      </div>
                    )}
                    {selectedId === "level4_1" && (
                      <div className="action-note">
                        js 본문에서 값이 바로 안 보여도 끝이 아니다. source map이 열려 있으면 원본 코드/시크릿이 그대로 노출될 수 있다.
                      </div>
                    )}
                    {selectedId === "level4_2" && (
                      <div className="action-note">
                        kid는 검증 키 선택 힌트다. legacy 키 경로가 남아있으면 검증 우회의 시작점이 될 수 있다.
                      </div>
                    )}
                    {selectedId === "level4_3" && (
                      <div className="action-note">
                        replay 핵심은 "요청이 유효한가"가 아니라 "요청이 새로운가"다. 동일 event_id 재사용 차단 유무를 확인해.
                      </div>
                    )}
                    {selectedId === "level4_4" && (
                      <div className="action-note">
                        X-Forwarded-For는 문자열 헤더다. 신뢰 가능한 프록시 경계 없이 믿으면 IP allowlist는 우회된다.
                      </div>
                    )}
                    {selectedId === "level4_5" && (
                      <div className="action-note">
                        웹훅은 세션 대신 서명으로 신뢰를 만든다. 하지만 시크릿이 유출되면 서명 검증만으로는 위조를 못 막는다.
                      </div>
                    )}
                    {selectedId === "level4_boss" && (
                      <div className="action-note">
                        4-BOSS는 단일 취약점 문제가 아니다. 자산 유출, 키 선택 검증, 웹훅 서명, 스탬프 누적을 단계적으로 연결해야 한다.
                      </div>
                    )}
                    {currentActionMessage && <div className="action-note">{currentActionMessage}</div>}
                  </div>
                )}
                <div className="hint-row">
                  <h4>Hints</h4>
                  <button className="ghost-button hint-toggle" onClick={toggleHints}>
                    {hintOpen ? "힌트 숨기기" : "힌트 보기"}
                  </button>
                </div>
                {hintOpen && (
                  <>
                    {primaryHints.length > 0 && (
                      <ul>
                        {primaryHints.map((hint, idx) => (
                          <li key={`${hint.platform}-${idx}`}>
                            [{hint.platform}] <code>{hint.text}</code>
                          </li>
                        ))}
                      </ul>
                    )}

                    {unixHints.length > 0 && (
                      <div className="extra-hints">
                        <button className="ghost-button hint-toggle" onClick={toggleUnixHints}>
                          {unixHintOpen ? "유닉스 힌트 숨기기" : "유닉스 힌트 보기"}
                        </button>
                        {unixHintOpen && (
                          <ul>
                            {unixHints.map((hint, idx) => (
                              <li key={`unix-${idx}`}>
                                [{hint.platform}] <code>{hint.text}</code>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {progressiveHints.extra.length > 0 && (
                      <div className="extra-hints">
                        <button className="ghost-button hint-toggle" onClick={toggleDeepHints}>
                          {deepHintOpen ? "추가 힌트 숨기기" : "추가 힌트 보기"}
                        </button>

                        {deepHintOpen && (
                          <ul>
                            {progressiveHints.extra.map((hint, idx) => (
                              <li key={`extra-${hint.platform}-${idx}`}>
                                [{hint.platform}] <code>{hint.text}</code>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                )}

                <h4>
                  Terminal{" "}
                  {currentTerminalBusy && <span className="busy-indicator">(running...)</span>}
                </h4>

                <XTermPanel
                  key={selectedId}
                  disabled={!detail.attack?.enabled}
                  prompt={detail.attack?.terminal?.prompt || "$ "}
                  introHint={primaryHint}
                  onExec={handleExec}
                  busy={currentTerminalBusy}
                  onBusyChange={updateTerminalBusy}
                />

                {!effectiveSolved && (
                  <div className="flag-row">
                    <input
                      value={currentFlag}
                      onChange={(e) => setCurrentFlag(e.target.value)}
                      placeholder={detail.attack?.flagFormat || "FLAG{...}"}
                      disabled={!detail.attack?.enabled || currentTerminalBusy}
                    />
                    <button
                      onClick={handleSubmitFlag}
                      disabled={!detail.attack?.enabled || currentTerminalBusy}
                    >
                      Submit Flag
                    </button>
                  </div>
                )}

                {(currentResult?.message || solvedFromServer) && (
                  <div
                    className={`submit-result ${effectiveSolved ? "submit-result-ok" : "submit-result-fail"}`}
                  >
                    {currentResult?.message ||
                      (nextChallengeId
                        ? "Correct! Level Cleared 🎉"
                        : "All Challenges Cleared! 🏆")}
                  </div>
                )}

                {lessonNote && (
                  <div className={`lesson-note-wrap ${effectiveSolved ? "lesson-note-solved" : ""}`}>
                    {!effectiveSolved && (
                      <button className="ghost-button lesson-toggle" onClick={toggleLesson}>
                        {lessonOpen ? "강의 노트 숨기기" : "강의 노트 보기"}
                      </button>
                    )}

                    {(effectiveSolved || lessonOpen) && (
                      <section
                        className={`lesson-panel ${effectiveSolved ? "lesson-panel-emphasis" : ""}`}
                      >
                        <h4>{lessonNote.title}</h4>
                        <p className="lesson-summary">{lessonNote.shortSummary}</p>

                        {lessonNote.markdown && (
                          <div className="lesson-block">
                            <strong>상세 노트</strong>
                            <pre className="lesson-markdown">{lessonNote.markdown.trim()}</pre>
                          </div>
                        )}

                        {lessonNote.selfCheck?.length > 0 && (
                          <div className="lesson-block">
                            <strong>셀프 체크</strong>
                            {lessonNote.selfCheck.map((item) => (
                              <div key={item.q} className="lesson-qa">
                                <p>
                                  <b>Q.</b> {item.q}
                                </p>
                                <p>
                                  <b>A.</b> {item.a}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {effectiveSolved && (
                          <div className="lesson-next-row">
                            <button onClick={handleNextLevel}>{nextButtonLabel}</button>
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}

                {effectiveSolved && !lessonNote && (
                  <div className="lesson-next-row">
                    <button onClick={handleNextLevel}>{nextButtonLabel}</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "defense" && (
              <div className="stack">
                <p>{detail.defense?.instruction}</p>
                <h4>
                  Terminal{" "}
                  {currentTerminalBusy && <span className="busy-indicator">(running...)</span>}
                </h4>
                <XTermPanel
                  key={`${selectedId}-defense`}
                  disabled={!detail.defense?.enabled}
                  prompt={detail.attack?.terminal?.prompt || "$ "}
                  introHint="defense audit"
                  onExec={handleExec}
                  busy={currentTerminalBusy}
                  onBusyChange={updateTerminalBusy}
                />
                <div className="code-box">
                  {(detail.defense?.code?.lines || []).map((line) => {
                    const patchableId = line.patchableId;
                    const selected = patchableId && selectedPatchIds.includes(patchableId);
                    const className = patchableId
                      ? selected
                        ? "code-line patchable patched"
                        : "code-line patchable"
                      : "code-line";

                    return (
                      <button
                        key={line.no}
                        className={className}
                        onClick={() => togglePatch(patchableId)}
                        disabled={!patchableId || !detail.defense?.enabled}
                      >
                        <span>{line.no.toString().padStart(3, " ")}</span>
                        <code>{line.text}</code>
                      </button>
                    );
                  })}
                </div>

                <div className="flag-row">
                  <code>patched: [{selectedPatchIds.join(", ")}]</code>
                  <button onClick={handleSubmitPatch} disabled={!detail.defense?.enabled}>
                    Submit Patch
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {statusText && <section className="panel status-box">{statusText}</section>}
      </main>
    </div>
  );
}

export default App;

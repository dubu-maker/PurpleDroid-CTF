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
          term.clear();
          historyRef.current = [];
          resetInputState();
          writePrompt();
          ensureScrollBottom();
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
    selectedId === "level3_boss";

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
  }, [resolveNextId, resultById, selectedId]);

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
          "프로필 조회 완료. 이제 저장 요청 body를 변조해 role/is_admin 주입 후 perks 응답을 다시 확인해.",
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
                    <ul>
                      {progressiveHints.main.map((hint, idx) => (
                        <li key={`${hint.platform}-${idx}`}>
                          [{hint.platform}] <code>{hint.text}</code>
                        </li>
                      ))}
                    </ul>

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
                            <button onClick={handleNextLevel}>
                              {nextChallengeId ? "Next Level ->" : "Finish"}
                            </button>
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}

                {effectiveSolved && !lessonNote && (
                  <div className="lesson-next-row">
                    <button onClick={handleNextLevel}>{nextChallengeId ? "Next Level ->" : "Finish"}</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "defense" && (
              <div className="stack">
                <p>{detail.defense?.instruction}</p>
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

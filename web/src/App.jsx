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
    { platform: "web", text: "F12 Network에서 조회 요청 URL 끝의 parcel_id를 확인해." },
    {
      platform: "windows",
      text: 'curl.exe -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/<parcel_id> -H "Authorization: Bearer <token>"',
    },
    {
      platform: "unix",
      text: "curl -v -X GET http://localhost:8000/api/v1/challenges/level3_1/actions/parcels/<parcel_id> -H 'Authorization: Bearer <token>'",
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
  level3_1: "내 택배 조회 요청을 관찰한 뒤 parcel_id를 바꿔봐.",
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
  const cursorRef = useRef(0);
  const renderedBufferRef = useRef("");
  const renderedCursorRef = useRef(0);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const busyRef = useRef(false);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 13,
      theme: {
        background: "#0f172a",
        foreground: "#d1fae5",
      },
    });

    term.open(hostRef.current);
    term.focus();
    term.writeln("PurpleDroid fake terminal");
    if (introHint) {
      term.writeln(`Type: ${introHint}`);
    }
    term.write(prompt);
    cursorRef.current = 0;
    renderedBufferRef.current = "";
    renderedCursorRef.current = 0;

    const estimateRows = (text) => {
      const cols = Math.max(term.cols || 80, 1);
      return Math.max(1, Math.ceil(text.length / cols));
    };

    const rowFromCursor = (cursorInBuffer) => {
      const cols = Math.max(term.cols || 80, 1);
      const absolutePos = prompt.length + Math.max(0, cursorInBuffer);
      if (absolutePos <= 0) {
        return 0;
      }
      return Math.floor((absolutePos - 1) / cols);
    };

    const resetPromptState = () => {
      cursorRef.current = 0;
      renderedBufferRef.current = "";
      renderedCursorRef.current = 0;
    };

    const clearInputBlock = () => {
      const prevBuffer = renderedBufferRef.current;
      const prevCursor = renderedCursorRef.current;
      const rows = estimateRows(`${prompt}${prevBuffer}`);
      const cursorRow = rowFromCursor(prevCursor);
      term.write("\r");
      if (cursorRow > 0) {
        term.write(`\x1b[${cursorRow}A`);
      }
      for (let i = 0; i < rows; i += 1) {
        term.write("\x1b[2K");
        if (i < rows - 1) {
          term.write("\x1b[B");
        }
      }
      if (rows > 1) {
        term.write(`\x1b[${rows - 1}A`);
      }
      term.write("\r");
    };

    const redrawPromptLine = () => {
      const buf = bufferRef.current;
      const cursor = Math.max(0, Math.min(cursorRef.current, buf.length));
      cursorRef.current = cursor;
      clearInputBlock();
      const full = `${prompt}${buf}`;
      term.write(full);
      const moveLeft = buf.length - cursor;
      if (moveLeft > 0) {
        term.write(`\x1b[${moveLeft}D`);
      }
      renderedBufferRef.current = buf;
      renderedCursorRef.current = cursor;
    };

    const appendInputText = (text) => {
      if (!text) {
        return;
      }
      const clean = sanitizePastedText(text);
      if (!clean) {
        return;
      }
      const cursor = cursorRef.current;
      const buf = bufferRef.current;
      bufferRef.current = `${buf.slice(0, cursor)}${clean}${buf.slice(cursor)}`;
      cursorRef.current = cursor + clean.length;
      redrawPromptLine();
    };

    const sanitizePastedText = (text) => {
      if (!text) {
        return "";
      }
      return text.replace(/\r\n/g, "\n").replace(/\n/g, " ");
    };

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
        appendInputText(sanitizePastedText(text));
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
        bufferRef.current = history[historyIndexRef.current] || "";
        cursorRef.current = bufferRef.current.length;
        redrawPromptLine();
        return;
      }

      if (data === "\x1b[B" || data === "\x1bOB") {
        const history = historyRef.current;
        if (!history.length || historyIndexRef.current === -1) {
          return;
        }
        if (historyIndexRef.current >= history.length - 1) {
          historyIndexRef.current = -1;
          bufferRef.current = "";
        } else {
          historyIndexRef.current += 1;
          bufferRef.current = history[historyIndexRef.current] || "";
        }
        cursorRef.current = bufferRef.current.length;
        redrawPromptLine();
        return;
      }

      if (data === "\x1b[D" || data === "\x1bOD") {
        if (cursorRef.current > 0) {
          cursorRef.current -= 1;
          renderedCursorRef.current = cursorRef.current;
          term.write("\x1b[D");
        }
        return;
      }

      if (data === "\x1b[C" || data === "\x1bOC") {
        if (cursorRef.current < bufferRef.current.length) {
          cursorRef.current += 1;
          renderedCursorRef.current = cursorRef.current;
          term.write("\x1b[C");
        }
        return;
      }

      if (data === "\x1b[H" || data === "\x1bOH" || data === "\u0001") {
        if (cursorRef.current > 0) {
          const moveLeft = cursorRef.current;
          cursorRef.current = 0;
          renderedCursorRef.current = 0;
          term.write(`\x1b[${moveLeft}D`);
        }
        return;
      }

      if (data === "\x1b[F" || data === "\x1bOF" || data === "\u0005") {
        const moveRight = bufferRef.current.length - cursorRef.current;
        if (moveRight > 0) {
          cursorRef.current = bufferRef.current.length;
          renderedCursorRef.current = cursorRef.current;
          term.write(`\x1b[${moveRight}C`);
        }
        return;
      }

      if (data === "\u0003") {
        if (term.hasSelection()) {
          copySelection();
          return;
        }
        clearInputBlock();
        term.write("^C\r\n");
        bufferRef.current = "";
        historyIndexRef.current = -1;
        term.write(prompt);
        resetPromptState();
        return;
      }

      // Ctrl+U: 현재 입력 라인 전체 삭제
      if (data === "\u0015") {
        bufferRef.current = "";
        cursorRef.current = 0;
        redrawPromptLine();
        return;
      }

      if (data.startsWith("\x1b")) {
        return;
      }

      if (data.length > 1) {
        appendInputText(data);
        return;
      }

      if (data === "\r") {
        const command = bufferRef.current.trim();
        term.write("\r\n");
        bufferRef.current = "";
        resetPromptState();
        historyIndexRef.current = -1;

        if (!command) {
          term.write(prompt);
          resetPromptState();
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
          term.write(prompt);
          resetPromptState();
          return;
        }

        if (busyRef.current) {
          term.writeln("busy...");
          term.write(prompt);
          resetPromptState();
          return;
        }

        if (disabled) {
          term.writeln("Attack is locked for this challenge.");
          term.write(prompt);
          resetPromptState();
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
            term.scrollToBottom();
          })
          .catch((error) => {
            if (error.status === 429) {
              term.writeln("[error] Too many requests. Slow down.");
            } else {
              term.writeln(`[error] ${error.message}`);
            }
            term.scrollToBottom();
          })
          .finally(() => {
            onBusyChange(false);
            term.write(prompt);
            resetPromptState();
          });
        return;
      }

      if (data === "\x1b[3~") {
        const cursor = cursorRef.current;
        const buf = bufferRef.current;
        if (cursor < buf.length) {
          bufferRef.current = `${buf.slice(0, cursor)}${buf.slice(cursor + 1)}`;
          redrawPromptLine();
        }
        return;
      }

      if (data === "\u007F") {
        const cursor = cursorRef.current;
        const buf = bufferRef.current;
        if (cursor > 0) {
          bufferRef.current = `${buf.slice(0, cursor - 1)}${buf.slice(cursor)}`;
          cursorRef.current = cursor - 1;
          redrawPromptLine();
        }
        return;
      }

      if (data >= " " && data <= "~") {
        appendInputText(data);
      }
    });

    return () => {
      keySub.dispose();
      onDataSub.dispose();
      term.dispose();
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
    selectedId === "level3_1";

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
      const response = await fetch(`${API_BASE}/challenges/level3_1/actions/parcels/PD-1004`, {
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
          "내 택배 조회 완료. Network 요청 URL 끝 parcel_id를 다른 값으로 바꿔 재요청해봐.",
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
                {showGuidedActions && (
                  <div className="action-row">
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
                                : handleMyParcelRequest
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
                              : "내 택배 조회"}
                    </button>
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
                      ) : (
                        <>
                          버튼을 누른 직후 Network에서 <code>/actions/parcels/PD-1004</code> 요청을 확인해.
                        </>
                      )}
                    </p>
                    {selectedId === "level3_1" && (
                      <div className="action-note">
                        📢 [시스템 공지] VIP 전용 택배 (Tracking No: PD-1005)가 오늘 배송될 예정입니다.
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

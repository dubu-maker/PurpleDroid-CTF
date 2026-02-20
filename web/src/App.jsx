import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";

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

    const redrawPromptLine = () => {
      term.write(`\r\x1b[2K${prompt}${bufferRef.current}`);
    };

    const appendInputText = (text) => {
      if (!text) {
        return;
      }
      bufferRef.current += text;
      term.write(text);
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
        redrawPromptLine();
        return;
      }

      if (data === "\u0003" && term.hasSelection()) {
        copySelection();
        return;
      }

      if (data.length > 1) {
        appendInputText(sanitizePastedText(data));
        return;
      }

      if (data === "\r") {
        const command = bufferRef.current.trim();
        term.write("\r\n");
        bufferRef.current = "";
        historyIndexRef.current = -1;

        if (!command) {
          term.write(prompt);
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
          return;
        }

        if (busyRef.current) {
          term.writeln("busy...");
          term.write(prompt);
          return;
        }

        if (disabled) {
          term.writeln("Attack is locked for this challenge.");
          term.write(prompt);
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
          });
        return;
      }

      if (data === "\u007F") {
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write("\b \b");
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
  const solvedFromServer = detail?.status?.attack === "solved";
  const effectiveSolved = Boolean(currentResult?.correct || solvedFromServer);

  const selectedPatchIds = useMemo(
    () => (Array.isArray(resultById[`patch:${selectedId}`]) ? resultById[`patch:${selectedId}`] : []),
    [resultById, selectedId]
  );

  const hints = useMemo(() => resolveHints(detail, selectedId), [detail, selectedId]);
  const primaryHint = hints[0]?.text || 'adb logcat -d | grep "PurpleDroid_"';

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
    setStatusText("Session reset. Creating a new one...");
    await createSession();
  }, [createSession]);

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
            <h2>Level 1 Missions</h2>
            <p className="caption">탭을 클릭해서 1-1 / 1-2 / 1-3 미션을 전환하세요.</p>
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
          <div className="challenge-tabs">
            {challenges.map((item, idx) => (
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
                <h4>Hints</h4>
                <ul>
                  {hints.map((hint, idx) => (
                    <li key={`${hint.platform}-${idx}`}>
                      [{hint.platform}] <code>{hint.text}</code>
                    </li>
                  ))}
                </ul>

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

                <div className="flag-row">
                  <input
                    value={currentFlag}
                    onChange={(e) => setCurrentFlag(e.target.value)}
                    placeholder={detail.attack?.flagFormat || "FLAG{...}"}
                    disabled={!detail.attack?.enabled || currentTerminalBusy}
                  />

                  {effectiveSolved ? (
                    <button onClick={handleNextLevel}>
                      {resolveNextId(selectedId, currentResult?.nextId || detail?.next?.id || null)
                        ? "Next Level ->"
                        : "Finish"}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitFlag}
                      disabled={!detail.attack?.enabled || currentTerminalBusy}
                    >
                      Submit Flag
                    </button>
                  )}
                </div>

                {(currentResult?.message || solvedFromServer) && (
                  <div
                    className={`submit-result ${effectiveSolved ? "submit-result-ok" : "submit-result-fail"}`}
                  >
                    {currentResult?.message ||
                      (resolveNextId(selectedId, detail?.next?.id || null)
                        ? "Correct! Level Cleared 🎉"
                        : "All Challenges Cleared! 🏆")}
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

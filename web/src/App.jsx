import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Terminal } from "xterm";

const TOKEN_KEY = "purpledroid_session_token";
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1").replace(
  /\/$/,
  ""
);

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

function XTermPanel({ disabled, prompt, onExec }) {
  const hostRef = useRef(null);
  const termRef = useRef(null);
  const bufferRef = useRef("");
  const busyRef = useRef(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

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

    termRef.current = term;
    term.open(hostRef.current);
    term.focus();
    term.writeln("PurpleDroid fake terminal");
    term.writeln('Type: adb logcat -d | grep "PurpleDroid"');
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
        // Browser permission can block clipboard write; ignore silently.
      }
    };

    const keySub = term.onKey(({ domEvent }) => {
      const key = domEvent.key.toLowerCase();
      const hasMod = domEvent.ctrlKey || domEvent.metaKey;

      if (hasMod && key === "c" && term.hasSelection()) {
        domEvent.preventDefault();
        copySelection();
      }
    });

    const sub = term.onData((data) => {
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

        busyRef.current = true;
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
          })
          .catch((error) => {
            term.writeln(`[error] ${error.message}`);
          })
          .finally(() => {
            busyRef.current = false;
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
        bufferRef.current += data;
        term.write(data);
      }
    });

    return () => {
      keySub.dispose();
      sub.dispose();
      term.dispose();
      termRef.current = null;
    };
  }, [disabled, onExec, prompt]);

  return <div className="terminal-host" ref={hostRef} />;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [challenges, setChallenges] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [me, setMe] = useState(null);
  const [flagInput, setFlagInput] = useState("");
  const [patchByLevel, setPatchByLevel] = useState({});
  const [activeTab, setActiveTab] = useState("attack");
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(async () => {
    const data = await apiRequest("/session", {
      method: "POST",
      body: { client: { source: "vite-react" } },
    });
    localStorage.setItem(TOKEN_KEY, data.sessionToken);
    setToken(data.sessionToken);
    return data.sessionToken;
  }, []);

  const loadChallenges = useCallback(
    async (sessionToken) => {
      const data = await apiRequest("/challenges", {
        token: sessionToken,
      });
      setChallenges(data.challenges || []);
      if (!selectedId && data.challenges?.length) {
        setSelectedId(data.challenges[0].id);
      }
    },
    [selectedId]
  );

  const loadMe = useCallback(async (sessionToken) => {
    const data = await apiRequest("/me", { token: sessionToken });
    setMe(data);
  }, []);

  const loadDetail = useCallback(async (sessionToken, challengeId) => {
    const data = await apiRequest(`/challenges/${challengeId}`, {
      token: sessionToken,
    });
    setDetail(data);
  }, []);

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
    loadDetail(token, selectedId).catch((error) => setStatusText(error.message));
  }, [loadDetail, selectedId, token]);

  const selectedPatchIds = useMemo(() => patchByLevel[selectedId] || [], [patchByLevel, selectedId]);

  const togglePatch = useCallback(
    (patchableId) => {
      if (!selectedId || !patchableId) {
        return;
      }
      setPatchByLevel((prev) => {
        const current = new Set(prev[selectedId] || []);
        if (current.has(patchableId)) {
          current.delete(patchableId);
        } else {
          current.add(patchableId);
        }
        return {
          ...prev,
          [selectedId]: Array.from(current),
        };
      });
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

  const handleSubmitFlag = useCallback(async () => {
    if (!token || !selectedId || !flagInput.trim()) {
      return;
    }
    const data = await apiRequest(`/challenges/${selectedId}/submit-flag`, {
      method: "POST",
      token,
      body: { flag: flagInput.trim() },
    });
    setStatusText(data.message);
    await Promise.all([refreshAll(token), loadDetail(token, selectedId)]);
  }, [flagInput, loadDetail, refreshAll, selectedId, token]);

  const handleSubmitPatch = useCallback(async () => {
    if (!token || !selectedId) {
      return;
    }
    const data = await apiRequest(`/challenges/${selectedId}/submit-patch`, {
      method: "POST",
      token,
      body: { patched: selectedPatchIds },
    });
    setStatusText(data.message);
    await Promise.all([refreshAll(token), loadDetail(token, selectedId)]);
  }, [loadDetail, refreshAll, selectedId, selectedPatchIds, token]);

  const handleResetSession = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setChallenges([]);
    setSelectedId("");
    setDetail(null);
    setMe(null);
    setPatchByLevel({});
    setFlagInput("");
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

        <h2>Challenges</h2>
        <div className="challenge-list">
          {challenges.map((item) => (
            <button
              key={item.id}
              className={`challenge-item ${selectedId === item.id ? "active" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <strong>
                L{item.level}. {item.title}
              </strong>
              <span className="challenge-meta">
                A:<StatusPill value={item.status.attack} /> D:<StatusPill value={item.status.defense} />
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>Player</h2>
            <p className="caption">
              score: {me?.score ?? 0} | current: {me?.current || "-"} | completed:{" "}
              {me?.completed?.join(", ") || "-"}
            </p>
          </div>
          <button
            className="ghost-button"
            onClick={() => token && refreshAll(token)}
            disabled={!token || loading}
          >
            Refresh
          </button>
        </header>

        {!detail && <section className="panel">Challenge loading...</section>}

        {detail && (
          <section className="panel">
            <h3>
              L{detail.level}. {detail.title}
            </h3>
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
                  {(detail.attack?.hints || []).map((hint, idx) => (
                    <li key={`${hint.platform}-${idx}`}>
                      [{hint.platform}] <code>{hint.text}</code>
                    </li>
                  ))}
                </ul>

                <h4>Terminal</h4>
                <XTermPanel
                  key={selectedId}
                  disabled={!detail.attack?.enabled}
                  prompt={detail.attack?.terminal?.prompt || "$ "}
                  onExec={handleExec}
                />

                <div className="flag-row">
                  <input
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    placeholder={detail.attack?.flagFormat || "FLAG{...}"}
                    disabled={!detail.attack?.enabled}
                  />
                  <button onClick={handleSubmitFlag} disabled={!detail.attack?.enabled}>
                    Submit Flag
                  </button>
                </div>
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

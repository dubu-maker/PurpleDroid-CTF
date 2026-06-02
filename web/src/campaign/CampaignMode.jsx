import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPAIGN_INTERMISSIONS,
  CAMPAIGN_PROLOGUE,
  CAMPAIGN_TOKEN_KEY,
  getMissionStory,
  getOperationForChallenge,
} from "../story/campaignStory";

const TOKEN_KEY = "purpledroid_session_token";
const OPERATION_03_INTERMISSION_KEY = "purpledroid_intermission_operation03_trace_seen";
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

function CampaignHome({
  loading,
  me,
  currentChallenge,
  onContinue,
  onNewCampaign,
  statusText,
}) {
  return (
    <div className="campaign-page campaign-home">
      <header className="campaign-hero">
        <div className="campaign-hero-copy">
          <p className="campaign-kicker">{CAMPAIGN_PROLOGUE.year} // AEGIS GRIDLINE</p>
          <h1>{CAMPAIGN_PROLOGUE.title}</h1>
          <p className="campaign-subtitle">{CAMPAIGN_PROLOGUE.subtitle}</p>
          <div className="campaign-prologue">
            {CAMPAIGN_PROLOGUE.paragraphs.map((paragraph) => (
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
            <button className="ghost-button" onClick={() => (window.location.href = "/")}>
              Classic Mission Board
            </button>
          </div>
          {statusText && <p className="campaign-status-line">{statusText}</p>}
        </div>

        <div className="campaign-visual" aria-hidden="true">
          <div className="aegis-eye">
            <div className="aegis-eye-core" />
            <div className="aegis-eye-scan" />
          </div>
          <div className="visual-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </header>

      <section className="campaign-home-strip">
        <div>
          <span>ACTIVE NODE</span>
          <strong>{currentChallenge?.title || "Syncing..."}</strong>
        </div>
        <div>
          <span>AGENT</span>
          <strong>VIOLET</strong>
        </div>
        <div>
          <span>COMPLETED</span>
          <strong>{me?.completed?.length || 0}</strong>
        </div>
      </section>
    </div>
  );
}

function OperationHeader({ operation, story, detail, phase, onHome }) {
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
        <span className={`phase-badge phase-${phase.toLowerCase()}`}>{phaseLabel(phase)}</span>
        <span className="mission-id">{detail?.id || story.challengeId}</span>
        <button className="ghost-button" onClick={onHome}>
          Campaign Home
        </button>
        <button className="ghost-button" onClick={() => (window.location.href = "/")}>
          Classic
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
      <div className="agent-card">
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

function DialoguePanel({ story, phase, attackNotice }) {
  const key =
    phase === "MISSION_COMPLETE"
      ? "complete"
      : attackNotice
        ? "attackSolved"
        : phase === "DEFENSE"
          ? "defense"
          : phase === "ATTACK"
            ? "attack"
            : "briefing";

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

function IntelPanel({ items, progressive }) {
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
          힌트 더 보기 ({revealed}/{items.length})
        </button>
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
}) {
  const outputRef = useRef(null);

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

function PatchSubmit({
  detail,
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
      <p>{detail?.defense?.instruction || "Evidence Shard 회수 후 봉쇄 단계가 열린다."}</p>
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

function DebriefModal({ story, onNext, onClose, hasNext }) {
  return (
    <div className="debrief-backdrop" role="dialog" aria-modal="true">
      <section className="debrief-modal">
        <p className="campaign-kicker">MISSION DEBRIEF</p>
        <h2>{story.debrief.title}</h2>
        <p>{story.debrief.summary}</p>
        <ul>
          {story.debrief.learned.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="debrief-next">
          <p>{story.debrief.nextTeaser}</p>
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

function OperationIntermission({ intermission, busy, onContinue }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [relayMasked, setRelayMasked] = useState(false);
  const logs = intermission.logs || [];
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

  return (
    <div
      className={`campaign-page intermission-page ${
        sweepComplete ? "trace-complete" : "trace-running"
      } ${relayMasked ? "relay-masked" : ""}`}
    >
      <div className="intermission-noise" aria-hidden="true" />
      <main className="intermission-stage">
        <section className="intermission-hero">
          <p className="campaign-kicker">{intermission.kicker}</p>
          <h1>{intermission.title}</h1>
          <p>{intermission.subtitle}</p>
        </section>

        <section className="intermission-metrics" aria-label="Trace metrics">
          {intermission.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </section>

        <section className="intermission-console">
          <div className="section-heading">
            <span>AEGIS TRACE SWEEP</span>
            <strong>{sweepComplete ? "identity unresolved" : "correlating"}</strong>
          </div>
          <div className="intermission-log-list">
            {visibleLogs.map((log, index) => (
              <div key={`${log.source}-${index}`} className={`intermission-log ${log.tone}`}>
                <span>[{log.source}]</span>
                <p>{log.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="intermission-dialogue">
          <div className="dialogue-line mira">
            <span>MIRA</span>
            <p>{intermission.mira}</p>
          </div>
          <div className="dialogue-line aegis">
            <span>AEGIS</span>
            <p>{intermission.aegis}</p>
          </div>
        </section>

        <section className="intermission-brief">
          <div>
            <p className="campaign-kicker">{intermission.nextOperation}</p>
            <p>{intermission.summary}</p>
          </div>
          {!sweepComplete ? (
            <button disabled>Trace sweep running...</button>
          ) : !relayMasked ? (
            <button onClick={() => setRelayMasked(true)}>{intermission.actionLabel}</button>
          ) : (
            <button onClick={onContinue} disabled={busy}>
              {busy ? "Opening..." : intermission.readyLabel}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

function CampaignMode() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [campaignActive, setCampaignActive] = useState(
    () => localStorage.getItem(CAMPAIGN_TOKEN_KEY) === "1"
  );
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [me, setMe] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [currentId, setCurrentId] = useState("");
  const [detail, setDetail] = useState(null);
  const [briefingSeenById, setBriefingSeenById] = useState({});
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [bootedById, setBootedById] = useState({});
  const [command, setCommand] = useState("");
  const [consoleBusy, setConsoleBusy] = useState(false);
  const [flagValue, setFlagValue] = useState("");
  const [evidenceResult, setEvidenceResult] = useState(null);
  const [patchResult, setPatchResult] = useState(null);
  const [selectedPatchIds, setSelectedPatchIds] = useState([]);
  const [containmentVerifiedById, setContainmentVerifiedById] = useState({});
  const [attackNotice, setAttackNotice] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [nextId, setNextId] = useState(null);
  const [operation03IntermissionSeen, setOperation03IntermissionSeen] = useState(
    () => localStorage.getItem(OPERATION_03_INTERMISSION_KEY) === "1"
  );
  const [activeIntermission, setActiveIntermission] = useState(null);

  const createSession = useCallback(async () => {
    const data = await apiRequest("/session", {
      method: "POST",
      body: { client: { source: "campaign-mode" } },
    });
    localStorage.setItem(TOKEN_KEY, data.sessionToken);
    setToken(data.sessionToken);
    return data.sessionToken;
  }, []);

  const loadMissionDetail = useCallback(async (sessionToken, challengeId) => {
    const data = await apiRequest(`/challenges/${challengeId}`, {
      token: sessionToken,
    });
    setDetail(data);
    return data;
  }, []);

  const bootstrap = useCallback(
    async (preferredToken = token) => {
      setLoading(true);
      setStatusText("Synchronizing with AEGIS grid...");
      let sessionToken = preferredToken;

      try {
        if (!sessionToken) {
          sessionToken = await createSession();
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

        setStatusText("");
      } catch (error) {
        if (error.status === 401) {
          const newToken = await createSession();
          await bootstrap(newToken);
          return;
        }
        setStatusText(error.message || "Campaign sync failed.");
      } finally {
        setLoading(false);
      }
    },
    [createSession, loadMissionDetail, token]
  );

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setConsoleLogs([]);
    setCommand("");
    setFlagValue("");
    setEvidenceResult(null);
    setPatchResult(null);
    setSelectedPatchIds([]);
    setAttackNotice(false);
    setShowDebrief(false);
    setNextId(null);
  }, [currentId]);

  const story = useMemo(() => getMissionStory(currentId, detail), [currentId, detail]);
  const operation = useMemo(() => getOperationForChallenge(currentId), [currentId]);
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
      ...CAMPAIGN_INTERMISSIONS.operation03Trace,
      nextId: currentId,
    });
  }, [activeIntermission, campaignActive, currentId, me?.completed, operation03IntermissionSeen]);

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
    localStorage.setItem(CAMPAIGN_TOKEN_KEY, "1");
    setCampaignActive(true);
  }, []);

  const handleNewCampaign = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OPERATION_03_INTERMISSION_KEY);
    localStorage.setItem(CAMPAIGN_TOKEN_KEY, "1");
    setCampaignActive(true);
    setToken("");
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
        const output = [data.stdout, data.stderr].filter(Boolean).join("\n");

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
      } catch (error) {
        setConsoleLogs((prev) => [
          ...prev,
          { id: `${id}-err`, type: "error", text: error.message || "terminal request failed" },
        ]);
      } finally {
        setConsoleBusy(false);
      }
    },
    [currentId, prompt, token]
  );

  const handleSubmitEvidence = useCallback(async () => {
    if (!token || !currentId || !flagValue.trim()) {
      return;
    }

    try {
      const data = await apiRequest(`/challenges/${currentId}/submit-flag`, {
        method: "POST",
        token,
        body: { flag: flagValue.trim() },
      });
      const isCorrect = Boolean(data.correct);
      setEvidenceResult({
        correct: isCorrect,
        message: isCorrect ? story.attackSuccessText : data.message || "Evidence rejected.",
      });

      if (isCorrect) {
        setAttackNotice(true);
        const refreshed = await refreshMission(token, currentId);
        setNextId(refreshed?.detailData?.next?.id || null);
      }
    } catch (error) {
      setEvidenceResult({ correct: false, message: error.message || "Evidence rejected." });
    }
  }, [currentId, flagValue, refreshMission, story.attackSuccessText, token]);

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
        message: "AEGIS 검증이 아직 안 끝났어. 콘솔에서 defense apply 후 defense verify를 성공시켜줘.",
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
        message: isCorrect ? story.defenseSuccessText : data.message || "Containment rejected.",
      });

      if (isCorrect) {
        setNextId(data?.next?.id || null);
        await refreshMission(token, currentId);
        setShowDebrief(true);
      }
    } catch (error) {
      setPatchResult({ correct: false, message: error.message || "Containment rejected." });
    }
  }, [
    containmentVerified,
    currentId,
    refreshMission,
    requiresTerminalVerification,
    selectedPatchIds,
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
          ...CAMPAIGN_INTERMISSIONS.operation03Trace,
          nextId: candidate,
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
    nextId,
    operation03IntermissionSeen,
    refreshMission,
    token,
  ]);

  const handleCompleteIntermission = useCallback(async () => {
    if (!activeIntermission) {
      return;
    }

    localStorage.setItem(OPERATION_03_INTERMISSION_KEY, "1");
    setOperation03IntermissionSeen(true);

    const targetId = activeIntermission.nextId;
    setActiveIntermission(null);

    if (token && targetId && targetId !== currentId) {
      setLoading(true);
      setStatusText("Opening TRUST LAYER...");
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

              <DialoguePanel story={story} phase={phase} attackNotice={attackNotice} />

              <ObjectivePanel
                story={story}
                phase={phase}
                hasUserCommand={consoleLogs.some((entry) => entry.type === "command")}
              />

              <IntelPanel key={activeChallengeId} items={story.intel} progressive={story.progressiveHints} />

              {phase === "BRIEFING" && (
                <section className="briefing-lock">
                  <p>작전 브리핑을 확인했으면 침투 콘솔을 열 수 있어.</p>
                  <button onClick={handleBeginMission}>Begin Infiltration</button>
                </section>
              )}

              <MissionConsole
                disabled={phase === "LOCKED" || phase === "BRIEFING"}
                prompt={prompt}
                placeholder={story.consolePlaceholder}
                onExec={handleExec}
                logs={consoleLogs}
                command={command}
                setCommand={setCommand}
                busy={consoleBusy}
              />

              <EvidenceSubmit
                disabled={phase === "LOCKED" || phase === "BRIEFING" || consoleBusy}
                value={flagValue}
                onChange={setFlagValue}
                onSubmit={handleSubmitEvidence}
                result={evidenceResult}
                solved={evidenceSolved}
              />

              {attackNotice && phase === "DEFENSE" && (
                <section className="aegis-alert">
                  <strong>AEGIS ALERT</strong>
                  <p>{story.aegis.attackSolved}</p>
                </section>
              )}

              <PatchSubmit
                detail={detail}
                phase={phase}
                selectedPatchIds={selectedPatchIds}
                requiresVerification={requiresTerminalVerification}
                verificationReady={containmentVerified}
                onToggle={handleTogglePatch}
                onSubmit={handleSubmitPatch}
                result={patchResult}
                busy={loading}
              />

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
        />
      )}
    </div>
  );
}

export default CampaignMode;

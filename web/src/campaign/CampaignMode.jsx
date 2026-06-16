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

const LEVEL4_3_REPLAY_PUZZLE = {
  evidenceShard: "FLAG{REPLAY_NEEDS_IDEMPOTENCY}",
  sampleEventId: "EVT-2026-DEL-001",
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
      },
      note:
        "첫 요청은 정상 이벤트처럼 보여. 문제는 같은 배송 완료를 event_id만 바꿔 반복할 때 서버가 또 stamp를 주는지야.",
      action: "Stage Delivered Event로 첫 window를 열고 Stamp Ledger를 확인해봐.",
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
        vulnerableRule: "new event_id with same parcel/status is credited",
        replayProtection: "event_id only",
      },
      note:
        "같은 event_id는 중복으로 잡혀. 하지만 parcel_id와 status가 같은데 event_id만 새로우면 어떻게 되는지 비교해야 해.",
      action: "Duplicate Probe와 Next Event를 번갈아 보면서 credited 값이 어떻게 달라지는지 봐.",
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
      title: "Event Sequencer",
      summary: "stage repeated event_id variants",
      content: {
        pattern: "EVT-2026-DEL-00$i",
        range: "1..5",
        warning: "same logical delivery, new event ids",
      },
      note:
        "Event Sequencer는 자동 풀이 버튼이 아니라 반복 패턴을 준비하는 초안이야. 왜 count가 오르는지 Ledger를 같이 봐.",
      action: "Replay Ledger에서 중복/credited 차이를 봤다면 Burst Draft로 같은 배송의 변형 이벤트를 빠르게 stage해봐.",
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
      id: "policy_replay_window_audit",
      title: "Replay Window Audit",
      text: "짧은 시간 안의 반복 상태 전환을 감사 로그와 알림으로 남긴다.",
      correct: true,
    },
    {
      id: "bonus_rate_limit_burst",
      title: "Rate Limit Burst Events",
      text: "burst rate limit은 좋은 보조 방어지만 idempotency를 대신하지는 못한다.",
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
    {
      id: "decoy_trust_status",
      title: "Trust delivered Status",
      text: "status=delivered는 클라이언트 입력이므로 서버 상태 전환으로 검증해야 한다.",
      correct: false,
    },
  ],
};

function level33SafeUpdateCurl() {
  return 'curl "/api/v1/challenges/level3_3/actions/profile" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d \'{}\'';
}

function level43EventCurl(eventId = LEVEL4_3_REPLAY_PUZZLE.sampleEventId) {
  return `curl -v -X POST "/api/v1/challenges/level4_3/actions/event/delivered" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d '{"event_id":"${eventId}","parcel_id":"PD-1004","status":"delivered"}'`;
}

function level43StampsCurl() {
  return 'curl -v -X GET "/api/v1/challenges/level4_3/actions/stamps" -H "Authorization: Bearer $SESSION_TOKEN"';
}

function level43BurstCurl() {
  return 'for i in $(seq 1 5); do curl -v -X POST "/api/v1/challenges/level4_3/actions/event/delivered" -H "Authorization: Bearer $SESSION_TOKEN" -H "Content-Type: application/json" -d \'{"event_id":"EVT-2026-DEL-00$i","parcel_id":"PD-1004","status":"delivered"}\'; done';
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
      };
      return;
    }

    nextEntries.push(entry);
  });

  return nextEntries;
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
}) {
  const cardsById = useMemo(
    () => new Map(LEVEL4_1_MEMORY_PUZZLE.cards.map((card) => [card.id, card])),
    []
  );
  const [revealedIds, setRevealedIds] = useState(() => LEVEL4_1_MEMORY_PUZZLE.initialCards);
  const [selectedCardId, setSelectedCardId] = useState("memory_index");
  const [slotAssignments, setSlotAssignments] = useState({});
  const [memoryResult, setMemoryResult] = useState(null);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dropSlotId, setDropSlotId] = useState(null);
  const revealedCards = LEVEL4_1_MEMORY_PUZZLE.cards.filter((card) => revealedIds.includes(card.id));
  const selectedCard = cardsById.get(selectedCardId) || revealedCards[0];
  const allSlotsFilled = LEVEL4_1_MEMORY_PUZZLE.slots.every((slot) => slotAssignments[slot.id]);
  const reconstructionCorrect = LEVEL4_1_MEMORY_PUZZLE.slots.every((slot) =>
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
    "먼저 AEGIS Memory Index와 Public Bundle Shard를 비교해봐. AEGIS는 source map이 없다고 했는데, bundle 마지막 줄에는 다른 단서가 남아 있어.";
  const activeAction =
    selectedCard?.action ||
    "Memory Board에서 카드를 하나 누른 뒤, MIRA HINT의 안내를 보고 아래 슬롯에 넣을지 다음 카드를 열지 판단해봐.";
  const activeHintTone = memoryResult?.correct === false ? "fail" : "ok";

  useEffect(() => {
    if (restored) {
      setRevealedIds(LEVEL4_1_MEMORY_PUZZLE.cards.map((card) => card.id));
    }
  }, [restored]);

  const revealCard = useCallback((card) => {
    setSelectedCardId(card.id);
    if (card.unlocks?.length) {
      setRevealedIds((prev) => [...new Set([...prev, ...card.unlocks])]);
    }
    if (card.id === "map_canary") {
      setMemoryResult({
        correct: false,
        message:
          "그건 source map canary야. redaction 상태를 확인하려고 심어둔 표식이지 Evidence Shard가 아니야.",
      });
      return;
    }
    if (card.note) {
      setMemoryResult({ correct: true, message: card.note });
      return;
    }
    setMemoryResult(null);
  }, []);

  const assignCardToSlot = useCallback(
    (slot, cardId) => {
      const card = cardsById.get(cardId);
      if (!card) {
        setMemoryResult({ correct: false, message: "먼저 Memory Card를 하나 선택해줘." });
        return;
      }

      setSelectedCardId(card.id);
      setSlotAssignments((prev) => ({ ...prev, [slot.id]: card.id }));
      if (slot.id === "secret_residue" && card.id === "map_canary") {
        setMemoryResult({
          correct: false,
          message:
            "FLAG처럼 보이지만 canary야. key 이름과 사용 위치를 봐. Partner Handshake에는 partner key residue가 필요해.",
        });
        return;
      }

      const isCorrect = slot.accepts.includes(card.id);
      setMemoryResult({
        correct: isCorrect,
        message: isCorrect
          ? `${slot.label} 슬롯에 ${card.title} 카드를 고정했어.`
          : `${card.title} 카드는 ${slot.label} 슬롯과 연결이 약해. 카드의 문맥을 다시 비교해봐.`,
      });
    },
    [cardsById]
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
        message:
          "복원 체인이 아직 맞지 않아. source map 모순, sourcesContent, partner key residue, handshake impact를 순서대로 연결해봐.",
      });
      return;
    }

    setMemoryResult({ correct: true, message: "Partner Handshake Evidence 복원 중..." });
    await onRestoreEvidence();
  }, [allSlotsFilled, onRestoreEvidence, reconstructionCorrect, restored]);

  return (
    <section className="memory-vault-panel">
      <div className="memory-vault-header">
        <div>
          <p className="campaign-kicker">OPERATION 04 // MEMORY VAULT</p>
          <h3>ABSENCE MAP</h3>
          <p>
            AEGIS는 source map이 사라졌다고 기록했지만, 공개 bundle shard에는 아직
            sourceMappingURL이 남아 있다.
          </p>
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
        <span>사용법</span>
        <p>
          먼저 Memory Board 카드를 눌러 확인해. Inspector에서 카드 내용을 본 다음,
          MIRA HINT와 지금 할 일을 따라 선택된 카드를 아래 슬롯에 끌어 놓거나 슬롯을 눌러 넣으면 돼.
          새 카드가 열렸다는 안내가 나오면 슬롯보다 새 카드를 먼저 눌러봐.
        </p>
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
            <p>“없다”고 표시된 것이 정말 없는지 봐. 기억은 종종 포인터를 남겨.</p>
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
        <span>지금 할 일</span>
        <strong>{activeAction}</strong>
      </div>

      <div className="evidence-reconstruction">
        <div className="section-heading">
          <span>EVIDENCE RECONSTRUCTION</span>
          <strong>{restored ? "complete" : "선택 카드"}</strong>
        </div>
        <div className="evidence-slot-grid">
          {LEVEL4_1_MEMORY_PUZZLE.slots.map((slot) => {
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
                <strong>{assignedCard?.title || "선택 카드 넣기"}</strong>
                <small>{slot.hint}</small>
              </button>
            );
          })}
        </div>
        <div className="memory-action-row">
          <button onClick={handleRestore} disabled={restored || !allSlotsFilled || busy}>
            {restored ? "Evidence Restored" : "Restore Evidence"}
          </button>
          <code>{restored ? LEVEL4_1_MEMORY_PUZZLE.evidenceShard : "Partner Handshake Evidence pending"}</code>
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
    "evidenceShard": "${LEVEL4_1_MEMORY_PUZZLE.evidenceShard}",
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
        <p>
          공개 artifact leak은 값을 더 숨기는 것으로 해결되지 않는다. secret 사용 위치, source map 배포,
          key 수명, credential scope를 함께 닫아야 해.
        </p>
        <div className="policy-card-grid">
          {LEVEL4_1_MEMORY_PUZZLE.policyCards.map((card) => {
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
}) {
  const cardsById = useMemo(
    () => new Map(LEVEL4_2_KEY_SLOT_PUZZLE.cards.map((card) => [card.id, card])),
    []
  );
  const [revealedIds, setRevealedIds] = useState(() => LEVEL4_2_KEY_SLOT_PUZZLE.initialCards);
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

  const revealedCards = LEVEL4_2_KEY_SLOT_PUZZLE.cards.filter((card) => revealedIds.includes(card.id));
  const selectedCard = cardsById.get(selectedCardId) || revealedCards[0];
  const selectedKeySlot = LEVEL4_2_KEY_SLOT_PUZZLE.slotOptions.find(
    (slot) => slot.id === selectedKeySlotId
  );
  const selectedClaim = LEVEL4_2_KEY_SLOT_PUZZLE.claimOptions.find(
    (claim) => claim.id === selectedClaimId
  );
  const allSlotsFilled = LEVEL4_2_KEY_SLOT_PUZZLE.slots.every((slot) => slotAssignments[slot.id]);
  const reconstructionCorrect = LEVEL4_2_KEY_SLOT_PUZZLE.slots.every((slot) =>
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
    "PartnerPass header.kid와 JWKS Memory Slot을 비교해봐.";
  const activeHintTone = labResult?.correct === false ? "fail" : "ok";
  const currentGoal = (() => {
    if (canSealPolicy || phase === "MISSION_COMPLETE") {
      return {
        step: "DEFENSE",
        title: "Policy Cards로 legacy verifier path를 봉쇄한다.",
        text: "kid/alg/claim trust boundary를 서버 정책으로 고정하는 control을 골라.",
      };
    }
    if (restored) {
      return {
        step: "COMPLETE",
        title: "Admin Audit Evidence가 복원됐다.",
        text: "이제 방어 단계가 열리면 deprecated kid와 admin claim trust boundary를 닫으면 돼.",
      };
    }
    if (!hasInspectedPartnerPass) {
      return {
        step: "STEP 1",
        title: "PartnerPass Capsule 구조를 확인한다.",
        text: "Memory Board에서 PartnerPass Capsule을 눌러 header, payload, signature를 먼저 봐.",
      };
    }
    if (!hasInspectedJwks) {
      return {
        step: "STEP 2",
        title: "JWKS Memory Slots를 비교한다.",
        text: "active, legacy, retired slot의 상태 차이를 확인해. deprecated와 disabled는 다르다.",
      };
    }
    if (!stackVerified && !allSlotsFilled) {
      return {
        step: "STEP 3",
        title: "Verification Stack에 핵심 조각을 고정한다.",
        text: "kid selector, weak slot, claim mutation, impact를 카드로 연결해.",
      };
    }
    if (!stackVerified && !reconstructionCorrect) {
      return {
        step: "STEP 3",
        title: "Verification Stack 조합을 다시 확인한다.",
        text: "각 슬롯은 역할이 달라. 카드가 의미하는 신뢰 경계와 슬롯 이름을 맞춰봐.",
      };
    }
    if (!stackVerified) {
      return {
        step: "VERIFY",
        title: "Run Verification으로 Key Slot Wheel을 연다.",
        text: "스택이 맞다면 다음 실험 단계가 열린다. 버튼을 눌러 조합을 검증해봐.",
      };
    }
    if (!selectedKeySlotId) {
      return {
        step: "STEP 4",
        title: "kid selector가 사용할 key slot을 실험한다.",
        text: "Key Slot Wheel에서 active, legacy, retired를 비교하고 열려 있는 약한 경로를 찾아.",
      };
    }
    if (selectedKeySlotId !== "legacy") {
      return {
        step: "STEP 4",
        title: "legacy compatibility path를 찾아야 한다.",
        text: "active는 strict verifier고 retired는 disabled다. deprecated legacy가 왜 더 위험한지 비교해봐.",
      };
    }
    if (selectedClaim?.kind !== "admin") {
      return {
        step: "STEP 5",
        title: "admin claim mutation을 확인한다.",
        text: "legacy verifier path 뒤에서 role 또는 scope가 admin으로 바뀌면 어떤 gate가 열리는지 봐.",
      };
    }
    return {
      step: "VERIFY",
      title: "Run Verification으로 Evidence를 복원한다.",
      text: "legacy key slot과 admin claim mutation이 Admin Audit Gate까지 이어지는지 검증해.",
    };
  })();
  const claimPanelLock = (() => {
    if (!canUseKeyWheel || canUseClaimPanel) {
      return null;
    }
    if (selectedKeySlotId === "active") {
      return {
        title: "strict path blocked",
        text: "ACTIVE는 정상 검증 경로라 payload를 바꾸려면 matching signature가 필요해. claim mutation panel은 열리지 않아.",
      };
    }
    if (selectedKeySlotId === "retired") {
      return {
        title: "disabled path blocked",
        text: "RETIRED는 disabled 상태라 verifier path가 없어. claim을 보기 전에 멈추는 비교 경로야.",
      };
    }
    return {
      title: "slot 선택 필요",
      text: "위에서 LEGACY를 선택하면 claim mutation 실험이 열린다. ACTIVE와 RETIRED는 왜 막히는지 비교하는 경로야.",
    };
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
      setRevealedIds(LEVEL4_2_KEY_SLOT_PUZZLE.cards.map((card) => card.id));
      setInspectedIds(LEVEL4_2_KEY_SLOT_PUZZLE.cards.map((card) => card.id));
      setStackVerified(true);
    }
  }, [restored]);

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
        message: `새 카드가 열렸어: ${newCardTitles}. Memory Board에서 이어서 확인해봐.`,
      });
      return;
    }
    setLabResult(null);
  }, [cardsById, revealedIds]);

  const assignCardToSlot = useCallback(
    (slot, cardId) => {
      const card = cardsById.get(cardId);
      if (!card) {
        setLabResult({ correct: false, message: "먼저 Memory Board에서 카드를 하나 선택해줘." });
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
          ? `${slot.label} 슬롯에 ${card.title} 카드를 고정했어.`
          : `${card.title} 카드는 ${slot.label} 슬롯의 핵심 단서와 거리가 있어.`,
      });
    },
    [cardsById]
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
      const slot = LEVEL4_2_KEY_SLOT_PUZZLE.slotOptions.find((item) => item.id === slotId);
      setLabResult({
        correct: slotId === "legacy",
        message:
          slotId === "legacy"
            ? "deprecated slot이 아직 응답해. 이제 claim 변화가 어디까지 신뢰되는지 확인해봐."
            : slotId === "active"
              ? "active slot은 strict verifier야. payload를 바꾸면 matching signature가 필요해."
              : "retired slot은 disabled 상태야. verifier path가 열려 있지 않아.",
      });
    },
    []
  );

  const handleSelectClaim = useCallback((claimId) => {
    setSelectedClaimId(claimId);
    setVerificationNotice(null);
    if (claimId !== "none") {
      setRevealedIds((prev) => [...new Set([...prev, "claim_mutation", "admin_claim_evidence"])]);
    }
    const claim = LEVEL4_2_KEY_SLOT_PUZZLE.claimOptions.find((item) => item.id === claimId);
    setLabResult({
      correct: claim?.kind !== "invalid",
      message:
        claim?.kind === "admin"
          ? "권한 claim이 바뀌었어. 이 주장이 어떤 verifier 뒤에서 받아들여지는지 확인해봐."
          : claim?.kind === "invalid"
            ? "iss/aud/exp 같은 common claim을 깨면 admin gate 전에 거부돼야 해."
            : "neutral claim이야. Admin Audit Gate를 열 권한 변화는 아직 없어.",
    });
  }, []);

  const handleVerify = useCallback(async () => {
    if (restored) {
      return;
    }

    if (!stackVerified) {
      if (!allSlotsFilled || !reconstructionCorrect) {
        const notice = {
          correct: false,
          message:
            "Verification failed. Stack 슬롯마다 역할이 달라. selector, slot, claim, impact 단서를 다시 맞춰봐.",
        };
        setLabResult(notice);
        setVerificationNotice(notice);
        return;
      }

      const notice = {
        correct: true,
        message:
          "Verification Stack 확인 완료. Key Slot Wheel이 열렸어. 이제 kid selector가 실제로 어떤 key slot을 사용하는지 실험해봐.",
      };
      setStackVerified(true);
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (!selectedKeySlotId) {
      const notice = {
        correct: false,
        message: "Key Slot Wheel에서 kid selector가 사용할 slot을 먼저 골라봐.",
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedKeySlotId === "active") {
      const notice = {
        correct: false,
        message: "Verification failed: active slot은 strict signature를 요구해. claim을 바꾸면 signature mismatch가 나야 해.",
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedKeySlotId === "retired") {
      const notice = {
        correct: false,
        message: "Verification failed: retired slot은 disabled 상태야. 열려 있는 verifier path가 없어.",
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedClaim?.kind === "invalid") {
      const notice = {
        correct: false,
        message: "Verification failed: iss/aud/exp 같은 common claim이 깨졌어. admin 권한보다 먼저 거부돼야 해.",
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    if (selectedClaim?.kind !== "admin") {
      const notice = {
        correct: false,
        message: "Compatibility path selected, but admin audit gate still sees user/read claim.",
      };
      setLabResult(notice);
      setVerificationNotice(notice);
      return;
    }

    const notice = {
      correct: true,
      message:
        "Compatibility path selected. Signature enforcement degraded. Admin audit accepts mutated PartnerPass.",
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
  ]);

  return (
    <section className="memory-vault-panel key-slot-lab">
      <div className="memory-vault-header">
        <div>
          <p className="campaign-kicker">OPERATION 04 // MEMORY VAULT</p>
          <h3>KEY MEMORY SLOT</h3>
          <p>
            AEGIS는 PartnerPass가 active key slot으로 검증된다고 주장하지만, Memory Vault에는
            deprecated legacy slot이 아직 남아 있다.
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
          증거 조사. 카드를 눌러 Inspector에서 내용을 확인하고, 필요한 카드는 Verification Stack에 고정한다.
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
          결론 고정. 조사한 카드 4개를 각 슬롯에 맞게 연결해 공격 흐름을 복원한다.
        </p>
        <div className="evidence-slot-grid">
          {LEVEL4_2_KEY_SLOT_PUZZLE.slots.map((slot) => {
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
                <strong>{assignedCard?.title || "빈 슬롯"}</strong>
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
              <code>Admin Audit Evidence pending</code>
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
            검증 경로 실험. ACTIVE/RETIRED는 막힌 비교 경로이고, LEGACY를 선택하면 아래 claim mutation 실험이 열린다.
          </p>
          <div className="key-slot-grid">
            {LEVEL4_2_KEY_SLOT_PUZZLE.slotOptions.map((slot) => (
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
          <p>Verification Stack을 맞춘 뒤 Run Verification을 누르면 열린다.</p>
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
              ? "admin claim이 선택됐어. 아래 Restore Evidence로 최종 검증해봐."
              : "role=admin 또는 scope=partner:admin 중 하나를 선택해 admin gate 변화를 확인해봐."}
          </p>
          <div className="claim-lab-layout">
            <pre>{JSON.stringify(mutatedPayload, null, 2)}</pre>
            <div className="claim-option-grid">
              {LEVEL4_2_KEY_SLOT_PUZZLE.claimOptions.map((claim) => (
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
            LEGACY verifier path와 admin claim mutation을 함께 검증해 Evidence를 복원한다.
          </p>
          <div className="memory-action-row">
            <button onClick={handleVerify} disabled={restored || busy}>
              {restored ? "Evidence Restored" : "Restore Evidence"}
            </button>
            <code>{restored ? LEVEL4_2_KEY_SLOT_PUZZLE.evidenceShard : "Admin Audit Evidence pending"}</code>
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
    "evidenceShard": "${LEVEL4_2_KEY_SLOT_PUZZLE.evidenceShard}"
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
          kid와 alg는 token header가 아니라 서버 정책으로 고정해야 한다. deprecated verifier path와
          admin claim trust boundary를 함께 닫아야 해.
        </p>
        <div className="policy-card-grid">
          {LEVEL4_2_KEY_SLOT_PUZZLE.policyCards.map((card) => {
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
          <p>Admin Audit Evidence가 복원되면 방어 카드가 열린다.</p>
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
}) {
  const cardsById = useMemo(
    () => new Map(LEVEL4_3_REPLAY_PUZZLE.cards.map((card) => [card.id, card])),
    []
  );
  const [selectedCardId, setSelectedCardId] = useState("delivered_template");
  const [inspectedCardIds, setInspectedCardIds] = useState(["delivered_template"]);
  const [labNotice, setLabNotice] = useState(null);
  const [stampSnapshot, setStampSnapshot] = useState({
    count: 0,
    target: LEVEL4_3_REPLAY_PUZZLE.target,
    status: "collecting",
    windowSec: LEVEL4_3_REPLAY_PUZZLE.windowSec,
    remainingSec: LEVEL4_3_REPLAY_PUZZLE.windowSec,
    replayProtection: "event_id",
    events: [],
  });

  const selectedCard = cardsById.get(selectedCardId) || LEVEL4_3_REPLAY_PUZZLE.cards[0];
  const events = Array.isArray(stampSnapshot.events) ? stampSnapshot.events : [];
  const restored = evidenceSolved || evidenceResult?.correct;
  const canSealPolicy = phase === "DEFENSE";
  const showPolicyForge = restored || canSealPolicy || phase === "MISSION_COMPLETE";
  const stampReady = restored || stampSnapshot.status === "ready" || Boolean(stampSnapshot.flag);
  const hasCreditedEvent = events.some((event) => event.credited);
  const hasDuplicateProbe = events.some((event) => event.duplicate);
  const sequencerUnlocked = restored || hasDuplicateProbe || Number(stampSnapshot.count || 0) >= 2;
  const nextEventId = `EVT-2026-DEL-${padReplayEventNumber(Number(stampSnapshot.count || 0) + 1)}`;
  const activeHint =
    labNotice?.message ||
    selectedCard?.note ||
    "첫 delivered 요청을 보내고 Replay Ledger에서 credited/duplicate 차이를 확인해봐.";
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
        prev?.message === "Failed to fetch" || prev?.message?.includes("Stamp 상태")
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
          message:
            "Event Sequencer는 Replay Ledger에서 duplicate와 새 event_id의 차이를 본 뒤 열려.",
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
        message: "Stamp Vault가 아직 잠겨 있어. window 안에서 stamp count를 target까지 올려야 해.",
      });
      return;
    }
    await onRestoreEvidence();
    setLabNotice({
      correct: true,
      message: "Stamp Vault Evidence를 복원했어. 이제 replay 방어 정책을 고르면 돼.",
    });
  }, [onRestoreEvidence, restored, stampReady]);

  const currentGoal = (() => {
    if (canSealPolicy || phase === "MISSION_COMPLETE") {
      return {
        step: "DEFENSE",
        title: "Policy Cards로 replay stamp를 봉쇄한다.",
        text: "event_id 중복만이 아니라 같은 배송 상태 전환이 반복 처리되지 않도록 서버 통제를 골라.",
      };
    }
    if (restored) {
      return {
        step: "COMPLETE",
        title: "Stamp Vault Evidence가 복원됐다.",
        text: "curl 실험에서 드러난 재전송 흐름을 방어 카드로 봉쇄하면 돼.",
      };
    }
    if (!hasCreditedEvent) {
      return {
        step: "STEP 1",
        title: "delivered 이벤트로 stamp window를 연다.",
        text: "Stage Delivered Event를 콘솔에 올리고 Run을 눌러 첫 stamp를 받아봐.",
      };
    }
    if (!hasDuplicateProbe) {
      return {
        step: "STEP 2",
        title: "같은 event_id 재전송이 어떻게 처리되는지 확인한다.",
        text: "Duplicate Probe를 실행해 duplicate는 credited되지 않는다는 점을 먼저 확인해봐.",
      };
    }
    if (!stampReady) {
      return {
        step: "STEP 3",
        title: "event_id를 바꾼 재전송으로 stamp가 쌓이는지 본다.",
        text: "Next Event 또는 Burst Draft로 같은 parcel/status를 새 event_id로 보내고 Ledger count를 확인해.",
      };
    }
    return {
      step: "VAULT",
      title: "Stamp Vault에서 Evidence를 회수한다.",
      text: "Stamp Check 응답이 ready가 됐어. Restore Evidence로 공격 단계를 마무리해.",
    };
  })();

  return (
    <section className="memory-vault-panel replay-stamp-lab">
      <div className="memory-vault-header replay-stamp-header">
        <div>
          <p className="campaign-kicker">OPERATION 04 // MEMORY VAULT</p>
          <h3>REPLAY STAMP</h3>
          <p>
            정상 delivered 이벤트처럼 보여도, 서버가 같은 배송 완료를 여러 event_id로 계속
            처리하면 stamp는 재전송으로 누적된다.
          </p>
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
            <p className="lab-section-summary">
              버튼은 명령어를 콘솔에 올리기만 해. Run을 눌러 실행하고, 오른쪽 Replay Ledger에서
              credited와 duplicate 차이를 확인해.
            </p>
            <div className="replay-stage-actions">
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43EventCurl(LEVEL4_3_REPLAY_PUZZLE.sampleEventId),
                    "첫 delivered 이벤트를 Mission Console에 올렸어. Run으로 window를 열어봐."
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
                    level43EventCurl(LEVEL4_3_REPLAY_PUZZLE.sampleEventId),
                    "같은 event_id를 다시 올렸어. duplicate가 credited되는지 Ledger에서 확인해봐."
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
                    level43EventCurl(nextEventId),
                    `${nextEventId} 초안을 올렸어. 같은 parcel/status인데 event_id만 바뀐 요청이야.`
                  )
                }
                disabled={consoleBusy || restored || !hasCreditedEvent}
              >
                Stage Next Event
              </button>
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43BurstCurl(),
                    "Burst Draft를 올렸어. 반복 패턴이 왜 위험한지는 Replay Ledger count로 확인해봐."
                  )
                }
                disabled={consoleBusy || restored || !sequencerUnlocked}
              >
                Stage Burst Draft
              </button>
              <button
                type="button"
                onClick={() =>
                  stageCommand(
                    level43StampsCurl(),
                    "Stamp Check를 올렸어. count, status, flag 노출 여부를 확인해봐."
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
              <li className="empty">아직 실행된 delivered 이벤트가 없어.</li>
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
                        : event.accepted
                          ? "accepted / no stamp"
                          : "ignored"}
                  </span>
                  <small>
                    {event.parcel_id} / {event.status}
                  </small>
                </li>
              ))
            )}
          </ul>
        </aside>
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
        <p className="lab-section-summary">
          curl 결과를 해석하는 카드야. 콘솔에서 본 count, duplicate, credited를 카드 의미와 연결해봐.
        </p>
        <div className="memory-card-grid replay-card-grid">
          {LEVEL4_3_REPLAY_PUZZLE.cards.map((card) => {
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
                <small>{locked ? "duplicate/new event 차이를 먼저 확인해." : card.summary}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="final-evidence-panel replay-vault-panel lab-section lab-section-evidence">
        <div className="section-heading">
          <span>STAMP VAULT</span>
          <strong>{stampReady ? "evidence ready" : "locked"}</strong>
        </div>
        <p className="lab-section-summary">
          target count에 도달한 뒤 Stamp Check 응답에서 Evidence를 회수한다. 이 미션은 FLAG 직접
          입력보다 재전송 상태를 만드는 과정이 핵심이야.
        </p>
        <div className="memory-action-row">
          <button onClick={handleRestoreEvidence} disabled={busy || restored || !stampReady}>
            {restored ? "Evidence Restored" : "Restore Evidence"}
          </button>
          <code>{stampReady || restored ? LEVEL4_3_REPLAY_PUZZLE.evidenceShard : "Replay Evidence pending"}</code>
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
    "replayProtection": "event_id only",
    "evidenceShard": "${LEVEL4_3_REPLAY_PUZZLE.evidenceShard}"
  }
}`}
          </pre>
        )}
      </div>

      {showPolicyForge ? (
        <div className={`policy-forge ${canSealPolicy || phase === "MISSION_COMPLETE" ? "active" : ""}`}>
          <div className="section-heading">
            <span>POLICY CARDS</span>
            <strong>{policyStatus}</strong>
          </div>
          <p>
            event_id 중복 차단만으로는 부족하다. 논리적 배송 단위 idempotency, processed event 저장,
            중복 상태 전환 거부, replay audit을 함께 봉쇄해야 해.
          </p>
          <div className="policy-card-grid">
            {LEVEL4_3_REPLAY_PUZZLE.policyCards.map((card) => {
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
          <p>Stamp Vault Evidence가 복원되면 replay 방어 카드가 열린다.</p>
        </div>
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
  const [networkTraceResult, setNetworkTraceResult] = useState(null);
  const [networkTraceBusy, setNetworkTraceBusy] = useState(false);
  const [networkTraceEntries, setNetworkTraceEntries] = useState([]);
  const [networkTraceCapsuleId, setNetworkTraceCapsuleId] = useState("");
  const [auditSelectorFields, setAuditSelectorFields] = useState([]);
  const [auditSelectorDraft, setAuditSelectorDraft] = useState({});
  const [expandedTraceById, setExpandedTraceById] = useState({});
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
    setNetworkTraceResult(null);
    setNetworkTraceBusy(false);
    setNetworkTraceEntries([]);
    setNetworkTraceCapsuleId("");
    setAuditSelectorFields([]);
    setAuditSelectorDraft({});
    setExpandedTraceById({});
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
  const usesMemoryVault = currentId === "level4_1" || currentId === "level4_2" || currentId === "level4_3";

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

        const traceEntry = extractNetworkTraceFromCommand(nextCommand, data.stdout, token);
        if (traceEntry) {
          setNetworkTraceEntries((prev) => mergeTraceEntries(prev, [traceEntry]));
          const selectorFields = auditSelectorFieldsFromTrace(traceEntry);
          if (selectorFields.length > 0) {
            setAuditSelectorFields(selectorFields);
          }
        }
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
            message = parsed?.error?.message || parsed?.detail || message;
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
            body,
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
            message = parsed?.error?.message || parsed?.detail || message;
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
            body,
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
            message = parsed?.error?.message || parsed?.detail || message;
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
            body,
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
            message = parsed?.error?.message || parsed?.detail || message;
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
            body,
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
            message = parsed?.error?.message || parsed?.detail || message;
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
            body,
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
          message: "Unlock request staged in Mission Console. <PIN>만 직접 바꿔서 실행해봐.",
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
          message: "Trust fragments reviewed. 첫 probe 이후 체인은 Mission Console에서 직접 이어가봐.",
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
          message: "First probe staged in Mission Console. 이후 요청은 응답 단서를 보고 직접 이어가봐.",
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
  }, [story.actionProbe, token]);

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
      message: "Detail request queued in Mission Console. $SESSION_TOKEN은 콘솔 안에서 현재 세션으로 처리돼.",
    });
  }, [networkTraceCapsuleId, token]);

  const handleCopyTraceCurl = useCallback((curl) => {
    setCommand(curl);
    setNetworkTraceResult({
      ok: true,
      message: "curl staged in Mission Console. 필요한 부분을 직접 수정해서 실행해봐.",
    });

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(curl).catch(() => {});
    }
  }, []);

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
  }, [currentId, refreshMission, story.attackSuccessText, token]);

  const handleSubmitEvidence = useCallback(async () => {
    await submitEvidenceValue(flagValue);
  }, [flagValue, submitEvidenceValue]);

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

              {phase === "BRIEFING" && (
                <section className="briefing-lock">
                  <p>
                    {usesMemoryVault
                      ? "브리핑을 확인했으면 Memory Board를 열 수 있어."
                      : "작전 브리핑을 확인했으면 침투 콘솔을 열 수 있어."}
                  </p>
                  <button onClick={handleBeginMission}>
                    {usesMemoryVault ? "Open Memory Board" : "Begin Infiltration"}
                  </button>
                </section>
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
                  />
                ) : null
              ) : (
                <>
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
        />
      )}
    </div>
  );
}

export default CampaignMode;

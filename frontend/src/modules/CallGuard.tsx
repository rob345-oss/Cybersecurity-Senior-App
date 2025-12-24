import { useMemo, useState } from "react";
import { postJson } from "../api";
import { RiskResponse, SessionStartResponse } from "../types";
import ChipGrid from "../components/ChipGrid";
import RiskCard from "../components/RiskCard";

const signals = [
  "urgency",
  "bank_impersonation",
  "government_impersonation",
  "tech_support",
  "remote_access_request",
  "verification_code_request",
  "gift_cards",
  "crypto_payment",
  "threats_or_arrest",
  "too_good_to_be_true",
  "asks_to_keep_secret",
  "caller_id_mismatch"
];

export default function CallGuard() {
  const [selectedSignals, setSelectedSignals] = useState<Set<string>>(new Set());
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const quickActions = useMemo(
    () => [
      {
        title: "I’m on a call — help me",
        subtitle: "Live coaching for suspicious callers"
      },
      {
        title: "Before I send money",
        subtitle: "Check payment risk fast"
      },
      {
        title: "Check a message or link",
        subtitle: "Inbox phishing triage"
      },
      {
        title: "Identity protection steps",
        subtitle: "Freeze credit checklist"
      }
    ],
    []
  );

  const toggleSignal = (item: string) => {
    setSelectedSignals((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const startSession = async () => {
    setLoading(true);
    setRisk(null);
    try {
      const response = await postJson<SessionStartResponse>("v1/session/start", {
        user_id: crypto.randomUUID(),
        device_id: "web",
        module: "callguard",
        context: null
      });
      setSessionId(response.session_id);

      for (const signal of selectedSignals) {
        const event = {
          type: "signal",
          payload: { signal_key: signal },
          timestamp: new Date().toISOString()
        };
        const result = await postJson<RiskResponse>(`v1/session/${response.session_id}/event`, event);
        setRisk(result);
      }
    } catch (error) {
      console.error(error);
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian CallGuard summary: ${risk.level} risk score ${risk.score}.`;
    if (navigator.share) {
      await navigator.share({ text: summary });
    } else {
      await navigator.clipboard.writeText(summary);
      alert("Summary copied to clipboard.");
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          {quickActions.map((action) => (
            <div key={action.title} className="quick-action">
              <strong>{action.title}</strong>
              <p className="helper-note">{action.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>I’m on a call — help me</h2>
        <p className="helper-note">Tap any signals you recognize while you’re on the line.</p>
        <ChipGrid items={signals} selected={selectedSignals} onToggle={toggleSignal} />
        <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <button className="button" onClick={startSession} disabled={loading || selectedSignals.size === 0}>
            {loading ? "Starting..." : "Start Live Session"}
          </button>
          {sessionId && <span className="helper-note">Session ID: {sessionId}</span>}
        </div>
      </div>
      {risk && (
        <div>
          <RiskCard risk={risk} />
          <button className="button secondary" style={{ marginTop: 12 }} onClick={shareSummary}>
            Share summary
          </button>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { postJson, ApiError } from "../api";
import { RiskResponse, SessionStartResponse } from "../types";
import ChipGrid from "../components/ChipGrid";
import RiskCard from "../components/RiskCard";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import EmptyState from "../components/EmptyState";

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
  const { showToast } = useToast();
  const { user } = useAuth();
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
    if (selectedSignals.size === 0) {
      showToast("Please select at least one signal", "error");
      return;
    }

    setLoading(true);
    setRisk(null);
    try {
      if (!user?.id) {
        showToast("You must be logged in to start a session", "error");
        setLoading(false);
        return;
      }
      
      const response = await postJson<SessionStartResponse>("v1/session/start", {
        user_id: user.id,
        device_id: "web",
        module: "callguard",
        context: null
      });
      setSessionId(response.session_id);
      showToast("Session started successfully", "success");

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
      const errorMessage = error instanceof ApiError ? error.message : "Failed to start session. Please try again.";
      showToast(errorMessage, "error");
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian CallGuard summary: ${risk.level} risk score ${risk.score}.`;
    try {
      if (navigator.share) {
        await navigator.share({ text: summary });
        showToast("Summary shared successfully", "success");
      } else {
        await navigator.clipboard.writeText(summary);
        showToast("Summary copied to clipboard", "success");
      }
    } catch (error) {
      showToast("Failed to share summary", "error");
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
        <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="button" onClick={startSession} disabled={loading || selectedSignals.size === 0}>
            {loading ? "Starting..." : "Start Live Session"}
          </button>
          {sessionId && <span className="helper-note">Session ID: {sessionId}</span>}
        </div>
      </div>
      {!risk && !loading && (
        <div className="card">
          <EmptyState
            title="No session started yet"
            description="Select any signals you recognize during a call, then click 'Start Live Session' to get real-time coaching."
            icon="📞"
          />
        </div>
      )}
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

import { useState } from "react";
import { postJson } from "../api";
import { RiskResponse } from "../types";
import RiskCard from "../components/RiskCard";

export default function InboxGuard() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const analyzeText = async () => {
    setLoadingText(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/inboxguard/analyze_text", {
        text,
        channel: "sms"
      });
      setRisk(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingText(false);
    }
  };

  const analyzeUrl = async () => {
    setLoadingUrl(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/inboxguard/analyze_url", {
        url
      });
      setRisk(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUrl(false);
    }
  };

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian InboxGuard summary: ${risk.level} risk score ${risk.score}.`;
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
        <h2>Paste a message or URL</h2>
        <label>
          Message text
          <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button className="button" style={{ marginTop: 12 }} onClick={analyzeText} disabled={loadingText}>
          {loadingText ? "Analyzing..." : "Analyze Message"}
        </button>
        <label style={{ marginTop: 12, display: "block" }}>
          URL
          <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} />
        </label>
        <button className="button" style={{ marginTop: 12 }} onClick={analyzeUrl} disabled={loadingUrl}>
          {loadingUrl ? "Analyzing..." : "Analyze URL"}
        </button>
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

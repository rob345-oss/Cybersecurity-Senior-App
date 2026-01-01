import { useState, useMemo, useCallback } from "react";
import { postJson, ApiError } from "../api";
import { RiskResponse } from "../types";
import RiskCard from "../components/RiskCard";
import { useToast } from "../contexts/ToastContext";
import { validateInboxGuardForm, validateText, validateUrl } from "../utils/validation";
import EmptyState from "../components/EmptyState";
import { debounce } from "../utils/debounce";

export default function InboxGuard() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const analyzeText = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (loadingText) {
      return;
    }

    setValidationErrors({});

    const validation = validateText(text, "Message text");
    if (!validation.isValid) {
      setValidationErrors({ text: validation.errors[0] });
      showToast(validation.errors[0], "error");
      return;
    }

    setLoadingText(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/inboxguard/analyze_text", {
        text,
        channel: "sms"
      });
      setRisk(response);
      showToast("Message analyzed successfully", "success");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to analyze message. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoadingText(false);
    }
  }, [text, loadingText, showToast]);

  const analyzeUrl = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (loadingUrl) {
      return;
    }

    setValidationErrors({});

    const validation = validateUrl(url);
    if (!validation.isValid) {
      setValidationErrors({ url: validation.errors[0] });
      showToast(validation.errors[0], "error");
      return;
    }

    setLoadingUrl(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/inboxguard/analyze_url", {
        url
      });
      setRisk(response);
      showToast("URL analyzed successfully", "success");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to analyze URL. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoadingUrl(false);
    }
  }, [url, loadingUrl, showToast]);

  // Debounced versions to prevent rapid successive clicks (500ms delay)
  const debouncedAnalyzeText = useMemo(() => debounce(analyzeText, 500), [analyzeText]);
  const debouncedAnalyzeUrl = useMemo(() => debounce(analyzeUrl, 500), [analyzeUrl]);

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian InboxGuard summary: ${risk.level} risk score ${risk.score}.`;
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
        <h2>Paste a message or URL</h2>
        <label>
          Message text
          <textarea
            className="textarea"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (validationErrors.text) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.text;
                  return next;
                });
              }
            }}
            style={{
              borderColor: validationErrors.text ? "#ef4444" : undefined
            }}
          />
          {validationErrors.text && (
            <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
              {validationErrors.text}
            </span>
          )}
        </label>
        <button className="button" style={{ marginTop: 12 }} onClick={debouncedAnalyzeText} disabled={loadingText}>
          {loadingText ? "Analyzing..." : "Analyze Message"}
        </button>
        <label style={{ marginTop: 12, display: "block" }}>
          URL
          <input
            className="input"
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (validationErrors.url) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.url;
                  return next;
                });
              }
            }}
            style={{
              borderColor: validationErrors.url ? "#ef4444" : undefined
            }}
          />
          {validationErrors.url && (
            <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
              {validationErrors.url}
            </span>
          )}
        </label>
        <button className="button" style={{ marginTop: 12 }} onClick={debouncedAnalyzeUrl} disabled={loadingUrl}>
          {loadingUrl ? "Analyzing..." : "Analyze URL"}
        </button>
      </div>
      {!risk && !loadingText && !loadingUrl && (
        <div className="card">
          <EmptyState
            title="No analysis yet"
            description="Paste a message or URL above and click 'Analyze' to check for phishing or suspicious content."
            icon="📧"
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

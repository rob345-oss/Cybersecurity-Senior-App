import { useState } from "react";
import { postJson, ApiError } from "../api";
import { RiskResponse } from "../types";
import RiskCard from "../components/RiskCard";
import { useToast } from "../contexts/ToastContext";
import { validateMoneyGuardForm } from "../utils/validation";
import EmptyState from "../components/EmptyState";

export default function MoneyGuard() {
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("zelle");
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState("");
  const [didTheyContactYouFirst, setDidTheyContactYouFirst] = useState(false);
  const [urgencyPresent, setUrgencyPresent] = useState(false);
  const [askedToKeepSecret, setAskedToKeepSecret] = useState(false);
  const [askedForVerificationCode, setAskedForVerificationCode] = useState(false);
  const [askedForRemoteAccess, setAskedForRemoteAccess] = useState(false);
  const [impersonationType, setImpersonationType] = useState("none");
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const assessRisk = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    // Validate form
    const validation = validateMoneyGuardForm({ amount, recipient, paymentMethod });
    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        if (error.includes("Amount")) errors.amount = error;
        else if (error.includes("Recipient")) errors.recipient = error;
        else if (error.includes("Payment method")) errors.paymentMethod = error;
        else errors.general = error;
      });
      setValidationErrors(errors);
      showToast(validation.errors.join(". "), "error");
      return;
    }

    setLoading(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/moneyguard/assess", {
        amount: Number(amount) || 0,
        payment_method: paymentMethod,
        recipient,
        reason,
        did_they_contact_you_first: didTheyContactYouFirst,
        urgency_present: urgencyPresent,
        asked_to_keep_secret: askedToKeepSecret,
        asked_for_verification_code: askedForVerificationCode,
        asked_for_remote_access: askedForRemoteAccess,
        impersonation_type: impersonationType
      });
      setRisk(response);
      showToast("Risk assessment completed successfully", "success");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to assess risk. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian MoneyGuard summary: ${risk.level} risk score ${risk.score}.`;
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
        <h2>Before you send money</h2>
        <div className="grid">
          <label>
            Amount
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                if (validationErrors.amount) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.amount;
                    return next;
                  });
                }
              }}
              style={{
                borderColor: validationErrors.amount ? "#ef4444" : undefined
              }}
            />
            {validationErrors.amount && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {validationErrors.amount}
              </span>
            )}
          </label>
          <label>
            Payment method
            <input
              className="input"
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(event.target.value);
                if (validationErrors.paymentMethod) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.paymentMethod;
                    return next;
                  });
                }
              }}
              style={{
                borderColor: validationErrors.paymentMethod ? "#ef4444" : undefined
              }}
            />
            {validationErrors.paymentMethod && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {validationErrors.paymentMethod}
              </span>
            )}
          </label>
          <label>
            Recipient
            <input
              className="input"
              value={recipient}
              onChange={(event) => {
                setRecipient(event.target.value);
                if (validationErrors.recipient) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.recipient;
                    return next;
                  });
                }
              }}
              style={{
                borderColor: validationErrors.recipient ? "#ef4444" : undefined
              }}
            />
            {validationErrors.recipient && (
              <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
                {validationErrors.recipient}
              </span>
            )}
          </label>
          <label>
            Reason
            <input className="input" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <label>
            Impersonation type
            <input
              className="input"
              value={impersonationType}
              onChange={(event) => setImpersonationType(event.target.value)}
            />
          </label>
        </div>
        <div className="toggle-group" style={{ marginTop: 16 }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={didTheyContactYouFirst}
              onChange={(event) => setDidTheyContactYouFirst(event.target.checked)}
            />
            They contacted me first
          </label>
          <label className="toggle">
            <input type="checkbox" checked={urgencyPresent} onChange={(event) => setUrgencyPresent(event.target.checked)} />
            Urgency present
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={askedToKeepSecret}
              onChange={(event) => setAskedToKeepSecret(event.target.checked)}
            />
            Asked to keep it secret
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={askedForVerificationCode}
              onChange={(event) => setAskedForVerificationCode(event.target.checked)}
            />
            Asked for verification code
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={askedForRemoteAccess}
              onChange={(event) => setAskedForRemoteAccess(event.target.checked)}
            />
            Asked for remote access
          </label>
        </div>
        <button className="button" style={{ marginTop: 16 }} onClick={assessRisk} disabled={loading}>
          {loading ? "Assessing..." : "Assess Risk"}
        </button>
      </div>
      {!risk && !loading && (
        <div className="card">
          <EmptyState
            title="No assessment yet"
            description="Fill out the form above and click 'Assess Risk' to get a risk analysis for your payment."
            icon="💳"
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

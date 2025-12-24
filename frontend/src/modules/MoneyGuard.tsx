import { useState } from "react";
import { postJson } from "../api";
import { RiskResponse } from "../types";
import RiskCard from "../components/RiskCard";

export default function MoneyGuard() {
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

  const assessRisk = async () => {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian MoneyGuard summary: ${risk.level} risk score ${risk.score}.`;
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
        <h2>Before you send money</h2>
        <div className="grid">
          <label>
            Amount
            <input className="input" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label>
            Payment method
            <input className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
          </label>
          <label>
            Recipient
            <input className="input" value={recipient} onChange={(event) => setRecipient(event.target.value)} />
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

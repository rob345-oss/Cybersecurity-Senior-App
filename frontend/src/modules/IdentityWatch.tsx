import { useState } from "react";
import { postJson } from "../api";
import { RiskResponse } from "../types";
import RiskCard from "../components/RiskCard";

const defaultSignals: Record<string, boolean> = {
  password_reset_unknown: false,
  account_opened: false,
  suspicious_inquiry: false,
  reused_passwords: false,
  clicked_suspicious_link: false,
  ssn_requested_unexpectedly: false
};

export default function IdentityWatch() {
  const [emails, setEmails] = useState("");
  const [phones, setPhones] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [signals, setSignals] = useState(defaultSignals);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState(false);

  const createProfile = async () => {
    setLoadingProfile(true);
    setRisk(null);
    try {
      const response = await postJson<{ profile_id: string }>("v1/identitywatch/profile", {
        emails: emails
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean),
        phones: phones
          .split(",")
          .map((phone) => phone.trim())
          .filter(Boolean),
        full_name: null,
        state: null
      });
      setProfileId(response.profile_id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const assessRisk = async () => {
    if (!profileId) return;
    setLoadingRisk(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/identitywatch/check_risk", {
        profile_id: profileId,
        signals
      });
      setRisk(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRisk(false);
    }
  };

  const toggleSignal = (key: string) => {
    setSignals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const shareSummary = async () => {
    if (!risk) return;
    const summary = `Titanium Guardian IdentityWatch summary: ${risk.level} risk score ${risk.score}.`;
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
        <h2>IdentityWatch Profile</h2>
        <label>
          Emails (comma separated)
          <input className="input" value={emails} onChange={(event) => setEmails(event.target.value)} />
        </label>
        <label style={{ marginTop: 12 }}>
          Phones (comma separated)
          <input className="input" value={phones} onChange={(event) => setPhones(event.target.value)} />
        </label>
        <button className="button" style={{ marginTop: 16 }} onClick={createProfile} disabled={loadingProfile}>
          {loadingProfile ? "Creating..." : "Create Profile"}
        </button>
        {profileId && <p className="helper-note">Profile ID: {profileId}</p>}
      </div>
      {profileId && (
        <div className="card">
          <h2>Something happened</h2>
          <div className="toggle-group">
            {Object.keys(signals).map((key) => (
              <label key={key} className="toggle">
                <input type="checkbox" checked={signals[key]} onChange={() => toggleSignal(key)} />
                {key.replaceAll("_", " ")}
              </label>
            ))}
          </div>
          <button className="button" style={{ marginTop: 16 }} onClick={assessRisk} disabled={loadingRisk}>
            {loadingRisk ? "Checking..." : "Check Risk"}
          </button>
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

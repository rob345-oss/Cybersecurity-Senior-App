import { useState } from "react";
import { postJson, ApiError } from "../api";
import { RiskResponse } from "../types";
import RiskCard from "../components/RiskCard";
import { useToast } from "../contexts/ToastContext";
import { validateIdentityWatchProfile } from "../utils/validation";
import EmptyState from "../components/EmptyState";

const defaultSignals: Record<string, boolean> = {
  password_reset_unknown: false,
  account_opened: false,
  suspicious_inquiry: false,
  reused_passwords: false,
  clicked_suspicious_link: false,
  ssn_requested_unexpectedly: false
};

export default function IdentityWatch() {
  const { showToast } = useToast();
  const [emails, setEmails] = useState("");
  const [phones, setPhones] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [signals, setSignals] = useState(defaultSignals);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createProfile = async () => {
    setValidationErrors({});

    const validation = validateIdentityWatchProfile({ emails, phones });
    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        if (error.includes("email")) errors.emails = error;
        else if (error.includes("phone")) errors.phones = error;
        else errors.general = error;
      });
      setValidationErrors(errors);
      showToast(validation.errors.join(". "), "error");
      return;
    }

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
      showToast("Profile created successfully", "success");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to create profile. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const assessRisk = async () => {
    if (!profileId) {
      showToast("Please create a profile first", "error");
      return;
    }
    setLoadingRisk(true);
    setRisk(null);
    try {
      const response = await postJson<RiskResponse>("v1/identitywatch/check_risk", {
        profile_id: profileId,
        signals
      });
      setRisk(response);
      showToast("Risk assessment completed successfully", "success");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof ApiError ? error.message : "Failed to check risk. Please try again.";
      showToast(errorMessage, "error");
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
        <h2>IdentityWatch Profile</h2>
        <label>
          Emails (comma separated)
          <input
            className="input"
            type="email"
            value={emails}
            onChange={(event) => {
              setEmails(event.target.value);
              if (validationErrors.emails) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.emails;
                  return next;
                });
              }
            }}
            style={{
              borderColor: validationErrors.emails ? "#ef4444" : undefined
            }}
          />
          {validationErrors.emails && (
            <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
              {validationErrors.emails}
            </span>
          )}
        </label>
        <label style={{ marginTop: 12 }}>
          Phones (comma separated)
          <input
            className="input"
            type="tel"
            value={phones}
            onChange={(event) => {
              setPhones(event.target.value);
              if (validationErrors.phones) {
                setValidationErrors((prev) => {
                  const next = { ...prev };
                  delete next.phones;
                  return next;
                });
              }
            }}
            style={{
              borderColor: validationErrors.phones ? "#ef4444" : undefined
            }}
          />
          {validationErrors.phones && (
            <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>
              {validationErrors.phones}
            </span>
          )}
        </label>
        <button className="button" style={{ marginTop: 16 }} onClick={createProfile} disabled={loadingProfile}>
          {loadingProfile ? "Creating..." : "Create Profile"}
        </button>
        {profileId && (
          <p className="helper-note" style={{ marginTop: 12 }}>
            Profile ID: {profileId}
          </p>
        )}
      </div>
      {!profileId && (
        <div className="card">
          <EmptyState
            title="Create your profile first"
            description="Enter at least one email or phone number to create your IdentityWatch profile, then you can check for identity risks."
            icon="🆔"
          />
        </div>
      )}
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
      {!risk && profileId && !loadingRisk && (
        <div className="card">
          <EmptyState
            title="No risk assessment yet"
            description="Select any signals that apply and click 'Check Risk' to get an identity risk assessment."
            icon="🔍"
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

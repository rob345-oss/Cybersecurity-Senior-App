import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { ApiError } from "../../api";

export default function VerifyEmail() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const { verifyEmailToken } = useAuth();
  const { showToast } = useToast();

  // Try to get token from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast("Please enter a verification token", "error");
      return;
    }

    setLoading(true);

    try {
      await verifyEmailToken(token);
      setVerified(true);
      showToast("Email verified successfully!", "success");
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, "error");
      } else {
        showToast("Failed to verify email. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <h2>Email Verified!</h2>
        <p>Your email has been verified. You can now log in.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem" }}>
      <h2>Verify Email</h2>
      <p style={{ marginBottom: "1rem" }}>
        Enter the verification token sent to your email address.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="token" style={{ display: "block", marginBottom: "0.5rem" }}>
            Verification Token:
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="Enter verification token"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>
    </div>
  );
}


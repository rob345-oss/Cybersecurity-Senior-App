import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { ApiError } from "../../api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return "Password must be at least 12 characters long";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(pwd)) {
      return "Password must contain at least one digit";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast(passwordError, "error");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName, phone || undefined);
      setRegistered(true);
      showToast("Account created! Please check your email for verification.", "success");
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, "error");
      } else {
        showToast("Failed to create account. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
        <h2>Account Created!</h2>
        <p>Please check your email for a verification link. Once verified, you can log in.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem" }}>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>
            Email: *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="fullName" style={{ display: "block", marginBottom: "0.5rem" }}>
            Full Name: *
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="phone" style={{ display: "block", marginBottom: "0.5rem" }}>
            Phone (optional):
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>
            Password: *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
          <small style={{ display: "block", marginTop: "0.25rem", color: "#666" }}>
            Minimum 12 characters with uppercase, lowercase, number, and special character
          </small>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "0.5rem" }}>
            Confirm Password: *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}


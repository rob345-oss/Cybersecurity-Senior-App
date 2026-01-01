import { useMemo, useState, useEffect } from "react";
import { ToastProvider } from "./contexts/ToastContext";
import { useAuth } from "./contexts/AuthContext";
import CallGuard from "./modules/CallGuard";
import MoneyGuard from "./modules/MoneyGuard";
import InboxGuard from "./modules/InboxGuard";
import IdentityWatch from "./modules/IdentityWatch";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import VerifyEmail from "./components/auth/VerifyEmail";

const tabs = [
  {
    id: "callguard",
    label: "CallGuard",
    description: "Live coaching for suspicious calls.",
    component: <CallGuard />
  },
  {
    id: "moneyguard",
    label: "MoneyGuard",
    description: "Assess payment risk before you send.",
    component: <MoneyGuard />
  },
  {
    id: "inboxguard",
    label: "InboxGuard",
    description: "Analyze messages and links for phishing.",
    component: <InboxGuard />
  },
  {
    id: "identitywatch",
    label: "IdentityWatch",
    description: "Monitor identity signals and escalation steps.",
    component: <IdentityWatch />
  }
];

function AuthenticatedApp({ initialAgent }: { initialAgent: string | null }) {
  const [activeTab, setActiveTab] = useState(initialAgent || "callguard");
  const active = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);
  const { user, logout } = useAuth();

  // Set initial tab from URL parameter
  useEffect(() => {
    if (initialAgent && tabs.some(tab => tab.id === initialAgent)) {
      setActiveTab(initialAgent);
    }
  }, [initialAgent]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Titanium Guardian
          <span>Cross-platform security companion</span>
        </div>
        <nav className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${tab.id === active.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "1rem", borderTop: "1px solid #ddd" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>{user?.email}</strong>
          </div>
          {!user?.email_verified && (
            <div style={{ marginBottom: "0.5rem", color: "#ff9800", fontSize: "0.9rem" }}>
              Email not verified
            </div>
          )}
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
        <div className="helper-note">
          Install this app from your mobile browser to use it on Android, ChromeOS, and desktop.
        </div>
      </aside>
      <main className="main">
        <header className="header">
          <div>
            <h1>{active.label}</h1>
            <p>{active.description}</p>
          </div>
        </header>
        {active.component}
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register" | "verify">("login");
  const [initialAgent, setInitialAgent] = useState<string | null>(null);

  // Check for agent parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agent = params.get("agent");
    if (agent) {
      setInitialAgent(agent);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid #ddd", backgroundColor: "white" }}>
            <h1 style={{ margin: 0 }}>Titanium Guardian</h1>
          </div>
          <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "white", borderBottom: "1px solid #ddd" }}>
            <button
              onClick={() => setAuthView("login")}
              style={{
                margin: "0 0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: authView === "login" ? "#007bff" : "transparent",
                color: authView === "login" ? "white" : "#007bff",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Login
            </button>
            <button
              onClick={() => setAuthView("register")}
              style={{
                margin: "0 0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: authView === "register" ? "#007bff" : "transparent",
                color: authView === "register" ? "white" : "#007bff",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Register
            </button>
            <button
              onClick={() => setAuthView("verify")}
              style={{
                margin: "0 0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: authView === "verify" ? "#007bff" : "transparent",
                color: authView === "verify" ? "white" : "#007bff",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Verify Email
            </button>
          </div>
          {authView === "login" && <Login />}
          {authView === "register" && <Register />}
          {authView === "verify" && <VerifyEmail />}
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AuthenticatedApp initialAgent={initialAgent} />
    </ToastProvider>
  );
}
        <aside className="sidebar">
          <div className="brand">
            Titanium Guardian
            <span>Cross-platform security companion</span>
          </div>
          <nav className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${tab.id === active.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="helper-note">
            Install this app from your mobile browser to use it on Android, ChromeOS, and desktop.
          </div>
        </aside>
        <main className="main">
          <header className="header">
            <div>
              <h1>{active.label}</h1>
              <p>{active.description}</p>
            </div>
            <div className="card">
              <strong>API endpoint</strong>
              <p className="helper-note">Update VITE_API_URL to point at your backend.</p>
            </div>
          </header>
          {active.component}
        </main>
      </div>
    </ToastProvider>
  );
}

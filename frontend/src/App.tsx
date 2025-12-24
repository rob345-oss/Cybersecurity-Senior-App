import { useMemo, useState } from "react";
import CallGuard from "./modules/CallGuard";
import MoneyGuard from "./modules/MoneyGuard";
import InboxGuard from "./modules/InboxGuard";
import IdentityWatch from "./modules/IdentityWatch";

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

export default function App() {
  const [activeTab, setActiveTab] = useState("callguard");
  const active = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);

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
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon = "📋" }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        color: "#64748b"
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
      <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600, color: "#475569" }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: "14px", maxWidth: "400px" }}>{description}</p>
    </div>
  );
}


import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export default function ToastComponent({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          backgroundColor: "#dcfce7",
          color: "#166534",
          borderColor: "#86efac"
        };
      case "error":
        return {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderColor: "#fca5a5"
        };
      case "info":
        return {
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          borderColor: "#93c5fd"
        };
      default:
        return {
          backgroundColor: "#f1f5f9",
          color: "#475569",
          borderColor: "#cbd5e1"
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      style={{
        ...styles,
        padding: "12px 16px",
        borderRadius: "8px",
        border: `1px solid ${styles.borderColor}`,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "500px",
        animation: "slideIn 0.3s ease-out"
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "4px 8px",
          fontSize: "18px",
          lineHeight: 1,
          opacity: 0.7
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}


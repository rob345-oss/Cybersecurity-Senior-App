import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

export default function ToastComponent({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`animate-slide-in flex min-w-[300px] max-w-md items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg ${typeStyles[toast.type]}`}
      role="alert"
    >
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded p-1 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

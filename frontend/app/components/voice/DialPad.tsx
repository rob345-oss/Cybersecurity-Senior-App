'use client'

interface DialPadProps {
  value: string
  onChange: (value: string) => void
  onCall: () => void
  disabled?: boolean
  loading?: boolean
}

export default function DialPad({ value, onChange, onCall, disabled, loading }: DialPadProps) {
  const append = (digit: string) => {
    if (disabled) return
    onChange(value + digit)
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

  return (
    <div className="space-y-4">
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="+1 (555) 123-4567"
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-gray-900 focus:border-gray-900"
      />
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => append(key)}
            className="py-3 text-lg font-medium bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {key}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onCall}
        disabled={disabled || !value.trim() || loading}
        className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Calling...' : 'Call'}
      </button>
    </div>
  )
}

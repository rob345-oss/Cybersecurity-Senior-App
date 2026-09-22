'use client'

import { Delete } from 'lucide-react'
import { cn } from '../../utils/cn'
import CallButton from './CallButton'
import { formatPhoneForDisplay } from '../../utils/phone'

interface DialPadProps {
  value: string
  onChange: (value: string) => void
  onCall: () => void
  disabled?: boolean
  loading?: boolean
  /** When true, only digits (in-call DTMF) — no call button */
  digitsOnly?: boolean
  onDigit?: (digit: string) => void
  className?: string
}

const KEYS: Array<{ digit: string; letters?: string }> = [
  { digit: '1' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*' },
  { digit: '0', letters: '+' },
  { digit: '#' },
]

export default function DialPad({
  value,
  onChange,
  onCall,
  disabled,
  loading,
  digitsOnly,
  onDigit,
  className,
}: DialPadProps) {
  const append = (digit: string) => {
    if (disabled) return
    onDigit?.(digit)
    if (!digitsOnly) {
      onChange(value + digit)
    }
  }

  const backspace = () => {
    if (disabled) return
    onChange(value.slice(0, -1))
  }

  const display = value.trim()
    ? formatPhoneForDisplay(value) === value
      ? value
      : value.startsWith('+') || value.length >= 10
        ? formatPhoneForDisplay(value)
        : value
    : ''

  return (
    <div className={cn('space-y-5', className)}>
      {!digitsOnly && (
        <div className="relative">
          <label htmlFor="callguard-dial-input" className="sr-only">
            Phone number
          </label>
          <input
            id="callguard-dial-input"
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter phone number"
            disabled={disabled}
            aria-label="Phone number to call"
            className={cn(
              'w-full min-h-[56px] px-4 pr-14 rounded-2xl border-2 border-gray-200 bg-white',
              'text-2xl font-semibold text-center text-[var(--cg-ink)] tracking-wide',
              'placeholder:text-gray-400 placeholder:font-normal placeholder:text-lg',
              'focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700',
              'disabled:opacity-50'
            )}
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={backspace}
              aria-label="Delete last digit"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
            >
              <Delete className="w-6 h-6" aria-hidden="true" />
            </button>
          )}
          {display && display !== value && (
            <p className="sr-only" aria-live="polite">
              {display}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto">
        {KEYS.map(({ digit, letters }) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => append(digit)}
            aria-label={`Dial ${digit}`}
            className={cn(
              'min-h-[64px] sm:min-h-[72px] rounded-2xl bg-white border border-gray-200 shadow-sm',
              'flex flex-col items-center justify-center gap-0.5',
              'text-2xl font-semibold text-[var(--cg-ink)]',
              'hover:bg-gray-50 active:bg-gray-100',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span>{digit}</span>
            {letters && (
              <span className="text-xs font-medium tracking-widest text-gray-400">{letters}</span>
            )}
          </button>
        ))}
      </div>

      {!digitsOnly && (
        <CallButton
          onClick={onCall}
          disabled={disabled || !value.trim()}
          loading={loading}
          pulse={!disabled && !!value.trim() && !loading}
        />
      )}
    </div>
  )
}

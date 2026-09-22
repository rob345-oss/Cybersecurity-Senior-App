'use client'

import { Grid3X3, Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react'
import { cn } from '../../utils/cn'
import TrustedContactAction from './TrustedContactAction'

interface ActiveCallControlsProps {
  muted: boolean
  speakerOn: boolean
  keypadOpen: boolean
  onToggleMute: () => void
  onToggleSpeaker: () => void
  onToggleKeypad: () => void
  onHangUp: () => void
  onAddTrusted?: () => void
  isTrusted?: boolean
  className?: string
}

function ControlButton({
  label,
  active,
  onClick,
  children,
  danger,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 min-h-[72px] min-w-[72px] rounded-2xl text-base font-semibold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
        danger
          ? 'bg-[var(--cg-end)] text-white hover:bg-[var(--cg-end-hover)] col-span-2 sm:col-span-1 min-w-[120px] min-h-[80px]'
          : active
            ? 'bg-white text-gray-900'
            : 'bg-white/15 text-white hover:bg-white/25'
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export default function ActiveCallControls({
  muted,
  speakerOn,
  keypadOpen,
  onToggleMute,
  onToggleSpeaker,
  onToggleKeypad,
  onHangUp,
  onAddTrusted,
  isTrusted,
  className,
}: ActiveCallControlsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
        <ControlButton label={muted ? 'Unmute' : 'Mute'} active={muted} onClick={onToggleMute}>
          {muted ? <MicOff className="w-7 h-7" aria-hidden="true" /> : <Mic className="w-7 h-7" aria-hidden="true" />}
        </ControlButton>
        <ControlButton
          label={speakerOn ? 'Speaker on' : 'Speaker'}
          active={speakerOn}
          onClick={onToggleSpeaker}
        >
          {speakerOn ? (
            <Volume2 className="w-7 h-7" aria-hidden="true" />
          ) : (
            <VolumeX className="w-7 h-7" aria-hidden="true" />
          )}
        </ControlButton>
        <ControlButton label="Keypad" active={keypadOpen} onClick={onToggleKeypad}>
          <Grid3X3 className="w-7 h-7" aria-hidden="true" />
        </ControlButton>
        <div className="col-span-2 sm:col-span-3 w-full flex justify-center">
          <TrustedContactAction
            isTrusted={isTrusted}
            onAddTrusted={onAddTrusted}
            compact
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          />
        </div>
      </div>
      <ControlButton label="End call" onClick={onHangUp} danger>
        <PhoneOff className="w-8 h-8" aria-hidden="true" />
      </ControlButton>
    </div>
  )
}

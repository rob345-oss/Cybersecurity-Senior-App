'use client'

import { User } from 'lucide-react'
import { formatPhoneForDisplay } from '../../utils/phone'
import { cn } from '../../utils/cn'
import type { CallerDisplay } from './types'

interface CallerIdentityProps {
  caller: CallerDisplay
  size?: 'md' | 'lg'
  className?: string
  subtitle?: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function CallerIdentity({
  caller,
  size = 'lg',
  className,
  subtitle,
}: CallerIdentityProps) {
  const isPhoneOnly =
    !caller.displayName ||
    caller.displayName === caller.phoneNumber ||
    /^[\d+\s().-]+$/.test(caller.displayName)

  const primary = isPhoneOnly
    ? formatPhoneForDisplay(caller.phoneNumber || caller.displayName)
    : caller.displayName

  const secondary = !isPhoneOnly
    ? formatPhoneForDisplay(caller.phoneNumber)
    : caller.relationship || undefined

  const avatarSize = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-xl'

  return (
    <div className={cn('flex flex-col items-center text-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-md',
          'bg-gradient-to-br from-teal-50 to-slate-100 text-[var(--cg-trusted)] font-semibold',
          avatarSize
        )}
        aria-hidden="true"
      >
        {caller.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caller.photoUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : isPhoneOnly ? (
          <User className={size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'} />
        ) : (
          initials(caller.displayName)
        )}
      </div>
      <div className="space-y-1 max-w-full px-2">
        <h2
          className={cn(
            'font-bold text-[var(--cg-ink)] break-words',
            size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-2xl'
          )}
        >
          {primary}
        </h2>
        {secondary && (
          <p className="text-lg text-[var(--cg-ink-muted)]">{secondary}</p>
        )}
        {subtitle && (
          <p className="text-lg text-[var(--cg-ink-muted)]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

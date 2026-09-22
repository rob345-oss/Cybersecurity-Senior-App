'use client'

import { UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '../../utils/cn'

interface TrustedContactActionProps {
  onAddTrusted?: () => void
  contactId?: string | null
  isTrusted?: boolean
  className?: string
  /** Compact style for in-call controls */
  compact?: boolean
}

export default function TrustedContactAction({
  onAddTrusted,
  contactId,
  isTrusted,
  className,
  compact,
}: TrustedContactActionProps) {
  if (isTrusted) {
    return (
      <Link
        href="/dashboard/contacts"
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--cg-trusted-border)] bg-[var(--cg-trusted-bg)] text-[var(--cg-trusted)] font-semibold',
          'min-h-[48px] px-4 text-base hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
          compact && 'flex-col text-sm px-3 py-2 min-h-[48px]',
          className
        )}
      >
        <Users className="w-5 h-5" aria-hidden="true" />
        Trusted contacts
      </Link>
    )
  }

  if (onAddTrusted) {
    return (
      <button
        type="button"
        onClick={onAddTrusted}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-[var(--cg-ink)] font-semibold',
          'min-h-[48px] px-4 text-base hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900',
          compact && 'flex-col text-sm px-3 py-2',
          className
        )}
      >
        <UserPlus className="w-5 h-5" aria-hidden="true" />
        Add to trusted
      </button>
    )
  }

  return (
    <Link
      href={contactId ? `/dashboard/contacts` : '/dashboard/contacts'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-[var(--cg-ink)] font-semibold',
        'min-h-[48px] px-4 text-base hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900',
        compact && 'flex-col text-sm px-3 py-2',
        className
      )}
    >
      <UserPlus className="w-5 h-5" aria-hidden="true" />
      Add to trusted
    </Link>
  )
}

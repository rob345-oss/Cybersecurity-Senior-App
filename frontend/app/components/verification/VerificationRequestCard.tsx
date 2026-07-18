'use client'

import Link from 'next/link'
import type { VerificationRequest } from '../../types/verification'
import { STATUS_LABELS } from '../../types/verification'

interface VerificationRequestCardProps {
  request: VerificationRequest
  href?: string
  highlightStale?: boolean
}

export default function VerificationRequestCard({
  request,
  href,
  highlightStale = true,
}: VerificationRequestCardProps) {
  const stale = highlightStale && request.is_stale && request.status === 'pending'
  const submitted = new Date(request.created_at).toLocaleString()

  const content = (
    <div
      className={`rounded-xl border-2 p-5 h-full transition ${
        stale
          ? 'border-amber-500 bg-amber-50'
          : 'border-gray-200 bg-white hover:border-gray-400'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xl font-semibold text-gray-900 capitalize">
            {request.interaction_type.replace('_', ' ')}
          </p>
          <p className="text-base text-gray-600 mt-1">Submitted {submitted}</p>
        </div>
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-900">
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      <p className="text-lg text-gray-800 line-clamp-3 mb-3">{request.description}</p>

      <div className="flex flex-wrap gap-3 text-base text-gray-700">
        {request.risk_score != null && (
          <span>
            Risk: <strong>{request.risk_score}</strong>
            {request.risk_level ? ` (${request.risk_level})` : ''}
          </span>
        )}
        {request.submitter_name && <span>From: {request.submitter_name}</span>}
        {stale && (
          <span className="font-semibold text-amber-900">Waiting over 30 minutes</span>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

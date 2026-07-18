'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import VerificationRequestCard from '../verification/VerificationRequestCard'
import { listVerificationRequests } from '../../verification/api'
import type { VerificationRequest } from '../../types/verification'
import { STATUS_LABELS } from '../../types/verification'

export default function VerificationDashboardCards() {
  const [submitted, setSubmitted] = useState<VerificationRequest[]>([])
  const [toReview, setToReview] = useState<VerificationRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [mine, reviews] = await Promise.all([
          listVerificationRequests('submitted'),
          listVerificationRequests('review'),
        ])
        if (!cancelled) {
          setSubmitted(mine)
          setToReview(reviews)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load family reviews')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Family reviews</h2>
        <p className="text-gray-600">Loading your family review status…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Family reviews</h2>
        <p className="text-amber-800">{error}</p>
      </section>
    )
  }

  const pendingMine = submitted.filter((r) => r.status === 'pending')
  const recentlyReviewed = submitted
    .filter((r) => r.status !== 'pending')
    .slice(0, 3)
  const latest = submitted[0]
  const pendingReviews = [...toReview]
    .filter((r) => r.status === 'pending')
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))

  return (
    <section className="mb-10 space-y-8">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your family reviews</h2>
          <Link href="/dashboard/verify" className="text-sm font-medium text-gray-900 underline">
            Ask family to check this
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-600 mb-1">Pending family reviews</p>
            <p className="text-3xl font-semibold text-gray-900">{pendingMine.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-600 mb-1">Recently reviewed</p>
            <p className="text-3xl font-semibold text-gray-900">{recentlyReviewed.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-600 mb-1">Current status</p>
            <p className="text-xl font-semibold text-gray-900">
              {latest ? STATUS_LABELS[latest.status] : 'No requests yet'}
            </p>
          </div>
        </div>

        {pendingMine.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {pendingMine.slice(0, 2).map((request) => (
              <VerificationRequestCard
                key={request.id}
                request={request}
                href={`/dashboard/family/reviews/${request.id}`}
              />
            ))}
          </div>
        )}

        {recentlyReviewed.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recently reviewed requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentlyReviewed.map((request) => (
                <VerificationRequestCard
                  key={request.id}
                  request={request}
                  href={`/dashboard/family/reviews/${request.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {pendingReviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">New requests needing your review</h2>
            <Link href="/dashboard/family" className="text-sm font-medium text-gray-900 underline">
              Open CareCircle
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            High-risk requests are listed first. Items waiting over 30 minutes are highlighted.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviews.slice(0, 4).map((request) => (
              <VerificationRequestCard
                key={request.id}
                request={request}
                href={`/dashboard/family/reviews/${request.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

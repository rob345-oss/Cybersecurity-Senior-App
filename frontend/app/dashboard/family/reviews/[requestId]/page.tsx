'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DashboardHeader from '../../../../components/dashboard/DashboardHeader'
import RiskSummary from '../../../../components/verification/RiskSummary'
import ReviewActionButtons from '../../../../components/verification/ReviewActionButtons'
import {
  getVerificationRequest,
  resolveScreenshotUrl,
  reviewVerificationRequest,
} from '../../../../verification/api'
import type { ReviewStatus, VerificationRequest } from '../../../../types/verification'
import { STATUS_LABELS } from '../../../../types/verification'

export default function FamilyReviewDetailPage() {
  const params = useParams<{ requestId: string }>()
  const requestId = params?.requestId
  const [request, setRequest] = useState<VerificationRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!requestId) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await getVerificationRequest(requestId)
        if (!cancelled) {
          setRequest(data)
          setNotes(data.reviewer_notes || '')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load request')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [requestId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!requestId || !selectedStatus) {
      setError('Choose one of the review buttons first.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await reviewVerificationRequest(requestId, {
        status: selectedStatus,
        reviewer_notes: notes.trim() || undefined,
      })
      setRequest(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your review')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="Family review" description="Loading request…" />
        <p className="text-lg text-gray-700">Please wait…</p>
      </>
    )
  }

  if (!request) {
    return (
      <>
        <DashboardHeader title="Family review" description="We could not open this request." />
        <p className="text-lg text-red-800 mb-4">{error || 'Request not found.'}</p>
        <Link href="/dashboard/family" className="text-lg font-semibold text-gray-900 underline">
          Back to CareCircle
        </Link>
      </>
    )
  }

  const screenshotUrl = resolveScreenshotUrl(request.screenshot_url)
  const submittedAt = new Date(request.created_at).toLocaleString()

  return (
    <>
      <DashboardHeader
        title="Review a family request"
        description="Look over the details, then choose how safe this seems."
      />

      <div className="max-w-3xl space-y-8">
        {error && (
          <div className="rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 text-lg text-red-950">
            {error}
          </div>
        )}

        {saved && (
          <div className="rounded-xl border-2 border-green-700 bg-green-50 px-4 py-3 text-lg text-green-950">
            Your review was saved. Status: {STATUS_LABELS[request.status]}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Interaction details</h2>
          <p className="text-lg text-gray-800">
            <strong>Type:</strong> {request.interaction_type.replace('_', ' ')}
          </p>
          <p className="text-lg text-gray-800">
            <strong>Submitted:</strong> {submittedAt}
          </p>
          <p className="text-lg text-gray-800">
            <strong>From:</strong>{' '}
            {request.submitter_name || request.submitter_email || 'Family member'}
          </p>
          {request.sender_name && (
            <p className="text-lg text-gray-800">
              <strong>Caller / sender name:</strong> {request.sender_name}
            </p>
          )}
          {request.sender_contact && (
            <p className="text-lg text-gray-800">
              <strong>Phone or email:</strong> {request.sender_contact}
            </p>
          )}
          <p className="text-lg text-gray-800">
            <strong>What happened:</strong> {request.description}
          </p>
          {request.requested_action && (
            <p className="text-lg text-gray-800">
              <strong>What they asked:</strong> {request.requested_action}
            </p>
          )}
          {request.amount_requested != null && request.amount_requested !== '' && (
            <p className="text-lg text-gray-800">
              <strong>Amount requested:</strong> ${String(request.amount_requested)}
            </p>
          )}
        </section>

        {screenshotUrl && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Screenshot</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotUrl}
              alt="Screenshot of the suspicious interaction"
              className="max-w-full rounded-xl border border-gray-300"
            />
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Risk check</h2>
          <RiskSummary
            riskScore={request.risk_score}
            riskLevel={request.risk_level}
            riskReasons={request.risk_reasons}
          />
        </section>

        {request.status === 'pending' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-semibold text-gray-900">Your decision</h2>
            <ReviewActionButtons
              selected={selectedStatus}
              onSelect={setSelectedStatus}
              disabled={saving}
            />
            <div>
              <label htmlFor="notes" className="block text-xl font-semibold text-gray-900 mb-2">
                Notes for your family member (optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-400 px-4 py-4 text-lg"
                placeholder="Example: Call me before you reply to them."
              />
            </div>
            <button
              type="submit"
              disabled={saving || !selectedStatus}
              className="w-full rounded-xl bg-gray-900 px-6 py-5 text-xl font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save review'}
            </button>
          </form>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-xl text-gray-900">
              Status: <strong>{STATUS_LABELS[request.status]}</strong>
            </p>
            {request.reviewer_notes && (
              <p className="text-lg text-gray-800 mt-3">Notes: {request.reviewer_notes}</p>
            )}
          </div>
        )}

        <Link href="/dashboard/family" className="inline-block text-lg font-semibold text-gray-900 underline">
          Back to CareCircle
        </Link>
      </div>
    </>
  )
}

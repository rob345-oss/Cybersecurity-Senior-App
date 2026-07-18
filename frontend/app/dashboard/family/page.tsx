'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import VerificationRequestCard from '../../components/verification/VerificationRequestCard'
import {
  addTrustedContact,
  listTrustedContacts,
  listVerificationRequests,
} from '../../verification/api'
import type { TrustedContact, VerificationRequest } from '../../types/verification'

export default function FamilyPage() {
  const [reviewRequests, setReviewRequests] = useState<VerificationRequest[]>([])
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [reviews, trusted] = await Promise.all([
        listVerificationRequests('review'),
        listTrustedContacts(),
      ])
      setReviewRequests(reviews)
      setContacts(trusted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load CareCircle')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleAddContact(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await addTrustedContact(email.trim(), label.trim() || undefined)
      setEmail('')
      setLabel('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add contact')
    }
  }

  const pending = reviewRequests.filter((r) => r.status === 'pending')
  const sortedPending = [...pending].sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))

  return (
    <>
      <DashboardHeader
        title="CareCircle"
        description="Review requests from family and manage your trusted contacts."
      />

      <div className="mb-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/verify"
          className="inline-flex justify-center rounded-xl bg-gray-900 px-6 py-4 text-lg font-semibold text-white"
        >
          Ask family to check something
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 text-lg text-red-950">
          {error}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Requests needing your review</h2>
        <p className="text-lg text-gray-700 mb-4">
          High-risk items appear first. Requests waiting more than 30 minutes are highlighted.
        </p>
        {loading ? (
          <p className="text-lg text-gray-700">Loading…</p>
        ) : sortedPending.length === 0 ? (
          <p className="text-lg text-gray-700">No new requests right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedPending.map((request) => (
              <VerificationRequestCard
                key={request.id}
                request={request}
                href={`/dashboard/family/reviews/${request.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your trusted contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-lg text-gray-700 mb-4">You have not added anyone yet.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg text-gray-900"
              >
                <strong>{contact.label || contact.contact_name || 'Trusted contact'}</strong>
                {contact.contact_email ? ` · ${contact.contact_email}` : ''}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddContact} className="max-w-xl space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">Add someone by email</h3>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
            className="w-full rounded-xl border-2 border-gray-400 px-4 py-4 text-lg"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (example: Son)"
            className="w-full rounded-xl border-2 border-gray-400 px-4 py-4 text-lg"
          />
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-5 py-3 text-lg font-semibold text-white"
          >
            Add trusted contact
          </button>
        </form>
      </section>
    </>
  )
}

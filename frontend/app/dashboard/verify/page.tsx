'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import InteractionTypeSelector from '../../components/verification/InteractionTypeSelector'
import TrustedContactSelect from '../../components/verification/TrustedContactSelect'
import RiskSummary from '../../components/verification/RiskSummary'
import {
  addTrustedContact,
  createVerificationRequest,
  listTrustedContacts,
  uploadScreenshot,
} from '../../verification/api'
import type {
  InteractionType,
  TrustedContact,
  VerificationRequest,
} from '../../types/verification'

const inputClass =
  'w-full rounded-xl border-2 border-gray-400 bg-white px-4 py-4 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900'

export default function VerifyPage() {
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [interactionType, setInteractionType] = useState<InteractionType>('call')
  const [senderName, setSenderName] = useState('')
  const [senderContact, setSenderContact] = useState('')
  const [description, setDescription] = useState('')
  const [requestedAction, setRequestedAction] = useState('')
  const [amountRequested, setAmountRequested] = useState('')
  const [trustedContactId, setTrustedContactId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactLabel, setNewContactLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<VerificationRequest | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await listTrustedContacts()
        if (!cancelled) {
          setContacts(items)
          if (items.length === 1) setTrustedContactId(items[0].id)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load trusted contacts')
        }
      } finally {
        if (!cancelled) setLoadingContacts(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleAddContact() {
    setError(null)
    if (!newContactEmail.trim()) {
      setError('Enter the email address of your trusted contact.')
      return
    }
    try {
      const contact = await addTrustedContact(
        newContactEmail.trim(),
        newContactLabel.trim() || undefined
      )
      setContacts((prev) => [...prev, contact])
      setTrustedContactId(contact.id)
      setNewContactEmail('')
      setNewContactLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add trusted contact')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!description.trim()) {
      setError('Please describe what happened.')
      return
    }
    if (!trustedContactId) {
      setError('Please choose who should review this.')
      return
    }

    setLoading(true)
    try {
      let amount: number | null = null
      if (amountRequested.trim()) {
        amount = Number(amountRequested)
        if (Number.isNaN(amount) || amount < 0) {
          throw new Error('Amount requested must be a valid number.')
        }
      }

      let result = await createVerificationRequest({
        trusted_contact_id: trustedContactId,
        interaction_type: interactionType,
        description: description.trim(),
        sender_name: senderName.trim() || undefined,
        sender_contact: senderContact.trim() || undefined,
        requested_action: requestedAction.trim() || undefined,
        amount_requested: amount,
      })

      if (screenshot) {
        result = await uploadScreenshot(result.id, screenshot)
      }

      setSubmitted(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your request')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <>
        <DashboardHeader
          title="Sent for family review"
          description="Your trusted contact has been notified."
        />
        <div className="max-w-3xl space-y-6">
          <RiskSummary
            riskScore={submitted.risk_score}
            riskLevel={submitted.risk_level}
            riskReasons={submitted.risk_reasons}
          />
          <p className="text-xl text-gray-800">
            Current status: <strong>Waiting for review</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="inline-flex justify-center rounded-xl bg-gray-900 px-6 py-4 text-lg font-semibold text-white"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(null)
                setDescription('')
                setRequestedAction('')
                setSenderName('')
                setSenderContact('')
                setAmountRequested('')
                setScreenshot(null)
              }}
              className="inline-flex justify-center rounded-xl border-2 border-gray-900 px-6 py-4 text-lg font-semibold text-gray-900"
            >
              Submit another
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Ask family to check this"
        description="Tell us what happened. We will send it to someone you trust before you take action."
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
        {error && (
          <div className="rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 text-lg text-red-950">
            {error}
          </div>
        )}

        <InteractionTypeSelector value={interactionType} onChange={setInteractionType} />

        <div>
          <label htmlFor="sender-name" className="block text-xl font-semibold text-gray-900 mb-2">
            Name of caller or sender
          </label>
          <input
            id="sender-name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className={inputClass}
            placeholder="Example: John from the bank"
          />
        </div>

        <div>
          <label
            htmlFor="sender-contact"
            className="block text-xl font-semibold text-gray-900 mb-2"
          >
            Phone number or email
          </label>
          <input
            id="sender-contact"
            value={senderContact}
            onChange={(e) => setSenderContact(e.target.value)}
            className={inputClass}
            placeholder="Example: 555-123-4567"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xl font-semibold text-gray-900 mb-2">
            What happened?
          </label>
          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Describe the call, message, or website in your own words."
          />
        </div>

        <div>
          <label
            htmlFor="requested-action"
            className="block text-xl font-semibold text-gray-900 mb-2"
          >
            What did they ask you to do?
          </label>
          <textarea
            id="requested-action"
            rows={3}
            value={requestedAction}
            onChange={(e) => setRequestedAction(e.target.value)}
            className={inputClass}
            placeholder="Example: Send money, share a code, install an app"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-xl font-semibold text-gray-900 mb-2">
            Amount of money requested (if any)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amountRequested}
            onChange={(e) => setAmountRequested(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="screenshot" className="block text-xl font-semibold text-gray-900 mb-2">
            Screenshot (optional)
          </label>
          <input
            id="screenshot"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            className="block w-full text-lg text-gray-900 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-3 file:text-lg file:font-semibold file:text-white"
          />
        </div>

        {loadingContacts ? (
          <p className="text-lg text-gray-700">Loading your trusted contacts…</p>
        ) : (
          <TrustedContactSelect
            contacts={contacts}
            value={trustedContactId}
            onChange={setTrustedContactId}
          />
        )}

        <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Add a trusted contact</h2>
          <p className="text-lg text-gray-700">
            They must already have a Titanium Guardian account. Enter their email.
          </p>
          <input
            value={newContactEmail}
            onChange={(e) => setNewContactEmail(e.target.value)}
            className={inputClass}
            placeholder="family@example.com"
            type="email"
          />
          <input
            value={newContactLabel}
            onChange={(e) => setNewContactLabel(e.target.value)}
            className={inputClass}
            placeholder="Label (example: Daughter)"
          />
          <button
            type="button"
            onClick={handleAddContact}
            className="rounded-xl border-2 border-gray-900 px-5 py-3 text-lg font-semibold text-gray-900"
          >
            Add trusted contact
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || contacts.length === 0}
          className="w-full rounded-xl bg-gray-900 px-6 py-5 text-xl font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send to my trusted contact'}
        </button>
      </form>
    </>
  )
}

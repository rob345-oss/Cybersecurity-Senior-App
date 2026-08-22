'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SharingProgress from '@/app/components/share-number/SharingProgress'
import MessagePreview from '@/app/components/share-number/MessagePreview'
import ShareActionButtons from '@/app/components/share-number/ShareActionButtons'
import { useShareOnboarding } from '@/app/share-number/ShareOnboardingContext'
import { deleteTrustedContact } from '@/app/share-number/api'

export default function ShareNumberReviewPage() {
  const router = useRouter()
  const { contacts, refreshContacts, refreshAll, loading, error } = useShareOnboarding()
  const selectedContacts = contacts.filter((c) => c.is_selected)
  const [activeIndex, setActiveIndex] = useState(0)

  const activeContact = selectedContacts[activeIndex]

  const handleRemove = async (contactId: string) => {
    await deleteTrustedContact(contactId)
    await refreshContacts()
    setActiveIndex(0)
  }

  const handleFinish = async () => {
    await refreshAll()
    router.push('/dashboard/share-number/complete')
  }

  if (loading) {
    return <p className="text-lg text-gray-600">Loading review…</p>
  }

  if (selectedContacts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">No contacts to review.</p>
        <Link href="/dashboard/share-number/contacts" className="text-gray-900 font-medium underline">
          Add trusted contacts
        </Link>
      </div>
    )
  }

  const message = activeContact.share_event?.message_preview || ''

  return (
    <>
      <SharingProgress currentStep={4} />

      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Review and share</h2>
          <p className="mt-2 text-base text-gray-700">
            Share with one contact at a time. Their information is never shown to other contacts.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {selectedContacts.length > 1 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select contact to review">
            {selectedContacts.map((contact, index) => (
              <button
                key={contact.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-base font-medium border ${
                  index === activeIndex
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-800 border-gray-300'
                }`}
              >
                {contact.first_name}
              </button>
            ))}
          </div>
        )}

        {activeContact && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <MessagePreview
              contactFirstName={activeContact.first_name}
              contactPhoneFormatted={activeContact.phone_formatted}
              message={message}
            />

            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/dashboard/share-number/messages"
                className="font-medium text-gray-900 underline hover:no-underline min-h-[44px] inline-flex items-center"
              >
                Edit message
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(activeContact.id)}
                className="font-medium text-red-700 hover:underline min-h-[44px]"
              >
                Remove contact
              </button>
            </div>

            <ShareActionButtons
              contactId={activeContact.id}
              phone={activeContact.phone}
              message={message}
              onStatusChange={async () => {
                await refreshContacts()
              }}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={handleFinish}
            className="min-h-[48px] px-6 py-3 text-base sm:text-lg font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            Continue
          </button>
          <Link
            href="/dashboard/share-number/messages"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base font-medium rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>
    </>
  )
}

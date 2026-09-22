'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SharingProgress from '@/app/components/share-number/SharingProgress'
import MessageTemplatePicker from '@/app/components/share-number/MessageTemplatePicker'
import { useShareOnboarding } from '@/app/share-number/ShareOnboardingContext'
import { useAuth } from '@/app/contexts/AuthContext'
import { getDisplayName } from '@/app/utils/auth'

export default function ShareNumberMessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { contacts, protectedNumber, refreshContacts, loading, error } = useShareOnboarding()

  const selectedContacts = contacts.filter((c) => c.is_selected)
  const userFirstName = user ? getDisplayName(user) : 'Friend'
  const protectedFormatted = protectedNumber?.protected_number_formatted || ''

  const handleContinue = () => {
    router.push('/dashboard/share-number/review')
  }

  if (loading) {
    return <p className="text-lg text-gray-600">Loading messages…</p>
  }

  if (selectedContacts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">No selected contacts yet.</p>
        <Link href="/dashboard/share-number/contacts" className="text-gray-900 font-medium underline">
          Add trusted contacts
        </Link>
      </div>
    )
  }

  return (
    <>
      <SharingProgress currentStep={3} />

      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customize your messages
          </h2>
          <p className="mt-2 text-base text-gray-700">
            Each contact gets their own message. Nothing is sent until you choose to share on the
            next step.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-6">
          {selectedContacts.map((contact) => (
            <MessageTemplatePicker
              key={contact.id}
              contact={contact}
              userFirstName={userFirstName}
              protectedNumberFormatted={protectedFormatted}
              onUpdated={refreshContacts}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-[48px] px-6 py-3 text-base sm:text-lg font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            Continue to review
          </button>
          <Link
            href="/dashboard/share-number/contacts"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base font-medium rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>
    </>
  )
}

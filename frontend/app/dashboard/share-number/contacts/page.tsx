'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SharingProgress from '@/app/components/share-number/SharingProgress'
import TrustedContactSelector, {
  type TrustedContactSelectorHandle,
} from '@/app/components/share-number/TrustedContactSelector'
import { useShareOnboarding } from '@/app/share-number/ShareOnboardingContext'
import { bulkSelectContacts } from '@/app/share-number/api'

export default function ShareNumberContactsPage() {
  const router = useRouter()
  const selectorRef = useRef<TrustedContactSelectorHandle>(null)
  const { contacts, refreshContacts, loading, error } = useShareOnboarding()
  const [continuing, setContinuing] = useState(false)

  const handleContinue = async () => {
    setContinuing(true)
    const saved = await selectorRef.current?.saveContacts()
    if (saved) {
      router.push('/dashboard/share-number/messages')
    }
    setContinuing(false)
  }

  if (loading) {
    return <p className="text-lg text-gray-600">Loading contacts…</p>
  }

  return (
    <>
      <SharingProgress currentStep={2} />

      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Who should receive your new number?
          </h2>
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <TrustedContactSelector
          ref={selectorRef}
          contacts={contacts}
          onContactsChange={refreshContacts}
          onBulkSelect={bulkSelectContacts}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={continuing}
            className="min-h-[48px] px-6 py-3 text-base sm:text-lg font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {continuing ? 'Saving…' : 'Continue'}
          </button>
          <Link
            href="/dashboard/share-number"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base font-medium rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>
    </>
  )
}

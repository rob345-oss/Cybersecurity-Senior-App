'use client'

import Link from 'next/link'
import SharingProgress from '@/app/components/share-number/SharingProgress'
import { useShareOnboarding } from '@/app/share-number/ShareOnboardingContext'
import { completeShareOnboarding } from '@/app/share-number/api'

export default function ShareNumberCompletePage() {
  const { summary, refreshAll, loading } = useShareOnboarding()

  const handleComplete = async () => {
    await completeShareOnboarding()
    await refreshAll()
  }

  if (loading || !summary) {
    return <p className="text-lg text-gray-600">Loading summary…</p>
  }

  const sharedCount = summary.user_confirmed_shared_count + summary.share_opened_count

  return (
    <>
      <SharingProgress currentStep={5} />

      <div className="max-w-2xl mx-auto space-y-8 text-center">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            You&apos;ve shared your protected number
          </h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            {sharedCount > 0
              ? `You opened or prepared messages for ${sharedCount} contact${sharedCount === 1 ? '' : 's'}.`
              : 'You can return anytime to share with your trusted contacts.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-left space-y-3">
          <p className="text-base text-gray-800">
            <span className="font-semibold">{summary.prepared_count}</span> message
            {summary.prepared_count === 1 ? '' : 's'} prepared
          </p>
          <p className="text-base text-gray-800">
            <span className="font-semibold">{summary.share_opened_count}</span> opened in Messages
            or share sheet
          </p>
          <p className="text-base text-gray-800">
            <span className="font-semibold">{summary.remaining_contacts}</span> contact
            {summary.remaining_contacts === 1 ? '' : 's'} still remaining
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/share-number/contacts"
            onClick={() => handleComplete()}
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base sm:text-lg font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            Add more trusted contacts
          </Link>
          <Link
            href="/dashboard"
            onClick={() => handleComplete()}
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base sm:text-lg font-medium rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </>
  )
}

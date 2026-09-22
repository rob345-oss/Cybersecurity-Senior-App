'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SharingProgress from '@/app/components/share-number/SharingProgress'
import ProtectedNumberCard from '@/app/components/share-number/ProtectedNumberCard'
import { useShareOnboarding } from '@/app/share-number/ShareOnboardingContext'
import { deferShareOnboarding } from '@/app/share-number/api'

export default function ShareNumberConfirmationPage() {
  const router = useRouter()
  const { protectedNumber, loading, error } = useShareOnboarding()

  const handleLater = async () => {
    try {
      await deferShareOnboarding()
    } catch {
      // Still allow navigation if defer fails
    }
    router.push('/dashboard')
  }

  if (loading) {
    return <p className="text-lg text-gray-600">Loading your protected number…</p>
  }

  if (error || !protectedNumber) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p>{error || 'Unable to load your protected number.'}</p>
      </div>
    )
  }

  return (
    <>
      <SharingProgress currentStep={1} />

      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Your protected number is ready
          </h2>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            Start by sharing this number with the people you trust most. Your existing number will
            continue working unless you choose otherwise.
          </p>
        </div>

        <ProtectedNumberCard
          formattedNumber={protectedNumber.protected_number_formatted}
          rawNumber={protectedNumber.protected_number}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/share-number/contacts"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base sm:text-lg font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 text-center"
          >
            Share with trusted contacts
          </Link>
          <button
            type="button"
            onClick={handleLater}
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base sm:text-lg font-medium rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          >
            I&apos;ll do this later
          </button>
        </div>
      </div>
    </>
  )
}

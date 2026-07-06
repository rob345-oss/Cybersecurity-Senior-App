import Link from 'next/link'
import { Users } from 'lucide-react'

export default function TrustedNumberOnboardingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-gray-900" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Set Up Your Trusted Circle Number
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-8">
          Guided setup is coming soon. You will be able to choose a protected
          number and share it with family, friends, doctors, and caregivers.
        </p>
        <Link
          href="/signup"
          className="inline-block w-full px-6 py-4 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors mb-4"
        >
          Get Started
        </Link>
        <Link
          href="/#protected-numbers"
          className="inline-block text-gray-600 hover:text-gray-900 transition-colors"
        >
          Back to homepage
        </Link>
      </div>
    </main>
  )
}

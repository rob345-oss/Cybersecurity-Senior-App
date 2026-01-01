'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your digital guardian.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AI-powered protection for older adults against scams across phone, text, email, and web.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-center"
              >
                Get Started
              </Link>
              <Link
                href="#how-it-works"
                className="px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center"
              >
                See How It Works
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-blue-50 rounded-lg border border-blue-100"></div>
                  <div className="h-24 bg-green-50 rounded-lg border border-green-100"></div>
                  <div className="h-24 bg-yellow-50 rounded-lg border border-yellow-100"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-gray-100 rounded-lg"></div>
                  <div className="flex-1 h-10 bg-gray-900 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Titanium Systems
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#product" className="text-gray-600 hover:text-gray-900 transition-colors">
              Product
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}
              className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Sign Up
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="#product" className="block text-gray-600 hover:text-gray-900 py-2">
              Product
            </Link>
            <Link href="#how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">
              How It Works
            </Link>
            <Link href="#pricing" className="block text-gray-600 hover:text-gray-900 py-2">
              Pricing
            </Link>
            <Link href="#faq" className="block text-gray-600 hover:text-gray-900 py-2">
              FAQ
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}
              className="block px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center mb-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}


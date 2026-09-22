'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const demoButtonClassName =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 active:bg-blue-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors font-medium'

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, loading, logout } = useAuth()

  const closeMenu = () => setIsMenuOpen(false)

  const demoLink = (className = demoButtonClassName) => (
    <Link
      href="/demo"
      className={className}
      title="No signup required — stays on this website"
      aria-label="Try Live Demo — no signup required"
      onClick={closeMenu}
    >
      <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
      Try Live Demo
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Titanium Guardian
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#product" className="text-gray-600 hover:text-gray-900 transition-colors">
              Learn
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </Link>
            <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {demoLink()}
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
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
            <Link href="#product" className="block text-gray-600 hover:text-gray-900 py-2" onClick={closeMenu}>
              Learn
            </Link>
            <Link href="#pricing" className="block text-gray-600 hover:text-gray-900 py-2" onClick={closeMenu}>
              Pricing
            </Link>
            <Link href="#how-it-works" className="block text-gray-600 hover:text-gray-900 py-2" onClick={closeMenu}>
              How It Works
            </Link>
            <Link href="#faq" className="block text-gray-600 hover:text-gray-900 py-2" onClick={closeMenu}>
              FAQ
            </Link>
            {demoLink(`${demoButtonClassName} w-full`)}
            {!loading && (
              <div className="space-y-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
                      onClick={closeMenu}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        closeMenu()
                      }}
                      className="block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
                      onClick={closeMenu}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
                      onClick={closeMenu}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

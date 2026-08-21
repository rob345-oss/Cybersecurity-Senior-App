'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../i18n/LanguageProvider'
import LanguageToggle from '../../i18n/LanguageToggle'

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, loading, logout } = useAuth()
  const { dictionary: d } = useTranslation()

  const authLinks = (
    <>
      {isAuthenticated ? (
        <>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
          >
            {d.common.dashboard}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
          >
            {d.common.logOut}
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
          >
            {d.common.logIn}
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
          >
            {d.common.signUp}
          </Link>
        </>
      )}
    </>
  )

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              {d.common.brand}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#product" className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              {d.nav.product}
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              {d.nav.howItWorks}
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              {d.nav.pricing}
            </Link>
            <Link href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              {d.nav.faq}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageToggle compact />
            {!loading && authLinks}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageToggle compact />
            <button
              className="p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={d.common.toggleMenu}
              aria-expanded={isMenuOpen}
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
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link href="#product" className="block text-gray-600 hover:text-gray-900 py-2">
              {d.nav.product}
            </Link>
            <Link href="#how-it-works" className="block text-gray-600 hover:text-gray-900 py-2">
              {d.nav.howItWorks}
            </Link>
            <Link href="#pricing" className="block text-gray-600 hover:text-gray-900 py-2">
              {d.nav.pricing}
            </Link>
            <Link href="#faq" className="block text-gray-600 hover:text-gray-900 py-2">
              {d.nav.faq}
            </Link>
            {!loading && (
              <div className="space-y-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {d.common.dashboard}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                      className="block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
                    >
                      {d.common.logOut}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
                    >
                      {d.common.logIn}
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-center"
                    >
                      {d.common.signUp}
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

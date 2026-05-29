'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Shield } from 'lucide-react'

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-white">
              <Shield className="h-5 w-5" aria-hidden />
            </span>
            Titanium Guardian
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            <Link href="#product" className="text-slate-600 transition-colors hover:text-slate-900">
              Product
            </Link>
            <Link href="#how-it-works" className="text-slate-600 transition-colors hover:text-slate-900">
              How It Works
            </Link>
            <Link href="#pricing" className="text-slate-600 transition-colors hover:text-slate-900">
              Pricing
            </Link>
            <Link href="#faq" className="text-slate-600 transition-colors hover:text-slate-900">
              FAQ
            </Link>
          </div>

          <div className="hidden items-center space-x-3 md:flex">
            <Link href={appUrl} className="btn-secondary px-4 py-2">
              Log In
            </Link>
            <Link href="/signup" className="btn-primary px-4 py-2">
              Sign Up
            </Link>
          </div>

          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="space-y-3 border-t border-slate-100 pb-4 pt-3 md:hidden">
            <Link href="#product" className="block py-2 text-slate-600 hover:text-slate-900" onClick={() => setIsMenuOpen(false)}>
              Product
            </Link>
            <Link href="#how-it-works" className="block py-2 text-slate-600 hover:text-slate-900" onClick={() => setIsMenuOpen(false)}>
              How It Works
            </Link>
            <Link href="#pricing" className="block py-2 text-slate-600 hover:text-slate-900" onClick={() => setIsMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="#faq" className="block py-2 text-slate-600 hover:text-slate-900" onClick={() => setIsMenuOpen(false)}>
              FAQ
            </Link>
            <Link href={appUrl} className="btn-secondary block text-center">
              Log In
            </Link>
            <Link href="/signup" className="btn-primary block text-center">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

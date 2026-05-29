'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function FinalCTA() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSubmitted(true)
    setEmail('')
    setIsSubmitting(false)
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <section id="join-waitlist" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-brand-primary p-12 text-center shadow-card-hover">
          <h2 className="mb-4 text-4xl font-bold text-white">Ready to Get Protected?</h2>
          <p className="mb-8 text-xl text-slate-300">
            Join the waitlist to be among the first to access Titanium Guardian
          </p>
          <form onSubmit={handleSubmit} className="mx-auto max-w-md">
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="input-field flex-1 text-slate-900"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary shrink-0 bg-white px-8 py-3 text-brand-primary hover:bg-slate-100 disabled:opacity-50"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </div>
            {submitted && (
              <div className="mt-4 rounded-lg bg-teal-600 p-4 text-white">
                <p className="font-semibold">Success! You&apos;ve been added to the waitlist.</p>
                <p className="mt-1 text-sm">We&apos;ll notify you when Titanium Guardian is ready.</p>
              </div>
            )}
          </form>
          <p className="mt-6 text-sm text-slate-400">
            Or{' '}
            <Link href="/signup" className="font-medium text-teal-300 hover:text-teal-200">
              create an account now
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

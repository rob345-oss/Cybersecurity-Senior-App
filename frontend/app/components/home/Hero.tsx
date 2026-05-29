'use client'

import Link from 'next/link'
import { Phone, Shield } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-teal-50/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              <Shield className="h-4 w-4" aria-hidden />
              Trusted protection for seniors
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your digital guardian.
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              AI-powered protection against scams across phone, text, email, and web — with calm,
              real-time coaching when you need it most.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/signup" className="btn-primary px-6 py-3 text-center">
                Get Started
              </Link>
              <Link href="#how-it-works" className="btn-secondary px-6 py-3 text-center">
                See How It Works
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-hover">
              <div className="flex">
                <div className="w-36 shrink-0 bg-brand-primary p-4">
                  <p className="text-xs font-bold text-white">Titanium Guardian</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-white">
                      <Phone className="h-3 w-3" />
                      CallGuard
                    </div>
                    <div className="rounded-lg px-2 py-1.5 text-xs text-slate-400">MoneyGuard</div>
                    <div className="rounded-lg px-2 py-1.5 text-xs text-slate-400">InboxGuard</div>
                  </div>
                </div>
                <div className="flex-1 p-5">
                  <p className="text-sm font-semibold text-slate-900">Live call coaching</p>
                  <p className="mt-1 text-xs text-slate-500">Suspicious caller detected</p>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Medium risk · 62
                    </span>
                    <p className="mt-2 text-xs text-slate-600">
                      Caller requested gift cards and asked you to keep it secret.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['Urgency', 'Gift cards', 'Keep secret'].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 h-9 rounded-lg bg-brand-accent text-center text-xs font-semibold leading-9 text-white">
                    Start Live Session
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

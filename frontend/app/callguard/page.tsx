'use client'

import CallGuardClient from './CallGuardClient'
import NavBar from '../components/home/NavBar'

export default function CallGuardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CallGuard</h1>
          <p className="text-xl text-gray-600">Live coaching for suspicious calls</p>
        </div>
        <CallGuardClient />
      </main>
    </div>
  )
}


'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '../i18n/LanguageProvider'
import LanguageToggle from '../i18n/LanguageToggle'

export default function SignUpPage() {
  const router = useRouter()
  const { dictionary: d } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return d.signup.passwordMinLength
    }
    if (!/[A-Z]/.test(pwd)) {
      return d.signup.passwordUppercase
    }
    if (!/[a-z]/.test(pwd)) {
      return d.signup.passwordLowercase
    }
    if (!/\d/.test(pwd)) {
      return d.signup.passwordDigit
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return d.signup.passwordSpecial
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError(d.signup.passwordsMismatch)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || d.signup.createFailed)
        setLoading(false)
        return
      }

      setSuccess(true)
      setError('')

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError(d.common.networkError)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 right-4">
          <LanguageToggle compact />
        </div>
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{d.signup.successTitle}</h2>
            <p className="text-gray-600 mb-6">
              {d.signup.successBody}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {d.signup.redirecting}
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              {d.signup.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageToggle compact />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">{d.signup.title}</h2>
          <p className="text-center text-gray-600">
            {d.signup.subtitle}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {d.signup.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-gray-900 focus:border-gray-900 focus:z-10 sm:text-sm"
                placeholder={d.signup.emailPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                {d.signup.fullNameLabel}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-gray-900 focus:border-gray-900 focus:z-10 sm:text-sm"
                placeholder={d.signup.fullNamePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {d.signup.phoneLabel}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-gray-900 focus:border-gray-900 focus:z-10 sm:text-sm"
                placeholder={d.signup.phonePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {d.signup.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-gray-900 focus:border-gray-900 focus:z-10 sm:text-sm"
                placeholder={d.signup.passwordPlaceholder}
              />
              <p className="mt-1 text-xs text-gray-500">
                {d.signup.passwordHint}
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {d.signup.confirmPasswordLabel}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-gray-900 focus:border-gray-900 focus:z-10 sm:text-sm"
                placeholder={d.signup.confirmPasswordPlaceholder}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? d.signup.submitting : d.signup.submit}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {d.signup.hasAccount}{' '}
              <Link href="/login" className="font-medium text-gray-900 hover:text-gray-700">
                {d.signup.logInLink}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

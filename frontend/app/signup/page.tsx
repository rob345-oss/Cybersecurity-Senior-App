'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) return 'Password must be at least 12 characters long'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter'
    if (!/\d/.test(pwd)) return 'Password must contain at least one digit'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must contain at least one special character'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push(appUrl), 2000)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SignupNav />
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="auth-card max-w-md text-center">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-brand-accent" aria-hidden />
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Account Created!</h2>
            <p className="mb-6 text-slate-600">
              Please check your email for a verification link. You will be redirected to the app
              shortly.
            </p>
            <Link href={appUrl} className="btn-primary inline-block">
              Go to App Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SignupNav />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="auth-card w-full max-w-md">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">Create an Account</h2>
          <p className="mb-6 text-center text-slate-600">Sign up for Titanium Guardian to get started</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="label-field">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="fullName" className="label-field">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label-field">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="password" className="label-field">
                Password *
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Create a strong password"
              />
              <p className="mt-1 text-xs text-slate-500">
                Minimum 12 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label-field">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Re-enter your password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href={appUrl} className="font-medium text-brand-accent hover:underline">
                Log In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function SignupNav() {
  return (
    <nav className="border-b border-slate-200 bg-white px-4 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
            <Shield className="h-4 w-4" aria-hidden />
          </span>
          Titanium Guardian
        </Link>
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to home
        </Link>
      </div>
    </nav>
  )
}

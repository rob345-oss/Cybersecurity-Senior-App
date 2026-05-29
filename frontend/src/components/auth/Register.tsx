import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ApiError } from '../../api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { register } = useAuth()
  const { showToast } = useToast()

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

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      showToast(passwordError, 'error')
      return
    }

    setLoading(true)

    try {
      await register(email, password, fullName, phone || undefined)
      setRegistered(true)
      showToast('Account created! Please check your email for verification.', 'success')
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error')
      } else {
        showToast('Failed to create account. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-brand-accent" aria-hidden />
        <h2 className="mb-2 text-xl font-bold text-slate-900">Account Created!</h2>
        <p className="text-slate-600">
          Please check your email for a verification link. Once verified, you can log in.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-slate-900">Create your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-email" className="label-field">
            Email *
          </label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="fullName" className="label-field">
            Full Name *
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label-field">
            Phone (optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="label-field">
            Password *
          </label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
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
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

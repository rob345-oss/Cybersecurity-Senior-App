import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ApiError } from '../../api'

export default function VerifyEmail() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const { verifyEmailToken } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    if (tokenParam) setToken(tokenParam)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      showToast('Please enter a verification token', 'error')
      return
    }

    setLoading(true)

    try {
      await verifyEmailToken(token)
      setVerified(true)
      showToast('Email verified successfully!', 'success')
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error')
      } else {
        showToast('Failed to verify email. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-brand-accent" aria-hidden />
        <h2 className="mb-2 text-xl font-bold text-slate-900">Email Verified!</h2>
        <p className="text-slate-600">Your email has been verified. You can now log in.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">Verify your email</h2>
      <p className="mb-6 text-sm text-slate-600">
        Enter the verification token sent to your email address.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="token" className="label-field">
            Verification Token
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="Paste token from email"
            className="input-field"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>
    </div>
  )
}

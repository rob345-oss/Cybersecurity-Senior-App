import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ApiError } from '../../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      showToast('Successfully logged in!', 'success')
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error')
      } else {
        showToast('Failed to log in. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-slate-900">Welcome back</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label-field">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="label-field">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Logging in...
            </span>
          ) : (
            'Log In'
          )}
        </button>
      </form>
    </div>
  )
}

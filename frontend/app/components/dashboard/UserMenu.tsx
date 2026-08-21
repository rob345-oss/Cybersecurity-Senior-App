'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../i18n/LanguageProvider'

interface UserMenuProps {
  className?: string
}

export default function UserMenu({ className = '' }: UserMenuProps) {
  const { user, logout } = useAuth()
  const { dictionary: d } = useTranslation()

  if (!user) return null

  return (
    <div className={`border-t border-gray-200 pt-4 ${className}`}>
      <p className="text-sm text-gray-600 truncate mb-1" title={user.email}>
        {user.email}
      </p>
      {!user.email_verified && (
        <p className="text-xs text-amber-700 mb-2">{d.dashboard.emailNotVerified}</p>
      )}
      <button
        type="button"
        onClick={logout}
        className="w-full px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
      >
        {d.common.logOut}
      </button>
    </div>
  )
}

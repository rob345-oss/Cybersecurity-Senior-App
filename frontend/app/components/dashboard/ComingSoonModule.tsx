'use client'

import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/LanguageProvider'

interface ComingSoonModuleProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function ComingSoonModule({
  icon: Icon,
  title,
  description,
}: ComingSoonModuleProps) {
  const { dictionary: d } = useTranslation()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-6">
        <Icon className="w-8 h-8 text-gray-900" />
      </div>
      <span className="inline-block px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full mb-4">
        {d.common.comingSoon}
      </span>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
      <p className="mt-4 text-sm text-gray-500">
        {d.dashboard.comingSoonBody}
      </p>
    </div>
  )
}

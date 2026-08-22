'use client'

import { Mail } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import ComingSoonModule from '../../components/dashboard/ComingSoonModule'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function DashboardInboxGuardPage() {
  const { dictionary: d } = useTranslation()
  const g = d.dashboard.guards.inboxguard

  return (
    <>
      <DashboardHeader
        title={g.title}
        description={g.navDescription}
      />
      <ComingSoonModule
        icon={Mail}
        title={g.title}
        description={g.comingSoonDescription}
      />
    </>
  )
}

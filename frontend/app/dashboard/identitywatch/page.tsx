'use client'

import { User } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import ComingSoonModule from '../../components/dashboard/ComingSoonModule'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function DashboardIdentityWatchPage() {
  const { dictionary: d } = useTranslation()
  const g = d.dashboard.guards.identitywatch

  return (
    <>
      <DashboardHeader
        title={g.title}
        description={g.navDescription}
      />
      <ComingSoonModule
        icon={User}
        title={g.title}
        description={g.comingSoonDescription}
      />
    </>
  )
}

'use client'

import { DollarSign } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import ComingSoonModule from '../../components/dashboard/ComingSoonModule'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function DashboardMoneyGuardPage() {
  const { dictionary: d } = useTranslation()
  const g = d.dashboard.guards.moneyguard

  return (
    <>
      <DashboardHeader
        title={g.title}
        description={g.navDescription}
      />
      <ComingSoonModule
        icon={DollarSign}
        title={g.title}
        description={g.comingSoonDescription}
      />
    </>
  )
}

import { DollarSign } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import ComingSoonModule from '../../components/dashboard/ComingSoonModule'

export default function DashboardMoneyGuardPage() {
  return (
    <>
      <DashboardHeader
        title="MoneyGuard"
        description="Assess payment risk before you send"
      />
      <ComingSoonModule
        icon={DollarSign}
        title="MoneyGuard"
        description="Assess payment risk before you send money to prevent financial scams."
      />
    </>
  )
}

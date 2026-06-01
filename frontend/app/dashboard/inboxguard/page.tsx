import { Mail } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import ComingSoonModule from '../../components/dashboard/ComingSoonModule'

export default function DashboardInboxGuardPage() {
  return (
    <>
      <DashboardHeader
        title="InboxGuard"
        description="Analyze messages and links for phishing"
      />
      <ComingSoonModule
        icon={Mail}
        title="InboxGuard"
        description="Analyze messages and links for phishing attempts before you click or respond."
      />
    </>
  )
}

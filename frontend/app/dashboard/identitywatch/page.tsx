import { User } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import ComingSoonModule from '../../components/dashboard/ComingSoonModule'

export default function DashboardIdentityWatchPage() {
  return (
    <>
      <DashboardHeader
        title="IdentityWatch"
        description="Monitor identity signals and escalation steps"
      />
      <ComingSoonModule
        icon={User}
        title="IdentityWatch"
        description="Monitor identity signals and get escalation steps when suspicious activity is detected."
      />
    </>
  )
}

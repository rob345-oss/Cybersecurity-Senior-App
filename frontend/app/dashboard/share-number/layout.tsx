'use client'

import DashboardHeader from '@/app/components/dashboard/DashboardHeader'
import { ShareOnboardingProvider } from '@/app/share-number/ShareOnboardingContext'

export default function ShareNumberLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShareOnboardingProvider>
      <DashboardHeader
        title="Share your protected number"
        description="Help your trusted contacts save your new Titanium Guardian number."
      />
      {children}
    </ShareOnboardingProvider>
  )
}

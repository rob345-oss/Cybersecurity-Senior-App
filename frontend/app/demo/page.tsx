import type { Metadata } from 'next'
import DemoExperience from './DemoExperience'

export const metadata: Metadata = {
  title: 'Live Demo | Titanium Guardian',
  description:
    'Simulated CallGuard and Titanium Guardian demo. No signup, no real calls, and no personal data required.',
}

export default function DemoPage() {
  return <DemoExperience />
}

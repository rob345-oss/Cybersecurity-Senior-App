import { Suspense } from 'react'
import ContactsPage from './ContactsClient'

export default function ContactsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-lg text-gray-600">Loading your contacts…</div>
      }
    >
      <ContactsPage />
    </Suspense>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import Providers from './components/Providers'

export const metadata: Metadata = {
  title: 'Titanium Guardian | Phone Scam Protection for Older Adults and Families',
  description:
    'Titanium Guardian helps older adults and their families recognize suspicious phone calls, pause before acting, and verify urgent requests.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}


import type { Metadata } from 'next'
import './globals.css'
import Providers from './components/Providers'

export const metadata: Metadata = {
  title: 'Titanium Systems - Your digital guardian.',
  description: 'AI-powered protection for older adults against scams across phone, text, email, and web.',
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


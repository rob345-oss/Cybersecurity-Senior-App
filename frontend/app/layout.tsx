import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}


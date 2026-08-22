import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import Providers from './components/Providers'
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './i18n/config'
import { getDictionary } from './i18n/get-dictionary'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(LOCALE_COOKIE)?.value
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const dict = getDictionary(locale)

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: locale === 'es' ? 'es_ES' : 'en_US',
    },
    alternates: {
      languages: {
        en: '/',
        es: '/',
      },
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(LOCALE_COOKIE)?.value
  const locale: Locale = isLocale(raw) ? raw : defaultLocale

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  )
}

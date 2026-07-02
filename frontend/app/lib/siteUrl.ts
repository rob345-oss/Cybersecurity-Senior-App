import { headers } from 'next/headers'

export async function getSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) {
    return configured
  }

  const headerList = await headers()
  const host = headerList.get('host')
  if (!host) {
    return ''
  }

  const protocol = headerList.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

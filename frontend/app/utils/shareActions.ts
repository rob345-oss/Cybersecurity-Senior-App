/** Share actions: SMS deep links, Web Share API, and clipboard fallback. */

import { phoneForSmsUri } from './phone'

export interface ShareResult {
  method: 'sms' | 'web_share' | 'copy' | 'none'
  success: boolean
  userMessage: string
}

export function buildSmsUrl(phone: string, message: string): string {
  const normalizedPhone = phoneForSmsUri(phone)
  const encodedBody = encodeURIComponent(message)
  return `sms:${normalizedPhone}?body=${encodedBody}`
}

export async function copyText(text: string): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(text)
    return {
      method: 'copy',
      success: true,
      userMessage: 'Message copied to your clipboard. Paste it into your messaging app when you are ready.',
    }
  } catch {
    return {
      method: 'copy',
      success: false,
      userMessage: 'Could not copy automatically. Please select and copy the message manually.',
    }
  }
}

export async function shareText(text: string, title?: string): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: title ?? 'Protected number update', text })
      return {
        method: 'web_share',
        success: true,
        userMessage: 'Share sheet opened. Nothing is sent until you confirm in your app.',
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          method: 'web_share',
          success: false,
          userMessage: 'Sharing cancelled.',
        }
      }
    }
  }

  return copyText(text)
}

export function openSmsLink(phone: string, message: string): ShareResult {
  const url = buildSmsUrl(phone, message)
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
  return {
    method: 'sms',
    success: true,
    userMessage: 'Messages opened with your message ready. Nothing is sent until you tap Send.',
  }
}

export async function shareAnotherWay(text: string): Promise<ShareResult> {
  return shareText(text, 'My new protected number')
}

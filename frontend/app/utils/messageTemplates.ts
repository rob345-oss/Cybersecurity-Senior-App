/** Message templates for share onboarding. */

export type MessageTemplateKey = 'default' | 'short' | 'warm' | 'security_focused'

export const MESSAGE_TEMPLATE_OPTIONS: {
  key: MessageTemplateKey
  label: string
  description: string
}[] = [
  { key: 'default', label: 'Standard', description: 'Balanced and clear' },
  { key: 'short', label: 'Short', description: 'Brief and to the point' },
  { key: 'warm', label: 'Warm & explanatory', description: 'More context for close contacts' },
  { key: 'security_focused', label: 'Security-focused', description: 'Emphasizes privacy' },
]

export interface BuildMessageParams {
  userFirstName: string
  contactFirstName: string
  protectedNumber: string
  template?: MessageTemplateKey
  customText?: string
}

export function buildPersonalizedMessage({
  userFirstName,
  contactFirstName,
  protectedNumber,
  template = 'default',
}: Omit<BuildMessageParams, 'customText'>): string {
  const user = userFirstName.trim() || 'me'
  const contact = contactFirstName.trim() || 'there'
  const number = protectedNumber.trim()

  if (template === 'short') {
    return (
      `Hi ${contact}—it's ${user}. I have a new protected number through Titanium Guardian: ` +
      `${number}. Please save it and use it when you need to reach me. ` +
      `Please don't share it without asking me first.`
    )
  }

  if (template === 'warm') {
    return (
      `Hi ${contact}, it's ${user}. I wanted to let you know I now have a protected phone number ` +
      `through Titanium Guardian: ${number}. Your existing number for me still works for now, ` +
      `but I'd appreciate you saving this new one and starting to use it when you can. ` +
      `This helps me stay safer from unwanted calls. Please don't share it with others without ` +
      `checking with me first.`
    )
  }

  if (template === 'security_focused') {
    return (
      `Hi ${contact}—it's ${user}. For my safety, I have a new protected phone number through ` +
      `Titanium Guardian: ${number}. Please save it in your contacts and use it instead of my ` +
      `old number when possible. Please do not share this number with anyone else without ` +
      `my permission.`
    )
  }

  return (
    `Hi ${contact}—it's ${user}. I have a new protected phone number through Titanium Guardian: ` +
    `${number}. Please save it in your contacts. You can still reach me at my old number for now, ` +
    `but I'd like you to start using this one. Please don't share it without asking me first.`
  )
}

export function resolveMessage(params: BuildMessageParams): string {
  if (params.customText?.trim()) {
    return params.customText.trim()
  }
  return buildPersonalizedMessage(params)
}

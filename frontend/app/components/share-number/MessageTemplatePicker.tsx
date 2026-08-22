'use client'

import { useEffect, useState } from 'react'
import {
  MESSAGE_TEMPLATE_OPTIONS,
  buildPersonalizedMessage,
  type MessageTemplateKey,
} from '@/app/utils/messageTemplates'
import type { TrustedContactInfo } from '@/app/share-number/api'
import { updateShareEvent } from '@/app/share-number/api'

interface MessageTemplatePickerProps {
  contact: TrustedContactInfo
  userFirstName: string
  protectedNumberFormatted: string
  onUpdated: () => Promise<void>
}

export default function MessageTemplatePicker({
  contact,
  userFirstName,
  protectedNumberFormatted,
  onUpdated,
}: MessageTemplatePickerProps) {
  const initialTemplate = (contact.share_event?.message_template || 'default') as MessageTemplateKey
  const [template, setTemplate] = useState<MessageTemplateKey>(initialTemplate)
  const [message, setMessage] = useState(
    contact.share_event?.custom_message ||
      buildPersonalizedMessage({
        userFirstName,
        contactFirstName: contact.first_name,
        protectedNumber: protectedNumberFormatted,
        template: initialTemplate,
      })
  )
  const [isCustomized, setIsCustomized] = useState(Boolean(contact.share_event?.custom_message))
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    const t = (contact.share_event?.message_template || 'default') as MessageTemplateKey
    setTemplate(t)
    setMessage(
      contact.share_event?.custom_message ||
        buildPersonalizedMessage({
          userFirstName,
          contactFirstName: contact.first_name,
          protectedNumber: protectedNumberFormatted,
          template: t,
        })
    )
    setIsCustomized(Boolean(contact.share_event?.custom_message))
  }, [contact, userFirstName, protectedNumberFormatted])

  const handleTemplateChange = async (nextTemplate: MessageTemplateKey) => {
    setTemplate(nextTemplate)
    if (!isCustomized) {
      const nextMessage = buildPersonalizedMessage({
        userFirstName,
        contactFirstName: contact.first_name,
        protectedNumber: protectedNumberFormatted,
        template: nextTemplate,
      })
      setMessage(nextMessage)
      await persist(nextTemplate, undefined, false)
    } else {
      await persist(nextTemplate, message, true)
    }
  }

  const persist = async (
    nextTemplate: MessageTemplateKey,
    customMessage: string | undefined,
    customized: boolean
  ) => {
    setSaving(true)
    setStatusMessage(null)
    try {
      await updateShareEvent(contact.id, {
        message_template: nextTemplate,
        custom_message: customized ? customMessage : '',
        sharing_status: 'prepared',
      })
      await onUpdated()
      setStatusMessage('Message saved.')
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to save message')
    } finally {
      setSaving(false)
    }
  }

  const handleMessageChange = (value: string) => {
    setMessage(value)
    setIsCustomized(true)
  }

  const handleBlur = () => {
    persist(template, message, true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Message for {contact.first_name}
      </h3>

      <fieldset>
        <legend className="text-base font-medium text-gray-900 mb-2">Choose a template</legend>
        <div className="flex flex-wrap gap-2">
          {MESSAGE_TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleTemplateChange(option.key)}
              aria-pressed={template === option.key}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-sm sm:text-base font-medium border ${
                template === option.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`message-${contact.id}`} className="block text-base font-medium text-gray-900 mb-1">
          Your message
        </label>
        <textarea
          id={`message-${contact.id}`}
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onBlur={handleBlur}
          rows={6}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          aria-describedby={`message-help-${contact.id}`}
        />
        <p id={`message-help-${contact.id}`} className="mt-2 text-sm text-gray-600">
          You can edit this message before sharing. Nothing is sent automatically.
        </p>
      </div>

      {saving && <p className="text-sm text-gray-600">Saving…</p>}
      {statusMessage && (
        <p className="text-sm text-gray-700" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </div>
  )
}

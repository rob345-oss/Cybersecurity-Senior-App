'use client'

interface MessagePreviewProps {
  contactFirstName: string
  contactPhoneFormatted: string
  message: string
}

export default function MessagePreview({
  contactFirstName,
  contactPhoneFormatted,
  message,
}: MessagePreviewProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-600">To</p>
        <p className="text-lg font-semibold text-gray-900">{contactFirstName}</p>
        <p className="text-base text-gray-700">{contactPhoneFormatted}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">Message</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-base text-gray-900 whitespace-pre-wrap leading-relaxed">
          {message}
        </div>
      </div>
    </div>
  )
}

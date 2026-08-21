'use client'

import { useTranslation } from '../../i18n/LanguageProvider'

interface IncomingCallModalProps {
  callerId: string
  onAccept: () => void
  onDecline: () => void
}

export default function IncomingCallModal({ callerId, onAccept, onDecline }: IncomingCallModalProps) {
  const { dictionary: d } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
        <p className="text-sm text-gray-500 mb-2">{d.voice.incomingCall}</p>
        <p className="text-2xl font-bold text-gray-900 mb-6">{callerId || d.common.unknown}</p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onDecline}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            {d.voice.decline}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            {d.voice.accept}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RiskResponse } from '../../callguard/api'
import type { TrustedCallerInfo } from './types'
import { getVoiceWebSocketUrl, type VoiceWsMessage } from './voiceApi'

export function useVoiceWebSocket(sessionId: string | null, enabled: boolean) {
  const [transcript, setTranscript] = useState('')
  const [risk, setRisk] = useState<RiskResponse | null>(null)
  const [signals, setSignals] = useState<string[]>([])
  const [trustedCaller, setTrustedCaller] = useState<TrustedCallerInfo | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!enabled || !sessionId) {
      return
    }

    const url = getVoiceWebSocketUrl(sessionId)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VoiceWsMessage
        if (data.type === 'risk_update' && data.risk) {
          setRisk(data.risk)
          if (data.transcript) setTranscript(data.transcript)
          if (data.signals) setSignals(data.signals)
          else if (data.detected_signals) setSignals(data.detected_signals)
          if (data.trusted_caller) setTrustedCaller(data.trusted_caller)
        } else if (data.type === 'connected' && data.transcript) {
          setTranscript(data.transcript)
        } else if (data.type === 'call_ended') {
          setConnected(false)
        }
      } catch {
        // ignore parse errors
      }
    }

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)

    return () => {
      clearInterval(ping)
      ws.close()
      wsRef.current = null
    }
  }, [sessionId, enabled])

  const reset = useCallback(() => {
    setTranscript('')
    setRisk(null)
    setSignals([])
    setTrustedCaller(null)
  }, [])

  return { transcript, risk, signals, trustedCaller, connected, reset }
}

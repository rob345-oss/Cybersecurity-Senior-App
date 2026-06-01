'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Device, Call } from '@twilio/voice-sdk'
import { getVoiceToken, registerBrowserCall } from './voiceApi'
import { useAuth } from '../../contexts/AuthContext'

export type DeviceStatus = 'idle' | 'loading' | 'ready' | 'error' | 'on-call'

export function useTwilioDevice() {
  const { user } = useAuth()
  const deviceRef = useRef<Device | null>(null)
  const activeCallRef = useRef<Call | null>(null)
  const [status, setStatus] = useState<DeviceStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [callSid, setCallSid] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const init = async () => {
      if (!user) return
      setStatus('loading')
      setError(null)
      try {
        const { token } = await getVoiceToken()
        if (cancelled) return

        const device = new Device(token, {
          logLevel: 1,
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        })

        device.on('registered', () => {
          if (!cancelled) setStatus('ready')
        })
        device.on('error', (err) => {
          setError(err.message || 'Twilio device error')
          setStatus('error')
        })
        device.on('incoming', (call) => {
          setIncomingCall(call)
        })
        device.on('unregistered', () => {
          if (!cancelled) setStatus('idle')
        })

        await device.register()
        deviceRef.current = device
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize phone')
          setStatus('error')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      activeCallRef.current?.disconnect()
      deviceRef.current?.destroy()
      deviceRef.current = null
    }
  }, [user])

  useEffect(() => {
    if (!activeCall) {
      setDurationSeconds(0)
      return
    }
    const start = Date.now()
    const timer = setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [activeCall])

  const bindCallHandlers = useCallback(
    (call: Call, sid: string) => {
      activeCallRef.current = call
      setActiveCall(call)
      setCallSid(call.parameters.CallSid || sid)
      setStatus('on-call')
      setIncomingCall(null)

      call.on('disconnect', () => {
        activeCallRef.current = null
        setActiveCall(null)
        setCallSid(null)
        setStatus('ready')
        setMuted(false)
      })
    },
    []
  )

  const startSession = useCallback(async (): Promise<string> => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const accessToken = sessionStorage.getItem('access_token')
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const response = await fetch(`${apiUrl}/v1/session/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: user?.id,
        device_id: 'twilio-web',
        module: 'callguard',
        context: null,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Failed to start session')
    const id = data.session_id as string
    setSessionId(id)
    return id
  }, [user])

  const connectOutbound = useCallback(
    async (to: string) => {
      const device = deviceRef.current
      if (!device || !user) throw new Error('Phone not ready')

      const sid = sessionId || (await startSession())
      let normalized = to.trim()
      if (!normalized.startsWith('+')) normalized = `+${normalized.replace(/\D/g, '')}`

      const call = await device.connect({
        params: {
          To: normalized,
          SessionId: sid,
          UserId: String(user.id),
        },
      })

      const callSidParam = call.parameters.CallSid
      if (callSidParam) {
        await registerBrowserCall(sid, callSidParam, 'outbound', '', normalized)
      }

      bindCallHandlers(call, callSidParam || '')
      return { sessionId: sid, call }
    },
    [user, sessionId, startSession, bindCallHandlers]
  )

  const acceptIncoming = useCallback(async () => {
    const call = incomingCall
    if (!call) return

    const sid = await startSession()
    call.accept()
    const callSidParam = call.parameters.CallSid
    if (callSidParam && user) {
      await registerBrowserCall(
        sid,
        callSidParam,
        'inbound',
        call.parameters.From || '',
        call.parameters.To || ''
      )
    }
    bindCallHandlers(call, callSidParam || '')
    return sid
  }, [incomingCall, startSession, bindCallHandlers, user])

  const declineIncoming = useCallback(() => {
    incomingCall?.reject()
    setIncomingCall(null)
  }, [incomingCall])

  const hangUp = useCallback(() => {
    activeCallRef.current?.disconnect()
    setActiveCall(null)
    setCallSid(null)
    setStatus('ready')
  }, [])

  const toggleMute = useCallback(() => {
    const call = activeCallRef.current
    if (!call) return
    const next = !muted
    call.mute(next)
    setMuted(next)
  }, [muted])

  return {
    status,
    error,
    incomingCall,
    activeCall,
    callSid,
    sessionId,
    setSessionId,
    muted,
    durationSeconds,
    connectOutbound,
    acceptIncoming,
    declineIncoming,
    hangUp,
    toggleMute,
    incomingCallerId: incomingCall?.parameters?.From || 'Unknown',
    activeLabel: activeCall?.parameters?.To || activeCall?.parameters?.From || 'Active call',
  }
}

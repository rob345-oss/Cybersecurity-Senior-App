'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Device, Call } from '@twilio/voice-sdk'
import { getVoiceToken, registerBrowserCall } from './voiceApi'
import { useAuth } from '../../contexts/AuthContext'
import type { CallPhase } from './types'

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
  const [speakerOn, setSpeakerOn] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [isDialing, setIsDialing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [justEnded, setJustEnded] = useState(false)
  const [callFailed, setCallFailed] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [activeNumber, setActiveNumber] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!user) return
      setStatus('loading')
      setError(null)
      setPermissionDenied(false)
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
          const msg = err.message || 'Twilio device error'
          setError(msg)
          if (/permission|NotAllowed|microphone/i.test(msg)) {
            setPermissionDenied(true)
          }
          setStatus('error')
        })
        device.on('incoming', (call) => {
          setIncomingCall(call)
          setActiveNumber(call.parameters.From || '')
        })
        device.on('unregistered', () => {
          if (!cancelled) setStatus('idle')
        })

        await device.register()
        deviceRef.current = device
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to initialize phone'
          setError(msg)
          if (/permission|NotAllowed|microphone/i.test(msg)) {
            setPermissionDenied(true)
          }
          setStatus('error')
        }
      }
    }

    init()

    return () => {
      cancelled = true
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

  const clearEndedFlag = useCallback(() => {
    setJustEnded(false)
  }, [])

  const bindCallHandlers = useCallback((call: Call, sid: string) => {
    activeCallRef.current = call
    setActiveCall(call)
    setCallSid(call.parameters.CallSid || sid)
    setStatus('on-call')
    setIncomingCall(null)
    setIsDialing(false)
    setIsConnecting(false)
    setCallFailed(false)
    setJustEnded(false)

    call.on('accept', () => {
      setIsConnecting(false)
      setIsDialing(false)
    })

    call.on('disconnect', () => {
      activeCallRef.current = null
      setActiveCall(null)
      setCallSid(null)
      setStatus('ready')
      setMuted(false)
      setSpeakerOn(false)
      setJustEnded(true)
      setIsDialing(false)
      setIsConnecting(false)
      setTimeout(() => setJustEnded(false), 2500)
    })

    call.on('cancel', () => {
      setIsDialing(false)
      setIsConnecting(false)
    })

    call.on('reject', () => {
      setCallFailed(true)
      setIsDialing(false)
      setIsConnecting(false)
    })
  }, [])

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

      setIsDialing(true)
      setCallFailed(false)
      setJustEnded(false)
      setActiveNumber(to)

      try {
        const sid = sessionId || (await startSession())
        let normalized = to.trim()
        if (!normalized.startsWith('+')) normalized = `+${normalized.replace(/\D/g, '')}`
        setActiveNumber(normalized)
        setIsConnecting(true)

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
      } catch (err) {
        setIsDialing(false)
        setIsConnecting(false)
        setCallFailed(true)
        throw err
      }
    },
    [user, sessionId, startSession, bindCallHandlers]
  )

  const acceptIncoming = useCallback(async () => {
    const call = incomingCall
    if (!call) return

    setIsConnecting(true)
    try {
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
      setActiveNumber(call.parameters.From || '')
      bindCallHandlers(call, callSidParam || '')
      return sid
    } catch (err) {
      setIsConnecting(false)
      setCallFailed(true)
      throw err
    }
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
    setIsDialing(false)
    setIsConnecting(false)
  }, [])

  const toggleMute = useCallback(() => {
    const call = activeCallRef.current
    if (!call) return
    const next = !muted
    call.mute(next)
    setMuted(next)
  }, [muted])

  const sendDigits = useCallback((digits: string) => {
    const call = activeCallRef.current
    if (!call || !digits) return
    try {
      call.sendDigits(digits)
    } catch {
      // DTMF may be unavailable depending on call state
    }
  }, [])

  const toggleSpeaker = useCallback(async () => {
    const next = !speakerOn
    setSpeakerOn(next)
    // Best-effort browser speaker routing — limited vs native mobile
    try {
      const mediaElements = document.querySelectorAll('audio')
      for (const el of Array.from(mediaElements)) {
        const audio = el as HTMLAudioElement & {
          setSinkId?: (id: string) => Promise<void>
        }
        if (typeof audio.setSinkId === 'function') {
          await audio.setSinkId('default')
        }
        audio.volume = next ? 1 : Math.min(audio.volume, 1)
      }
      // Speaker routing is limited in browsers; UI state communicates intent.
    } catch {
      // Speaker routing is best-effort in browsers
    }
  }, [speakerOn])

  const callPhase: CallPhase = callFailed
    ? 'failed'
    : justEnded
      ? 'ended'
      : activeCall || status === 'on-call'
        ? 'active'
        : isConnecting
          ? 'connecting'
          : isDialing
            ? 'dialing'
            : 'idle'

  return {
    status,
    error,
    incomingCall,
    activeCall,
    callSid,
    sessionId,
    setSessionId,
    muted,
    speakerOn,
    durationSeconds,
    connectOutbound,
    acceptIncoming,
    declineIncoming,
    hangUp,
    toggleMute,
    toggleSpeaker,
    sendDigits,
    isDialing,
    isConnecting,
    justEnded,
    callFailed,
    clearEndedFlag,
    clearCallFailed: () => setCallFailed(false),
    permissionDenied,
    callPhase,
    activeNumber,
    incomingCallerId: incomingCall?.parameters?.From || 'Unknown',
    activeLabel: activeNumber || activeCall?.parameters?.To || activeCall?.parameters?.From || 'Active call',
  }
}

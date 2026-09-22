'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Device, Call } from '@twilio/voice-sdk'
import { getVoiceToken, registerBrowserCall } from './voiceApi'
import { useAuth } from '../../contexts/AuthContext'
import { toOutboundE164 } from '../../utils/phone'
import { deriveCallPhase } from './callState'

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
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearEndedTimer = useCallback(() => {
    if (endedTimerRef.current) {
      clearTimeout(endedTimerRef.current)
      endedTimerRef.current = null
    }
  }, [])

  const markCallEnded = useCallback(() => {
    setJustEnded(true)
    clearEndedTimer()
    endedTimerRef.current = setTimeout(() => {
      endedTimerRef.current = null
      setJustEnded(false)
    }, 2500)
  }, [clearEndedTimer])

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
          const clearIfCurrent = () => {
            setIncomingCall((current) => (current === call ? null : current))
          }
          // Caller hung up before Accept — otherwise the modal stays forever.
          call.on('cancel', clearIfCurrent)
          call.on('disconnect', clearIfCurrent)
          call.on('reject', clearIfCurrent)
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
      const call = activeCallRef.current
      activeCallRef.current = null
      call?.disconnect()
      clearEndedTimer()
      deviceRef.current?.destroy()
      deviceRef.current = null
      setIncomingCall(null)
      setActiveCall(null)
    }
  }, [user, clearEndedTimer])

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

  const releaseCall = useCallback(
    (call: Call) => {
      // Hang-up clears the ref first; a newer call replaces it. Either way,
      // events from a call that is no longer current must not wipe the UI.
      if (activeCallRef.current !== call) return false
      activeCallRef.current = null
      setActiveCall(null)
      setCallSid(null)
      setStatus((current) => (current === 'on-call' ? 'ready' : current))
      setMuted(false)
      setSpeakerOn(false)
      setIsDialing(false)
      setIsConnecting(false)
      return true
    },
    []
  )

  const bindCallHandlers = useCallback(
    (call: Call, sid: string) => {
      clearEndedTimer()
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
        if (activeCallRef.current && activeCallRef.current !== call) return
        setIsConnecting(false)
        setIsDialing(false)
      })

      call.on('disconnect', () => {
        if (!releaseCall(call)) return
        markCallEnded()
      })

      call.on('cancel', () => {
        if (!releaseCall(call)) return
        markCallEnded()
      })

      call.on('reject', () => {
        if (!releaseCall(call)) return
        setCallFailed(true)
      })
    },
    [clearEndedTimer, markCallEnded, releaseCall]
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

      setIsDialing(true)
      setCallFailed(false)
      setJustEnded(false)
      setActiveNumber(to)

      try {
        const sid = sessionId || (await startSession())
        const normalized = toOutboundE164(to)
        if (!normalized) throw new Error('Enter a valid phone number')
        setActiveNumber(normalized)
        setIsConnecting(true)
        clearEndedTimer()

        const call = await device.connect({
          params: {
            To: normalized,
            SessionId: sid,
            UserId: String(user.id),
          },
        })

        const callSidParam = call.parameters.CallSid
        // Bind before registration so a failed register cannot drop a live call.
        bindCallHandlers(call, callSidParam || '')
        if (callSidParam) {
          try {
            await registerBrowserCall(sid, callSidParam, 'outbound', '', normalized)
          } catch {
            setError('Call connected, but scam protection could not attach. You can still hang up.')
          }
        }
        return { sessionId: sid, call }
      } catch (err) {
        setIsDialing(false)
        setIsConnecting(false)
        setCallFailed(true)
        throw err
      }
    },
    [user, sessionId, startSession, bindCallHandlers, clearEndedTimer]
  )

  const acceptIncoming = useCallback(async () => {
    const call = incomingCall
    if (!call) return

    setIsConnecting(true)
    clearEndedTimer()
    try {
      const sid = await startSession()
      call.accept()
      const callSidParam = call.parameters.CallSid
      setActiveNumber(call.parameters.From || '')
      bindCallHandlers(call, callSidParam || '')
      if (callSidParam && user) {
        try {
          await registerBrowserCall(
            sid,
            callSidParam,
            'inbound',
            call.parameters.From || '',
            call.parameters.To || ''
          )
        } catch {
          setError('Call connected, but scam protection could not attach. You can still hang up.')
        }
      }
      return sid
    } catch (err) {
      setIsConnecting(false)
      setCallFailed(true)
      throw err
    }
  }, [incomingCall, startSession, bindCallHandlers, user, clearEndedTimer])

  const declineIncoming = useCallback(() => {
    incomingCall?.reject()
    setIncomingCall(null)
  }, [incomingCall])

  const hangUp = useCallback(() => {
    const call = activeCallRef.current
    activeCallRef.current = null
    call?.disconnect()
    setActiveCall(null)
    setCallSid(null)
    setStatus((current) => (current === 'on-call' ? 'ready' : current))
    setIsDialing(false)
    setIsConnecting(false)
    setMuted(false)
    setSpeakerOn(false)
    markCallEnded()
  }, [markCallEnded])

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

  const callPhase = deriveCallPhase({
    deviceStatus: status,
    hasActiveCall: Boolean(activeCall),
    isDialing,
    isConnecting,
    callFailed,
    justEnded,
  })

  const clearCallFailed = useCallback(() => setCallFailed(false), [])

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
    clearCallFailed,
    permissionDenied,
    callPhase,
    activeNumber,
    incomingCallerId: incomingCall?.parameters?.From || 'Unknown',
    activeLabel: activeNumber || activeCall?.parameters?.To || activeCall?.parameters?.From || 'Active call',
  }
}

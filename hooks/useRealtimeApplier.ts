'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getWsBaseUrl } from '@/lib/runtime-urls'

export type RealtimeEvent = {
  type: string
  agent?: string
  message?: string
  data?: Record<string, unknown>
  timestamp?: string
}

type PendingHitl = {
  id: string
  message: string
  context?: string
  options?: string[]
}

type ScreenshotFrame = {
  id: string
  image: string
  timestamp: string
}

function imageFromData(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  if (value.startsWith('data:image')) return value
  return `data:image/jpeg;base64,${value}`
}

export function useRealtimeApplier(token: string, sessionId: string) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const manuallyClosedRef = useRef(false)
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<ScreenshotFrame[]>([])
  const [pendingHitl, setPendingHitl] = useState<PendingHitl | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reconnectCount, setReconnectCount] = useState(0)
  const [lastPongAt, setLastPongAt] = useState<string | null>(null)

  const wsUrl = useMemo(() => {
    if (!sessionId) return ''
    const url = new URL(`${getWsBaseUrl()}/ws/${sessionId}`)
    if (token) {
      url.searchParams.set('token', token)
    }
    return url.toString()
  }, [token, sessionId])

  const scheduleReconnect = () => {
    if (manuallyClosedRef.current) return
    reconnectAttemptsRef.current += 1
    setReconnectCount(reconnectAttemptsRef.current)
    const delay = Math.min(1000 * 2 ** Math.min(reconnectAttemptsRef.current, 4), 15000)
    reconnectTimerRef.current = setTimeout(() => {
      connect()
    }, delay)
  }

  const connect = () => {
    if (!wsUrl) return
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0
      setReconnectCount(0)
      setConnected(true)
      setError(null)
    }

    socket.onmessage = (rawEvent) => {
      let event: RealtimeEvent = { type: 'text', message: String(rawEvent.data) }
      try {
        event = JSON.parse(String(rawEvent.data)) as RealtimeEvent
      } catch {
        event = { type: 'text', message: String(rawEvent.data) }
      }

      if (event.type === 'ping') {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'pong' }))
        }
        return // Don't store ping in event history
      }
      if (event.type === 'pong') {
        setLastPongAt(new Date().toISOString())
        return // Don't store pong in event history
      }

      // Deduplicate repeated "connected" events (server replays history on reconnect)
      if (event.type === 'connected') {
        setEvents((current) => {
          const filtered = current.filter((e) => e.type !== 'connected')
          return [event, ...filtered].slice(0, 300)
        })
      } else {
        setEvents((current) => [event, ...current].slice(0, 300))
      }

      const screenshotPayload = event?.data?.screenshot ?? event?.data?.image
      const screenshot = imageFromData(screenshotPayload)
      if (screenshot) {
        setLastScreenshot(screenshot)
        setScreenshots((current) =>
          [
            {
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              image: screenshot,
              timestamp: new Date().toISOString()
            },
            ...current
          ].slice(0, 12)
        )
      }

      if ((event.type === 'hitl:request' || event.type === 'draft:review') && event.data) {
        const hitlId = event.data.hitl_id
        if (typeof hitlId === 'string') {
          const eventScreenshot = imageFromData(event.data.screenshot)
          if (eventScreenshot) {
            setLastScreenshot(eventScreenshot)
          }
          const opts = event.data.options
          setPendingHitl({
            id: hitlId,
            message: event.message || 'Please provide input',
            context: typeof event.data.context === 'string' ? event.data.context : undefined,
            options: Array.isArray(opts) ? opts.filter((v): v is string => typeof v === 'string') : undefined
          })
        }
      }
    }

    socket.onerror = () => {
      setError('WebSocket connection error')
    }
    socket.onclose = () => {
      setConnected(false)
      if (!manuallyClosedRef.current) {
        scheduleReconnect()
      }
    }
  }

  useEffect(() => {
    if (!wsUrl) return
    manuallyClosedRef.current = false
    connect()

    return () => {
      manuallyClosedRef.current = true
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [wsUrl])

  const send = (payload: Record<string, unknown>) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return false
    socketRef.current.send(JSON.stringify(payload))
    return true
  }

  const startApply = (url: string, draftMode: boolean) =>
    send({
      type: 'start_apply',
      url,
      draft_mode: draftMode
    })

  const stopApply = () => send({ type: 'applier:stop' })

  const sendChat = (message: string) =>
    send({
      type: 'chat:message',
      data: { message, sender: 'user' }
    })

  const resolveHitl = (response: string) => {
    if (!pendingHitl) return false
    const sent = send({
      type: 'hitl_response',
      hitl_id: pendingHitl.id,
      response
    })
    if (sent) {
      setPendingHitl(null)
    }
    return sent
  }

  const reconnect = () => {
    manuallyClosedRef.current = true
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    socketRef.current?.close()
    manuallyClosedRef.current = false
    connect()
  }

  return {
    connected,
    events,
    lastScreenshot,
    screenshots,
    pendingHitl,
    error,
    reconnectCount,
    lastPongAt,
    reconnect,
    startApply,
    stopApply,
    sendChat,
    resolveHitl
  }
}

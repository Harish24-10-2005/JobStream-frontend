'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getWsBaseUrl } from '@/lib/runtime-urls'

export function usePipelineSocket(sessionId: string, token: string) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<string>('No events yet')
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  const wsUrl = useMemo(() => {
    if (!sessionId) return ''
    const url = new URL(`${getWsBaseUrl()}/api/v1/pipeline/ws/${sessionId}`)
    if (token) {
      url.searchParams.set('token', token)
    }
    return url.toString()
  }, [sessionId, token])

  useEffect(() => {
    if (!wsUrl) return
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      setConnected(true)
      setError(null)
    }
    socket.onmessage = (event) => {
      setLastEvent(event.data?.toString?.() || String(event.data))
    }
    socket.onerror = () => {
      setError('WebSocket error')
    }
    socket.onclose = () => {
      setConnected(false)
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [wsUrl])

  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'ping' }))
    }
  }

  return { connected, lastEvent, error, sendPing }
}

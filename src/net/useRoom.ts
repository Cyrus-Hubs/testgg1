import { useCallback, useEffect, useRef, useState } from 'react'
import type { Action, Room } from '@shared/types'

const SESSION = 'scamos-session'

interface Session {
  pid: string
  code: string
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed.pid || !parsed.code) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(pid: string, code: string) {
  sessionStorage.setItem(SESSION, JSON.stringify({ pid, code }))
}

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws`
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const send = useCallback((payload: unknown) => {
    const socket = wsRef.current
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload))
  }, [])

  useEffect(() => {
    let cancelled = false
    let retry = 0
    let socket: WebSocket | null = null
    const connect = () => {
      socket = new WebSocket(wsUrl())
      wsRef.current = socket
      socket.onopen = () => {
        if (cancelled) {
          socket?.close()
          return
        }
        setConnected(true)
        const saved = readSession()
        if (saved) send({ t: 'rejoin', ...saved, playerId: saved.pid, code: saved.code })
      }
      socket.onmessage = (event) => {
        const msg = JSON.parse(String(event.data)) as { t: string; code?: string; playerId?: string; room?: Room }
        if (msg.t === 'state' && msg.room && msg.playerId) {
          setRoom(msg.room)
          setPlayerId(msg.playerId)
          writeSession(msg.playerId, msg.room.code)
          setError(null)
        } else if (msg.t === 'error') {
          setError(msg.code || 'invalid')
          if (msg.code === 'room_gone') {
            sessionStorage.removeItem(SESSION)
            setRoom(null)
            setPlayerId(null)
          }
        }
      }
      socket.onclose = () => {
        if (cancelled) return
        setConnected(false)
        retry = window.setTimeout(connect, 700)
      }
    }
    connect()
    return () => {
      cancelled = true
      window.clearTimeout(retry)
      const current = socket
      if (!current) return
      if (current.readyState === WebSocket.OPEN) current.close()
      else current.addEventListener('open', () => current?.close())
    }
  }, [send])

  const e2e = new URLSearchParams(location.search).has('e2e')
  const solo = (name: string, shiftSeconds: number) => send({ t: 'solo', name, shiftSeconds, e2e })
  const create = (name: string, shiftSeconds: number) => send({ t: 'create', name, shiftSeconds, e2e })
  const join = (name: string, code: string) => send({ t: 'join', name, code })
  const act = (action: Action) => send({ t: 'action', action })

  return { room, playerId, connected, error, setError, solo, create, join, act }
}

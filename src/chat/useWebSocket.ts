import { useCallback, useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  nickname: string
  profileImage?: string
  content: string
  createdAt: string
}

interface UseWebSocketOptions {
  roomId: string
  token: string | null
  enabled: boolean
}

interface UseWebSocketReturn {
  messages: ChatMessage[]
  connected: boolean
  send: (content: string) => void
}

const WS_BASE = (import.meta.env.VITE_WS_BASE_URL as string | undefined) ?? ''

export function useWebSocket({ roomId, token, enabled }: UseWebSocketOptions): UseWebSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!enabled || !token) return
    if (!WS_BASE) {
      setConnected(true)
      return
    }

    const url = `${WS_BASE}/ws/chat/${roomId}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as ChatMessage
        setMessages((prev) => [...prev, msg])
      } catch {
        /* ignore malformed */
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
      setConnected(false)
    }
  }, [roomId, token, enabled])

  const send = useCallback(
    (content: string) => {
      if (!content.trim()) return

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'MESSAGE', content }))
        return
      }

      // Mock: WS 백엔드 없을 때 로컬에서 메시지 추가
      const mockMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        roomId,
        userId: 'me',
        nickname: '나',
        content,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, mockMsg])
    },
    [roomId],
  )

  return { messages, connected, send }
}

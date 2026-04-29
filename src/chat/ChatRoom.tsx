import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../auth/useAuthStore'
import { useWebSocket, type ChatMessage } from './useWebSocket'

interface ChatRoomProps {
  roomId: string
  roomName: string
  onBack: () => void
  onLoginRequired: () => void
}

export function ChatRoom({ roomId, roomName, onBack, onLoginRequired }: ChatRoomProps) {
  const { user, token } = useAuthStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, connected, send } = useWebSocket({
    roomId,
    token,
    enabled: !!user,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-3xl">💬</div>
        <p className="text-base font-medium text-zinc-800">
          채팅방에 참여하려면 로그인이 필요합니다.
        </p>
        <p className="text-sm text-zinc-500">SNS 계정으로 간편하게 참여할 수 있어요.</p>
        <button
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          onClick={onLoginRequired}
        >
          로그인하기
        </button>
        <button
          className="text-sm text-zinc-400 transition hover:text-zinc-600"
          onClick={onBack}
        >
          ← 돌아가기
        </button>
      </div>
    )
  }

  const handleSend = () => {
    if (!input.trim()) return
    send(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] max-h-[700px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          onClick={onBack}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{roomName}</p>
          <p className="text-xs text-zinc-400">채팅방 · {roomId}</p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            connected
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-zinc-100 text-zinc-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-zinc-300'}`}
          />
          {connected ? '연결됨' : '연결 중'}
        </span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-2xl">☕</p>
            <p className="text-sm font-medium text-zinc-600">{roomName} 채팅방</p>
            <p className="text-xs text-zinc-400">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} myUserId={user.id} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="border-t border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400/30"
            type="text"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
          />
          <button
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500 disabled:bg-zinc-300"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="전송"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8l12-6-4.5 6 4.5 6L2 8z"
                fill="white"
              />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-right text-xs text-zinc-300">{input.length}/500</p>
      </div>
    </div>
  )
}

function MessageBubble({ msg, myUserId }: { msg: ChatMessage; myUserId: string }) {
  const isMe = msg.userId === myUserId || msg.userId === 'me'
  const timeStr = new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isMe) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[75%] flex-col items-end gap-1">
          <div className="rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">
            {msg.content}
          </div>
          <span className="text-xs text-zinc-300">{timeStr}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
        {msg.nickname.charAt(0)}
      </div>
      <div className="flex max-w-[75%] flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">{msg.nickname}</span>
        <div className="rounded-2xl rounded-tl-sm border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 shadow-sm">
          {msg.content}
        </div>
        <span className="text-xs text-zinc-300">{timeStr}</span>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { BubbleGame } from './BubbleGame'

const SECRET_PASSWORD = 'mk6530'
const STORAGE_KEY = 'secret_room_unlocked'

interface SecretRoomPageProps {
  onBack: () => void
}

export function SecretRoomPage({ onBack }: SecretRoomPageProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [tries, setTries] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      setUnlocked(true)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === SECRET_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setUnlocked(true)
    } else {
      setShake(true)
      setTries((t) => t + 1)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleLock = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUnlocked(false)
    setInput('')
  }

  if (unlocked) {
    return (
      <div className="flex min-h-[80vh] flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🫧</span>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
              뽀글뽀글
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLock}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm transition hover:bg-zinc-50"
            >
              잠그기
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50"
            >
              ← Back
            </button>
          </div>
        </div>

        <BubbleGame />
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="relative w-full max-w-sm">
        <button
          type="button"
          onClick={onBack}
          className="absolute -top-12 left-0 text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          ← Back
        </button>

        <div
          className={`overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 shadow-2xl ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">비밀의 방</h2>
            <p className="text-xs leading-5 text-zinc-400">
              비밀번호를 알고 있는 사람만 들어올 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              placeholder="비밀번호"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-center text-sm tracking-[0.3em] text-white outline-none transition placeholder:text-zinc-600 placeholder:tracking-normal focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="submit"
              disabled={!input}
              className="w-full rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-4 py-3 text-sm font-bold text-zinc-900 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              열기
            </button>
          </form>

          {tries > 0 ? (
            <p className="mt-4 text-center text-[11px] text-rose-400">
              비밀번호가 일치하지 않습니다. ({tries}회 실패)
            </p>
          ) : (
            <p className="mt-4 text-center text-[11px] text-zinc-500">
              힌트: 4자리 숫자로 끝납니다 🤫
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}

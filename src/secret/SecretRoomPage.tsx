import { useEffect, useState } from 'react'
import { BubbleGame } from './BubbleGame'

const SECRET_PASSWORD = 'mk6530'
const STORAGE_KEY = 'secret_room_unlocked'
const SPLASH_DURATION_MS = 2400

type Phase = 'locked' | 'opening' | 'playing'

interface SecretRoomPageProps {
  onBack: () => void
}

export function SecretRoomPage({ onBack }: SecretRoomPageProps) {
  const [phase, setPhase] = useState<Phase>('locked')
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [tries, setTries] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      setPhase('playing')
    }
  }, [])

  // opening → playing 자동 전환
  useEffect(() => {
    if (phase !== 'opening') return
    const t = window.setTimeout(() => setPhase('playing'), SPLASH_DURATION_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === SECRET_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setPhase('opening')
    } else {
      setShake(true)
      setTries((t) => t + 1)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleExit = () => {
    onBack()
  }

  const handleLockAndExit = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    onBack()
  }

  // === 풀스크린 게임 ===
  if (phase === 'playing') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-auto bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950">
        {/* 배경 별 효과 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-[2px] w-[2px] rounded-full bg-white"
              style={{
                left: `${(i * 137) % 100}%`,
                top: `${(i * 89) % 100}%`,
                opacity: 0.2 + ((i * 17) % 70) / 100,
                animation: `secretTwinkle ${3 + (i % 5)}s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>

        {/* 게임 */}
        <div className="relative z-10 flex w-full justify-center px-3 py-4">
          <BubbleGame />
        </div>

        {/* 우측 하단 나가기 버튼 */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleLockAndExit}
            className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-[10px] font-medium text-zinc-400 shadow-lg backdrop-blur-md transition hover:border-zinc-600 hover:text-zinc-200"
            title="잠그고 나가기"
          >
            잠그고 나가기
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="group flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-500/90 to-amber-600/90 px-5 py-2.5 text-sm font-bold text-zinc-900 shadow-xl shadow-amber-500/30 backdrop-blur-md transition hover:scale-105 hover:from-amber-400 hover:to-amber-500 active:scale-95"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            나가기
          </button>
        </div>

        <style>{`
          @keyframes secretTwinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.9; }
          }
        `}</style>
      </div>
    )
  }

  // === 문이 열리는 연출 ===
  if (phase === 'opening') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-zinc-950">
        {/* 배경 어두움 */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />

        {/* 문 컨테이너 (3D perspective) */}
        <div className="relative" style={{ perspective: '1400px' }}>
          <div
            className="relative"
            style={{ width: 280, height: 380, transformStyle: 'preserve-3d' }}
          >
            {/* 문 안쪽 (배경 = 다른 세상의 빛) */}
            <div
              aria-hidden
              className="absolute inset-0 overflow-hidden rounded-t-[2.8rem]"
              style={{
                animation: `innerLight ${SPLASH_DURATION_MS}ms ease-in forwards`,
                opacity: 0,
              }}
            >
              {/* 빛 그라디언트 */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700" />
              {/* 빛줄기 */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-bottom"
                  style={{
                    width: 4,
                    height: 300,
                    background:
                      'linear-gradient(to top, rgba(255,255,255,0.9), transparent)',
                    transform: `translate(-50%, -100%) rotate(${(i - 2.5) * 12}deg)`,
                    filter: 'blur(2px)',
                  }}
                />
              ))}
            </div>

            {/* 좌측 문짝 */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/2 origin-left rounded-tl-[2.8rem] border-2 border-amber-700/80 bg-gradient-to-br from-amber-900 via-amber-950 to-zinc-900 shadow-2xl"
              style={{
                animation: `doorOpenLeft ${SPLASH_DURATION_MS}ms cubic-bezier(0.6, 0, 0.4, 1) forwards`,
                backfaceVisibility: 'hidden',
              }}
            >
              {/* 패널 디테일 */}
              <div className="absolute inset-x-3 top-3 h-12 rounded-md border border-amber-700/40" />
              <div className="absolute inset-x-3 bottom-3 h-12 rounded-md border border-amber-700/40" />
              {/* 손잡이 (오른쪽 가장자리, 즉 가운데 쪽) */}
              <div className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.7)]" />
            </div>

            {/* 우측 문짝 */}
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-1/2 origin-right rounded-tr-[2.8rem] border-2 border-amber-700/80 bg-gradient-to-bl from-amber-900 via-amber-950 to-zinc-900 shadow-2xl"
              style={{
                animation: `doorOpenRight ${SPLASH_DURATION_MS}ms cubic-bezier(0.6, 0, 0.4, 1) forwards`,
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="absolute inset-x-3 top-3 h-12 rounded-md border border-amber-700/40" />
              <div className="absolute inset-x-3 bottom-3 h-12 rounded-md border border-amber-700/40" />
              {/* 손잡이 (왼쪽 가장자리, 즉 가운데 쪽) */}
              <div className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.7)]" />
            </div>

            {/* 문 위 자물쇠 (열리는 표시) */}
            <div
              aria-hidden
              className="absolute -top-12 left-1/2 -translate-x-1/2"
              style={{ animation: `lockUnlock ${SPLASH_DURATION_MS}ms ease-out forwards` }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-400"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
                <path d="M8 11V8a4 4 0 018 0v3" />
              </svg>
            </div>
          </div>
        </div>

        {/* 빛 폭발 (문 열린 후) */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 100,
            height: 100,
            background:
              'radial-gradient(circle, rgba(252,211,77,0.95) 0%, rgba(245,158,11,0.7) 30%, rgba(120,53,15,0.3) 60%, transparent 100%)',
            animation: `lightBurst ${SPLASH_DURATION_MS}ms ease-out forwards`,
            opacity: 0,
          }}
        />

        {/* 화면 흰빛 플래시 (피크) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white"
          style={{
            animation: `whiteFlash ${SPLASH_DURATION_MS}ms ease-in forwards`,
            opacity: 0,
          }}
        />

        {/* 텍스트 */}
        <p
          className="absolute bottom-[18vh] left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.5em] text-amber-300"
          style={{ animation: `enterText ${SPLASH_DURATION_MS}ms ease-out forwards`, opacity: 0 }}
        >
          ── 다른 세상으로 ──
        </p>

        <style>{`
          @keyframes doorOpenLeft {
            0%, 15% { transform: rotateY(0deg); }
            70% { transform: rotateY(-115deg); }
            100% { transform: rotateY(-120deg); opacity: 0.4; }
          }
          @keyframes doorOpenRight {
            0%, 15% { transform: rotateY(0deg); }
            70% { transform: rotateY(115deg); }
            100% { transform: rotateY(120deg); opacity: 0.4; }
          }
          @keyframes innerLight {
            0%, 10% { opacity: 0; filter: brightness(0.5); }
            25% { opacity: 0.4; filter: brightness(1); }
            55% { opacity: 1; filter: brightness(1.6); }
            85% { opacity: 1; filter: brightness(2.4); }
            100% { opacity: 0; }
          }
          @keyframes lightBurst {
            0%, 35% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            55% { transform: translate(-50%, -50%) scale(4); opacity: 1; }
            85% { transform: translate(-50%, -50%) scale(20); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(40); opacity: 0; }
          }
          @keyframes whiteFlash {
            0%, 70% { opacity: 0; }
            85% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          @keyframes lockUnlock {
            0%, 5% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            12% { opacity: 1; transform: translate(-50%, -8px) scale(1.3); filter: drop-shadow(0 0 8px rgba(252,211,77,0.9)); }
            20% { opacity: 1; transform: translate(-50%, -4px) scale(1.1); }
            40% { opacity: 0.6; transform: translate(-50%, -10px) scale(0.9); }
            60% { opacity: 0; transform: translate(-50%, -20px) scale(0.6); }
            100% { opacity: 0; }
          }
          @keyframes enterText {
            0%, 60% { opacity: 0; transform: translate(-50%, 10px); }
            75% { opacity: 1; transform: translate(-50%, 0); }
            95% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // === 비밀번호 입력 (locked) ===
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
      {/* 배경 별 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 89) % 100}%`,
              opacity: 0.2 + ((i * 13) % 50) / 100,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-400 shadow-sm backdrop-blur-md transition hover:border-zinc-600 hover:text-zinc-200"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        나가기
      </button>

      <div className="relative w-full max-w-sm">
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

interface LoginModalProps {
  onClose: () => void
}

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as string | undefined
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const REDIRECT_URI =
  (import.meta.env.VITE_OAUTH_REDIRECT_URI as string | undefined) ??
  `${window.location.origin}/auth/callback`

function kakaoLoginUrl() {
  const params = new URLSearchParams({
    client_id: KAKAO_REST_API_KEY ?? '',
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'profile_nickname,profile_image',
    state: 'kakao',
  })
  return `https://kauth.kakao.com/oauth/authorize?${params}`
}

function googleLoginUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? '',
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: 'google',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export function LoginModal({ onClose }: LoginModalProps) {
  const handleKakao = () => {
    if (!KAKAO_REST_API_KEY) {
      alert('카카오 앱 키가 설정되지 않았습니다. (VITE_KAKAO_REST_API_KEY)')
      return
    }
    window.location.href = kakaoLoginUrl()
  }

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert('구글 클라이언트 ID가 설정되지 않았습니다. (VITE_GOOGLE_CLIENT_ID)')
      return
    }
    window.location.href = googleLoginUrl()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">로그인</h2>
          <p className="mt-1 text-sm text-zinc-500">
            SNS 계정으로 간편하게 로그인하고 채팅방에 참여하세요.
          </p>
        </div>

        <div className="space-y-3 px-6 py-4">
          {/* 카카오 */}
          <button
            className="flex w-full items-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#3C1E1E] shadow-sm transition hover:brightness-95 active:brightness-90"
            onClick={handleKakao}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2C5.582 2 2 4.895 2 8.45c0 2.24 1.411 4.205 3.545 5.343L4.6 17.05a.25.25 0 00.378.268L9.26 14.88c.244.02.49.03.74.03 4.418 0 8-2.895 8-6.46C18 4.895 14.418 2 10 2z"
                fill="#3C1E1E"
              />
            </svg>
            카카오로 시작하기
          </button>

          {/* 구글 */}
          <button
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:bg-zinc-100"
            onClick={handleGoogle}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path
                d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.62 4.62 0 01-2 3.03v2.52h3.24c1.89-1.74 2.96-4.3 2.96-7.34z"
                fill="#4285F4"
              />
              <path
                d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.6A9.99 9.99 0 0010 20z"
                fill="#34A853"
              />
              <path
                d="M4.41 11.89A6 6 0 014.18 10c0-.65.11-1.28.23-1.89V5.51H1.07A10 10 0 000 10c0 1.61.38 3.13 1.07 4.49l3.34-2.6z"
                fill="#FBBC05"
              />
              <path
                d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.99 12.7 0 10 0A9.99 9.99 0 001.07 5.51l3.34 2.6C5.2 5.72 7.4 3.96 10 3.96z"
                fill="#EA4335"
              />
            </svg>
            Google로 시작하기
          </button>
        </div>

        <div className="border-t border-zinc-100 px-6 py-4">
          <button
            className="w-full text-center text-sm text-zinc-400 transition hover:text-zinc-600"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

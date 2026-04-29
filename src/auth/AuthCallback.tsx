import { useEffect, useRef } from 'react'
import { useAuthStore } from './useAuthStore'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

interface AuthCallbackProps {
  onDone: (redirectTo: string) => void
}

/**
 * OAuth 리다이렉트 후 처리 페이지.
 * URL: /auth/callback?code=...&state=...&provider=kakao|google
 *
 * 백엔드가 준비되면 code를 POST /auth/{provider}로 전송해 JWT를 받습니다.
 * 현재는 mock 처리로 즉시 가짜 유저를 로그인 시킵니다.
 */
export function AuthCallback({ onDone }: AuthCallbackProps) {
  const login = useAuthStore((s) => s.login)
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const provider = params.get('state') ?? detectProvider()

    if (!code) {
      onDone('/')
      return
    }

    exchangeCode(code, provider as 'kakao' | 'google')
      .then(({ user, token }) => {
        login(user, token)
        const redirectTo = sessionStorage.getItem('auth_redirect') ?? '/24hours'
        sessionStorage.removeItem('auth_redirect')
        onDone(redirectTo)
      })
      .catch(() => onDone('/'))
  }, [login, onDone])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
        <p className="text-sm text-zinc-500">로그인 처리 중...</p>
      </div>
    </div>
  )
}

function detectProvider(): 'kakao' | 'google' {
  const ref = document.referrer
  if (ref.includes('kakao')) return 'kakao'
  return 'google'
}

async function exchangeCode(
  code: string,
  provider: 'kakao' | 'google',
): Promise<{ user: import('./useAuthStore').AuthUser; token: string }> {
  if (!API_BASE) {
    return mockLogin(provider)
  }

  try {
    const res = await fetch(`${API_BASE}/auth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) throw new Error('auth failed')
    const raw = (await res.json()) as {
      data?: {
        user?: { id?: string; nickname?: string; profileImage?: string }
        token?: string
      }
      token?: string
      id?: string
      nickname?: string
      profileImage?: string
    }

    // { data: { user: { ... }, token } } 구조와 flat 구조 모두 지원
    const token = raw.data?.token ?? raw.token ?? ''
    const userObj = raw.data?.user
    const id = userObj?.id ?? raw.id ?? ''
    const nickname = userObj?.nickname ?? raw.nickname ?? ''
    const profileImage = userObj?.profileImage ?? raw.profileImage

    return {
      token,
      user: { id, nickname, profileImage, provider },
    }
  } catch {
    return mockLogin(provider)
  }
}

function mockLogin(provider: 'kakao' | 'google') {
  return Promise.resolve({
    token: `mock-token-${Date.now()}`,
    user: {
      id: `mock-${Date.now()}`,
      nickname: provider === 'kakao' ? '카카오 유저' : 'Google User',
      provider,
    } as import('./useAuthStore').AuthUser,
  })
}

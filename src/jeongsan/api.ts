/**
 * 백엔드 호출. `VITE_JEONGSAN_API_BASE_URL` 이 없으면 mock 으로 떨어진다.
 *
 * 24hours 백엔드(AWS)와 정산어택 백엔드(OCI)는 다른 호스트이므로
 * 기존 `VITE_API_BASE_URL` 과 분리해서 쓴다.
 *
 * v2(모임) 호출은 모임 화면과 함께 지웠다(2026-10-04). v3 API 호출은 백엔드 v3가 나오면 여기에 붙인다.
 */
const BASE = (import.meta.env.VITE_JEONGSAN_API_BASE_URL as string | undefined) ?? ''

export const isMock = () => BASE === ''

/**
 * 구글 로그인을 화면에 띄울지. **기본은 꺼짐이다.**
 *
 * 카카오 앱만 먼저 등록했다. 등록하지 않은 제공자의 버튼을 띄우면 눌러도
 * 아무 일이 없고, 사용자는 서비스가 고장난 줄 안다.
 *
 * 켤 때는 `.env.local` 과 Vercel 양쪽에 `VITE_JEONGSAN_GOOGLE_ENABLED=true`.
 * 구글 OAuth 클라이언트 등록이 먼저다.
 */
export const googleEnabled =
  (import.meta.env.VITE_JEONGSAN_GOOGLE_ENABLED as string | undefined) === 'true'

/** `GET /api/v1/auth/me` 응답 — `API.md` §2.2 */
export type Me = {
  id: number
  nickname: string
  profileImageUrl: string | null
}

/**
 * 로그인 여부 확인 — `API.md` §2.2.
 *
 * **쿠키가 httpOnly 라 JS 가 읽을 수 없다.** 그래서 프론트는 로그인 상태를
 * 스스로 알 방법이 없고, 서버에 물어봐야 한다. 새로고침할 때마다 부른다.
 *
 * 실패(401 등)하면 `null` — 호출부가 "로그아웃 상태"로 다룬다.
 * mock 모드에서는 서버가 없으므로 `null` 을 준다(개발용 전환 바로 로그인시킨다).
 */
export const fetchMe = async (): Promise<Me | null> => {
  if (isMock()) return null
  try {
    const res = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { Accept: 'application/json' },
      // 인증이 httpOnly 쿠키다(API.md §2.3). 다른 오리진의 API 로 쿠키를 실으려면 include.
      credentials: 'include',
    })
    if (!res.ok) return null
    return (await res.json()) as Me
  } catch {
    return null
  }
}

/** 카카오 로그인 시작. 서버가 카카오 인가 화면으로 302 시킨다(`API.md` §2.1). */
export const kakaoLoginUrl = () => `${BASE}/api/v1/auth/kakao/login`

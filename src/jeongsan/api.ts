/**
 * 로그인 화면 설정. 서버 호출은 v3 클라이언트(`v3/api.ts`)와 동작 입구(`v3/gateway.ts`) 한 곳으로 모았다(2026-10-05).
 */

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

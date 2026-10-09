/**
 * 개인정보처리방침·지원 페이지에 들어가는 운영 정보 — 스토어 심사에 필요한 공개 URL
 * (`/jungsan/privacy`, `/jungsan/support`). 사실과 다르면 안 되는 값이라 한곳에 모았다.
 *
 * 수집 항목·보관 기간은 `jungsan_attack` `docs/REQUIREMENTS.md` §6.4·§7과 서버 코드(`KakaoModels.kt` — 닉네임·
 * 프로필 사진만 받는다)를 따른다. 그 규칙이 바뀌면 여기와 `PrivacyPage.tsx`를 같이 고친다.
 *
 * ⚠ `TODO_`로 시작하는 값은 CTO 확인 전이다 — 채우기 전에는 배포하지 않는다(`__tests__/legal.test.ts`가 막는다).
 */

/** 개인정보 보호책임자 성명(개인정보 보호법 제30조) */
export const OPERATOR = '김동규'

/** 문의 이메일 — 지원 페이지·방침 공통. 공개된다 */
export const CONTACT_EMAIL = 'skyko6530@gmail.com'

/** 서버가 있는 곳 — 국외면 국외 이전 고지가 필요하다 */
export const SERVER_LOCATION = '싱가포르(Oracle Cloud ap-singapore-1)'

/** 시행일 — 내용을 바꾸면 날짜도 바꾼다 */
export const EFFECTIVE_DATE = '2026년 10월 10일'

/**
 * 국외 이전(개인정보 보호법 제28조의8) — 서버가 싱가포르에 있어 고지한다. 웹은 Vercel(미국)이 화면을 내보내며 접속 기록을 남긴다.
 * 서버 리전·호스팅을 바꾸면 여기와 `SERVER_LOCATION`을 같이 고친다.
 */
export const OVERSEAS_TRANSFERS = [
  {
    to: 'Oracle Corporation (Oracle Cloud Infrastructure)',
    country: '싱가포르',
    items: '1항의 처리하는 개인정보 전부',
    purpose: '서버와 데이터베이스 운영·보관',
    when: '서비스를 이용할 때마다 네트워크로 전송',
    period: '4항의 보관 기간과 같음',
  },
  {
    to: 'Vercel Inc.',
    country: '미국',
    items: '웹 접속 기록(IP 주소, 브라우저 정보, 접속 시각)',
    purpose: '웹 화면 제공과 장애 대응',
    when: '웹 화면을 열 때 네트워크로 전송',
    period: 'Vercel 보관 정책에 따름(최대 30일)',
  },
] as const

/** 아직 채우지 않은 값 — 배포 전 검사용 */
export const unfilled = () =>
  Object.entries({ OPERATOR, CONTACT_EMAIL, SERVER_LOCATION }).filter(([, v]) => v.startsWith('TODO_')).map(([k]) => k)

/**
 * 백엔드 호출. `VITE_JEONGSAN_API_BASE_URL` 이 없으면 mock 으로 떨어진다.
 *
 * 24hours 백엔드(AWS)와 정산어택 백엔드(OCI)는 다른 호스트이므로
 * 기존 `VITE_API_BASE_URL` 과 분리해서 쓴다.
 */
import { mockGathering, mockGroupDetails, mockGroups, mockSettlement, mockSummaries } from './mock'
import type { Gathering, GatheringSummary, GroupDetail, GroupSummary, Id, Me, Settlement } from './types'

const BASE = (import.meta.env.VITE_JEONGSAN_API_BASE_URL as string | undefined) ?? ''

export const isMock = () => BASE === ''

/**
 * 구글 로그인을 화면에 띄울지. **기본은 꺼짐이다.**
 *
 * 카카오 앱만 먼저 등록했다. 등록하지 않은 제공자의 버튼을 띄우면 눌러도
 * 아무 일이 없고, 사용자는 서비스가 고장난 줄 안다.
 *
 * 주석 처리가 아니라 플래그로 둔 이유 — 주석으로 지우면 되살릴 때
 * 화면에서 무엇이 빠졌는지 아무도 기억하지 못한다.
 *
 * 켤 때는 `.env.local` 과 Vercel 양쪽에 `VITE_JEONGSAN_GOOGLE_ENABLED=true`.
 * 구글 OAuth 클라이언트 등록이 먼저다.
 */
export const googleEnabled =
  (import.meta.env.VITE_JEONGSAN_GOOGLE_ENABLED as string | undefined) === 'true'

/**
 * 단톡방에 뿌리는 공유 링크의 호스트. **프론트 주소가 아니다.**
 *
 * 카카오톡은 링크를 붙이면 자기 크롤러로 그 URL 을 GET 해서 `og:*` 태그로
 * 카드를 만든다. **크롤러는 JS 를 실행하지 않으므로** CSR 인 이 프론트가 무엇을
 * 그리든 카드에는 반영되지 않는다. 그래서 백엔드가 OG 태그가 든 HTML 을 응답하고,
 * 사람은 그 HTML 의 스크립트로 이 프론트로 넘어온다 — `ADR-007`.
 *
 * ⚠ 주소창에서 복사한 프론트 주소를 뿌리면 OG 를 거치지 않아 카드가 안 뜬다.
 *   화면은 **항상 이 주소**를 보여주고 복사시켜야 한다.
 */
const SHARE_BASE =
  (import.meta.env.VITE_JEONGSAN_SHARE_BASE_URL as string | undefined) ??
  'https://join.devkdk.com'

/** 표시용 — 스킴을 뗀다. `join.devkdk.com/g/k3f9dq2` */
export const shareUrlLabel = (token: string) =>
  `${SHARE_BASE.replace(/^https?:\/\//, '')}/g/${token}`

/** 복사·공유용 전체 URL */
export const shareUrl = (token: string) => `${SHARE_BASE}/g/${token}`

type ApiEnvelope<T> = { data?: T } & Partial<T>

async function get<T>(path: string, fallback: T): Promise<T> {
  if (isMock()) return Promise.resolve(fallback)
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
    // 인증이 httpOnly 쿠키다(API.md §2.3). fetch 는 기본이 same-origin 이라
    // 이게 없으면 다른 오리진의 API 로 쿠키가 안 실려 전부 401 이 된다.
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  const json = (await res.json()) as ApiEnvelope<T>
  return (json.data ?? json) as T
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

/**
 * H0 — 내 모임 목록. `API.md` §3-b.1
 *
 * 응답의 `role` 로 총무인 모임과 참여 중인 모임을 갈라 보여준다.
 * 소프트 삭제된 번개 모임(확정 +14일 경과)은 서버가 이미 걸러서 준다.
 */
export const fetchMyGroups = () =>
  get<GroupSummary[]>('/api/v1/groups', mockGroups)

/** 모임 상세 — 멤버와 술자리 목록. `API.md` §3-b.3 */
export const fetchGroup = (id: Id) =>
  get<GroupDetail>(`/api/v1/groups/${id}`, mockGroupDetails[id] ?? mockGroupDetails[100])

/** 모임 안의 술자리 목록 */
export const fetchMyGatherings = () =>
  get<GatheringSummary[]>('/api/v1/gatherings', mockSummaries)

/** H2·H3·H5 — 모임 전체 (한 번에 조립해서 받는다) */
export const fetchGathering = (id: Id) =>
  get<Gathering>(`/api/v1/gatherings/${id}`, mockGathering)

/** H3-b — 확정 미리보기. inputHash 를 함께 받는다 (ADR-004) */
export const fetchPreview = (id: Id) =>
  get<Settlement>(`/api/v1/gatherings/${id}/settlement/preview`, mockSettlement)

/** H4 — 확정된 결과 */
export const fetchSettlement = (id: Id) =>
  get<Settlement>(`/api/v1/gatherings/${id}/settlement`, mockSettlement)

/** 참여자 웹 — 토큰으로 진입 */
export const fetchByToken = (token: string) =>
  get<Gathering>(`/api/v1/g/${token}`, mockGathering)

export const fetchSettlementByToken = (token: string) =>
  get<Settlement>(`/api/v1/g/${token}/settlement`, mockSettlement)

/** 계좌번호는 숫자만 복사한다 — 은행명·하이픈이 섞이면 송금 앱 입력란에서 잘린다 (SPEC §8) */
export const digitsOnly = (accountNo: string) => accountNo.replace(/[^0-9]/g, '')

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
export const signedWon = (n: number) =>
  `${n < 0 ? '−' : '+'}${Math.abs(n).toLocaleString('ko-KR')}원`

export const dateLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${iso.replace(/-/g, '. ')} (${day})`
}

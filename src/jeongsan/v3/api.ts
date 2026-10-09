/**
 * v3 백엔드 호출 — 계약은 `jungsan_attack` `docs/API.md`(v4~)와 `docs/flow-changes/2026-10-04-v3-api-contract.md`(FC-014).
 *
 * `VITE_JEONGSAN_API_BASE_URL`이 비어 있으면 **목데이터 모드**다(지금 배포도 그렇다). 화면은 `gateway.ts`를 통해
 * 부르고, 거기서 모드에 따라 목데이터 스토어나 이 파일을 고른다 — 화면 코드는 모드를 몰라도 된다.
 *
 * 인증은 httpOnly 쿠키(API.md §2.3)라 이 파일은 토큰을 다루지 않는다. 모든 요청에 `credentials: 'include'`.
 */
import type { ResponseType, User } from './model'
import type { ServerGathering, ServerJoinPreview, ServerPreview } from './serverModel'

const BASE = (import.meta.env.VITE_JEONGSAN_API_BASE_URL as string | undefined) ?? ''

/** 실제 서버에 붙는가. 아니면 목데이터 */
export const isApiMode = () => BASE !== ''

/** API.md §1.2 오류 응답. `code`로 화면 문구·처리를 고르고, 없으면 서버 `message`를 그대로 보여준다 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly errors: { code: string; message: string }[] | null

  constructor(status: number, code: string, message: string, errors: ApiError['errors'] = null) {
    super(message)
    this.status = status
    this.code = code
    this.errors = errors
  }
}

type ErrorBody = { code?: string; message?: string; errors?: ApiError['errors'] }

/** 네트워크가 끊겼을 때 — 서버 응답이 아니므로 status 0 */
const NETWORK = 'NETWORK_ERROR'

export async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, NETWORK, '연결이 불안정해요. 잠시 뒤 다시 시도해주세요')
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const json: unknown = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const e = (json ?? {}) as ErrorBody
    throw new ApiError(res.status, e.code ?? `HTTP_${res.status}`, e.message ?? '잠시 뒤 다시 시도해주세요', e.errors ?? null)
  }
  // API.md §1.1 — 봉투 없이 본문이 곧 자원이다
  return json as T
}

// ── 응답 모양(서버 DTO 그대로) ───────────────────────────

/** `GET /api/v1/auth/me` — server `MeResponse` */
export type MeResponse = {
  id: number
  nickname: string
  profileImageUrl: string | null
  /** 등록한 실명. 아직 안 받았으면 null(FC-013) */
  displayName: string | null
  needsName: boolean
  /** 본인 계좌(FC-014 §9) — 없으면 null */
  payout?: { bank: string; accountNo: string; holder: string } | null
  spoonCount?: number
  unreadNotificationCount?: number
}

/** `GET /api/v1/me/notifications` 한 줄 */
export type ServerNotification = {
  id: number; type: string; gatheringId: number; settlementUnitId: number | null
  title: string; body: string; createdAt: string; readAt: string | null
}

type Answer = { roundId: number; type: ResponseType }
type RoundBody = { total: number; payerParticipantId: number; drinks: { name: string; unitPrice: number; quantity: number }[] }

/** 정산 단위 경로 `…/gatherings/{gid}/settlement-units/{uid}` (SETTLEMENT_UNITS §4.2의 U) */
const U = (gid: number, uid: number) => `/api/v1/gatherings/${gid}/settlement-units/${uid}`

// ── 엔드포인트 ─────────────────────────────────────────

export const api = {
  /** 로그인 여부 + 내 정보. 401이면 로그아웃 상태 */
  me: () => request<MeResponse>('GET', '/api/v1/auth/me'),
  /** 실명 최초 등록(FC-013). 400 형식 오류 · 409 `DISPLAY_NAME_ALREADY_SET` */
  putDisplayName: (displayName: string) => request<MeResponse>('PUT', '/api/v1/users/me/display-name', { displayName }),
  /** 카카오 로그인 시작 주소. 로그인 뒤 돌아올 경로(FC-014 1-2) — `/jungsan/`으로 시작하는 것만 서버가 받는다 */
  kakaoLoginUrl: (returnTo?: string) =>
    `${BASE}/api/v1/auth/kakao/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
  /** 로그아웃 — 서버 세션을 끊고 쿠키를 지운다 */
  logout: () => request<unknown>('POST', '/api/v1/auth/logout'),
  /** 회원 탈퇴 — 계정·연결 정보를 지우고 쿠키도 지운다 */
  deleteMe: () => request<unknown>('DELETE', '/api/v1/users/me'),
  putPayout: (p: { bank: string; accountNo: string; holder: string }) => request<unknown>('PUT', '/api/v1/users/me/payout', p),

  // 술자리 — 응답은 모두 술자리 전체(ServerGathering). 화면은 serverModel.toRooms 로 정산방들로 바꾼다
  myGatherings: () => request<ServerGathering[]>('GET', '/api/v1/me/gatherings'),
  gathering: (gid: number) => request<ServerGathering>('GET', `/api/v1/gatherings/${gid}`),
  createGathering: (title?: string) => request<ServerGathering>('POST', '/api/v1/gatherings', title ? { title } : {}),
  sendMessage: (gid: number, text: string) => request<unknown>('POST', `/api/v1/gatherings/${gid}/messages`, { text }),
  joinPreview: (token: string) => request<ServerJoinPreview>('GET', `/api/v1/join/${encodeURIComponent(token)}`),
  join: (token: string, settlementUnitId: number, responses: Answer[]) =>
    request<{ gatheringId: number; participantId: number }>('POST', `/api/v1/join/${encodeURIComponent(token)}`, { settlementUnitId, responses }),

  // 정산 단위 — 다음 차 총무(FC-015)
  createUnit: (gid: number, requestId: string, participantIds: number[], headcount?: number) =>
    request<{ id: number }>('POST', `/api/v1/gatherings/${gid}/settlement-units`, { requestId, participantIds, headcount }),
  /** 인원(FC-020) — 총무·정산 전. 바꾼 뒤 서버가 자동 정산 판정을 한 번 돈다 */
  putHeadcount: (gid: number, uid: number, headcount: number) => request<unknown>('PUT', `${U(gid, uid)}/headcount`, { headcount }),
  addMember: (gid: number, uid: number, pid: number) => request<unknown>('PUT', `${U(gid, uid)}/participants/${pid}`),
  removeMember: (gid: number, uid: number, pid: number) => request<unknown>('DELETE', `${U(gid, uid)}/participants/${pid}`),
  addRound: (gid: number, uid: number, body: RoundBody) => request<{ id: number }>('POST', `${U(gid, uid)}/rounds`, body),
  putRound: (gid: number, uid: number, rid: number, body: RoundBody) => request<{ id: number }>('PUT', `${U(gid, uid)}/rounds/${rid}`, body),
  deleteRound: (gid: number, uid: number, rid: number) => request<unknown>('DELETE', `${U(gid, uid)}/rounds/${rid}`),
  respond: (gid: number, uid: number, answers: Answer[]) => request<unknown>('PUT', `${U(gid, uid)}/responses/me`, { answers }),
  respondFor: (gid: number, uid: number, pid: number, answers: Answer[]) =>
    request<unknown>('PUT', `${U(gid, uid)}/participants/${pid}/responses`, { answers }),
  preview: (gid: number, uid: number) => request<ServerPreview>('GET', `${U(gid, uid)}/settlement/preview`),
  settle: (gid: number, uid: number, inputRevision: number, inputHash: string) =>
    request<ServerGathering>('POST', `${U(gid, uid)}/settlement`, { inputRevision, inputHash }),
  revertSettlement: (gid: number, uid: number) => request<unknown>('DELETE', `${U(gid, uid)}/settlement`),
  markViewed: (gid: number, uid: number) => request<unknown>('POST', `${U(gid, uid)}/settlement/viewed`),

  // 송금 — 송금자·수취인만
  sent: (tid: number) => request<unknown>('POST', `/api/v1/transfers/${tid}/sent`),
  confirm: (tid: number) => request<unknown>('POST', `/api/v1/transfers/${tid}/confirm`),
  notReceived: (tid: number) => request<unknown>('POST', `/api/v1/transfers/${tid}/not-received`),

  // 알림
  notifications: () => request<ServerNotification[]>('GET', '/api/v1/me/notifications'),
  readNotification: (id: number) => request<unknown>('POST', `/api/v1/me/notifications/${id}/read`),
  readAllNotifications: () => request<unknown>('POST', '/api/v1/me/notifications/read-all'),
}

// ── 서버 응답 → 프론트 모델 ────────────────────────────

/**
 * 서버의 내 정보를 화면 모델로. 실명이 아직 없으면 화면은 이름을 쓰지 않는다(L2가 먼저 뜬다) — 빈 문자열로 둔다.
 * 스푼·계좌는 이 응답에 아직 없어서(FC-014 §9 이후) 이전 값을 이어 쓴다.
 */
export function toUser(m: MeResponse, prev?: User): User {
  return {
    id: m.id,
    displayName: m.displayName ?? '',
    nickname: m.nickname,
    needsName: m.needsName,
    spoonCount: m.spoonCount ?? (prev?.id === m.id ? prev.spoonCount : 0),
    payout: m.payout !== undefined ? (m.payout ?? undefined) : prev?.id === m.id ? prev.payout : undefined,
  }
}

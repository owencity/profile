/**
 * v3 백엔드 호출 — 계약은 `jungsan_attack` `docs/API.md`(v4~)와 `docs/flow-changes/2026-10-04-v3-api-contract.md`(FC-014).
 *
 * `VITE_JEONGSAN_API_BASE_URL`이 비어 있으면 **목데이터 모드**다(지금 배포도 그렇다). 화면은 `gateway.ts`를 통해
 * 부르고, 거기서 모드에 따라 목데이터 스토어나 이 파일을 고른다 — 화면 코드는 모드를 몰라도 된다.
 *
 * 인증은 httpOnly 쿠키(API.md §2.3)라 이 파일은 토큰을 다루지 않는다. 모든 요청에 `credentials: 'include'`.
 */
import type { User } from './model'

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
}

// ── 엔드포인트 ─────────────────────────────────────────

export const api = {
  /** 로그인 여부 + 내 정보. 401이면 로그아웃 상태 */
  me: () => request<MeResponse>('GET', '/api/v1/auth/me'),
  /** 실명 최초 등록(FC-013). 400 형식 오류 · 409 `DISPLAY_NAME_ALREADY_SET` */
  putDisplayName: (displayName: string) => request<MeResponse>('PUT', '/api/v1/users/me/display-name', { displayName }),
  /** 카카오 로그인 시작 주소. 로그인 뒤 돌아올 경로(FC-014 1-2) — `/jungsan/`으로 시작하는 것만 서버가 받는다 */
  kakaoLoginUrl: (returnTo?: string) =>
    `${BASE}/api/v1/auth/kakao/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
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
    spoonCount: prev?.id === m.id ? prev.spoonCount : 0,
    payout: prev?.id === m.id ? prev.payout : undefined,
  }
}

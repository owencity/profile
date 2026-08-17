/**
 * 백엔드 호출. `VITE_JEONGSAN_API_BASE_URL` 이 없으면 mock 으로 떨어진다.
 *
 * 24hours 백엔드(AWS)와 정산어택 백엔드(OCI)는 다른 호스트이므로
 * 기존 `VITE_API_BASE_URL` 과 분리해서 쓴다.
 */
import { mockGathering, mockSettlement, mockSummaries } from './mock'
import type { Gathering, GatheringSummary, Id, Settlement } from './types'

const BASE = (import.meta.env.VITE_JEONGSAN_API_BASE_URL as string | undefined) ?? ''

export const isMock = () => BASE === ''

type ApiEnvelope<T> = { data?: T } & Partial<T>

async function get<T>(path: string, fallback: T): Promise<T> {
  if (isMock()) return Promise.resolve(fallback)
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  const json = (await res.json()) as ApiEnvelope<T>
  return (json.data ?? json) as T
}

/** H0 — 내 모임 목록 */
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

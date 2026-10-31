import { ApiError, request } from './api'
import type { GatheringStatus, Payout, ResponseSource, ResponseType, TransferBasis, TransferStatus } from './model'
import type { ServerJoinPreview } from './serverModel'

export type GuestPreview = ServerJoinPreview & { gatheringId: number }
export type GuestMe = {
  gatheringId: number; title: string; participantId: number; displayName: string
  settlementUnits: { id: number; status: GatheringStatus; inputRevision: number; included: boolean }[]
  rounds: { id: number; settlementUnitId: number; seq: number; total: number }[]
  responses: { roundId: number; type: ResponseType; source: ResponseSource }[]
}
export type GuestMoney = {
  gatheringId: number; settlementUnitId: number; participantId: number; status: GatheringStatus
  isEstimate: boolean; available: boolean; errorCode: string | null; total: number | null; settledAt: string | null
  transfers: { id: number | null; toParticipantId: number; toDisplayName: string; amount: number
    status: TransferStatus | 'PREVIEW'; payout: Payout | null; basis: TransferBasis[] }[]
}
export type GuestAnswer = { roundId: number; type: ResponseType }

// 동시 초기화의 쿠키 덮어쓰기를 막는다. 토큰은 JS나 저장소에서 취급하지 않는다.
let initializing: Promise<void> | undefined
export function ensureGuestSession(): Promise<void> {
  if (!initializing) {
    initializing = request<void>('POST', '/api/v1/guest/session').finally(() => { initializing = undefined })
  }
  return initializing
}
const unitPath = (gatheringId: number, unitId: number) => `/api/v1/guest/gatherings/${gatheringId}/settlement-units/${unitId}`
export const guestApi = {
  preview: async (token: string): Promise<GuestPreview> => {
    const preview = await request<GuestPreview>('GET', `/api/v1/join/${encodeURIComponent(token)}`)
    if (!Number.isSafeInteger(preview.gatheringId)) throw new ApiError(503, 'GUEST_UNAVAILABLE', '간편 참여를 준비 중이에요. 총무에게 알려주세요')
    return preview
  },
  me: (gatheringId: number) => request<GuestMe>('GET', `/api/v1/guest/gatherings/${gatheringId}/me`),
  join: (token: string, displayName: string, settlementUnitId: number, responses: GuestAnswer[]) =>
    request<GuestMe>('POST', `/api/v1/guest/join/${encodeURIComponent(token)}`, { displayName, settlementUnitId, responses }),
  respond: (gatheringId: number, unitId: number, answers: GuestAnswer[]) =>
    request<void>('PUT', `${unitPath(gatheringId, unitId)}/responses/me`, { answers }),
  money: (gatheringId: number, unitId: number) => request<GuestMoney>('GET', `${unitPath(gatheringId, unitId)}/settlement`),
  sent: (transferId: number) => request<void>('POST', `/api/v1/guest/transfers/${transferId}/sent`),
}

export function guestError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return '이 브라우저의 참여 정보가 만료되었어요. 기존 참여 내역은 총무에게 확인해주세요. 이름만으로 복구할 수는 없어요.'
    if (error.code === 'NOT_SETTLEMENT_UNIT_MEMBER') return '이 정산의 참여 대상에서 제외되었어요. 총무에게 확인해주세요.'
    if (error.code === 'SETTLEMENT_UNIT_NOT_OPEN') return '이미 정산이 시작되었어요. 새로고침해서 금액을 확인해주세요.'
    return error.message
  }
  return '연결을 확인하고 다시 시도해주세요.'
}

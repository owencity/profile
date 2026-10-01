/**
 * 정산어택 v3 프론트 데이터 모델 — `docs/SCREENS.md` §8. 앱(`jungsan_app`)도 같은 모양을 쓴다.
 *
 * ⚠ **1인당 금액은 프론트가 계산하지 않는다.** 송금 금액(`Transfer.amount`)과 근거는 서버가 준다.
 * 목데이터 단계에선 고정값을 쓴다. 계산은 백엔드 `core`만 한다.
 */

export type Id = number
export type Money = number

export type GatheringStatus = 'OPEN' | 'SETTLING' | 'COMPLETED'
export type ResponseType = 'ABSENT' | 'SOBER' | 'DRANK' | 'EXEMPT'
/** SELF 본인 · AUTO 정산 때 자동응답 · HOST 총무가 면제 지정 */
export type ResponseSource = 'SELF' | 'AUTO' | 'HOST'
export type TransferStatus = 'WAITING' | 'SENT' | 'CONFIRMED'

export type Payout = { bank: string; accountNo: string; holder: string }

export type User = {
  id: Id
  displayName: string
  spoonCount: number
  payout?: Payout
}

export type Participant = {
  id: Id
  userId: Id
  displayName: string
  spoonCount: number
  /** 결제자일 때 받을 계좌. 없으면 "계좌 등록을 기다리는 중" */
  payout?: Payout
}

export type DrinkItem = { name: string; unitPrice: Money; quantity: number }

export type Round = {
  id: Id
  seq: number
  label: string
  total: Money
  payerParticipantId: Id
  drinks: DrinkItem[]
}

export type RoundResponse = {
  participantId: Id
  roundId: Id
  type: ResponseType
  source: ResponseSource
}

export type Transfer = {
  id: Id
  fromParticipantId: Id
  toParticipantId: Id
  amount: Money
  status: TransferStatus
  /** 한 번이라도 [보냈어요]가 눌리면 채워지고 지워지지 않는다 — 정산 되돌리기 가능 여부 판단용 */
  sentAt?: string
  confirmedAt?: string
  /** 마지막 [아직 안 들어왔어요] 시각 */
  notReceivedAt?: string
  /** 금액 근거 — 차수별로 얼마인지(P3 "근거 펼치기"). 서버가 준다 */
  basis?: TransferBasis[]
}

export type TransferBasis = { roundId: Id; type: ResponseType; amount: Money }

export type TimelineEntry = {
  id: Id
  type: 'MESSAGE' | 'SYSTEM' | 'SPOON'
  authorParticipantId?: Id
  body: string
  createdAt: string
}

export type Gathering = {
  id: Id
  title: string
  date: string
  hostUserId: Id
  status: GatheringStatus
  shareToken: string
  inputRevision: number
  completedAt?: string
  participants: Participant[]
  rounds: Round[]
  responses: RoundResponse[]
  /** 정산 전에는 비어 있다 */
  transfers: Transfer[]
  timeline: TimelineEntry[]
  /** 이 술자리에서 총무에게 스푼을 준 참여자 id */
  spoonGivers: Id[]
}

// ── 조회 도우미 ─────────────────────────────────

export const hostOf = (g: Gathering) => g.participants.find((p) => p.userId === g.hostUserId)!

export const participantOfUser = (g: Gathering, userId: Id) => g.participants.find((p) => p.userId === userId)

export const nameOf = (g: Gathering, participantId: Id) =>
  g.participants.find((p) => p.id === participantId)?.displayName ?? '알 수 없음'

export const responseOf = (g: Gathering, participantId: Id, roundId: Id) =>
  g.responses.find((r) => r.participantId === participantId && r.roundId === roundId)

/** 모든 차수에 응답이 있는가 */
export const hasResponded = (g: Gathering, participantId: Id) =>
  g.rounds.length > 0 && g.rounds.every((r) => responseOf(g, participantId, r.id))

export const unrespondedParticipants = (g: Gathering) => g.participants.filter((p) => !hasResponded(g, p.id))

/** 이 참여자가 결제자인 차수 */
export const roundsPaidBy = (g: Gathering, participantId: Id) =>
  g.rounds.filter((r) => r.payerParticipantId === participantId)

/** 아무도 [보냈어요]·[확인]을 누른 적 없으면 정산 되돌리기가 가능하다 — `DOMAIN_DB_DESIGN_V2.md` §5.2 */
export const canUndoSettle = (g: Gathering) =>
  g.status === 'SETTLING' && g.transfers.every((t) => !t.sentAt && !t.confirmedAt)

/** 완료 후 삭제까지 남은 날 (7일 규칙) */
export function daysUntilDelete(g: Gathering, now = new Date()): number | null {
  if (g.status !== 'COMPLETED' || !g.completedAt) return null
  const deleteAt = new Date(g.completedAt).getTime() + 7 * 24 * 3600 * 1000
  return Math.max(0, Math.ceil((deleteAt - now.getTime()) / (24 * 3600 * 1000)))
}

export const won = (n: Money) => `${n.toLocaleString('ko-KR')}원`

/** 응답 버튼·근거에 쓰는 이름. EXEMPT는 버튼이 아니라 총무 지정 표시로만 나온다 */
export const RESPONSE_LABEL: Record<ResponseType, string> = {
  ABSENT: '불참', SOBER: '논알코올', DRANK: '알코올', EXEMPT: '면제',
}

/** 참여자가 직접 고를 수 있는 응답 — 순서가 곧 버튼 순서 */
export const SELF_CHOICES: ResponseType[] = ['ABSENT', 'SOBER', 'DRANK']

/** 총무가 면제로 지정한 칸 — 참여자는 바꿀 수 없다 */
export const isLockedByHost = (r?: RoundResponse) => r?.type === 'EXEMPT' && r.source === 'HOST'

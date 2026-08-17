/**
 * 정산어택 도메인 타입 — 백엔드 응답 형태를 그대로 옮긴 것.
 *
 * ⚠ **프론트는 금액을 계산하지 않는다.**
 * 계산 엔진(Kotlin `core` 모듈)이 유일한 계산 주체이고, 프론트는 [Settlement]을 받아 그린다.
 * 여기서 다시 계산하면 서버와 프론트가 다른 금액을 내보내는 사고가 난다.
 * `docs/ADR/005-no-stored-settlement.md` 참조.
 */

export type Money = number
export type Id = number

export type PaymentStatus = 'NONE' | 'SENT' | 'RECEIVED'
export type GatheringStatus = 'COLLECTING' | 'CONFIRMED'
export type Provider = 'kakao' | 'google'

export type Payout = {
  bankName: string
  accountNo: string
  accountHolder: string
}

export type Participant = {
  id: Id
  /** 참여자가 직접 적은 이름. 계정 닉네임은 기본값일 뿐이다. */
  name: string
  exempt: boolean
  responded: boolean
  paymentStatus: PaymentStatus
  /** SENT/RECEIVED 로 표시된 시점의 부담액. 차액 계산 근거. */
  paidAmount: Money | null
  isHost: boolean
  provider: Provider
  profileImage?: string
  /** 결제자로 지정된 사람이 직접 등록한다. 미등록이면 undefined. */
  payout?: Payout
}

export type DrinkItem = {
  name: string
  bottleCount: number
  unitPrice: Money
}

export type Round = {
  id: Id
  seq: number
  label: string
  total: Money
  /** DrinkItem 이 있으면 그 합계로 덮어써진 값이다. */
  alcohol: Money
  payerId: Id
  drinkItems?: DrinkItem[]
}

export type ExtraItem = {
  id: Id
  label: string
  amount: Money
  payerId: Id
  bearerIds: Id[]
}

export type Attendance = { attended: boolean; drank: boolean }

/** `"participantId:roundId"` 키. */
export type AttendanceMap = Record<string, Attendance>

export const attKey = (participantId: Id, roundId: Id) => `${participantId}:${roundId}`

export type Gathering = {
  id: Id
  name: string
  /** ISO date (YYYY-MM-DD) */
  date: string
  status: GatheringStatus
  shareToken: string
  /** 본인 포함 예상 인원. 확정 전 인원 불일치 경고에만 쓰고 계산에는 쓰지 않는다. */
  expectedCount: number | null
  roundingUnit: number
  revision: number
  hostParticipantId: Id
  participants: Participant[]
  rounds: Round[]
  extras: ExtraItem[]
  attendance: AttendanceMap
}

// ── 계산 결과 (백엔드가 준다) ──────────────────────────────

export type RoundBreakdown = {
  roundId: Id
  seq: number
  label: string
  attended: boolean
  drank: boolean
  foodTotal: Money
  attendeeCount: number
  alcoholTotal: Money
  drinkerCount: number
  /** 원 단위로 반올림한 표시용 금액. 세로합이 맞도록 서버가 계산해 내려준다. */
  amount: Money
}

export type ExtraBreakdown = {
  extraId: Id
  label: string
  amount: Money
  bearerCount: number
  /** 이 사람이 부담자인가. 결제만 하고 부담하지 않는 경우가 있다. */
  bears: boolean
  /** 부담하지 않으면 0. */
  share: Money
}

export type ParticipantBreakdown = {
  participantId: Id
  name: string
  isExempt: boolean
  isMainPayer: boolean
  rounds: RoundBreakdown[]
  extras: ExtraBreakdown[]
  /** 최종금액 − 표시된 항목들의 합. 0이면 화면에서 행을 숨긴다. */
  roundingAdjustment: Money
  /** 내가 내야 할 몫. */
  finalAmount: Money
  /** 내가 결제한 총액. */
  paidTotal: Money
  /** paidTotal − finalAmount. 양수면 받을 돈, 음수면 보낼 돈. */
  netAmount: Money
}

export type Transfer = { fromId: Id; toId: Id; amount: Money }

export type Settlement = {
  mainPayerId: Id
  grandTotal: Money
  amounts: Record<Id, Money>
  breakdown: Record<Id, ParticipantBreakdown>
  transfers: Transfer[]
  appliedRoundingUnit: number
  /** 100원을 골랐지만 대표결제자가 음수가 되어 10원으로 강등된 경우. */
  roundingUnitDowngraded: boolean
  /** 미리보기와 수락 사이의 경합을 막는 지문. ADR-004. */
  inputHash: string
}

/** H0 목록용 요약. */
export type GatheringSummary = {
  id: Id
  name: string
  date: string
  status: GatheringStatus
  grandTotal: Money
  participantCount: number
  expectedCount: number | null
  respondedCount: number
  /** 확정 후에만 의미 있다. */
  paidCount: number
  payableCount: number
}

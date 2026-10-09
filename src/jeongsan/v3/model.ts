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
  /** 카카오 닉네임. 목록에서 `이름(닉네임)`으로 같이 보여 누군지 알아보게 한다. 사용자가 입력하지 않는다 */
  nickname?: string
  /** 첫 로그인이라 실명을 아직 받지 않았다(L2). 한 번 받으면 바뀌지 않는다 */
  needsName?: boolean
}

export type Participant = {
  id: Id
  userId: Id
  displayName: string
  nickname?: string
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
  /** 정산방 id. API 모드에서는 서버의 **정산 단위 id**다(`serverModel.ts`) */
  id: Id
  /** 서버의 술자리 id — 한 술자리에 총무별 정산 단위(정산방)가 여럿일 수 있다. 목데이터는 id 와 같거나 비어 있다 */
  gatheringId?: Id
  /**
   * 총무가 넣은 인원(총무 포함, FC-020). 이만큼 들어와 모두 응답하면 자동으로 정산된다.
   * 없으면(옛 술자리·아직 안 넣음) 총무가 [지금 계산하기]로 정산한다
   */
  headcount?: number
  /** 이 정산방의 첫 차수 번호(목데이터) — 다음 차 총무의 정산방은 술자리 전체 번호를 이어받는다. 없으면 1 */
  firstSeq?: number
  /** 다음에 넣을 차수 번호(API 모드) — 서버는 술자리 전체에서 번호를 매긴다. 없으면 이 정산방 차수로 센다 */
  nextSeq?: number
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

/**
 * 앱 안 알림(N1). 실제 서비스에선 서버가 만들고 푸시(FCM)도 같이 보낸다 — 목데이터 단계에선
 * 스토어가 상태 전이 때 만든다.
 */
export type AppNotification = {
  id: Id
  userId: Id
  roomId: Id
  title: string
  body: string
  /** 누르면 갈 곳 */
  link: string
  createdAt: string
  read: boolean
}

// ── 조회 도우미 ─────────────────────────────────

/** 새로 넣을 차수의 이름(R2) — 다음 차 총무의 정산방은 술자리 전체 번호를 이어받는다("4차 넣기") */
export const nextRoundLabel = (g: Gathering) =>
  `${g.nextSeq ?? (g.rounds.length > 0 ? Math.max(...g.rounds.map((r) => r.seq)) : (g.firstSeq ?? 1) - 1) + 1}차`

export const hostOf = (g: Gathering) => g.participants.find((p) => p.userId === g.hostUserId)!

export const participantOfUser = (g: Gathering, userId: Id) => g.participants.find((p) => p.userId === userId)

/**
 * 목록용 이름 — `김동규(동규짱)`. 참여자 줄·관리 시트·정산 확인처럼 "누구인지 알아보는" 곳에 쓴다.
 * 타임라인·알림 같은 문장에는 이름만 쓴다(괄호까지 붙으면 한 줄을 넘는다).
 */
export const nameWithNick = (p: { displayName: string; nickname?: string }) =>
  p.nickname && p.nickname !== p.displayName ? `${p.displayName}(${p.nickname})` : p.displayName

/** 아바타 한 글자 — 한글 세 글자 실명은 이름 첫 글자(김동규 → 동). 성으로 하면 김씨가 여럿일 때 구분이 안 된다 */
export const initialOf = (name: string) => {
  const c = [...name]
  return c.length === 3 && /^[가-힣]+$/.test(name) ? c[1] : (c[0] ?? '')
}

export const nameOf = (g: Gathering, participantId: Id) =>
  g.participants.find((p) => p.id === participantId)?.displayName ?? '알 수 없음'

export const responseOf = (g: Gathering, participantId: Id, roundId: Id) =>
  g.responses.find((r) => r.participantId === participantId && r.roundId === roundId)

/** 모든 차수에 응답이 있는가 */
export const hasResponded = (g: Gathering, participantId: Id) =>
  g.rounds.length > 0 && g.rounds.every((r) => responseOf(g, participantId, r.id))

export const unrespondedParticipants = (g: Gathering) => g.participants.filter((p) => !hasResponded(g, p.id))

/** 모든 차수에 응답을 마친 사람 수 — R1 "5명 중 3명 응답" */
export const respondedCount = (g: Gathering) => g.participants.filter((p) => hasResponded(g, p.id)).length

/**
 * 자동 정산 조건(FC-020) — 총무가 넣은 인원만큼 들어와 모두가 모든 차수에 응답했다. 서버 판정과 같은 규칙.
 * 인원보다 더 들어온 건 막지 않는다(≥).
 */
export const allIn = (g: Gathering) =>
  g.status === 'OPEN' && g.headcount !== undefined && g.rounds.length > 0 &&
  g.participants.length >= g.headcount && g.participants.every((p) => hasResponded(g, p.id))

/** 인원 입력 범위(FC-020) — 서버 검증과 같다 */
export const HEADCOUNT_MIN = 2
export const HEADCOUNT_MAX = 50

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

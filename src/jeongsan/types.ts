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

/* ── 모임(Group) ───────────────────────────────
   ⚠ 용어 주의: **모임 = Group · 술자리 = Gathering** 이다.
   모임 하나가 술자리 여러 개를 담는다. 번개(FLASH)만 예외로 딱 하나를 담는다. */

/** 번개(1회성) / 주기(계속 만나는 고정 멤버). `API.md` §3-b */
export type GroupType = 'FLASH' | 'RECURRING'

/** 모임에서 내 역할. 총무(OWNER)와 참여자(MEMBER)를 화면에서 갈라 보여준다. */
export type GroupRole = 'OWNER' | 'MEMBER'

/** 로그인한 사용자. `GET /api/v1/auth/me` — 토큰에는 id 만 담기고 나머지는 DB 에서 온다. */
export type Me = {
  id: Id
  nickname: string
  profileImageUrl: string | null
}

/** H0 목록용 모임 요약. `GET /api/v1/groups` */
export type GroupSummary = {
  id: Id
  name: string
  groupType: GroupType
  role: GroupRole
  /** 총무 닉네임. 참여 중인 모임에서 누가 총무인지 보여준다. */
  ownerName: string
  memberCount: number
  gatheringCount: number
}

export type GroupMember = {
  userId: Id
  nickname: string
  role: GroupRole
}

/** 모임 안의 술자리 한 줄. */
export type GroupGathering = {
  id: Id
  name: string
  date: string
  status: GatheringStatus
}

/** 모임 상세. `GET /api/v1/groups/{id}` */
export type GroupDetail = {
  id: Id
  name: string
  groupType: GroupType
  shareToken: string | null
  /**
   * 참가 비밀번호가 걸려 있나. **비밀번호 자체는 절대 내려보내지 않는다** —
   * 링크는 단톡방에 뿌려지는 순간 아무나 보고, 검색은 이름만 알면 누구나 찾는다.
   * 확인은 서버가 한다.
   */
  hasPassword: boolean
  members: GroupMember[]
  gatherings: GroupGathering[]
}

export type Payout = {
  bankName: string
  accountNo: string
  accountHolder: string
}

export type Participant = {
  id: Id
  /** 로그인 계정. 목업에선 모임 멤버의 userId 와 맞춘다. */
  userId: Id
  /** 참여자가 직접 적은 이름. 계정 닉네임은 기본값일 뿐이다. */
  name: string
  /**
   * 어떻게 들어왔나. **총무가 명단을 짜지 않는다** — 참여자가 술자리를 열어
   * 스스로 정산에 참여한다(SELF). 총무가 굳이 고를 이유가 없고,
   * 고르게 하면 빠뜨린 사람이 생긴다.
   */
  joinMode: JoinMode
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
  /** 이 술자리를 담은 모임. 모임 없이 열린 술자리면 null. */
  groupId: Id | null
  /**
   * **이 술자리의 총무.** 모임 개설자와 다를 수 있다 —
   * 이번엔 내가 계산하고 다음엔 네가 계산하는 게 실제 모습이다.
   */
  hostUserId: Id
  hostName: string
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

/* ══ 모임 참가 ═══════════════════════════════════════════════
   참가 방법이 둘이다 — **검색해서** 들어오거나, **링크를 받아** 들어온다.
   둘 다 비밀번호를 묻는다. 링크는 단톡방에 뿌려지는 순간 아무나 볼 수 있고,
   검색은 이름만 알면 누구나 찾을 수 있기 때문이다. */

/** 검색 결과 한 줄. 참가 전이라 멤버 명단은 안 보여준다. */
export type GroupSearchResult = {
  id: Id
  name: string
  groupType: GroupType
  ownerName: string
  memberCount: number
  /** 마지막 술자리 날짜. 죽은 모임인지 가늠하는 단서. */
  lastGatheringDate: string | null
}

/* ══ 술자리 총무 ═════════════════════════════════════════════
   **총무는 모임이 아니라 술자리마다 정해진다.** 이번엔 내가 계산하고
   다음엔 네가 계산하는 게 실제 모습이라, 모임 개설자에 총무를 묶으면 안 맞는다. */

/** 술자리 참여 방식. 총무가 명단을 짜지 않고 **각자 들어온다**. */
export type JoinMode = 'SELF' | 'INVITED'

/* ══ 이의제기 ════════════════════════════════════════════════
   참여자가 착각하거나 양심 없이 고를 수 있어서 총무가 걸 수 있고,
   반대로 총무가 금액을 잘못 매겼을 수 있어서 참여자도 걸 수 있다.
   **한쪽만 걸 수 있으면 힘의 균형이 무너진다.** */

export type DisputeKind =
  /** 총무 → 참여자. "1차 왔다면서 안 왔잖아" */
  | 'ATTENDANCE'
  /** 총무 → 참여자. 입금이 안 됐거나 금액이 모자람 */
  | 'PAYMENT'
  /** 참여자 → 총무. 나한테 매긴 금액이 이상하다 */
  | 'AMOUNT'

export type DisputeStatus = 'OPEN' | 'RESOLVED' | 'WITHDRAWN'

export type Dispute = {
  id: Id
  gatheringId: Id
  kind: DisputeKind
  status: DisputeStatus
  /** 건 사람 */
  raisedBy: Id
  /** 걸린 사람 */
  against: Id
  reason: string
  createdAt: string
  /** 이의제기 하나에 채팅방 하나. 조율은 여기서 한다. */
  messages: ChatMessage[]
}

export type ChatMessage = {
  id: Id
  senderId: Id
  senderName: string
  text: string
  createdAt: string
}

/* ══ 알림 ════════════════════════════════════════════════════
   **정산은 금액이 나왔다고 끝이 아니라 입금까지 돼야 끝난다.**
   그래서 알림이 두 번 이상 간다 — 금액 확정 때 한 번, 입금이 밀리면 또 한 번. */

export type NotificationKind =
  | 'GATHERING_OPENED'   // 모임에 새 술자리가 열림
  | 'CHECK_REQUEST'      // 차수 체크해 달라
  | 'SETTLED'            // 금액이 확정됐다
  | 'PAYMENT_REMINDER'   // 아직 입금 안 했다
  | 'DISPUTE_OPENED'     // 이의제기가 걸렸다
  | 'DISPUTE_MESSAGE'    // 이의제기 채팅에 새 글
  | 'PAYMENT_RECEIVED'   // 입금이 확인됐다

export type AppNotification = {
  id: Id
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
  /** 눌렀을 때 갈 곳. */
  link: string
}

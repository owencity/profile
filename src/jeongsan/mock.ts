/**
 * 백엔드가 없는 동안 쓰는 시나리오 데이터.
 *
 * ⚠ **금액은 여기서 계산하지 않고 하드코딩한다.**
 * 아래 숫자는 Kotlin 계산 엔진(`core`)과 참조 구현(`docs/reference_impl.py`)으로
 * 실제 계산해 검증한 값이다. 프론트에 계산을 흉내내는 코드를 넣으면
 * 서버와 다른 금액이 나오는 사고가 난다 — ADR-005.
 *
 * 시나리오
 *   5명 · 1차 137,000(술 48,000) 동규 결제 / 2차 62,000(술 44,000) 민지 결제
 *   택시비 21,000 재훈 결제 (수아·지원 부담)
 *   지원 1차 논알콜·2차 불참 · 수아 2차 불참
 *   → 합계 220,000원 · 대표결제자 동규
 */
import type {
  AppNotification,
  Dispute,
  Gathering,
  GatheringSummary,
  GroupDetail,
  GroupSearchResult,
  GroupSummary,
  Id,
  Participant,
  Settlement,
} from './types'
import { attKey } from './types'

const P = { 동규: 1, 민지: 2, 재훈: 3, 수아: 4, 지원: 5 } as const
const R = { '1차': 1, '2차': 2 } as const
const E = { 택시비: 101 } as const

const participants: Participant[] = [
  {
    id: P.동규, userId: P.동규, name: '동규', joinMode: 'INVITED',
    exempt: false, responded: true,
    paymentStatus: 'NONE', paidAmount: null, isHost: true, provider: 'kakao',
    payout: { bankName: '국민은행', accountNo: '123456-78-901234', accountHolder: '김동규' },
  },
  {
    id: P.민지, userId: P.민지, name: '민지', joinMode: 'INVITED',
    exempt: false, responded: true,
    paymentStatus: 'NONE', paidAmount: null, isHost: false, provider: 'kakao',
    payout: { bankName: '신한은행', accountNo: '110-234-567890', accountHolder: '박민지' },
  },
  {
    id: P.재훈, userId: P.재훈, name: '재훈', joinMode: 'SELF',
    exempt: false, responded: true,
    // 구글 로그인을 감춰둔 동안은 구글 참여자가 생길 수 없다. RosterPage 가
    // provider 를 "카카오 / 구글" 로 찍으므로 google 로 두면 없는 상태가 보인다.
    // 구글을 켜면 여기 하나를 google 로 되돌려 그 분기도 다시 확인할 것.
    paymentStatus: 'SENT', paidAmount: 29_470, isHost: false, provider: 'kakao',
    payout: { bankName: '카카오뱅크', accountNo: '3333-01-2345678', accountHolder: '이재훈' },
  },
  {
    id: P.수아, userId: P.수아, name: '수아', joinMode: 'INVITED',
    exempt: false, responded: true,
    paymentStatus: 'RECEIVED', paidAmount: 40_300, isHost: false, provider: 'kakao',
  },
  {
    id: P.지원, userId: P.지원, name: '지원', joinMode: 'SELF',
    exempt: false, responded: true,
    paymentStatus: 'NONE', paidAmount: null, isHost: false, provider: 'kakao',
  },
]

const attendance = (() => {
  const m: Gathering['attendance'] = {}
  const set = (p: Id, r: Id, attended: boolean, drank: boolean) => {
    m[attKey(p, r)] = { attended, drank }
  }
  // 1차 — 전원 참석, 지원만 논알콜
  set(P.동규, R['1차'], true, true)
  set(P.민지, R['1차'], true, true)
  set(P.재훈, R['1차'], true, true)
  set(P.수아, R['1차'], true, true)
  set(P.지원, R['1차'], true, false)
  // 2차 — 동규·민지·재훈만
  set(P.동규, R['2차'], true, true)
  set(P.민지, R['2차'], true, true)
  set(P.재훈, R['2차'], true, true)
  set(P.수아, R['2차'], false, false)
  set(P.지원, R['2차'], false, false)
  return m
})()

export const mockGathering: Gathering = {
  id: 1,
  name: '8월 팀 회식',
  date: '2026-08-14',
  status: 'CONFIRMED',
  groupId: 100,
  // 이 술자리의 총무는 동규다. 아래 mockGatherings 를 보면 **자리마다 총무가 다르다** —
  // 모임 개설자에 총무를 묶지 않는다는 걸 목데이터로 먼저 보여준다.
  hostUserId: P.동규,
  hostName: '동규',
  shareToken: 'k3f9dq2',
  expectedCount: 5,
  roundingUnit: 10,
  revision: 1,
  hostParticipantId: P.동규,
  participants,
  rounds: [
    { id: R['1차'], seq: 1, label: '1차 · 삼겹살집', total: 137_000, alcohol: 48_000, payerId: P.동규 },
    {
      id: R['2차'], seq: 2, label: '2차 · 호프집', total: 62_000, alcohol: 44_000, payerId: P.민지,
      drinkItems: [
        { name: '소주', bottleCount: 4, unitPrice: 5_000 },
        { name: '맥주', bottleCount: 4, unitPrice: 6_000 },
      ],
    },
  ],
  extras: [
    { id: E.택시비, label: '택시비', amount: 21_000, payerId: P.재훈, bearerIds: [P.수아, P.지원] },
  ],
  attendance,
}

/**
 * 검증된 계산 결과. 1차 안주 89,000÷5=17,800 · 술 48,000÷4=12,000 /
 * 2차 안주 18,000÷3=6,000 · 술 44,000÷3=14,666.67(표시 14,667) / 택시 21,000÷2=10,500
 */
export const mockSettlement: Settlement = {
  mainPayerId: P.동규,
  grandTotal: 220_000,
  amounts: {
    [P.동규]: 50_460, [P.민지]: 50_470, [P.재훈]: 50_470,
    [P.수아]: 40_300, [P.지원]: 28_300,
  },
  appliedRoundingUnit: 10,
  roundingUnitDowngraded: false,
  inputHash: 'a3f2c81e',
  transfers: [
    { fromId: P.수아, toId: P.동규, amount: 40_300 },
    { fromId: P.재훈, toId: P.동규, amount: 29_470 },
    { fromId: P.지원, toId: P.동규, amount: 16_770 },
    { fromId: P.지원, toId: P.민지, amount: 11_530 },
  ],
  breakdown: {
    [P.동규]: {
      participantId: P.동규, name: '동규', isExempt: false, isMainPayer: true,
      rounds: [
        { roundId: 1, seq: 1, label: '1차 · 삼겹살집', attended: true, drank: true,
          foodTotal: 89_000, attendeeCount: 5, alcoholTotal: 48_000, drinkerCount: 4, amount: 29_800 },
        { roundId: 2, seq: 2, label: '2차 · 호프집', attended: true, drank: true,
          foodTotal: 18_000, attendeeCount: 3, alcoholTotal: 44_000, drinkerCount: 3, amount: 20_667 },
      ],
      extras: [{ extraId: E.택시비, label: '택시비', amount: 21_000, bearerCount: 2, bears: false, share: 0 }],
      roundingAdjustment: -7, finalAmount: 50_460, paidTotal: 137_000, netAmount: 86_540,
    },
    [P.민지]: {
      participantId: P.민지, name: '민지', isExempt: false, isMainPayer: false,
      rounds: [
        { roundId: 1, seq: 1, label: '1차 · 삼겹살집', attended: true, drank: true,
          foodTotal: 89_000, attendeeCount: 5, alcoholTotal: 48_000, drinkerCount: 4, amount: 29_800 },
        { roundId: 2, seq: 2, label: '2차 · 호프집', attended: true, drank: true,
          foodTotal: 18_000, attendeeCount: 3, alcoholTotal: 44_000, drinkerCount: 3, amount: 20_667 },
      ],
      extras: [{ extraId: E.택시비, label: '택시비', amount: 21_000, bearerCount: 2, bears: false, share: 0 }],
      roundingAdjustment: 3, finalAmount: 50_470, paidTotal: 62_000, netAmount: 11_530,
    },
    [P.재훈]: {
      participantId: P.재훈, name: '재훈', isExempt: false, isMainPayer: false,
      rounds: [
        { roundId: 1, seq: 1, label: '1차 · 삼겹살집', attended: true, drank: true,
          foodTotal: 89_000, attendeeCount: 5, alcoholTotal: 48_000, drinkerCount: 4, amount: 29_800 },
        { roundId: 2, seq: 2, label: '2차 · 호프집', attended: true, drank: true,
          foodTotal: 18_000, attendeeCount: 3, alcoholTotal: 44_000, drinkerCount: 3, amount: 20_667 },
      ],
      // 재훈은 택시비를 결제했지만 부담자가 아니다 — 0원 행으로 드러낸다
      extras: [{ extraId: E.택시비, label: '택시비', amount: 21_000, bearerCount: 2, bears: false, share: 0 }],
      roundingAdjustment: 3, finalAmount: 50_470, paidTotal: 21_000, netAmount: -29_470,
    },
    [P.수아]: {
      participantId: P.수아, name: '수아', isExempt: false, isMainPayer: false,
      rounds: [
        { roundId: 1, seq: 1, label: '1차 · 삼겹살집', attended: true, drank: true,
          foodTotal: 89_000, attendeeCount: 5, alcoholTotal: 48_000, drinkerCount: 4, amount: 29_800 },
        { roundId: 2, seq: 2, label: '2차 · 호프집', attended: false, drank: false,
          foodTotal: 18_000, attendeeCount: 3, alcoholTotal: 44_000, drinkerCount: 3, amount: 0 },
      ],
      extras: [{ extraId: E.택시비, label: '택시비', amount: 21_000, bearerCount: 2, bears: true, share: 10_500 }],
      roundingAdjustment: 0, finalAmount: 40_300, paidTotal: 0, netAmount: -40_300,
    },
    [P.지원]: {
      participantId: P.지원, name: '지원', isExempt: false, isMainPayer: false,
      rounds: [
        { roundId: 1, seq: 1, label: '1차 · 삼겹살집', attended: true, drank: false,
          foodTotal: 89_000, attendeeCount: 5, alcoholTotal: 48_000, drinkerCount: 4, amount: 17_800 },
        { roundId: 2, seq: 2, label: '2차 · 호프집', attended: false, drank: false,
          foodTotal: 18_000, attendeeCount: 3, alcoholTotal: 44_000, drinkerCount: 3, amount: 0 },
      ],
      extras: [{ extraId: E.택시비, label: '택시비', amount: 21_000, bearerCount: 2, bears: true, share: 10_500 }],
      roundingAdjustment: 0, finalAmount: 28_300, paidTotal: 0, netAmount: -28_300,
    },
  },
}

export const mockSummaries: GatheringSummary[] = [
  {
    id: 1, name: '8월 팀 회식', date: '2026-08-14', status: 'CONFIRMED',
    grandTotal: 220_000, participantCount: 5, expectedCount: 5,
    respondedCount: 5, paidCount: 2, payableCount: 3,
  },
  {
    id: 2, name: '7월 환영회', date: '2026-07-22', status: 'CONFIRMED',
    grandTotal: 180_000, participantCount: 6, expectedCount: 6,
    respondedCount: 6, paidCount: 5, payableCount: 5,
  },
  {
    id: 3, name: '6월 번개', date: '2026-06-15', status: 'COLLECTING',
    grandTotal: 95_000, participantCount: 2, expectedCount: 4,
    respondedCount: 2, paidCount: 0, payableCount: 0,
  },
]

/**
 * H0 모임 목록 목업.
 *
 * 화면이 갈라 보여줄 두 경우를 **둘 다 넣는다** — 총무(OWNER)인 모임과
 * 참여자(MEMBER)로 들어가 있는 모임. 한 쪽만 있으면 구분이 되는지 알 수 없다.
 * 번개(FLASH)와 주기(RECURRING)도 마찬가지로 섞어둔다.
 */
export const mockGroups: GroupSummary[] = [
  {
    id: 100, name: '신림팸', groupType: 'RECURRING', role: 'OWNER', ownerName: '동규',
    memberCount: 5, gatheringCount: 3,
  },
  {
    id: 101, name: '8월 26일 번개', groupType: 'FLASH', role: 'OWNER', ownerName: '동규',
    memberCount: 4, gatheringCount: 1,
  },
  {
    id: 102, name: '대학 동기 모임', groupType: 'RECURRING', role: 'MEMBER', ownerName: '태현',
    memberCount: 8, gatheringCount: 12,
  },
  {
    id: 103, name: '수요일 번개', groupType: 'FLASH', role: 'MEMBER', ownerName: '해린',
    memberCount: 3, gatheringCount: 1,
  },
]

/**
 * 모임 상세 목업. **번개와 주기 둘 다** 넣는다 —
 * 번개는 술자리가 1개고 "새 술자리" 버튼이 없어야 하는데,
 * 주기 하나만 있으면 그 차이를 화면에서 확인할 수 없다.
 */
export const mockGroupDetails: Record<number, GroupDetail> = {
  100: {
    id: 100, name: '신림팸', groupType: 'RECURRING', shareToken: 'aB3xY9kL2mNp', hasPassword: true,
    members: [
      { userId: 1, nickname: '동규', role: 'OWNER' },
      { userId: 2, nickname: '민지', role: 'MEMBER' },
      { userId: 3, nickname: '재훈', role: 'MEMBER' },
      { userId: 4, nickname: '수아', role: 'MEMBER' },
      { userId: 5, nickname: '지원', role: 'MEMBER' },
    ],
    gatherings: [
      { id: 1, name: '8월 팀 회식', date: '2026-08-14', status: 'CONFIRMED' },
      { id: 2, name: '7월 환영회', date: '2026-07-22', status: 'CONFIRMED' },
      { id: 3, name: '6월 첫 모임', date: '2026-06-15', status: 'COLLECTING' },
    ],
  },
  101: {
    id: 101, name: '8월 26일 번개', groupType: 'FLASH', shareToken: 'kR7mQ2vXwZ1t', hasPassword: true,
    members: [
      { userId: 1, nickname: '동규', role: 'OWNER' },
      { userId: 3, nickname: '재훈', role: 'MEMBER' },
      { userId: 4, nickname: '수아', role: 'MEMBER' },
      { userId: 5, nickname: '지원', role: 'MEMBER' },
    ],
    gatherings: [{ id: 9, name: '8월 26일 번개', date: '2026-08-26', status: 'COLLECTING' }],
  },
  102: {
    id: 102, name: '대학 동기 모임', groupType: 'RECURRING', shareToken: null, hasPassword: false,
    members: [
      { userId: 7, nickname: '태현', role: 'OWNER' },
      { userId: 1, nickname: '동규', role: 'MEMBER' },
    ],
    gatherings: [{ id: 11, name: '연말 모임', date: '2026-12-20', status: 'COLLECTING' }],
  },
  103: {
    id: 103, name: '수요일 번개', groupType: 'FLASH', shareToken: null, hasPassword: false,
    members: [
      { userId: 8, nickname: '해린', role: 'OWNER' },
      { userId: 1, nickname: '동규', role: 'MEMBER' },
    ],
    gatherings: [{ id: 12, name: '수요일 번개', date: '2026-08-19', status: 'CONFIRMED' }],
  },
}

export const MOCK_IDS = P

/* ── 목업 팩토리 ──────────────────────────────────────────────
   백엔드가 없어도 **만든 것이 실제로 남아야** 흐름을 끝까지 걸어볼 수 있다.
   여기 함수들이 새 모임·술자리를 만들어 주고, JeongsanApp 이 그걸 상태에 넣는다.
   서버가 붙으면 이 자리를 POST 응답이 대신한다. */

/** 목업 id 발급기. 기존 데이터와 안 겹치게 넉넉히 띄운 값에서 시작한다. */
let seq = 900
const nextId = () => ++seq

/** 12자 공유 토큰. 서버의 ShareToken.generate() 와 모양만 맞춘다. */
export function makeToken(): string {
  const A = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 12 }, () => A[Math.floor(Math.random() * A.length)]).join('')
}

/** 방금 만든 술자리 — 아직 아무도 안 들어왔고 차수도 없다. */
export function makeGathering(v: {
  name: string
  date: string
  hostName: string
  expectedCount: number | null
  /** 어느 모임 안의 술자리인가. 모임 없이 열리면 생략. */
  groupId?: Id | null
  payout?: Participant['payout']
}): Gathering {
  const hostId = nextId()
  return {
    id: nextId(),
    name: v.name,
    date: v.date,
    status: 'COLLECTING',
    groupId: v.groupId ?? null,
    hostUserId: hostId,
    hostName: v.hostName,
    shareToken: makeToken(),
    expectedCount: v.expectedCount,
    roundingUnit: 10,
    revision: 1,
    hostParticipantId: hostId,
    // 총무 혼자 있는 상태에서 시작한다. 나머지는 링크로 들어온다.
    participants: [{
      id: hostId, userId: hostId, name: v.hostName, joinMode: 'INVITED',
      exempt: false, responded: true,
      paymentStatus: 'NONE', paidAmount: null, isHost: true, provider: 'kakao',
      payout: v.payout,
    }],
    rounds: [],
    extras: [],
    attendance: {},
  }
}

/** 방금 만든 모임. 번개면 술자리 1개가 같이 생긴다(FLASH 는 딱 하나). */
export function makeGroup(v: {
  name: string
  groupType: GroupSummary['groupType']
  ownerName: string
  gatheringDate?: string
  expectedCount?: number
  /** 참가 비밀번호. 목업이라 평문으로 두지만 **서버에서는 해시로만 저장한다.** */
  password?: string
}): { summary: GroupSummary; detail: GroupDetail; gathering: Gathering | null } {
  const id = nextId()
  const flash = v.groupType === 'FLASH'

  // 번개는 모임을 만드는 순간 술자리가 같이 만들어진다 — API.md §3-b.2 와 같은 규칙.
  const gathering = flash
    ? makeGathering({
        name: v.name,
        date: v.gatheringDate ?? new Date().toISOString().slice(0, 10),
        hostName: v.ownerName,
        expectedCount: v.expectedCount ?? null,
        groupId: id,
      })
    : null

  const detail: GroupDetail = {
    id,
    name: v.name,
    groupType: v.groupType,
    shareToken: makeToken(),
    hasPassword: Boolean(v.password),
    members: [{ userId: 1, nickname: v.ownerName, role: 'OWNER' }],
    gatherings: gathering
      ? [{ id: gathering.id, name: gathering.name, date: gathering.date, status: gathering.status }]
      : [],
  }

  const summary: GroupSummary = {
    id, name: v.name, groupType: v.groupType, role: 'OWNER', ownerName: v.ownerName,
    memberCount: 1,
    gatheringCount: gathering ? 1 : 0,
  }

  return { summary, detail, gathering }
}

/** 기존 목업 술자리들. 모임 상세의 술자리를 열면 **각자 다른 데이터**가 나와야 한다. */
export const mockGatherings: Record<number, Gathering> = {
  1: mockGathering,
  // **총무가 자리마다 다르다.** 신림팸(100)의 세 자리를 동규·민지·재훈이 나눠 맡는다 —
  // 모임 개설자는 동규 하나지만 총무는 돌아가며 한다.
  2: {
    ...mockGathering, id: 2, name: '7월 환영회', date: '2026-07-22',
    shareToken: 'p7q2ms4', groupId: 100, hostUserId: P.민지, hostName: '민지',
  },
  3: {
    ...mockGathering, id: 3, name: '6월 첫 모임', date: '2026-06-15',
    status: 'COLLECTING', shareToken: 'z9w1kt6',
    groupId: 100, hostUserId: P.재훈, hostName: '재훈',
  },
  9: {
    ...mockGathering, id: 9, name: '8월 26일 번개', date: '2026-08-26',
    status: 'COLLECTING', shareToken: 'kR7mQ2vXwZ1t',
    groupId: 101, hostUserId: P.동규, hostName: '동규',
  },
  11: {
    ...mockGathering, id: 11, name: '연말 모임', date: '2026-12-20',
    status: 'COLLECTING', shareToken: 'c4v8bn2',
    groupId: 102, hostUserId: 7, hostName: '태현',
  },
  12: {
    ...mockGathering, id: 12, name: '수요일 번개', date: '2026-08-19',
    shareToken: 'h5j3lp9', groupId: 103, hostUserId: 8, hostName: '해린',
  },
}

/* ══ 검색으로 찾는 모임 ══════════════════════════════════════
   내가 안 속한 모임들. 이름으로 찾아 비밀번호를 넣고 들어간다. */
export const mockSearchable: GroupSearchResult[] = [
  {
    id: 200, name: '신림 볼링 모임', groupType: 'RECURRING',
    ownerName: '준호', memberCount: 12, lastGatheringDate: '2026-08-21',
  },
  {
    id: 201, name: '신림동 맛집탐방', groupType: 'RECURRING',
    ownerName: '서연', memberCount: 6, lastGatheringDate: '2026-08-09',
  },
  {
    id: 202, name: '신림 러닝크루', groupType: 'RECURRING',
    ownerName: '민수', memberCount: 23, lastGatheringDate: null,
  },
  {
    id: 203, name: '금요일 한잔', groupType: 'FLASH',
    ownerName: '지훈', memberCount: 4, lastGatheringDate: '2026-08-28',
  },
]

/** 검색은 서버가 한다. 목업에선 이름 부분일치로 흉내만 낸다. */
export function searchGroups(q: string): GroupSearchResult[] {
  const k = q.trim()
  if (k.length < 2) return []   // 두 글자는 받아야 검색이 의미 있다
  return mockSearchable.filter((g) => g.name.includes(k))
}

/* ══ 이의제기 ════════════════════════════════════════════════ */
export const mockDisputes: Dispute[] = [
  {
    id: 500, gatheringId: 1, kind: 'ATTENDANCE', status: 'OPEN',
    raisedBy: P.동규, against: P.지원,
    reason: '2차 불참으로 찍혀 있는데, 호프집에서 같이 나온 것 같아서요. 확인 부탁해요.',
    createdAt: '2026-08-15T21:10:00+09:00',
    messages: [
      {
        id: 5001, senderId: P.동규, senderName: '동규',
        text: '지원아 2차 불참으로 돼 있는데 맞아? 나올 때 같이 나온 기억이 있어서',
        createdAt: '2026-08-15T21:10:00+09:00',
      },
      {
        id: 5002, senderId: P.지원, senderName: '지원',
        text: '아 맞다 2차 잠깐 있다가 먼저 갔어요. 술은 안 마셨고요',
        createdAt: '2026-08-15T21:14:00+09:00',
      },
      {
        id: 5003, senderId: P.동규, senderName: '동규',
        text: '그럼 2차 참석 + 논알콜로 고칠게. 금액 다시 뽑아서 알려줄게',
        createdAt: '2026-08-15T21:15:00+09:00',
      },
    ],
  },
  {
    id: 501, gatheringId: 1, kind: 'AMOUNT', status: 'OPEN',
    raisedBy: P.수아, against: P.동규,
    reason: '택시비가 저한테 붙어 있는데 저는 택시 안 탔어요.',
    createdAt: '2026-08-16T10:02:00+09:00',
    messages: [
      {
        id: 5011, senderId: P.수아, senderName: '수아',
        text: '택시비 21,000원 부담자에 제가 들어가 있는데 저는 지하철 탔어요',
        createdAt: '2026-08-16T10:02:00+09:00',
      },
    ],
  },
]

/* ══ 알림 ════════════════════════════════════════════════════
   **입금까지 끝나야 정산이 끝난다.** 그래서 금액 확정(SETTLED) 뒤에도
   PAYMENT_REMINDER 가 남아 있다. */
export const mockNotifications: AppNotification[] = [
  {
    id: 700, kind: 'PAYMENT_REMINDER',
    title: '아직 입금이 안 됐어요',
    body: '8월 팀 회식 · 29,470원 · 동규에게 보내면 됩니다',
    createdAt: '2026-08-17T09:00:00+09:00', read: false, link: '/jungsan/1/result',
  },
  {
    id: 701, kind: 'DISPUTE_MESSAGE',
    title: '이의제기에 답이 왔어요',
    body: '동규 · "그럼 2차 참석 + 논알콜로 고칠게"',
    createdAt: '2026-08-15T21:15:00+09:00', read: false, link: '/jungsan/dispute/500',
  },
  {
    id: 702, kind: 'SETTLED',
    title: '정산 금액이 나왔어요',
    body: '8월 팀 회식 · 총 220,000원 · 내 몫 29,470원',
    createdAt: '2026-08-15T20:40:00+09:00', read: true, link: '/jungsan/1/result',
  },
  {
    id: 703, kind: 'CHECK_REQUEST',
    title: '차수를 체크해 주세요',
    body: '6월 첫 모임 · 재훈이 정산을 시작했습니다',
    createdAt: '2026-08-14T23:30:00+09:00', read: true, link: '/g/z9w1kt6',
  },
  {
    id: 704, kind: 'GATHERING_OPENED',
    title: '새 술자리가 열렸어요',
    body: '신림팸 · 8월 26일 번개',
    createdAt: '2026-08-13T18:00:00+09:00', read: true, link: '/jungsan/group/101',
  },
]

let disputeSeq = 600
/** 이의제기를 건다. 거는 순간 채팅방이 하나 열린다. */
export function makeDispute(v: {
  gatheringId: Id
  kind: Dispute['kind']
  raisedBy: Id
  raisedByName: string
  against: Id
  reason: string
}): Dispute {
  const now = new Date().toISOString()
  return {
    id: ++disputeSeq,
    gatheringId: v.gatheringId,
    kind: v.kind,
    status: 'OPEN',
    raisedBy: v.raisedBy,
    against: v.against,
    reason: v.reason,
    createdAt: now,
    // 이의제기 사유가 곧 첫 메시지다. 따로 또 쓰게 하면 같은 말을 두 번 시킨다.
    messages: [{
      id: ++disputeSeq, senderId: v.raisedBy, senderName: v.raisedByName,
      text: v.reason, createdAt: now,
    }],
  }
}

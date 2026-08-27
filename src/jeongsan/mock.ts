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
  Gathering,
  GatheringSummary,
  GroupDetail,
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
    id: P.동규, name: '동규', exempt: false, responded: true,
    paymentStatus: 'NONE', paidAmount: null, isHost: true, provider: 'kakao',
    payout: { bankName: '국민은행', accountNo: '123456-78-901234', accountHolder: '김동규' },
  },
  {
    id: P.민지, name: '민지', exempt: false, responded: true,
    paymentStatus: 'NONE', paidAmount: null, isHost: false, provider: 'kakao',
    payout: { bankName: '신한은행', accountNo: '110-234-567890', accountHolder: '박민지' },
  },
  {
    id: P.재훈, name: '재훈', exempt: false, responded: true,
    // 구글 로그인을 감춰둔 동안은 구글 참여자가 생길 수 없다. RosterPage 가
    // provider 를 "카카오 / 구글" 로 찍으므로 google 로 두면 없는 상태가 보인다.
    // 구글을 켜면 여기 하나를 google 로 되돌려 그 분기도 다시 확인할 것.
    paymentStatus: 'SENT', paidAmount: 29_470, isHost: false, provider: 'kakao',
    payout: { bankName: '카카오뱅크', accountNo: '3333-01-2345678', accountHolder: '이재훈' },
  },
  {
    id: P.수아, name: '수아', exempt: false, responded: true,
    paymentStatus: 'RECEIVED', paidAmount: 40_300, isHost: false, provider: 'kakao',
  },
  {
    id: P.지원, name: '지원', exempt: false, responded: true,
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
    id: 100, name: '신림팸', groupType: 'RECURRING', shareToken: 'aB3xY9kL2mNp',
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
    id: 101, name: '8월 26일 번개', groupType: 'FLASH', shareToken: 'kR7mQ2vXwZ1t',
    members: [
      { userId: 1, nickname: '동규', role: 'OWNER' },
      { userId: 3, nickname: '재훈', role: 'MEMBER' },
      { userId: 4, nickname: '수아', role: 'MEMBER' },
      { userId: 5, nickname: '지원', role: 'MEMBER' },
    ],
    gatherings: [{ id: 9, name: '8월 26일 번개', date: '2026-08-26', status: 'COLLECTING' }],
  },
  102: {
    id: 102, name: '대학 동기 모임', groupType: 'RECURRING', shareToken: null,
    members: [
      { userId: 7, nickname: '태현', role: 'OWNER' },
      { userId: 1, nickname: '동규', role: 'MEMBER' },
    ],
    gatherings: [{ id: 11, name: '연말 모임', date: '2026-12-20', status: 'COLLECTING' }],
  },
  103: {
    id: 103, name: '수요일 번개', groupType: 'FLASH', shareToken: null,
    members: [
      { userId: 8, nickname: '해린', role: 'OWNER' },
      { userId: 1, nickname: '동규', role: 'MEMBER' },
    ],
    gatherings: [{ id: 12, name: '수요일 번개', date: '2026-08-19', status: 'CONFIRMED' }],
  },
}

export const MOCK_IDS = P

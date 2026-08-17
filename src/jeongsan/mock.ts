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
    paymentStatus: 'SENT', paidAmount: 29_470, isHost: false, provider: 'google',
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

export const MOCK_IDS = P

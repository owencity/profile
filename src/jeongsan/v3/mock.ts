/**
 * v3 목데이터 — 백엔드 v3 API가 나오기 전까지 화면을 돌리는 예시.
 * 세 술자리가 각각 다른 단계(응답 받는 중 / 송금 중 / 완료)라서 정산방의 "지금 할 일"이
 * 단계마다 어떻게 바뀌는지 한 번에 볼 수 있다. 금액은 서버 계산 결과를 흉내 낸 고정값이다.
 */
import type { Gathering, User } from './model'

/** 로그인한 나 — 프로 총무(1,280스푼) */
export const ME: User = {
  id: 1,
  displayName: '동규',
  spoonCount: 1_280,
  payout: { bank: '카카오뱅크', accountNo: '3333-01-2345678', holder: '김동규' },
}

const iso = (daysAgo: number, hh = 21, mm = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

/** ① 내가 총무, 응답 받는 중 — 두 명 미응답, 한 명은 2차 면제 */
const openRoom: Gathering = {
  id: 101, title: '9/28 술자리', date: iso(1), hostUserId: 1, status: 'OPEN',
  shareToken: 'k7Qx2', inputRevision: 7, participants: [
    { id: 11, userId: 1, displayName: '동규', spoonCount: 1_280, payout: ME.payout },
    { id: 12, userId: 2, displayName: '민지', spoonCount: 340 },
    { id: 13, userId: 3, displayName: '재훈', spoonCount: 12 },
    { id: 14, userId: 4, displayName: '지영', spoonCount: 0 },
    { id: 15, userId: 5, displayName: '민수', spoonCount: 57 },
  ],
  rounds: [
    { id: 1, seq: 1, label: '1차', total: 184_000, payerParticipantId: 11, drinks: [
      { name: '소주', unitPrice: 5_000, quantity: 8 }, { name: '맥주', unitPrice: 5_000, quantity: 6 },
    ] },
    { id: 2, seq: 2, label: '2차', total: 96_000, payerParticipantId: 11, drinks: [
      { name: '하이볼', unitPrice: 7_000, quantity: 6 },
    ] },
  ],
  responses: [
    { participantId: 11, roundId: 1, type: 'DRANK', source: 'SELF' },
    { participantId: 11, roundId: 2, type: 'DRANK', source: 'SELF' },
    { participantId: 12, roundId: 1, type: 'DRANK', source: 'SELF' },
    { participantId: 12, roundId: 2, type: 'EXEMPT', source: 'HOST' },
    { participantId: 13, roundId: 1, type: 'SOBER', source: 'SELF' },
    { participantId: 13, roundId: 2, type: 'ABSENT', source: 'SELF' },
  ],
  transfers: [],
  timeline: [
    { id: 1, type: 'SYSTEM', body: '동규님이 술자리를 만들었어요', createdAt: iso(1, 19, 2) },
    { id: 2, type: 'SYSTEM', body: '민지님이 들어왔어요', createdAt: iso(1, 19, 40) },
    { id: 3, type: 'SYSTEM', body: '재훈님이 응답했어요', createdAt: iso(1, 23, 5) },
    { id: 4, type: 'MESSAGE', authorParticipantId: 13, body: '2차는 먼저 들어가서 불참으로 했어요!', createdAt: iso(1, 23, 6) },
    { id: 5, type: 'SYSTEM', body: '민지님이 응답했어요', createdAt: iso(0, 9, 12) },
    { id: 6, type: 'MESSAGE', authorParticipantId: 11, body: '민지 생일이라 2차는 면제로 해뒀어요 🎂', createdAt: iso(0, 9, 20) },
  ],
  spoonGivers: [],
}

/** ② 민지가 총무, 송금 중 — 나는 민지와 재훈(2차 결제자)에게 각각 보내야 한다 */
const settlingRoom: Gathering = {
  id: 102, title: '9/25 회식', date: iso(4), hostUserId: 2, status: 'SETTLING',
  shareToken: 'Pw9mL', inputRevision: 12, participants: [
    { id: 21, userId: 2, displayName: '민지', spoonCount: 340, payout: { bank: '토스뱅크', accountNo: '1000-1234-5678', holder: '이민지' } },
    { id: 22, userId: 1, displayName: '동규', spoonCount: 1_280, payout: ME.payout },
    { id: 23, userId: 3, displayName: '재훈', spoonCount: 12 },
    { id: 24, userId: 6, displayName: '서연', spoonCount: 3 },
  ],
  rounds: [
    { id: 11, seq: 1, label: '1차', total: 156_000, payerParticipantId: 21, drinks: [{ name: '소주', unitPrice: 5_000, quantity: 10 }] },
    { id: 12, seq: 2, label: '2차', total: 72_000, payerParticipantId: 23, drinks: [{ name: '맥주', unitPrice: 6_000, quantity: 8 }] },
  ],
  responses: [
    { participantId: 21, roundId: 11, type: 'DRANK', source: 'SELF' }, { participantId: 21, roundId: 12, type: 'DRANK', source: 'SELF' },
    { participantId: 22, roundId: 11, type: 'DRANK', source: 'SELF' }, { participantId: 22, roundId: 12, type: 'DRANK', source: 'AUTO' },
    { participantId: 23, roundId: 11, type: 'SOBER', source: 'SELF' }, { participantId: 23, roundId: 12, type: 'DRANK', source: 'SELF' },
    { participantId: 24, roundId: 11, type: 'DRANK', source: 'SELF' }, { participantId: 24, roundId: 12, type: 'ABSENT', source: 'SELF' },
  ],
  transfers: [
    { id: 1, fromParticipantId: 22, toParticipantId: 21, amount: 41_000, status: 'WAITING' },
    { id: 2, fromParticipantId: 22, toParticipantId: 23, amount: 24_000, status: 'WAITING' },
    { id: 3, fromParticipantId: 23, toParticipantId: 21, amount: 29_000, status: 'SENT', sentAt: iso(2, 11) },
    { id: 4, fromParticipantId: 24, toParticipantId: 21, amount: 45_000, status: 'CONFIRMED', sentAt: iso(3, 10), confirmedAt: iso(3, 12) },
    { id: 5, fromParticipantId: 21, toParticipantId: 23, amount: 24_000, status: 'WAITING' },
  ],
  timeline: [
    { id: 1, type: 'SYSTEM', body: '민지님이 정산했어요 · 동규님은 전 차수 참석·알코올로 자동 계산됐어요', createdAt: iso(3, 9) },
    { id: 2, type: 'MESSAGE', authorParticipantId: 23, body: '2차는 제가 냈어요! 계좌 등록할게요', createdAt: iso(3, 9, 30) },
    { id: 3, type: 'SYSTEM', body: '서연님이 보냈어요', createdAt: iso(3, 10) },
    { id: 4, type: 'SYSTEM', body: '민지님이 서연님 입금을 확인했어요', createdAt: iso(3, 12) },
    { id: 5, type: 'SPOON', authorParticipantId: 24, body: '서연님이 총무에게 한 스푼 줬어요', createdAt: iso(3, 12, 5) },
    { id: 6, type: 'SYSTEM', body: '재훈님이 보냈어요', createdAt: iso(2, 11) },
  ],
  spoonGivers: [24],
}

/** ③ 재훈이 총무, 완료 — 2일 전 끝나서 5일 뒤 사라진다 */
const completedRoom: Gathering = {
  id: 103, title: '9/20 동기 모임', date: iso(9), hostUserId: 3, status: 'COMPLETED',
  shareToken: 'Zr3Tq', inputRevision: 5, completedAt: iso(2, 14), participants: [
    { id: 31, userId: 3, displayName: '재훈', spoonCount: 12, payout: { bank: '국민', accountNo: '123-45-678901', holder: '박재훈' } },
    { id: 32, userId: 1, displayName: '동규', spoonCount: 1_280, payout: ME.payout },
    { id: 33, userId: 2, displayName: '민지', spoonCount: 340 },
  ],
  rounds: [{ id: 21, seq: 1, label: '1차', total: 93_000, payerParticipantId: 31, drinks: [] }],
  responses: [
    { participantId: 31, roundId: 21, type: 'DRANK', source: 'SELF' },
    { participantId: 32, roundId: 21, type: 'DRANK', source: 'SELF' },
    { participantId: 33, roundId: 21, type: 'SOBER', source: 'SELF' },
  ],
  transfers: [
    { id: 1, fromParticipantId: 32, toParticipantId: 31, amount: 34_000, status: 'CONFIRMED', sentAt: iso(3), confirmedAt: iso(2, 13) },
    { id: 2, fromParticipantId: 33, toParticipantId: 31, amount: 25_000, status: 'CONFIRMED', sentAt: iso(3), confirmedAt: iso(2, 14) },
  ],
  timeline: [
    { id: 1, type: 'SYSTEM', body: '재훈님이 정산했어요', createdAt: iso(4) },
    { id: 2, type: 'SYSTEM', body: '모두 입금 완료! 🎉', createdAt: iso(2, 14) },
  ],
  spoonGivers: [33],
}

export const MOCK_ROOMS: Gathering[] = [openRoom, settlingRoom, completedRoom]

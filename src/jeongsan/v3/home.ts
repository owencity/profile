/** H1 내 술자리의 규칙 — docs/SCREENS.md §5 H1. 앱도 같은 규칙을 옮긴다. */
import type { Gathering, Id } from './model'
import { hasResponded, participantOfUser, roundsPaidBy } from './model'
import { nextAction } from './nextAction'

/**
 * 목록에서 방을 눌렀을 때 바로 갈 곳(CTO 결정 2026-10-01). 참여자는 정산방보다 **할 일 화면을
 * 먼저** 본다 — 응답 전이면 응답하기, 정산이 나왔는데 금액을 아직 안 봤으면 내 금액.
 * 그 밖에는 정산방. 총무는 늘 정산방(할 일 버튼이 거기 있다).
 */
export function entryRoute(g: Gathering, userId: Id, paySeen: boolean): string {
  const room = `/jungsan/r/${g.id}`
  const me = participantOfUser(g, userId)
  if (!me || g.hostUserId === userId) return room
  // 결제자인데 계좌가 없으면 무엇보다 먼저 — 그 계좌가 있어야 남이 돈을 보낼 수 있다(배너 규칙과 같음)
  if (needsAccount(g, me.id)) return `${room}/account`
  if (g.status === 'OPEN' && g.rounds.length > 0 && !hasResponded(g, me.id)) return `${room}/respond`
  if (g.status === 'SETTLING' && !paySeen && g.transfers.some((t) => t.fromParticipantId === me.id && t.status !== 'CONFIRMED')) {
    return `${room}/pay`
  }
  return room
}

/** 이 술자리에서 내가 결제자인데 받을 계좌가 없는가(완료된 방 제외) — nextAction의 첫 조건과 같다 */
export const needsAccount = (g: Gathering, participantId: Id) =>
  g.status !== 'COMPLETED' && roundsPaidBy(g, participantId).length > 0 &&
  !g.participants.find((p) => p.id === participantId)?.payout

/** 목록 줄에 붙일 뱃지 — 내가 아직 확인 안 한 일. 없으면 null. 순서는 배너와 같다(계좌 등록 → 입금 확인 → …) */
export function rowBadge(g: Gathering, userId: Id, paySeen: boolean): string | null {
  const me = participantOfUser(g, userId)
  if (!me) return null
  const isHost = g.hostUserId === userId
  if (needsAccount(g, me.id)) return '계좌 등록'
  if (g.status === 'OPEN') return !isHost && g.rounds.length > 0 && !hasResponded(g, me.id) ? '응답하기' : null
  if (g.status !== 'SETTLING') return null
  // 배너와 같은 순서 원칙: 남을 막고 있는 일(보냈다는 돈 확인)이 먼저 — SCREENS.md §4
  if (g.transfers.some((t) => t.toParticipantId === me.id && t.status === 'SENT')) return '입금 확인'
  if (!paySeen && g.transfers.some((t) => t.fromParticipantId === me.id && t.status !== 'CONFIRMED')) return '정산금액 확인'
  return null
}

/** 새 술자리 이름 — 입력받지 않고 날짜로 채운다("9/30 술자리"). 정산방 메뉴에서 바꾼다. */
export const autoTitle = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} 술자리`

/** 술자리 제목 최대 길이(FC-014 §4 PATCH 규칙과 같다) */
export const MAX_TITLE = 20

/**
 * 다음 차를 다른 사람이 계산해 새로 만드는 술자리의 이름 — "9/28 술자리 다음 차". 단톡방에서 어느 자리에서
 * 이어진 정산인지 알아보게 하는 이름일 뿐, 두 술자리는 데이터로 이어지지 않는다(완전히 분리).
 */
export const nextTitle = (prev: string) => [...`${prev} 다음 차`].slice(0, MAX_TITLE).join('')

export type HomeTab = 'HOSTING' | 'JOINED' | 'DONE'

/** 탭 이름 — 내 역할로 나눈다(CTO 결정 2026-10-01) */
export const TAB_LABEL: Record<HomeTab, string> = { HOSTING: '내가 총무', JOINED: '참여 중', DONE: '완료' }

/**
 * 내가 참여한 술자리를 탭별로 나눈다. 진행 중인 방은 내 역할(총무/참여)로, 끝난 방은 역할과
 * 상관없이 [완료]로. 각 탭 안에서는 최근 날짜가 위로.
 */
export function myRoomTabs(rooms: Gathering[], userId: Id): Record<HomeTab, Gathering[]> {
  const mine = rooms
    .filter((g) => participantOfUser(g, userId))
    .sort((a, b) => b.date.localeCompare(a.date))
  const active = mine.filter((g) => g.status !== 'COMPLETED')
  return {
    HOSTING: active.filter((g) => g.hostUserId === userId),
    JOINED: active.filter((g) => g.hostUserId !== userId),
    DONE: mine.filter((g) => g.status === 'COMPLETED'),
  }
}

/** 이 탭에 내가 지금 손대야 하는 방이 있는가 — 탭 옆 점 표시 */
export const tabHasTodo = (rooms: Gathering[], userId: Id) =>
  rooms.some((g) => nextAction(g, userId).tone === 'todo')

/**
 * 처음 열 탭. 할 일이 있는 탭이 먼저(총무 → 참여 순), 없으면 방이 있는 탭, 다 비었으면 [내가 총무]
 * — 거기에 [+ 새 술자리] 안내가 있다.
 */
export function initialTab(tabs: Record<HomeTab, Gathering[]>, userId: Id): HomeTab {
  if (tabHasTodo(tabs.HOSTING, userId)) return 'HOSTING'
  if (tabHasTodo(tabs.JOINED, userId)) return 'JOINED'
  if (tabs.HOSTING.length > 0) return 'HOSTING'
  if (tabs.JOINED.length > 0) return 'JOINED'
  return 'HOSTING'
}

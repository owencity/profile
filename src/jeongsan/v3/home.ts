/** H1 내 술자리의 규칙 — docs/SCREENS.md §5 H1. 앱도 같은 규칙을 옮긴다. */
import type { Gathering, Id } from './model'
import { participantOfUser } from './model'
import { nextAction } from './nextAction'

/** 새 술자리 이름 — 입력받지 않고 날짜로 채운다("9/30 술자리"). 정산방 메뉴에서 바꾼다. */
export const autoTitle = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} 술자리`

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

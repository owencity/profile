/** H1 내 술자리의 규칙 — docs/SCREENS.md §5 H1. 앱도 같은 규칙을 옮긴다. */
import type { Gathering, Id } from './model'
import { participantOfUser } from './model'

/** 새 술자리 이름 — 입력받지 않고 날짜로 채운다("9/30 술자리"). 정산방 메뉴에서 바꾼다. */
export const autoTitle = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} 술자리`

/** 내가 참여한 술자리를 진행 중 / 완료로 나눈다. 둘 다 최근 날짜가 위로. */
export function myRooms(rooms: Gathering[], userId: Id) {
  const mine = rooms
    .filter((g) => participantOfUser(g, userId))
    .sort((a, b) => b.date.localeCompare(a.date))
  return {
    active: mine.filter((g) => g.status !== 'COMPLETED'),
    done: mine.filter((g) => g.status === 'COMPLETED'),
  }
}

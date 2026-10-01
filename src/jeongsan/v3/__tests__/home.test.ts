/**
 * H1 내 술자리 — 로그인 직후 첫 화면의 규칙(SCREENS.md §5 H1)과, 새 술자리 만들기.
 * 모임(Group)이 없어졌으니 첫 화면은 "내가 들어가 있는 술자리 목록"이어야 한다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { autoTitle, initialTab, myRoomTabs } from '../home'
import { hostOf } from '../model'
import { ME, MOCK_ROOMS } from '../mock'
import { nextAction } from '../nextAction'
import { isV3Home, isV3Route } from '../routes'
import { useV3 } from '../store'

const s = () => useV3.getState()

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('내 술자리 탭 — [내가 총무] [참여 중] [완료]', () => {
  it('새 술자리 이름은 입력받지 않고 날짜로 채운다', () => {
    expect(autoTitle(new Date(2026, 8, 30))).toBe('9/30 술자리')
    expect(autoTitle(new Date(2026, 0, 5))).toBe('1/5 술자리')
  })

  it('내가 참여하지 않은 술자리는 어느 탭에도 보이지 않는다', () => {
    const t = myRoomTabs(MOCK_ROOMS, 9999)
    expect(t.HOSTING.length + t.JOINED.length + t.DONE.length).toBe(0)
  })

  it('진행 중인 방은 내 역할로 나뉜다 — 내가 연 방은 [내가 총무], 남이 연 방은 [참여 중]', () => {
    const t = myRoomTabs(MOCK_ROOMS, ME.id)
    expect(t.HOSTING.map((g) => g.id)).toEqual([101])
    expect(t.JOINED.map((g) => g.id)).toEqual([102])
  })

  it('끝난 방은 역할과 상관없이 [완료]에만 있다', () => {
    const t = myRoomTabs(MOCK_ROOMS, ME.id)
    expect(t.DONE.map((g) => g.id)).toEqual([103])
    expect([...t.HOSTING, ...t.JOINED].some((g) => g.status === 'COMPLETED')).toBe(false)
  })

  it('한 방은 정확히 한 탭에만 있다', () => {
    const t = myRoomTabs(MOCK_ROOMS, ME.id)
    const ids = [...t.HOSTING, ...t.JOINED, ...t.DONE].map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(MOCK_ROOMS.filter((g) => g.participants.some((p) => p.userId === ME.id)).length)
  })

  it('탭 안에서는 최근 술자리가 위로 온다', () => {
    const base = MOCK_ROOMS[0]
    const older = { ...base, id: 901, date: '2026-01-01T10:00:00.000Z' }
    const newer = { ...base, id: 902, date: '2026-09-01T10:00:00.000Z' }
    expect(myRoomTabs([older, newer], ME.id).HOSTING.map((g) => g.id)).toEqual([902, 901])
  })

  it('처음 열리는 탭은 할 일이 있는 탭이다 — 총무 일이 먼저', () => {
    // 동규: 총무방(101)은 응답 기다리는 중(wait), 참여방(102)은 보낼 돈(todo)
    expect(initialTab(myRoomTabs(MOCK_ROOMS, ME.id), ME.id)).toBe('JOINED')
    // 민지: 총무방(102)에 재훈이 보냈대요(todo)
    expect(initialTab(myRoomTabs(MOCK_ROOMS, 2), 2)).toBe('HOSTING')
  })

  it('방이 하나도 없으면 [내가 총무]가 열린다 — 새 술자리 안내가 있는 곳', () => {
    expect(initialTab(myRoomTabs([], ME.id), ME.id)).toBe('HOSTING')
  })
})

describe('새 술자리 만들기', () => {
  it('누르면 내가 총무이자 유일한 참여자인 빈 술자리가 생긴다', () => {
    const id = s().createGathering()
    const g = s().rooms[id]
    expect(g.status).toBe('OPEN')
    expect(g.hostUserId).toBe(ME.id)
    expect(g.participants).toHaveLength(1)
    expect(hostOf(g).userId).toBe(ME.id)
    expect(g.rounds).toHaveLength(0)
    expect(g.title).toBe(autoTitle(new Date()))
  })

  it('만든 직후 할 일은 1차 금액 넣기다', () => {
    const id = s().createGathering()
    expect(nextAction(s().rooms[id], ME.id).action?.kind).toBe('EDIT_FIRST_ROUND')
  })

  it('만든 술자리는 [내가 총무] 탭 맨 위에 보이고, 할 일(1차 입력)이 있어 그 탭이 먼저 열린다', () => {
    const id = s().createGathering()
    const tabs = myRoomTabs(Object.values(s().rooms), ME.id)
    expect(tabs.HOSTING[0].id).toBe(id)
    expect(initialTab(tabs, ME.id)).toBe('HOSTING')
  })

  it('연달아 만들어도 id가 겹치지 않는다', () => {
    const a = s().createGathering()
    const b = s().createGathering()
    expect(a).not.toBe(b)
    expect(s().rooms[a].participants[0].id).not.toBe(s().rooms[b].participants[0].id)
  })
})

describe('로그인 뒤 경로', () => {
  it('첫 화면과 옛 "모임 만들기" 주소는 v3 내 술자리로 간다', () => {
    expect(isV3Home('/jungsan')).toBe(true)
    expect(isV3Home('/jungsan/new')).toBe(true)
    expect(isV3Route('/jungsan')).toBe(true)
    expect(isV3Route('/jungsan/r/101')).toBe(true)
  })

  it('아직 옮기지 않은 화면(알림함 등)은 옛 라우터에 남는다', () => {
    expect(isV3Route('/jungsan/alerts')).toBe(false)
    expect(isV3Route('/jungsan/g/1')).toBe(false)
  })
})

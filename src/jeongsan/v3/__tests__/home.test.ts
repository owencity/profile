/**
 * H1 내 술자리 — 로그인 직후 첫 화면의 규칙(SCREENS.md §5 H1)과, 새 술자리 만들기.
 * 모임(Group)이 없어졌으니 첫 화면은 "내가 들어가 있는 술자리 목록"이어야 한다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { autoTitle, myRooms } from '../home'
import { hostOf } from '../model'
import { ME, MOCK_ROOMS } from '../mock'
import { nextAction } from '../nextAction'
import { isV3Home, isV3Route } from '../routes'
import { useV3 } from '../store'

const s = () => useV3.getState()

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('내 술자리 목록', () => {
  it('새 술자리 이름은 입력받지 않고 날짜로 채운다', () => {
    expect(autoTitle(new Date(2026, 8, 30))).toBe('9/30 술자리')
    expect(autoTitle(new Date(2026, 0, 5))).toBe('1/5 술자리')
  })

  it('내가 참여하지 않은 술자리는 보이지 않는다', () => {
    const { active, done } = myRooms(MOCK_ROOMS, 9999)
    expect(active).toHaveLength(0)
    expect(done).toHaveLength(0)
  })

  it('완료된 술자리는 진행 중과 따로 모인다', () => {
    const { active, done } = myRooms(MOCK_ROOMS, ME.id)
    expect(active.every((g) => g.status !== 'COMPLETED')).toBe(true)
    expect(done.every((g) => g.status === 'COMPLETED')).toBe(true)
    expect(active.length + done.length).toBe(MOCK_ROOMS.filter((g) => g.participants.some((p) => p.userId === ME.id)).length)
  })

  it('최근 술자리가 위로 온다', () => {
    const base = MOCK_ROOMS[0]
    const older = { ...base, id: 901, date: '2026-01-01T10:00:00.000Z' }
    const newer = { ...base, id: 902, date: '2026-09-01T10:00:00.000Z' }
    const { active } = myRooms([older, newer], ME.id)
    expect(active.map((g) => g.id)).toEqual([902, 901])
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

  it('만든 술자리는 내 술자리 진행 중 목록 맨 위에 보인다', () => {
    const id = s().createGathering()
    const { active } = myRooms(Object.values(s().rooms), ME.id)
    expect(active[0].id).toBe(id)
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

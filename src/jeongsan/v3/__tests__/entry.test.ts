/**
 * P1 참여 입구 — 링크로 들어와 참여하고 응답까지 한 번에(SCREENS.md §5 P1, 2026-10-03 P1+P2 합침).
 * 링크를 연 것만으로는 참여되지 않고, [참여]를 눌러야 명단에 들어간다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { hasResponded, participantOfUser, responseOf } from '../model'
import { isV3JoinRoute, isV3Route } from '../routes'
import { useV3 } from '../store'

const OPEN_TOKEN = 'k7Qx2' // 101 — 동규 총무, 응답 받는 중
const SETTLING_TOKEN = 'Pw9mL' // 102 — 정산 뒤
const s = () => useV3.getState()
const room = () => s().rooms[101]

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
  s().actAs(6) // 서연 — 101에 없는 사람
})

describe('참여하기', () => {
  it('참여하면 명단에 들어가고 고른 응답이 본인 응답으로 남는다', () => {
    const id = s().joinGathering(OPEN_TOKEN, [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'ABSENT' }])
    expect(id).toBe(101)
    const me = participantOfUser(room(), 6)!
    expect(me.displayName).toBe('서연')
    expect(hasResponded(room(), me.id)).toBe(true)
    expect(responseOf(room(), me.id, 2)).toMatchObject({ type: 'ABSENT', source: 'SELF' })
  })

  it('타임라인에 들어온 소식과 응답 소식이 남는다', () => {
    s().joinGathering(OPEN_TOKEN, [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'DRANK' }])
    expect(room().timeline.slice(-2).map((t) => t.body)).toEqual(['서연님이 들어왔어요', '서연님이 응답했어요'])
  })

  it('총무에게 "참여하고 응답했어요" 알림이 간다', () => {
    s().joinGathering(OPEN_TOKEN, [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'DRANK' }])
    const n = s().notifications.find((x) => x.userId === 1 && x.roomId === 101)!
    expect(n.title).toBe('서연님이 참여하고 응답했어요')
  })

  it('명단이 바뀌면 총무가 보던 정산 미리보기로는 정산할 수 없다', () => {
    const rev = room().inputRevision
    s().joinGathering(OPEN_TOKEN, [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'DRANK' }])
    s().actAs(1)
    expect(s().settle(101, rev)).toBe('STALE')
  })

  it('새로 온 사람은 면제를 고를 수 없다 — 면제는 총무만 정한다', () => {
    s().joinGathering(OPEN_TOKEN, [{ roundId: 1, type: 'EXEMPT' }])
    const me = participantOfUser(room(), 6)!
    expect(responseOf(room(), me.id, 1)).toBeUndefined()
  })

  it('이미 참여 중이면 아무것도 바꾸지 않고 그 술자리로 보낸다', () => {
    s().actAs(3) // 재훈 — 이미 101에 있다
    const before = room()
    expect(s().joinGathering(OPEN_TOKEN, [])).toBe(101)
    expect(room()).toBe(before)
  })

  it('정산된 술자리에는 참여할 수 없다', () => {
    s().actAs(4) // 지영 — 102에 없다
    expect(s().joinGathering(SETTLING_TOKEN, [])).toBeNull()
    expect(participantOfUser(s().rooms[102], 4)).toBeUndefined()
  })

  it('없는 링크면 참여되지 않는다', () => {
    expect(s().joinGathering('nope', [])).toBeNull()
  })
})

describe('참여 입구 경로', () => {
  it('링크 경로는 로그인 전에도 열리는 별도 경로다', () => {
    expect(isV3JoinRoute('/jungsan/j/k7Qx2')).toBe(true)
    expect(isV3Route('/jungsan/j/k7Qx2')).toBe(false) // 로그인 뒤 라우팅과 섞지 않는다
    expect(isV3JoinRoute('/jungsan/j/')).toBe(false)
  })
})

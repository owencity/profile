/** 메시지 신고·차단(FC-024) — 누구에게 어떤 메시지를 숨기나. 앱 SafetyTest 도 같은 케이스. */
import { describe, expect, it } from 'vitest'
import type { Gathering, TimelineEntry } from '../model'
import { MOCK_ROOMS } from '../mock'
import { EMPTY_MODERATION, canModerate, entryKey, myBlocks, visibleTimeline } from '../safety'
import type { Moderation } from '../safety'

// 9/28 술자리: 참여자 11(김동규·user 1) 12(이민지·user 2) 13(박재훈·user 3) 14(최지영·user 4)
const room = (): Gathering => {
  const g = structuredClone(MOCK_ROOMS.find((x) => x.id === 101)!)
  const t = (id: number, type: TimelineEntry['type'], author?: number): TimelineEntry => ({ id, type, authorParticipantId: author, body: `#${id}`, createdAt: '2026-10-20T00:00:00Z' })
  g.timeline = [t(1, 'MESSAGE', 12), t(2, 'MESSAGE', 13), t(3, 'SYSTEM'), t(4, 'MESSAGE', 11), t(5, 'SPOON', 12)]
  return g
}
const ids = (es: TimelineEntry[]) => es.map((e) => e.id)

describe('신고', () => {
  it('신고한 사람에게서는 그 메시지가 바로 사라지고, 다른 사람에게는 그대로 보인다', () => {
    const g = room()
    const m: Moderation = { reports: [{ key: entryKey(g, 1), reporterUserId: 1 }], blocks: [] }
    expect(ids(visibleTimeline(g, 1, m))).toEqual([2, 3, 4, 5])
    expect(ids(visibleTimeline(g, 3, m))).toEqual([1, 2, 3, 4, 5])
  })

  it('서로 다른 두 명이 신고하면 모두에게서 숨긴다', () => {
    const g = room()
    const m: Moderation = { reports: [{ key: entryKey(g, 1), reporterUserId: 1 }, { key: entryKey(g, 1), reporterUserId: 3 }], blocks: [] }
    expect(ids(visibleTimeline(g, 4, m))).toEqual([2, 3, 4, 5])
  })

  it('같은 사람이 두 번 신고해도 한 명으로 센다', () => {
    const g = room()
    const r = { key: entryKey(g, 1), reporterUserId: 1 }
    expect(ids(visibleTimeline(g, 4, { reports: [r, r], blocks: [] }))).toEqual([1, 2, 3, 4, 5])
  })
})

describe('차단', () => {
  it('차단한 사람이 쓴 메시지만 나에게서 숨기고 시스템 소식·스푼은 그대로 둔다', () => {
    const g = room()
    const m: Moderation = { reports: [], blocks: [{ blockerUserId: 1, blockedUserId: 2, displayName: '이민지' }] }
    expect(ids(visibleTimeline(g, 1, m))).toEqual([2, 3, 4, 5])
  })

  it('차단은 차단한 사람에게만 적용된다 — 차단당한 사람이나 제3자의 화면은 그대로', () => {
    const g = room()
    const m: Moderation = { reports: [], blocks: [{ blockerUserId: 1, blockedUserId: 2, displayName: '이민지' }] }
    expect(ids(visibleTimeline(g, 2, m))).toEqual([1, 2, 3, 4, 5])
    expect(ids(visibleTimeline(g, 3, m))).toEqual([1, 2, 3, 4, 5])
  })

  it('차단해도 명단은 그대로다 — 돈 계산을 깨지 않는다', () => {
    const g = room()
    visibleTimeline(g, 1, { reports: [], blocks: [{ blockerUserId: 1, blockedUserId: 2, displayName: '이민지' }] })
    expect(g.participants.some((p) => p.userId === 2)).toBe(true)
  })

  it('계정 화면에는 내가 차단한 사람만 나온다', () => {
    const m: Moderation = { reports: [], blocks: [{ blockerUserId: 1, blockedUserId: 2, displayName: '이민지' }, { blockerUserId: 3, blockedUserId: 4, displayName: '최지영' }] }
    expect(myBlocks(m, 1).map((b) => b.displayName)).toEqual(['이민지'])
  })
})

describe('신고·차단 메뉴가 뜨는 곳', () => {
  it('남이 쓴 메시지에만 뜬다 — 내 메시지·시스템 소식·스푼에는 없다', () => {
    const g = room()
    const [other, , sys, mine, spoon] = g.timeline
    expect(canModerate(g, other, 1)).toBe(true)
    expect(canModerate(g, mine, 1)).toBe(false)
    expect(canModerate(g, sys, 1)).toBe(false)
    expect(canModerate(g, spoon, 1)).toBe(false)
  })

  it('아무도 신고·차단하지 않았으면 전부 보인다', () => {
    expect(ids(visibleTimeline(room(), 1, EMPTY_MODERATION))).toEqual([1, 2, 3, 4, 5])
  })
})

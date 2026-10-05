/**
 * 다음 차를 다른 사람이 계산 — 그 사람이 총무인 **완전히 별개의** 새 술자리를 만든다(CTO 결정 2026-10-06).
 * 술자리 하나 = 받는 사람(총무) 한 명. 사람은 옮기지 않는다(새 술자리에는 다른 사람이 올 수 있다).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_TITLE, autoTitle, nextTitle } from '../home'
import { useV3 } from '../store'

const s = () => useV3.getState()

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('새 술자리 이름', () => {
  it('원래 술자리 이름 뒤에 "다음 차"를 붙인다 — 단톡방에서 어느 자리에서 이어졌는지 알아보게', () => {
    expect(nextTitle('9/28 술자리')).toBe('9/28 술자리 다음 차')
  })

  it(`${MAX_TITLE}자를 넘으면 자른다(제목 규칙과 같다)`, () => {
    const t = nextTitle('가'.repeat(18))
    expect([...t]).toHaveLength(MAX_TITLE)
  })
})

describe('다음 차는 내가 계산했어요', () => {
  it('누른 사람이 총무이자 유일한 참여자인 새 술자리가 생긴다 — 사람은 옮겨 오지 않는다', () => {
    s().actAs(2) // 이민지 — 101의 참여자, 총무 아님
    const before = Object.keys(s().rooms).length
    const id = s().createGathering(nextTitle(s().rooms[101].title))
    const g = s().rooms[id]
    expect(Object.keys(s().rooms)).toHaveLength(before + 1)
    expect(g.hostUserId).toBe(2)
    expect(g.participants.map((p) => p.userId)).toEqual([2])
    expect(g.title).toBe('9/28 술자리 다음 차')
    expect(g.status).toBe('OPEN')
    expect(g.rounds).toEqual([])
    expect(g.shareToken).not.toBe(s().rooms[101].shareToken)
  })

  it('원래 술자리는 그대로다 — 총무·사람·차수·송금 무엇도 바뀌지 않는다(완전히 분리)', () => {
    const orig = s().rooms[101]
    s().actAs(2)
    s().createGathering(nextTitle(orig.title))
    expect(s().rooms[101]).toEqual(orig)
  })

  it('제목을 주지 않으면 날짜 제목(M/d 술자리) — H1 [+ 새 술자리]와 같다', () => {
    const id = s().createGathering()
    expect(s().rooms[id].title).toBe(autoTitle(new Date()))
  })
})

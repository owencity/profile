import { describe, expect, it } from 'vitest'
import type { Gathering } from '../model'
import { canUndoSettle, daysUntilDelete, hasResponded, won } from '../model'
import { MOCK_ROOMS } from '../mock'
import { levelOf, titleOf } from '../../character/hostSprite'

const room = (id: number): Gathering => structuredClone(MOCK_ROOMS.find((g) => g.id === id)!)
const DAY = 24 * 3600 * 1000

describe('삭제까지 남은 날', () => {
  it('완료 순간에는 7일이 남는다', () => {
    const g = room(103)
    const now = new Date('2026-09-30T12:00:00Z')
    g.completedAt = now.toISOString()
    expect(daysUntilDelete(g, now)).toBe(7)
  })

  it('7일이 지나면 음수가 아니라 0이다', () => {
    const g = room(103)
    const now = new Date('2026-09-30T12:00:00Z')
    g.completedAt = new Date(now.getTime() - 9 * DAY).toISOString()
    expect(daysUntilDelete(g, now)).toBe(0)
  })

  it('완료되지 않은 술자리에는 남은 날이 없다', () => {
    expect(daysUntilDelete(room(101))).toBeNull()
  })
})

describe('정산 되돌리기 가능 여부 — DOMAIN_DB_DESIGN_V2.md §5.2', () => {
  it('아무도 보내거나 확인한 적 없으면 되돌릴 수 있다', () => {
    const g = room(102)
    g.transfers.forEach((t) => { t.status = 'WAITING'; delete t.sentAt; delete t.confirmedAt })
    expect(canUndoSettle(g)).toBe(true)
  })

  it('한 번이라도 [보냈어요]가 눌렸으면 지금 대기 상태여도 되돌릴 수 없다', () => {
    const g = room(102)
    g.transfers.forEach((t) => { t.status = 'WAITING'; delete t.confirmedAt })
    g.transfers[0].sentAt = new Date().toISOString()
    g.transfers.slice(1).forEach((t) => delete t.sentAt)
    expect(canUndoSettle(g)).toBe(false)
  })
})

describe('응답 여부', () => {
  it('모든 차수에 응답이 있어야 응답한 것이다', () => {
    const g = room(101)
    expect(hasResponded(g, 13)).toBe(true) // 박재훈: 1차·2차 모두
    g.responses = g.responses.filter((r) => !(r.participantId === 13 && r.roundId === 2))
    expect(hasResponded(g, 13)).toBe(false)
  })
})

describe('칭호 구간 — REQUIREMENTS.md §8.3, 경계값은 위 단계', () => {
  it.each([
    [0, 1, '새내기 총무'], [99, 1, '새내기 총무'],
    [100, 2, '믿음직한 총무'], [999, 2, '믿음직한 총무'],
    [1_000, 3, '프로 총무'], [9_999, 3, '프로 총무'],
    [10_000, 4, '전설의 총무'], [1_000_000, 4, '전설의 총무'],
  ])('스푼 %i개는 Lv.%i %s', (spoons, lv, title) => {
    expect(levelOf(spoons)).toBe(lv)
    expect(titleOf(spoons)).toBe(title)
  })
})

describe('금액 표시', () => {
  it('천 단위 쉼표와 "원"을 붙인다', () => {
    expect(won(41000)).toBe('41,000원')
    expect(won(0)).toBe('0원')
  })
})

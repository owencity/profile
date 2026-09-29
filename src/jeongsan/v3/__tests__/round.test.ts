/** R2 차수 편집 규칙 — 저장 전에 무엇을 막는가. 앱도 같은 케이스를 옮긴다. */
import { describe, expect, it } from 'vitest'
import type { Gathering } from '../model'
import { MOCK_ROOMS } from '../mock'
import { MAX_ROUND_TOTAL, drinksTotal, parseAmount, relabel, validateRound } from '../round'

const g = (): Gathering => structuredClone(MOCK_ROOMS.find((x) => x.id === 101)!)
const ok = { total: 100_000, drinks: [{ name: '소주', unitPrice: 5_000, quantity: 4 }], payerParticipantId: 11 }

describe('금액 입력 파싱', () => {
  it.each([
    ['184,000', 184_000], ['184000원', 184_000], ['1a2b3', 123], ['', 0], ['원', 0], ['007', 7],
  ])('"%s" → %i원', (text, won) => {
    expect(parseAmount(text)).toBe(won)
  })
})

describe('저장 전 검증', () => {
  it('정상 입력은 막지 않는다', () => {
    expect(validateRound(ok, g())).toEqual([])
  })

  it('술을 안 마신 차수(술 항목 없음)도 저장할 수 있다', () => {
    expect(validateRound({ ...ok, drinks: [] }, g())).toEqual([])
  })

  it('금액이 0이면 막는다', () => {
    expect(validateRound({ ...ok, total: 0 }, g())).toContain('금액을 넣어주세요')
  })

  it('0을 하나 더 친 것 같은 큰 금액은 막는다', () => {
    expect(validateRound({ ...ok, total: MAX_ROUND_TOTAL + 1 }, g())[0]).toContain('너무 커요')
  })

  it('술값 합계가 차수 금액보다 크면 막는다 — 계산 엔진이 거부할 입력을 미리 잡는다', () => {
    const drinks = [{ name: '와인', unitPrice: 30_000, quantity: 4 }] // 120,000 > 100,000
    expect(validateRound({ ...ok, drinks }, g())).toContain('술값 합계가 이 차수 금액보다 커요')
  })

  it('술값 합계가 금액과 같으면 통과한다(경계값)', () => {
    const drinks = [{ name: '와인', unitPrice: 25_000, quantity: 4 }] // 100,000
    expect(validateRound({ ...ok, drinks }, g())).toEqual([])
  })

  it('직접 입력한 술의 이름·가격이 비어 있으면 막는다', () => {
    const errs = validateRound({ ...ok, drinks: [{ name: ' ', unitPrice: 0, quantity: 1 }] }, g())
    expect(errs).toContain('술 이름을 넣어주세요')
    expect(errs).toContain('술 가격을 넣어주세요')
  })

  it('참여자가 아닌 사람을 낸 사람으로 고를 수 없다', () => {
    expect(validateRound({ ...ok, payerParticipantId: 999 }, g())).toContain('낸 사람을 골라주세요')
  })
})

describe('술 합계', () => {
  it('병당 가격 × 병 수를 더한다', () => {
    expect(drinksTotal([{ name: '소주', unitPrice: 5_000, quantity: 8 }, { name: '맥주', unitPrice: 5_000, quantity: 6 }])).toBe(70_000)
  })
})

describe('차수 이름은 순서로 정한다', () => {
  it('중간 차수가 빠지면 뒤 차수가 당겨진다(1·3차 → 1·2차)', () => {
    const out = relabel([
      { id: 1, seq: 1, label: '1차' },
      { id: 3, seq: 3, label: '3차' },
    ])
    expect(out.map((r) => [r.id, r.label])).toEqual([[1, '1차'], [3, '2차']])
  })
})

/** FC-029: 기존 자동 확정 회귀 사례를 총무 확인 정책으로 전환한다. */
import { beforeEach, describe, expect, it } from 'vitest'
import { ME } from '../mock'
import { hostOf, respondedCount } from '../model'
import { canSettleNow, nextAction } from '../nextAction'
import { paymentRequestMessage } from '../share'
import { useV3 } from '../store'

const OPEN = 101 // 김동규 총무, 5명 중 최지영(4)·정민수(5)가 아직 응답 안 함
const s = () => useV3.getState()
const g = () => s().rooms[OPEN]
const actAs = (userId: number) => s().actAs(userId)
/** 그 사람으로 모든 차수에 알코올 응답 */
const answerAll = (userId: number) => {
  actAs(userId)
  s().respond(OPEN, g().rounds.map((r) => ({ roundId: r.id, type: 'DRANK' as const })))
}

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
  useV3.setState({ me: ME })
})

describe('자동 정산', () => {
  it('전원 응답 후에도 OPEN이고 총무 확인 전 송금과 확정 알림이 없다', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    expect(g().status).toBe('OPEN') // 아직 한 명 남음
    answerAll(5)
    expect(g().status).toBe('OPEN')
    expect(g().transfers).toHaveLength(0)
    expect(g().timeline.some((e) => e.body.startsWith('모두 응답해서 자동으로 계산했어요'))).toBe(false)
  })

  it('전원 응답 뒤 총무가 명시적으로 확정한다', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    answerAll(5) // 정민수의 응답으로 정산 — 총무는 행동하지 않았으니 알림을 받는다
    expect(s().notifications.some((n) => n.title.includes('입금 요청'))).toBe(false)
    actAs(1)
    expect(s().settle(OPEN, g().inputRevision)).toBe('OK')
    expect(g().status).toBe('SETTLING')
  })

  it('인원보다 적게 모이면 모두 응답해도 정산하지 않는다 — 아직 안 들어온 사람이 있다', () => {
    s().setHeadcount(OPEN, 6)
    answerAll(4)
    answerAll(5)
    expect(g().status).toBe('OPEN')
  })

  it('인원을 넣지 않은 술자리(옛 흐름)는 모두 응답해도 총무가 정산할 때까지 기다린다', () => {
    answerAll(4)
    answerAll(5)
    expect(g().status).toBe('OPEN')
  })

  it('전원 응답 뒤 목표 인원을 바꿔도 확정하지 않는다', () => {
    answerAll(4)
    answerAll(5)
    actAs(1)
    s().setHeadcount(OPEN, 5)
    expect(g().status).toBe('OPEN')
  })

  it('인원은 총무만, 2~50명 안에서만 바꾼다', () => {
    actAs(2)
    s().setHeadcount(OPEN, 4)
    expect(g().headcount).toBeUndefined()
    actAs(1)
    s().setHeadcount(OPEN, 99)
    expect(g().headcount).toBe(50)
    s().setHeadcount(OPEN, 1)
    expect(g().headcount).toBe(2)
  })
})

describe('지금 할 일(총무)', () => {
  it('인원을 넣었으면 "5명 중 3명 응답 · 다 모이면 자동으로 계산돼요" + [링크 공유]', () => {
    s().setHeadcount(OPEN, 5)
    const a = nextAction(g(), 1)
    expect(a.banner).toBe('2명이 아직 응답 안 했어요 · 명단을 확인해주세요')
    expect(a.action?.kind).toBe('SETTLE')
    // 끝까지 안 들어오는 사람이 있을 때를 위해 [지금 계산하기]는 배너 아래 따로 있다
    expect(canSettleNow(g(), 1)).toBe(true)
    expect(canSettleNow(g(), 2)).toBe(false)
  })

  it('참여자는 응답 뒤 "다 모이면 자동으로 계산돼요"를 본다', () => {
    s().setHeadcount(OPEN, 5)
    expect(nextAction(g(), 2).banner).toBe('응답을 총무에게 보냈어요. 총무가 확인 후 정산해요')
  })

  it('계산이 끝나면 총무 할 일은 [입금 요청 보내기]', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    answerAll(5)
    actAs(1)
    expect(s().settle(OPEN, g().inputRevision)).toBe('OK')
    const a = nextAction(g(), 1)
    expect(a.banner).toBe('계산 끝! 단톡방에 입금 요청을 보내주세요')
    expect(a.action?.kind).toBe('REQUEST_PAYMENT')
  })
})

describe('입금 요청 문구', () => {
  it('받는 사람별로 보낼 사람·금액·계좌를 담고, 이미 확인된 송금은 뺀다', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    answerAll(5)
    actAs(1)
    expect(s().settle(OPEN, g().inputRevision)).toBe('OK')
    const room = g()
    const text = paymentRequestMessage(room)
    expect(text.startsWith(`[정산어택] ${room.title} 계산 끝!`)).toBe(true)
    for (const t of room.transfers) expect(text).toContain(`${room.participants.find((p) => p.id === t.fromParticipantId)!.displayName} `)
    expect(text).toContain(ME.payout!.accountNo)

    const first = room.transfers[0]
    const done = { ...room, transfers: room.transfers.map((t) => (t.id === first.id ? { ...t, status: 'CONFIRMED' as const } : t)) }
    const who = room.participants.find((p) => p.id === first.fromParticipantId)!.displayName
    expect(paymentRequestMessage(done)).not.toContain(`· ${who} `)
  })
})

describe('인원보다 더 들어오면 (CTO 결정 2026-10-09)', () => {
  it('총무에게 "현재 5명이 참여했어요 · 인원이 맞는지 확인"과 [5명 모두 포함하기]가 먼저 뜬다', () => {
    s().setHeadcount(OPEN, 4)
    const a = nextAction(g(), 1)
    expect(a.banner).toBe('예상 4명보다 많은 5명이 응답 명단에 있어요')
    expect(a.note).toBe('명단에서 잘못된 응답자를 제외하고 예상 금액을 확인한 뒤 확정해주세요.') // 마지막에 들어온 사람
    expect(a.action).toEqual({ kind: 'SETTLE', label: '명단 확인 · 정산 확정' })
    expect(canSettleNow(g(), 1)).toBe(true) // "안 들어온 사람"이 없으니 [지금 계산하기]는 숨긴다
  })

  it('링크로 인원보다 한 명 더 들어오는 순간 총무에게 알림이 한 번 간다', () => {
    s().setHeadcount(OPEN, 5)
    actAs(6) // 한서연 — 6번째
    s().joinGathering(g().shareToken, [])
    actAs(2)
    s().sendMessage(OPEN, '안녕') // 그 뒤 다른 변화로는 다시 안 간다
    const host = hostOf(g()).userId
    expect(s().notifications.filter((n) => n.userId === host && n.title.startsWith('현재 6명이 참여했어요')).length).toBe(1)
  })

  it('목표 인원만 응답해도 초과 명단과 응답을 보존한다', () => {
    s().setHeadcount(OPEN, 4)
    answerAll(4) // 4번째 최지영 — 앞의 4명이 모두 응답
    expect(g().status).toBe('OPEN')
    expect(g().participants.map((p) => p.displayName)).toContain('정민수')
    expect(g().timeline.some((e) => e.body === '정민수님은 인원(4명) 밖이라 이번 정산에서 빠졌어요')).toBe(false)
    expect(s().notifications.some((n) => n.userId === 5 && n.body.includes('인원(4명) 밖이라'))).toBe(false)
  })

  it('목표 인원 변경과 전원 응답 후에도 명단 그대로 총무를 기다린다', () => {
    s().setHeadcount(OPEN, 4)
    s().setHeadcount(OPEN, g().participants.length) // [5명 모두 포함하기]
    answerAll(4)
    expect(g().status).toBe('OPEN') // 정민수가 아직
    answerAll(5)
    expect(g().status).toBe('OPEN')
    expect(g().participants.map((p) => p.displayName)).toContain('정민수')
  })

  it('인원 밖에 들어온 사람은 "인원이 다 찼어요 · 총무가 포함하면 함께 정산돼요"를 본다', () => {
    s().setHeadcount(OPEN, 4)
    expect(nextAction(g(), 5).note).toBeUndefined()
  })

  it('응답 수는 목표 인원 밖 사람도 센다', () => {
    s().setHeadcount(OPEN, 4)
    s().setHeadcount(OPEN, 5)
    s().setHeadcount(OPEN, 4)
    answerAll(5)
    expect(respondedCount(g())).toBe(4)
  })
})

describe('인원 밖 사람이 결제자면 (API v8 REMOVE_PAYER, CTO 승인 2026-10-10)', () => {
  /** 정민수(15, 인원 밖)를 2차 결제자로 — 총무가 차수를 고친다 */
  const make2ndPaidByExtra = () => {
    const r2 = g().rounds[1]
    s().saveRound(OPEN, { id: r2.id, total: r2.total, drinks: r2.drinks, payerParticipantId: 15 })
  }

  it('목표 인원 밖 결제자도 포함하므로 REMOVE_PAYER 오류를 만들지 않는다', () => {
    s().setHeadcount(OPEN, 4)
    make2ndPaidByExtra()
    answerAll(4)
    expect(g().status).toBe('OPEN')
    expect(g().autoSettlementError).toBeUndefined()
    const a = nextAction(g(), 1)
    expect(a.banner).toBe('예상 4명보다 많은 5명이 응답 명단에 있어요')
    expect(a.action).toEqual({ kind: 'SETTLE', label: '명단 확인 · 정산 확정' })
  })

  it('결제자를 수정해도 자동 확정하지 않는다', () => {
    s().setHeadcount(OPEN, 4)
    make2ndPaidByExtra()
    answerAll(4)
    actAs(1)
    const r2 = g().rounds[1]
    s().saveRound(OPEN, { id: r2.id, total: r2.total, drinks: r2.drinks, payerParticipantId: 11 })
    expect(g().status).toBe('OPEN')
    expect(g().autoSettlementError).toBeUndefined()
  })

  it('그 밖의 이유로 멈추면 [지금 계산하기]로 마무리하게 한다', () => {
    const a = nextAction({ ...g(), headcount: 5, autoSettlementError: 'NO_ROUNDS' }, 1)
    expect(a.banner).toBe('예상 금액을 계산하지 못했어요 · 입력을 확인해주세요')
    expect(a.action?.kind).toBe('SETTLE')
  })
})

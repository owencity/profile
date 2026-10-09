/**
 * 인원 입력 · 전원 응답 시 자동 정산 · 입금 요청(FC-020, CTO 결정 2026-10-09).
 * 총무가 [정산하기]를 누르지 않는다 — 넣어 둔 인원만큼 모두 응답한 순간 계산이 확정되고, 총무는 단톡방에 입금 요청만 보낸다.
 * 서버가 같은 판정을 하기 전까지 목데이터 스토어가 같은 규칙으로 흉내 낸다(앱 AutoSettleTest 와 같은 케이스).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { ME } from '../mock'
import { hostOf } from '../model'
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
  it('넣어 둔 인원이 모두 응답하면 마지막 응답에 정산이 확정된다 — 총무가 누르지 않는다', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    expect(g().status).toBe('OPEN') // 아직 한 명 남음
    answerAll(5)
    expect(g().status).toBe('SETTLING')
    expect(g().transfers.length).toBeGreaterThan(0)
    expect(g().timeline.some((e) => e.body.startsWith('모두 응답해서 자동으로 계산했어요'))).toBe(true)
  })

  it('정산되면 총무에게 "단톡방에 입금 요청을 보내주세요" 알림이 간다', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    answerAll(5) // 정민수의 응답으로 정산 — 총무는 행동하지 않았으니 알림을 받는다
    const host = hostOf(g()).userId
    expect(s().notifications.some((n) => n.userId === host && n.title.includes('입금 요청'))).toBe(true)
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

  it('이미 모두 응답한 뒤 인원을 맞추면 그때 정산된다(인원 변경도 판정한다)', () => {
    answerAll(4)
    answerAll(5)
    actAs(1)
    s().setHeadcount(OPEN, 5)
    expect(g().status).toBe('SETTLING')
  })

  it('인원은 총무만, 2~50명 안에서만 바꾼다', () => {
    actAs(2)
    s().setHeadcount(OPEN, 4)
    expect(g().headcount).toBeUndefined()
    actAs(1)
    s().setHeadcount(OPEN, 1)
    expect(g().headcount).toBe(2)
    s().setHeadcount(OPEN, 99)
    expect(g().headcount).toBe(50)
  })
})

describe('지금 할 일(총무)', () => {
  it('인원을 넣었으면 "5명 중 3명 응답 · 다 모이면 자동으로 계산돼요" + [링크 공유]', () => {
    s().setHeadcount(OPEN, 5)
    const a = nextAction(g(), 1)
    expect(a.banner).toBe('5명 중 3명 응답했어요 · 다 모이면 자동으로 계산돼요')
    expect(a.action?.kind).toBe('SHARE')
    // 끝까지 안 들어오는 사람이 있을 때를 위해 [지금 계산하기]는 배너 아래 따로 있다
    expect(canSettleNow(g(), 1)).toBe(true)
    expect(canSettleNow(g(), 2)).toBe(false)
  })

  it('참여자는 응답 뒤 "다 모이면 자동으로 계산돼요"를 본다', () => {
    s().setHeadcount(OPEN, 5)
    expect(nextAction(g(), 2).banner).toBe('응답 완료! 다 모이면 자동으로 계산돼요')
  })

  it('계산이 끝나면 총무 할 일은 [입금 요청 보내기]', () => {
    s().setHeadcount(OPEN, 5)
    answerAll(4)
    answerAll(5)
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
    const room = g()
    const text = paymentRequestMessage(room, 'https://x/jungsan/j/k7Qx2')
    expect(text.startsWith(`[정산어택] ${room.title} 계산 끝!`)).toBe(true)
    for (const t of room.transfers) expect(text).toContain(`${room.participants.find((p) => p.id === t.fromParticipantId)!.displayName} `)
    expect(text).toContain(ME.payout!.accountNo)

    const first = room.transfers[0]
    const done = { ...room, transfers: room.transfers.map((t) => (t.id === first.id ? { ...t, status: 'CONFIRMED' as const } : t)) }
    const who = room.participants.find((p) => p.id === first.fromParticipantId)!.displayName
    expect(paymentRequestMessage(done, 'u')).not.toContain(`· ${who} `)
  })
})

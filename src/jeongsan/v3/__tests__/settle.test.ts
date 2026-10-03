/**
 * 정산하기(R3) · 내 응답(P2) · 보낼 돈(P3) 흐름의 상태 전이, 그리고 개발용 시점 전환.
 * 금액 자체는 서버 흉내(mockServer)라 규칙보다 "돈이 새거나 생기지 않는가"만 본다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { hasResponded, hostOf, responseOf, unrespondedParticipants } from '../model'
import { mockPreview } from '../mockServer'
import { nextAction } from '../nextAction'
import { useV3 } from '../store'

const OPEN = 101
const SETTLING = 102
const s = () => useV3.getState()
const room = (id = OPEN) => s().rooms[id]

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('정산 미리보기(서버 흉내)', () => {
  it('사람별 금액을 다 더하면 차수 합계와 같다 — 돈이 새거나 생기지 않는다', () => {
    const p = mockPreview(room())
    const sum = p.lines.reduce((a, l) => a + l.total, 0)
    expect(sum).toBe(room().rounds.reduce((a, r) => a + r.total, 0))
  })

  it('보낼 돈은 결제자에게 가고, 결제자 자신은 보내지 않는다', () => {
    const p = mockPreview(room())
    const payers = new Set(room().rounds.map((r) => r.payerParticipantId))
    expect(p.transfers.every((t) => payers.has(t.toParticipantId) && t.fromParticipantId !== t.toParticipantId)).toBe(true)
  })

  it('응답 없는 사람은 자동으로 표시된다', () => {
    const missing = unrespondedParticipants(room()).map((x) => x.id)
    const auto = mockPreview(room()).lines.filter((l) => l.auto).map((l) => l.participantId)
    expect(auto.sort()).toEqual(missing.sort())
  })

  it('면제·불참인 차수는 0원이다', () => {
    const minji = mockPreview(room()).lines.find((l) => l.participantId === 12)!
    expect(minji.rounds.find((b) => b.roundId === 2)).toMatchObject({ type: 'EXEMPT', amount: 0 })
    const jaehoon = mockPreview(room()).lines.find((l) => l.participantId === 13)!
    expect(jaehoon.rounds.find((b) => b.roundId === 2)).toMatchObject({ type: 'ABSENT', amount: 0 })
  })
})

describe('정산하기', () => {
  it('총무가 누르면 송금 중으로 넘어가고 보낼 돈 목록이 생긴다', () => {
    expect(s().settle(OPEN, room().inputRevision)).toBe('OK')
    expect(room().status).toBe('SETTLING')
    expect(room().transfers.length).toBeGreaterThan(0)
    expect(room().transfers.every((t) => t.status === 'WAITING')).toBe(true)
  })

  it('응답 없던 사람은 전 차수 참석·알코올(자동)로 채워지고 타임라인에 이름이 남는다', () => {
    s().settle(OPEN, room().inputRevision)
    for (const pid of [14, 15]) {
      expect(hasResponded(room(), pid)).toBe(true)
      expect(room().responses.filter((r) => r.participantId === pid).every((r) => r.type === 'DRANK' && r.source === 'AUTO')).toBe(true)
    }
    expect(room().timeline.at(-1)!.body).toContain('최지영·정민수님은 응답이 없어')
  })

  it('자동응답된 사람의 배너 아래에 안내가 붙는다', () => {
    s().settle(OPEN, room().inputRevision)
    s().actAs(4)
    expect(nextAction(room(), 4).note).toBe('응답이 없어 전 차수 참석·알코올로 계산됐어요')
  })

  it('미리보기 뒤 입력이 바뀌었으면 거절된다(409 흉내)', () => {
    const rev = room().inputRevision
    s().respondAsHost(OPEN, 14, 1, 'ABSENT')
    expect(s().settle(OPEN, rev)).toBe('STALE')
    expect(room().status).toBe('OPEN')
  })

  it('총무가 아니면 정산할 수 없다', () => {
    s().actAs(2)
    expect(s().settle(OPEN, room().inputRevision)).toBe('DENIED')
    expect(room().status).toBe('OPEN')
  })

  it('정산한 뒤 내 송금 금액은 미리보기에서 본 금액 그대로다', () => {
    const preview = mockPreview(room())
    s().settle(OPEN, room().inputRevision)
    const toHost = (pid: number) => room().transfers.find((t) => t.fromParticipantId === pid)?.amount
    for (const t of preview.transfers) expect(toHost(t.fromParticipantId)).toBe(t.amount)
  })
})

describe('총무 대리 응답(R3)', () => {
  it('총무가 대신 넣은 응답은 HOST로 남고, 다 채우면 미응답자에서 빠진다', () => {
    s().respondAsHost(OPEN, 14, 1, 'SOBER')
    s().respondAsHost(OPEN, 14, 2, 'ABSENT')
    expect(responseOf(room(), 14, 1)).toMatchObject({ type: 'SOBER', source: 'HOST' })
    expect(unrespondedParticipants(room()).map((p) => p.id)).not.toContain(14)
  })

  it('참여자는 남의 응답을 대신 넣을 수 없다', () => {
    s().actAs(2)
    s().respondAsHost(OPEN, 14, 1, 'SOBER')
    expect(responseOf(room(), 14, 1)).toBeUndefined()
  })
})

describe('내 응답(P2)', () => {
  it('응답하면 SELF로 저장되고 배너가 "응답 완료"로 바뀐다', () => {
    s().actAs(5)
    s().respond(OPEN, [{ roundId: 1, type: 'DRANK' }, { roundId: 2, type: 'SOBER' }])
    expect(responseOf(room(), 15, 2)).toMatchObject({ type: 'SOBER', source: 'SELF' })
    expect(nextAction(room(), 5).action?.kind).toBe('EDIT_RESPONSE')
    expect(room().timeline.at(-1)!.body).toBe('정민수님이 응답했어요')
  })

  it('총무가 면제로 정한 칸은 참여자가 바꿀 수 없다', () => {
    s().actAs(2)
    s().respond(OPEN, [{ roundId: 1, type: 'SOBER' }, { roundId: 2, type: 'DRANK' }])
    expect(responseOf(room(), 12, 2)).toMatchObject({ type: 'EXEMPT', source: 'HOST' })
    expect(responseOf(room(), 12, 1)).toMatchObject({ type: 'SOBER' })
  })

  it('참여자는 스스로 면제를 고를 수 없다', () => {
    s().actAs(4)
    s().respond(OPEN, [{ roundId: 1, type: 'EXEMPT' }])
    expect(responseOf(room(), 14, 1)).toBeUndefined()
  })

  it('정산된 뒤에는 응답이 바뀌지 않는다', () => {
    const before = responseOf(room(SETTLING), 22, 11)
    s().respond(SETTLING, [{ roundId: 11, type: 'ABSENT' }])
    expect(responseOf(room(SETTLING), 22, 11)).toEqual(before)
  })
})

describe('보낼 돈(P3)', () => {
  it('[보냈어요]를 누르면 받는 사람의 배너가 "확인해주세요"로 바뀐다', () => {
    s().markSent(SETTLING, 1) // 김동규 → 이민지
    s().actAs(2)
    expect(nextAction(room(SETTLING), 2).banner).toBe('김동규님이 보냈대요. 확인해주세요')
  })

  it('[아직 안 들어왔어요] 뒤에는 보낸 사람이 다시 [보냈어요]를 누를 수 있다', () => {
    s().actAs(2)
    s().notReceived(SETTLING, 3) // 박재훈 → 이민지, SENT 였다
    expect(room(SETTLING).transfers.find((t) => t.id === 3)).toMatchObject({ status: 'WAITING' })
    expect(room(SETTLING).transfers.find((t) => t.id === 3)!.notReceivedAt).toBeDefined()
    s().actAs(3)
    s().markSent(SETTLING, 3)
    expect(room(SETTLING).transfers.find((t) => t.id === 3)!.status).toBe('SENT')
  })
})

describe('보는 사람 바꾸기(개발용)', () => {
  it('같은 정산방이 총무에겐 정산하기, 참여자에겐 응답으로 보인다', () => {
    expect(nextAction(room(), s().me.id).action?.kind).toBe('SETTLE')
    s().actAs(4)
    expect(s().me.displayName).toBe('최지영')
    expect(nextAction(room(), s().me.id).action?.kind).toBe('RESPOND')
  })

  it('없는 사람으로는 바뀌지 않는다', () => {
    s().actAs(999)
    expect(s().me.id).toBe(hostOf(room()).userId)
  })
})

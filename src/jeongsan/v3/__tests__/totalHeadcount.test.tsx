import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_ROOMS } from '../mock'
import type { Gathering } from '../model'
import { respondedCount, responseProgressLabel, validateTotalHeadcount } from '../model'
import { nextAction } from '../nextAction'
import { notificationsFor } from '../notify'
import { toRoom, type ServerGathering } from '../serverModel'
import { useV3 } from '../store'
import { TotalHeadcountCard } from '../TotalHeadcountCard'
import detail from './fixtures/detail_b.json'

const original = (): Gathering => structuredClone(MOCK_ROOMS.find((room) => room.id === 101)!)
const sixResponses = (): Gathering => {
  const room = original()
  room.headcount = 6
  room.totalHeadcount = 7
  room.participants.push({ id: 16, userId: null, displayName: '비회원', spoonCount: 0 })
  room.rounds = [...room.rounds.map((round, index) => ({ ...round, expectedHeadcount: index + 6 })),
    { ...room.rounds[0], id: 3, seq: 3, label: '3차', expectedHeadcount: 8 }]
  room.responses = room.participants.flatMap((person) => room.rounds.map((round) => ({
    participantId: person.id, roundId: round.id, source: 'SELF' as const,
    type: person.userId === null ? 'ABSENT' as const : 'DRANK' as const,
  })))
  return room
}

beforeEach(() => useV3.setState(useV3.getInitialState(), true))

describe('전체 응답 인원은 차수 인원과 별도로 센다', () => {
  it('차수별 6·7·8명이어도 총인원이 7이면 6명 제출은 6/7명 응답이다', () => {
    const room = sixResponses()
    expect(responseProgressLabel(room)).toBe('6/7명 응답')
    expect(nextAction(room, room.hostUserId)).toMatchObject({
      banner: '응답 받는 중 · 6/7명 응답', tone: 'wait',
    })
    expect(nextAction(room, room.hostUserId).note).toContain('1명 응답을 더 기다려요')
    expect(room.status).toBe('OPEN')
    expect(room.transfers).toEqual([])
  })

  it('총무와 비회원은 각각 한 명이며 전 차수 불참도 제출로 센다', () => {
    const room = sixResponses()
    expect(respondedCount(room)).toBe(6)
    // 동일 참여자의 같은 응답이 반복되어도 사람 수가 늘지 않는다.
    room.responses.push({ ...room.responses[0] })
    expect(respondedCount(room)).toBe(6)
  })

  it('AUTO 한 칸 또는 미응답 한 칸이 있으면 그 사람은 제출 수에서 제외한다', () => {
    const room = sixResponses()
    room.responses[0].source = 'AUTO'
    room.responses = room.responses.filter((answer) => !(answer.participantId === 12 && answer.roundId === 2))
    expect(respondedCount(room)).toBe(4)
    room.responses[0].source = 'HOST'
    expect(respondedCount(room)).toBe(5)
  })

  it('기존 headcount나 차수 인원만 있는 방은 총인원 미설정으로 표시한다', () => {
    const room = sixResponses()
    delete room.totalHeadcount
    expect(responseProgressLabel(room)).toBe('6명 응답 · 총인원 미설정')
  })

  it('초과 응답을 잘라내지 않고 실제 6/5명과 검토 안내를 보여준다', () => {
    const room = { ...sixResponses(), totalHeadcount: 5 }
    const action = nextAction(room, room.hostUserId)
    expect(action.banner).toBe('응답 받는 중 · 6/5명 응답')
    expect(action.note).toContain('명단과 총인원을 검토')
    expect(room.participants).toHaveLength(6)
    expect(room.status).toBe('OPEN')
  })

  it('기존 headcount를 넘었어도 총인원 안이면 인원 초과 알림을 만들지 않는다', () => {
    const next = { ...sixResponses(), headcount: 2 }
    const previous = { ...next, participants: next.participants.slice(0, 5) }
    expect(notificationsFor(previous, next).some((notification) => notification.title.startsWith('현재 6명이'))).toBe(false)
  })
})

describe('서버의 총 정산인원', () => {
  const gathering = detail as unknown as ServerGathering
  it('totalHeadcount만 옮기고 기존 headcount와 구분한다', () => {
    const unit = { ...gathering.settlementUnits[0], headcount: 6, totalHeadcount: 7 }
    expect(toRoom(gathering, unit)).toMatchObject({ headcount: 6, totalHeadcount: 7 })
  })
  it.each([null, undefined])('총인원이 %s이면 기존 headcount가 있어도 미설정이다', (totalHeadcount) => {
    const unit = { ...gathering.settlementUnits[0], headcount: 6, totalHeadcount }
    expect(toRoom(gathering, unit).totalHeadcount).toBeUndefined()
  })
})

describe('총무의 총인원 설정', () => {
  it('2~50 사이 정수만 저장할 수 있고 잘못된 값을 반올림하지 않는다', () => {
    for (const value of [2, 7, 50]) expect(validateTotalHeadcount(value)).toBeNull()
    for (const value of [0, 1, 51, 2.5, NaN, Infinity]) expect(validateTotalHeadcount(value)).not.toBeNull()
  })

  it('총인원 변경은 차수 예상 인원과 기존 headcount를 바꾸지 않는다', () => {
    const room = sixResponses()
    useV3.setState({ rooms: { [room.id]: room } })
    expect(useV3.getState().setTotalHeadcount(room.id, 8)).toBeNull()
    const saved = useV3.getState().rooms[room.id]
    expect(saved.totalHeadcount).toBe(8)
    expect(saved.headcount).toBe(6)
    expect(saved.rounds.map((round) => round.expectedHeadcount)).toEqual([6, 7, 8])
    expect(saved.responses).toEqual(room.responses)
    expect(saved.status).toBe('OPEN')
  })

  it('총무가 아닌 사람과 확정된 정산방은 변경을 거절한다', () => {
    const room = sixResponses()
    useV3.setState({ rooms: { [room.id]: room } })
    useV3.getState().actAs(2)
    expect(useV3.getState().setTotalHeadcount(room.id, 8)).toContain('총무만')
    useV3.getState().actAs(1)
    useV3.setState({ rooms: { [room.id]: { ...room, status: 'SETTLING' } } })
    expect(useV3.getState().setTotalHeadcount(room.id, 8)).toContain('이미 확정')
    expect(useV3.getState().rooms[room.id].totalHeadcount).toBe(7)
  })

  it('설정 인원 전원이 응답해도 OPEN이며 추가 참여와 응답을 받는다', () => {
    const store = () => useV3.getState()
    expect(store().setTotalHeadcount(101, 5)).toBeNull()
    for (const userId of [4, 5]) {
      store().actAs(userId)
      store().respond(101, store().rooms[101].rounds.map((round) => ({ roundId: round.id, type: 'DRANK' })))
    }
    expect(respondedCount(store().rooms[101])).toBe(5)
    expect(store().rooms[101].status).toBe('OPEN')
    store().actAs(6)
    const room = store().rooms[101]
    expect(store().joinGathering(room.shareToken, room.rounds.map((round) => ({ roundId: round.id, type: 'ABSENT' })))).toBe(101)
    expect(responseProgressLabel(store().rooms[101])).toBe('6/5명 응답')
    expect(store().rooms[101].status).toBe('OPEN')
    expect(store().rooms[101].transfers).toEqual([])
  })
})

describe('총 정산인원 화면', () => {
  const render = (room: Gathering) => renderToStaticMarkup(createElement(TotalHeadcountCard, { g: room, onSave: async () => null }))
  it('설정하지 않은 방은 미설정과 설정 버튼을 표시한다', () => {
    const html = render(original())
    expect(html).toContain('총 정산인원 (나 포함)')
    expect(html).toContain('총인원 미설정')
    expect(html).toContain('총인원 설정')
  })
  it('설정한 총인원과 6/7명 응답을 함께 보여준다', () => {
    const html = render(sixResponses())
    expect(html).toContain('6/7명 응답')
    expect(html).toContain('총인원 수정')
    expect(html).not.toContain('응답 완료')
  })
  it('확정한 방에는 수정 버튼이 없고 수정 불가 이유가 보인다', () => {
    const html = render({ ...sixResponses(), status: 'SETTLING' })
    expect(html).not.toContain('총인원 수정')
    expect(html).toContain('정산을 확정한 뒤에는 총인원을 수정할 수 없어요')
  })
})

/**
 * "지금 할 일" 판정 — docs/SCREENS.md §4 표를 그대로 옮긴 테스트.
 * 앱(jungsan_app)도 같은 케이스를 commonTest로 옮겨 두 플랫폼이 같은 배너를 내는지 확인한다.
 */
import { describe, expect, it } from 'vitest'
import type { Gathering } from '../model'
import { MOCK_ROOMS } from '../mock'
import { nextAction } from '../nextAction'

const room = (id: number): Gathering => structuredClone(MOCK_ROOMS.find((g) => g.id === id)!)
const OPEN = 101 // 동규(1)가 총무, 지영(4)·민수(5) 미응답
const SETTLING = 102 // 민지(2)가 총무, 동규(1)는 민지·재훈에게 보낼 돈
const COMPLETED = 103 // 재훈(3)이 총무, 민지는 스푼 줬고 동규는 아직

describe('총무 — 정산 전', () => {
  it('차수가 없으면 1차 금액 입력이 먼저 뜬다', () => {
    const g = room(OPEN)
    g.rounds = []
    g.responses = []
    expect(nextAction(g, 1).action?.kind).toBe('EDIT_FIRST_ROUND')
  })

  it('참여자가 총무뿐이면 링크 공유를 권한다', () => {
    const g = room(OPEN)
    g.participants = g.participants.filter((p) => p.userId === 1)
    expect(nextAction(g, 1).action?.kind).toBe('SHARE')
  })

  it('미응답자가 있으면 몇 명인지 알려주고, 기다리지 않고 정산할 수 있게 정산하기를 준다', () => {
    const a = nextAction(room(OPEN), 1)
    expect(a.banner).toContain('2명이 아직 응답 안 했어요')
    expect(a.action?.kind).toBe('SETTLE')
    expect(a.tone).toBe('wait')
  })

  it('모두 응답하면 "모두 응답했어요"와 정산하기를 준다', () => {
    const g = room(OPEN)
    for (const pid of [14, 15]) {
      for (const rid of [1, 2]) g.responses.push({ participantId: pid, roundId: rid, type: 'DRANK', source: 'SELF' })
    }
    const a = nextAction(g, 1)
    expect(a.banner).toBe('모두 응답했어요')
    expect(a.action?.kind).toBe('SETTLE')
  })
})

describe('참여자 — 정산 전', () => {
  it('참여자가 아니면 참여하고 체크하기를 먼저 권한다', () => {
    expect(nextAction(room(OPEN), 99).action?.label).toBe('참여하고 체크하기')
  })

  it('응답 전이면 차수 이름을 넣어 응답을 요청한다', () => {
    const a = nextAction(room(OPEN), 4)
    expect(a.banner).toBe('1차·2차 응답을 남겨주세요')
    expect(a.action?.kind).toBe('RESPOND')
  })

  it('응답했으면 기다리는 상태로 바뀌고 응답을 고칠 수 있다', () => {
    const a = nextAction(room(OPEN), 3)
    expect(a.tone).toBe('wait')
    expect(a.action?.kind).toBe('EDIT_RESPONSE')
  })
})

describe('송금 중', () => {
  it('보낼 돈이 있으면 받는 사람과 금액을 알려준다', () => {
    const a = nextAction(room(SETTLING), 1)
    expect(a.banner).toBe('민지님께 41,000원을 보내주세요')
    expect(a.action?.kind).toBe('VIEW_PAY')
  })

  it('자동응답으로 계산된 사람에게는 안내 한 줄이 붙는다', () => {
    expect(nextAction(room(SETTLING), 1).note).toBe('응답이 없어 전 차수 참석·알코올로 계산됐어요')
  })

  it('[아직 안 들어왔어요]를 받으면 보낼 돈 안내보다 먼저 뜬다', () => {
    const g = room(SETTLING)
    const t = g.transfers.find((x) => x.id === 1)!
    t.sentAt = new Date().toISOString()
    t.notReceivedAt = new Date().toISOString()
    expect(nextAction(g, 1).banner).toBe('민지님이 아직 입금을 확인 못 했어요')
  })

  it('계좌 없는 결제자에게는 계좌 등록이 무엇보다 먼저 뜬다', () => {
    // 재훈은 2차 결제자인데 계좌가 없다
    expect(nextAction(room(SETTLING), 3).action?.kind).toBe('REGISTER_ACCOUNT')
  })

  it('보낼 돈을 다 처리한 총무에게 [보냈어요] 받은 건이 있으면 확인을 요청한다', () => {
    const g = room(SETTLING)
    g.transfers.find((x) => x.id === 5)!.status = 'CONFIRMED' // 민지 → 재훈 처리됨
    const a = nextAction(g, 2)
    expect(a.banner).toBe('재훈님이 보냈대요. 확인해주세요')
    expect(a.action?.kind).toBe('CONFIRM_INCOMING')
  })

  it('보낼 돈이 받는 확인보다 먼저다 — 총무도 다른 결제자에게 보낼 돈이 있으면 그게 먼저 뜬다', () => {
    expect(nextAction(room(SETTLING), 2).banner).toBe('재훈님께 24,000원을 보내주세요')
  })

  it('내 송금이 모두 확인되면 총무에게 한 스푼을 권하고, 이미 줬으면 권하지 않는다', () => {
    const g = room(SETTLING)
    g.transfers.filter((t) => t.fromParticipantId === 22).forEach((t) => { t.status = 'CONFIRMED' })
    expect(nextAction(g, 1).action?.kind).toBe('GIVE_SPOON')
    g.spoonGivers.push(22)
    expect(nextAction(g, 1).action).toBeUndefined()
  })
})

describe('완료', () => {
  it('삭제까지 남은 날을 보여준다 (완료 7일 뒤 삭제)', () => {
    const g = room(COMPLETED)
    g.completedAt = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    expect(nextAction(g, 1).banner).toBe('정산 끝! 5일 뒤 사라져요')
  })

  it('스푼을 아직 안 준 참여자에게만 한 스푼 버튼을 준다', () => {
    expect(nextAction(room(COMPLETED), 1).action?.kind).toBe('GIVE_SPOON') // 동규: 아직
    expect(nextAction(room(COMPLETED), 2).action).toBeUndefined() // 민지: 이미 줌
  })

  it('총무 자신에게는 스푼 버튼이 없다', () => {
    expect(nextAction(room(COMPLETED), 3).action).toBeUndefined()
  })
})

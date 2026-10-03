/**
 * R4 참여자 관리 — 총무의 차수별 면제와 내보내기(SCREENS.md §5 R4, REQUIREMENTS 권한 표).
 * 면제는 총무만, 정산 전에만. 면제를 풀면 그 칸은 빈칸으로 돌아간다(flow-changes FC-010).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { hasResponded, participantOfUser, responseOf } from '../model'
import { removeBlockedReason, useV3 } from '../store'

const OPEN = 101 // 동규(1) 총무 · 11 동규(결제자) 12 민지 13 재훈 14 지영 15 민수
const SETTLING = 102
const s = () => useV3.getState()
const room = (id = OPEN) => s().rooms[id]
const inbox = (userId: number) => s().notifications.filter((n) => n.userId === userId)

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('차수별 면제', () => {
  it('총무가 면제하면 그 칸이 총무 지정 면제로 잠기고 입력 버전이 오른다', () => {
    const rev = room().inputRevision
    s().setExempt(OPEN, 13, 1, true) // 재훈 1차
    expect(responseOf(room(), 13, 1)).toMatchObject({ type: 'EXEMPT', source: 'HOST' })
    expect(room().inputRevision).toBe(rev + 1)
    expect(room().timeline.at(-1)!.body).toBe('재훈님 1차를 면제했어요 🎁')
  })

  it('면제받은 사람에게 알림이 간다', () => {
    s().setExempt(OPEN, 13, 1, true)
    expect(inbox(3)[0].title).toBe('동규 총무가 1차를 면제해줬어요 🎁')
  })

  it('면제받은 칸은 참여자가 바꿀 수 없다', () => {
    s().setExempt(OPEN, 13, 1, true)
    s().actAs(3)
    s().respond(OPEN, [{ roundId: 1, type: 'DRANK' }])
    expect(responseOf(room(), 13, 1)?.type).toBe('EXEMPT')
  })

  it('면제를 풀면 그 칸은 빈칸(응답 전)으로 돌아간다', () => {
    s().setExempt(OPEN, 12, 2, false) // 민지 2차 — 목데이터에서 원래 면제
    expect(responseOf(room(), 12, 2)).toBeUndefined()
    expect(hasResponded(room(), 12)).toBe(false)
    expect(room().timeline.at(-1)!.body).toBe('민지님 2차 면제를 풀었어요')
  })

  it('이미 같은 상태면 아무것도 바뀌지 않는다', () => {
    const before = room()
    s().setExempt(OPEN, 12, 2, true) // 이미 면제
    expect(room()).toBe(before)
  })

  it('총무가 아니면 면제할 수 없다', () => {
    s().actAs(2)
    s().setExempt(OPEN, 13, 1, true)
    expect(responseOf(room(), 13, 1)?.type).toBe('SOBER')
  })

  it('정산한 뒤에는 면제를 바꿀 수 없다 — 계산 입력은 고정이다', () => {
    s().actAs(2) // 102 총무 민지
    const before = room(SETTLING)
    s().setExempt(SETTLING, 22, 11, true)
    expect(room(SETTLING)).toBe(before)
  })
})

describe('내보내기', () => {
  it('정산 전에는 내보낼 수 있고, 그 사람의 응답도 같이 사라진다', () => {
    expect(s().removeParticipant(OPEN, 13)).toBeNull()
    expect(participantOfUser(room(), 3)).toBeUndefined()
    expect(room().responses.some((r) => r.participantId === 13)).toBe(false)
    expect(room().timeline.at(-1)!.body).toBe('재훈님이 빠졌어요')
  })

  it('빠진 사람에게 알림이 가고, 누르면 내 술자리로 간다', () => {
    s().removeParticipant(OPEN, 13)
    expect(inbox(3)[0]).toMatchObject({ title: '9/28 술자리에서 빠졌어요', link: '/jungsan' })
  })

  it('명단이 바뀌면 총무가 보던 미리보기로는 정산할 수 없다', () => {
    const rev = room().inputRevision
    s().removeParticipant(OPEN, 14)
    expect(s().settle(OPEN, rev)).toBe('STALE')
  })

  it('결제자는 내보낼 수 없다 — 그 차수의 돈을 받을 사람이 사라진다', () => {
    const g = { ...room(), rounds: room().rounds.map((r) => (r.id === 2 ? { ...r, payerParticipantId: 12 } : r)) }
    expect(removeBlockedReason(g, 12)).toContain('결제자는 내보낼 수 없어요')
  })

  it('총무 자신과 정산 뒤에는 내보낼 수 없다', () => {
    expect(s().removeParticipant(OPEN, 11)).toBe('총무는 내보낼 수 없어요')
    s().actAs(2)
    expect(s().removeParticipant(SETTLING, 24)).toBe('정산한 뒤에는 내보낼 수 없어요')
    expect(participantOfUser(room(SETTLING), 6)).toBeDefined()
  })

  it('총무가 아니면 내보낼 수 없다', () => {
    s().actAs(2)
    expect(s().removeParticipant(OPEN, 13)).toBe('총무만 내보낼 수 있어요')
    expect(participantOfUser(room(), 3)).toBeDefined()
  })
})

/**
 * 알림 · 목록 뱃지 · 참여자 진입 경로 — CTO 결정(2026-10-01):
 * 참여자는 응답하기를 먼저 보고, 정산되면 "입금액을 확인해주세요" 알림을 받고, 아직 안 본 정산금액엔
 * 목록에 뱃지가 붙는다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { entryRoute, rowBadge } from '../home'
import { isV3Route } from '../routes'
import { useV3 } from '../store'

const OPEN = 101
const SETTLING = 102
const s = () => useV3.getState()
const room = (id = OPEN) => s().rooms[id]
const inbox = (userId: number) => s().notifications.filter((n) => n.userId === userId)

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('정산되면 알림', () => {
  it('총무가 정산하면 참여자마다 "입금액을 확인해주세요" 알림이 가고, 누르면 내 금액으로 간다', () => {
    s().settle(OPEN, room().inputRevision)
    for (const userId of [3, 4, 5]) {
      const n = inbox(userId).find((x) => x.roomId === OPEN)!
      expect(n.title).toBe('정산이 나왔어요! 입금액을 확인해주세요')
      expect(n.link).toBe('/jungsan/r/101/pay')
      expect(n.read).toBe(false)
    }
  })

  it('알림에 받는 사람과 금액이 같이 나온다', () => {
    s().settle(OPEN, room().inputRevision)
    const t = room().transfers.find((x) => x.fromParticipantId === 14)!
    const n = inbox(4).find((x) => x.roomId === OPEN)!
    expect(n.body).toContain(`동규님께 ${t.amount.toLocaleString('ko-KR')}원`)
  })

  it('자동응답된 사람의 알림엔 그 사실이 붙고, 총무도 따로 알림을 받는다', () => {
    s().settle(OPEN, room().inputRevision)
    expect(inbox(4).find((x) => x.roomId === OPEN)!.body).toContain('응답이 없어 전 차수 참석·알코올로 계산됐어요')
    expect(inbox(3).find((x) => x.roomId === OPEN)!.body).not.toContain('응답이 없어')
  })

  it('정산한 총무 본인에게는 "정산이 나왔어요"를 보내지 않는다', () => {
    s().settle(OPEN, room().inputRevision)
    // 자동응답 안내도 총무가 직접 정산하며 화면에서 이미 봤다 — 본인 행동이라 빠진다
    expect(inbox(1).filter((n) => n.roomId === OPEN)).toHaveLength(0)
  })

  it('[보냈어요]를 누르면 받는 사람에게 "입금을 확인해주세요"가 간다', () => {
    s().markSent(SETTLING, 1) // 동규 → 민지
    expect(inbox(2)[0].title).toBe('동규님이 보냈대요. 입금을 확인해주세요')
  })

  it('[아직 안 들어왔어요]를 누르면 보낸 사람에게 알림이 가고, 누르면 내 금액으로 간다', () => {
    s().actAs(2)
    s().notReceived(SETTLING, 3) // 재훈 → 민지
    const n = inbox(3)[0]
    expect(n.title).toBe('민지님이 아직 입금을 확인 못 했대요')
    expect(n.link).toBe('/jungsan/r/102/pay')
  })

  it('모두 입금되면 행동한 사람 빼고 모두에게 "정산 완료!"가 간다', () => {
    // 102를 끝까지: 동규(1·2번 송금), 민지(5번 송금)가 보내고, 받는 사람이 모두 확인. 마지막 확인은 재훈
    s().markSent(SETTLING, 1); s().markSent(SETTLING, 2)
    s().actAs(2); s().confirmIncoming(SETTLING, 1); s().confirmIncoming(SETTLING, 3); s().markSent(SETTLING, 5)
    s().actAs(3); s().confirmIncoming(SETTLING, 2); s().confirmIncoming(SETTLING, 5)
    expect(room(SETTLING).status).toBe('COMPLETED')
    for (const u of [1, 2, 6]) expect(inbox(u)[0].title).toBe('정산 완료! 🎉')
    expect(inbox(3).some((n) => n.title === '정산 완료! 🎉')).toBe(false)
  })

  it('알림을 읽으면 읽음으로 바뀌고, 모두 읽음은 지금 보는 사람 것만 바꾼다', () => {
    const mine = inbox(1).find((n) => !n.read)!
    s().markRead(mine.id)
    expect(s().notifications.find((n) => n.id === mine.id)!.read).toBe(true)
    s().markAllRead()
    expect(inbox(1).every((n) => n.read)).toBe(true)
    expect(inbox(2).some((n) => !n.read)).toBe(true)
  })
})

describe('참여자는 할 일 화면을 먼저 본다', () => {
  it('응답 전이면 방을 눌렀을 때 응답하기로 바로 간다', () => {
    expect(entryRoute(room(), 4, false)).toBe('/jungsan/r/101/respond')
  })

  it('응답했으면 정산방으로 간다', () => {
    expect(entryRoute(room(), 3, false)).toBe('/jungsan/r/101')
  })

  it('정산이 나왔는데 금액을 아직 안 봤으면 내 금액으로 바로 간다', () => {
    expect(entryRoute(room(SETTLING), 1, false)).toBe('/jungsan/r/102/pay')
  })

  it('금액을 한 번 봤으면 그다음부턴 정산방으로 간다', () => {
    expect(entryRoute(room(SETTLING), 1, true)).toBe('/jungsan/r/102')
  })

  it('총무는 늘 정산방으로 간다 — 할 일 버튼이 거기 있다', () => {
    expect(entryRoute(room(), 1, false)).toBe('/jungsan/r/101')
    expect(entryRoute(room(SETTLING), 2, false)).toBe('/jungsan/r/102')
  })
})

describe('목록 뱃지 — 내가 아직 확인 안 한 일', () => {
  it('정산이 나왔는데 금액을 안 봤으면 [정산금액 확인]', () => {
    expect(rowBadge(room(SETTLING), 1, false)).toBe('정산금액 확인')
  })

  it('금액 화면을 열면 뱃지가 떨어진다', () => {
    s().markPaySeen(SETTLING)
    expect(s().paySeen).toContain('102:1')
    expect(rowBadge(room(SETTLING), 1, true)).toBeNull()
  })

  it('응답 안 한 방엔 [응답하기]', () => {
    expect(rowBadge(room(), 4, false)).toBe('응답하기')
    expect(rowBadge(room(), 3, false)).toBeNull()
  })

  it('누가 보냈다고 한 돈이 있으면 [입금 확인] — 내 보낼 돈보다 먼저(남을 막고 있는 일이 먼저)', () => {
    // 민지: 재훈이 보냈다는 돈(확인 대기)과 자기가 재훈에게 보낼 돈이 둘 다 있다
    expect(rowBadge(room(SETTLING), 2, false)).toBe('입금 확인')
  })

  it('완료된 방엔 뱃지가 없다', () => {
    expect(rowBadge(room(103), 1, false)).toBeNull()
  })

  it('알림함 경로는 v3가 맡는다', () => {
    expect(isV3Route('/jungsan/notifications')).toBe(true)
  })
})

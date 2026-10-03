/**
 * 목데이터 저장소의 상태 전이 — DOMAIN_DB_DESIGN_V2.md §3·§5를 흉내 낸 규칙을 지키는지.
 * 백엔드가 붙으면 이 전이는 서버가 결정하지만, 그때까지 화면이 거짓 상태를 보여주면 안 된다.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { hostOf } from '../model'
import { ME } from '../mock'
import { useV3 } from '../store'

const SETTLING = 102
const COMPLETED = 103
const OPEN = 101
const s = () => useV3.getState()
const actAs = (userId: number) => useV3.setState({ me: { ...ME, id: userId } })

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('스푼', () => {
  it('참여자가 주면 총무 누적이 1 오르고 타임라인에 소식이 남는다', () => {
    const before = hostOf(s().rooms[COMPLETED]).spoonCount
    s().giveSpoon(COMPLETED)
    const g = s().rooms[COMPLETED]
    expect(hostOf(g).spoonCount).toBe(before + 1)
    expect(g.spoonGivers).toContain(32)
    expect(g.timeline.at(-1)).toMatchObject({ type: 'SPOON', authorParticipantId: 32 })
  })

  it('한 술자리에서 두 번 눌러도 한 번만 반영된다', () => {
    s().giveSpoon(COMPLETED)
    const once = hostOf(s().rooms[COMPLETED]).spoonCount
    s().giveSpoon(COMPLETED)
    expect(hostOf(s().rooms[COMPLETED]).spoonCount).toBe(once)
  })

  it('정산 전에는 줄 수 없고, 총무는 자기 자신에게 줄 수 없다', () => {
    const openBefore = s().rooms[OPEN]
    s().giveSpoon(OPEN) // 김동규는 101의 총무이자, 101은 아직 정산 전
    expect(s().rooms[OPEN]).toBe(openBefore)
  })
})

describe('송금 상태', () => {
  it('[보냈어요]는 내가 보내는 대기 중 송금만 보냄 상태로 바꾸고 시각을 남긴다', () => {
    s().markSent(SETTLING, 1)
    const t = s().rooms[SETTLING].transfers.find((x) => x.id === 1)!
    expect(t.status).toBe('SENT')
    expect(t.sentAt).toBeDefined()
  })

  it('남의 송금에는 [보냈어요]를 누를 수 없다', () => {
    s().markSent(SETTLING, 5) // 이민지 → 박재훈
    expect(s().rooms[SETTLING].transfers.find((x) => x.id === 5)!.status).toBe('WAITING')
  })

  it('[아직 안 들어왔어요]는 대기로 되돌리되 보낸 시각은 지우지 않는다 — 돈이 움직였을 수 있어서 정산 되돌리기를 계속 막아야 한다', () => {
    actAs(2) // 이민지 — 박재훈이 보낸 29,000원의 수취인
    s().notReceived(SETTLING, 3)
    const t = s().rooms[SETTLING].transfers.find((x) => x.id === 3)!
    expect(t.status).toBe('WAITING')
    expect(t.notReceivedAt).toBeDefined()
    expect(t.sentAt).toBeDefined()
  })

  it('수취인이 아니면 입금 확인을 할 수 없다', () => {
    s().confirmIncoming(SETTLING, 3) // 김동규는 박재훈→이민지 송금의 수취인이 아니다
    expect(s().rooms[SETTLING].transfers.find((x) => x.id === 3)!.status).toBe('SENT')
  })

  it('마지막 송금이 확인되면 완료로 바뀌고, 참여자 2명 이상이면 총무가 기본 스푼 1개를 받는다', () => {
    const hostBefore = hostOf(s().rooms[SETTLING]).spoonCount
    actAs(2) // 이민지가 받을 돈 확인
    s().confirmIncoming(SETTLING, 3)
    s().confirmIncoming(SETTLING, 1)
    expect(s().rooms[SETTLING].status).toBe('SETTLING') // 박재훈이 받을 돈이 남았다
    actAs(3) // 박재훈이 받을 돈 확인
    s().confirmIncoming(SETTLING, 5)
    s().confirmIncoming(SETTLING, 2)
    const g = s().rooms[SETTLING]
    expect(g.status).toBe('COMPLETED')
    expect(g.completedAt).toBeDefined()
    expect(hostOf(g).spoonCount).toBe(hostBefore + 1)
    expect(g.timeline.at(-1)?.body).toBe('모두 입금 완료! 🎉')
  })
})

describe('차수 입력 (총무, 정산 전에만)', () => {
  const draft = { total: 50_000, drinks: [], payerParticipantId: 11 }

  it('새 차수는 다음 번호로 붙고, 입력 버전이 오르고, 타임라인에 남는다', () => {
    const rev = s().rooms[OPEN].inputRevision
    const id = s().saveRound(OPEN, draft)
    const g = s().rooms[OPEN]
    expect(id).not.toBeNull()
    expect(g.rounds.at(-1)).toMatchObject({ id, label: '3차', total: 50_000 })
    expect(g.inputRevision).toBe(rev + 1)
    expect(g.timeline.at(-1)?.body).toBe('3차 50,000원을 넣었어요')
  })

  it('기존 차수를 고치면 번호는 그대로고 값만 바뀐다', () => {
    s().saveRound(OPEN, { ...draft, id: 2, total: 99_000 })
    const r = s().rooms[OPEN].rounds.find((x) => x.id === 2)!
    expect(r).toMatchObject({ label: '2차', total: 99_000 })
    expect(s().rooms[OPEN].rounds).toHaveLength(2)
  })

  it('중간 차수를 지우면 그 차수의 응답도 지워지고 뒤 차수가 당겨진다', () => {
    s().saveRound(OPEN, draft) // 3차 추가
    s().deleteRound(OPEN, 2)
    const g = s().rooms[OPEN]
    expect(g.rounds.map((r) => r.label)).toEqual(['1차', '2차'])
    expect(g.responses.some((r) => r.roundId === 2)).toBe(false)
  })

  it('총무가 아니면 차수를 넣을 수 없다', () => {
    actAs(2)
    expect(s().saveRound(OPEN, draft)).toBeNull()
    expect(s().rooms[OPEN].rounds).toHaveLength(2)
  })

  it('정산한 뒤에는 차수를 넣거나 지울 수 없다 — 계산 입력은 고정이다', () => {
    actAs(2) // 102의 총무 이민지
    const before = s().rooms[SETTLING]
    s().saveRound(SETTLING, { ...draft, payerParticipantId: 21 })
    s().deleteRound(SETTLING, 11)
    expect(s().rooms[SETTLING]).toBe(before)
  })
})

describe('타임라인 메시지', () => {
  it('보낸 사람이 나로 기록된다', () => {
    s().sendMessage(OPEN, '다들 고생했어요')
    expect(s().rooms[OPEN].timeline.at(-1)).toMatchObject({ type: 'MESSAGE', authorParticipantId: 11, body: '다들 고생했어요' })
  })
})

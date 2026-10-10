/**
 * 서버 응답(API v5) → 화면 정산방. 픽스처는 `feat/backend-v4`를 로컬에서 띄워 실제로 받은 응답이다
 * (김동규가 1·2차 총무, 이민지가 3차부터 총무, 김동규는 정산했고 이민지 쪽은 응답 받는 중).
 */
import { describe, expect, it } from 'vitest'
import { nextAction } from '../nextAction'
import type { ServerGathering, ServerJoinPreview, ServerPreview } from '../serverModel'
import { entryChoiceLabel, settlementViewedOf, toEntryRooms, toPreview, toRoom, toRooms } from '../serverModel'
import { nextRoundLabel } from '../model'
import detailB from './fixtures/detail_b.json'
import detailC from './fixtures/detail_c.json'
import preview from './fixtures/preview.json'
import joinPublic from './fixtures/join_public.json'

const asB = detailB as unknown as ServerGathering // 이민지(userId 2) 시점 — 두 단위 모두에 들어 있다
const asC = detailC as unknown as ServerGathering // 박재훈(userId 3) 시점 — 김동규 단위에만 들어 있다

describe('정산 단위 하나 = 정산방 하나', () => {
  it('내가 들어 있는 단위마다 정산방이 생긴다 — 들어 있지 않은 단위는 보이지 않는다', () => {
    expect(toRooms(asB).map((r) => r.id)).toEqual([1, 2])
    expect(toRooms(asC).map((r) => r.id)).toEqual([1])
  })

  it('정산방의 총무·상태·입력 버전은 그 단위의 것이다(술자리 요약 상태를 쓰지 않는다)', () => {
    const [a, b] = toRooms(asB)
    expect(a).toMatchObject({ gatheringId: 1, hostUserId: 1, status: 'SETTLING', inputRevision: 5 })
    expect(b).toMatchObject({ gatheringId: 1, hostUserId: 2, status: 'OPEN', inputRevision: 1 })
  })

  it('차수·응답·송금은 그 단위 것만 — 3차는 이민지 정산방에만 있다', () => {
    const [a, b] = toRooms(asB)
    expect(a.rounds.map((r) => r.label)).toEqual(['1차', '2차'])
    expect(b.rounds.map((r) => r.label)).toEqual(['3차'])
    expect(a.transfers).toHaveLength(2)
    expect(b.transfers).toHaveLength(0)
    expect(a.responses.every((x) => x.roundId === 1 || x.roundId === 2)).toBe(true)
  })

  it('명단은 그 단위에 든 사람만 — 이민지 단위에는 박재훈이 없다', () => {
    const [, b] = toRooms(asB)
    expect(b.participants.map((p) => p.displayName)).toEqual(['김동규', '이민지'])
  })

  it('총무가 둘이면 이름에 담당 차수를 붙여 H1에서 두 줄을 구분한다', () => {
    const [a, b] = toRooms(asB)
    expect(a.title).toBe('10/9 술자리 · 1차부터')
    expect(b.title).toBe('10/9 술자리 · 3차부터')
    expect(toRooms({ ...asC, settlementUnits: asC.settlementUnits.slice(0, 1) })[0].title).toBe('10/9 술자리')
  })

  it('타임라인은 술자리 하나에 하나 — 어느 정산방에서 봐도 같은 대화가 보인다', () => {
    const [a, b] = toRooms(asB)
    expect(a.timeline).toEqual(b.timeline)
    expect(a.timeline.some((e) => e.body === '2차는 먼저 들어가요!')).toBe(true)
  })

  it('계좌는 서버가 보여준 만큼만 — 보낼 사람(김동규)의 계좌는 있고, 그 밖의 사람은 없다', () => {
    const [a] = toRooms(asB)
    expect(a.participants.find((p) => p.userId === 1)?.payout?.accountNo).toBe('3333012345678')
    expect(a.participants.find((p) => p.userId === 3)?.payout).toBeUndefined()
  })

  it('변환한 정산방으로 "지금 할 일"이 그대로 나온다 — 이민지: 1·2차는 보낼 돈, 3차부터는 자기 정산', () => {
    const [a, b] = toRooms(asB)
    expect(nextAction(a, 2).banner).toContain('김동규님께')
    expect(nextAction(b, 2).action?.kind).toBeDefined()
  })

  it('명단은 서버가 준 단위 순서(총무 먼저, 그다음 들어온 순서)대로 — "인원 안"을 이 순서로 센다', () => {
    const u = { ...asB.settlementUnits[0], participantIds: [1, 3, 2] }
    const room = toRooms({ ...asB, settlementUnits: [u] })[0]
    expect(room.participants.map((p) => p.id)).toEqual([1, 3, 2])
  })

  it('자동 계산이 멈춘 이유를 정산방에 싣는다(API v8)', () => {
    const u = { ...asB.settlementUnits[1], headcount: 2, autoSettlementError: 'REMOVE_PAYER' }
    const room = toRooms({ ...asB, settlementUnits: [asB.settlementUnits[0], u] })[1]
    expect(room.headcount).toBe(2)
    expect(room.autoSettlementError).toBe('REMOVE_PAYER')
  })

  it('정산금액을 열어봤는지는 단위별(D5)', () => {
    expect(settlementViewedOf(asB, 1)).toBe(false)
  })
})

describe('정산 미리보기', () => {
  it('서버 미리보기를 R3 모양으로 — inputHash 를 정산하기에 그대로 넘긴다', () => {
    const p = toPreview(preview as unknown as ServerPreview)
    expect(p.inputRevision).toBe(5)
    expect(p.inputHash).toMatch(/^[a-f0-9]{64}$/)
    expect(p.transfers[0]).toMatchObject({ fromParticipantId: 2, toParticipantId: 1, amount: 93334 })
    expect(p.lines.find((l) => l.participantId === 3)?.auto).toBe(true)
  })
})

describe('링크 입구(P1)', () => {
  const pub = joinPublic as unknown as ServerJoinPreview

  it('정산 전 단위만 고를 수 있다 — 이미 정산한 단위로는 들어갈 수 없다', () => {
    const two: ServerJoinPreview = {
      ...pub,
      settlementUnits: [
        { ...pub.settlementUnits[0], status: 'SETTLING' },
        { id: 2, status: 'OPEN', host: { displayName: '이민지', spoonCount: 3 }, rounds: [{ id: 9, seq: 3, total: 60000 }] },
      ],
    }
    const rooms = toEntryRooms(two, 'tok')
    expect(rooms.map((r) => r.id)).toEqual([2])
    expect(rooms[0].rounds[0].label).toBe('3차')
    expect(entryChoiceLabel(rooms[0])).toBe('이민지님 · 3차')
  })

  it('차수가 없으면 "금액 넣는 중"으로 고른다', () => {
    expect(entryChoiceLabel(toEntryRooms(pub, 'tok')[0])).toBe('김동규님 · 금액 넣는 중')
  })
})

describe('차수 번호', () => {
  it('새 차수 이름은 술자리 전체 번호를 잇는다 — 1·2·3차가 있으면 다음 총무의 첫 차수는 "4차"', () => {
    const empty = { ...asB.settlementUnits[1], id: 9, participantIds: asB.settlementUnits[1].participantIds }
    const g = { ...asB, settlementUnits: [...asB.settlementUnits, empty] }
    const room = toRoom(g, empty)
    expect(room.rounds).toHaveLength(0)
    expect(nextRoundLabel(room)).toBe('4차')
  })

  it('목데이터 정산방은 firstSeq 에서 이어 센다', () => {
    const [a] = toRooms(asB)
    expect(nextRoundLabel({ ...a, nextSeq: undefined, rounds: [], firstSeq: 3 })).toBe('3차')
    expect(nextRoundLabel({ ...a, nextSeq: undefined })).toBe('3차')
  })
})

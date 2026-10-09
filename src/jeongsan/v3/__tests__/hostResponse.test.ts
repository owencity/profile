/**
 * 총무 본인의 차수 응답(FC-019 A) — 차수를 넣을 때 화면에 보이는 "나는 이 차수에"를 같이 저장한다.
 * 총무가 자기 응답을 따로 찾지 않아도 되게 하고, 안 마신 날은 같은 화면에서 바꾸게 하려는 것이다.
 * 목데이터 모드의 gateway로 확인한다(API 모드는 같은 규칙으로 `PUT U/responses/me`를 한 번 더 부른다).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { gateway } from '../gateway'
import { hostOf, responseOf, unrespondedParticipants } from '../model'
import { useV3 } from '../store'

const OPEN = 101 // 김동규가 총무, 정산 전
const s = () => useV3.getState()
const draft = { total: 50_000, drinks: [], payerParticipantId: 11 }

beforeEach(() => {
  useV3.setState(useV3.getInitialState(), true)
})

describe('총무 본인 응답', () => {
  it('새 차수를 넣으면 고른 응답이 총무 몫으로 같이 들어간다 — 정산 때 총무 이름이 "응답 없음"에 뜨지 않는다', async () => {
    const r = await gateway.saveRound(OPEN, draft, 'DRANK')
    const g = s().rooms[OPEN]
    const id = 'id' in r ? r.id : -1
    expect(responseOf(g, hostOf(g).id, id)?.type).toBe('DRANK')
    expect(unrespondedParticipants(g).some((p) => p.id === hostOf(g).id)).toBe(false)
  })

  it('그날 술을 안 마셨으면 논알코올로 바꾼 그대로 저장된다', async () => {
    const r = await gateway.saveRound(OPEN, draft, 'SOBER')
    const g = s().rooms[OPEN]
    expect(responseOf(g, hostOf(g).id, 'id' in r ? r.id : -1)?.type).toBe('SOBER')
  })

  it('차수만 고치고 응답은 그대로면 응답을 다시 보내지 않는다 — 타임라인에 "응답을 고쳤어요"가 쌓이지 않게', async () => {
    const r = await gateway.saveRound(OPEN, draft, 'DRANK')
    const id = 'id' in r ? r.id : -1
    const lines = s().rooms[OPEN].timeline.length
    await gateway.saveRound(OPEN, { ...draft, id, total: 60_000 }, 'DRANK')
    const g = s().rooms[OPEN]
    expect(g.timeline.length).toBe(lines + 1) // 차수 고침 한 줄만
    expect(g.timeline.some((e) => e.body.includes('응답을 고쳤어요'))).toBe(false)
  })

  it('고치면서 응답을 바꾸면 그것만 반영된다', async () => {
    const r = await gateway.saveRound(OPEN, draft, 'DRANK')
    const id = 'id' in r ? r.id : -1
    await gateway.saveRound(OPEN, { ...draft, id }, 'ABSENT')
    const g = s().rooms[OPEN]
    expect(responseOf(g, hostOf(g).id, id)?.type).toBe('ABSENT')
  })
})

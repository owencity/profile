import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ServerGathering } from '../serverModel'
import detail from './fixtures/detail_b.json'

const fixture = (totalHeadcount: number | null): ServerGathering => {
  const gathering = structuredClone(detail) as unknown as ServerGathering
  gathering.settlementUnits[0] = { ...gathering.settlementUnits[0], status: 'OPEN', headcount: 6, totalHeadcount }
  return gathering
}

async function setup(...responses: { status: number; body?: unknown }[]) {
  vi.resetModules()
  vi.stubEnv('VITE_JEONGSAN_API_BASE_URL', 'https://api.test')
  const fetchMock = vi.fn(async () => {
    const response = responses.shift() ?? { status: 500 }
    return new Response(response.body === undefined ? null : JSON.stringify(response.body), { status: response.status })
  })
  vi.stubGlobal('fetch', fetchMock)
  const { gateway } = await import('../gateway')
  const { useV3 } = await import('../store')
  const { toRoom } = await import('../serverModel')
  const gathering = fixture(null)
  const room = toRoom(gathering, gathering.settlementUnits[0])
  useV3.setState({ rooms: { [room.id]: room }, me: { id: room.hostUserId, displayName: '총무', spoonCount: 0 } })
  return { gateway, useV3, fetchMock, room }
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('총 정산인원 저장 계약과 실패 처리', () => {
  it('별도 total-headcount 경로에 PUT하고 204 뒤 다시 받은 총인원을 표시한다', async () => {
    const { gateway, useV3, fetchMock, room } = await setup({ status: 204 }, { status: 200, body: fixture(7) })
    expect(await gateway.setTotalHeadcount(room.id, 7)).toBeNull()
    expect(fetchMock).toHaveBeenNthCalledWith(1,
      `https://api.test/api/v1/gatherings/${room.gatheringId}/settlement-units/${room.id}/total-headcount`,
      expect.objectContaining({ method: 'PUT', credentials: 'include', body: JSON.stringify({ totalHeadcount: 7 }) }))
    expect(useV3.getState().rooms[room.id]).toMatchObject({ totalHeadcount: 7, headcount: 6, status: 'OPEN' })
  })

  it('서버가 저장을 거절하면 기존 값이 유지되고 실패 이유를 돌려준다', async () => {
    const { gateway, useV3, room, fetchMock } = await setup({ status: 409, body: { code: 'SETTLEMENT_UNIT_NOT_OPEN', message: 'closed' } })
    expect(await gateway.setTotalHeadcount(room.id, 7)).toBe('이미 정산한 차수예요')
    expect(useV3.getState().rooms[room.id].totalHeadcount).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('저장 뒤 재조회만 실패하면 저장됐지만 확인하지 못했다는 안내를 돌려준다', async () => {
    const { gateway, useV3, room } = await setup({ status: 204 }, { status: 503 })
    expect(await gateway.setTotalHeadcount(room.id, 7)).toContain('총인원은 저장했지만 최신 정보를 불러오지 못했어요')
    expect(useV3.getState().rooms[room.id].totalHeadcount).toBeUndefined()
  })

  it('유효하지 않은 숫자와 확정된 방은 API 요청도 보내지 않는다', async () => {
    const { gateway, useV3, room, fetchMock } = await setup()
    expect(await gateway.setTotalHeadcount(room.id, 1)).toContain('2~50명')
    useV3.setState({ rooms: { [room.id]: { ...room, status: 'SETTLING' } } })
    expect(await gateway.setTotalHeadcount(room.id, 7)).toContain('이미 확정')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

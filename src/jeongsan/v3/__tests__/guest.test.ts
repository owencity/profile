import { afterEach, describe, expect, it, vi } from 'vitest'
import { capturePages, cellNote } from '../settlementTable'
import type { SettlementTable } from '../settlementTable'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
async function load() {
  vi.resetModules()
  vi.stubEnv('VITE_JEONGSAN_API_BASE_URL', 'https://api.test')
  return import('../guestApi')
}

describe('비회원 쿠키와 API 계약', () => {
  it('동시 초기화는 한 요청만 보내고 완료를 기다린다', async () => {
    let finish!: (value: Response) => void
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    const { ensureGuestSession } = await load()
    const first = ensureGuestSession()
    const second = ensureGuestSession()
    expect(first).toBe(second)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    finish(new Response(null, { status: 204 }))
    await Promise.all([first, second])
    expect(fetchMock.mock.calls[0]).toEqual(['https://api.test/api/v1/guest/session', expect.objectContaining({ method: 'POST', credentials: 'include' })])
  })
  it('초기화 실패를 보존하거나 토큰을 교체하지 않고 명시적 재시도가 가능하다', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{"code":"UNAUTHENTICATED"}', { status: 401 })).mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const { ensureGuestSession, guestError } = await load()
    const error = await ensureGuestSession().catch((failure: unknown) => failure)
    expect(guestError(error)).toContain('브라우저')
    expect(guestError(error)).not.toContain('로그인')
    await ensureGuestSession()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('참여는 단위와 이름·응답만 전송하고 회원 ID·토큰을 싣지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    const { guestApi } = await load()
    await guestApi.join('safe/token', '김하나', 12, [{ roundId: 41, type: 'SOBER' }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.test/api/v1/guest/join/safe%2Ftoken')
    expect(JSON.parse(init.body)).toEqual({ displayName: '김하나', settlementUnitId: 12, responses: [{ roundId: 41, type: 'SOBER' }] })
    expect(init.headers).not.toHaveProperty('Authorization')
    expect(init.credentials).toBe('include')
  })
  it('본인 응답 수정·금액·송금 표시는 guest 경로만 사용한다', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => new Response(init.method === 'GET' ? '{}' : null, { status: init.method === 'GET' ? 200 : 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const { guestApi } = await load()
    await guestApi.respond(2, 3, [{ roundId: 4, type: 'ABSENT' }])
    await guestApi.money(2, 3)
    await guestApi.sent(8)
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ['https://api.test/api/v1/guest/gatherings/2/settlement-units/3/responses/me', 'PUT'],
      ['https://api.test/api/v1/guest/gatherings/2/settlement-units/3/settlement', 'GET'],
      ['https://api.test/api/v1/guest/transfers/8/sent', 'POST'],
    ])
  })
  it('구버전 미리보기를 새 비회원 계약인 것처럼 사용하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"title":"술자리"}')))
    const { guestApi } = await load()
    await expect(guestApi.preview('abc')).rejects.toMatchObject({ code: 'GUEST_UNAVAILABLE' })
  })
  it.each([403, 502])('JSON이 아닌 %i 응답도 안전한 오류 문구로 표시한다', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>private upstream detail</html>', { status })))
    const { guestApi } = await load()
    await expect(guestApi.me(1)).rejects.toMatchObject({ status, code: `HTTP_${status}`, message: '응답을 확인하지 못했어요. 잠시 뒤 다시 시도해주세요' })
  })
  it('깨진 성공 JSON을 정상 데이터로 간주하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid')))
    const { guestApi } = await load()
    await expect(guestApi.me(1)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})

describe('캡처 페이지 누락 방지', () => {
  const lines = Array.from({ length: 25 }, (_, index) => ({ participantId: index + 1, name: '동명이인', total: 1000 + index, paidTotal: 0 }))
  const rounds = Array.from({ length: 5 }, (_, index) => ({ roundId: index + 1, seq: index + 1, payerParticipantId: 1, total: 10000, foodTotal: 10000, alcoholTotal: 0, displayTotal: 9999, cells: [] }))
  const adjustments = Array.from({ length: 5 }, (_, index) => ({ recipientParticipantId: index + 1, cells: { '1': -1, '2': 1 } }))
  const transfers = lines.slice(1).map((line) => ({ fromParticipantId: line.participantId, toParticipantId: 1, amount: line.total }))
  const view: SettlementTable = { gatheringId: 1, settlementUnitId: 2, title: '검증', status: 'SETTLING', isEstimate: false, generatedAt: '2026-10-31T12:00:00Z', inputHash: 'fixture', inputRevision: 3, table: { lines, rounds, adjustments, transfers, grandTotal: 50000 } }
  it('동명이인을 ID로 나누며 모든 사람×차수를 정확히 한 번 담는다', () => {
    const pages = capturePages(view)
    const combinations = pages.flatMap((page) => page.round ? page.lines.map((line) => `${line.participantId}-${page.round!.roundId}`) : [])
    expect(combinations).toHaveLength(125)
    expect(new Set(combinations).size).toBe(125)
    expect(pages.every((page) => page.lines.length <= 8 && page.transfers.length <= 8)).toBe(true)
    expect(pages.filter((page) => page.kind === 'summary').flatMap((page) => page.lines)).toEqual(lines)
    expect(capturePages(view, Number.MAX_SAFE_INTEGER)[0].lines).toEqual(lines)
  })
  it('조정과 송금 안내도 누락/중복 없이 원래 금액으로 전달한다', () => {
    const pages = capturePages(view)
    expect(pages.flatMap((page) => page.transfers)).toEqual(transfers)
    for (const line of lines) {
      expect(pages.filter((page) => page.adjustment && page.lines.some((candidate) => candidate.participantId === line.participantId)).map((page) => page.adjustment)).toEqual(adjustments)
      expect(pages.flatMap((page) => page.lines).find((candidate) => candidate.participantId === line.participantId)?.total).toBe(line.total)
    }
  })
  it('미응답·불참·면제는 모두 0원이더라도 서로 다른 문구다', () => {
    const cell = { participantId: 1, type: 'DRANK' as const, source: 'UNANSWERED' as const, amount: 0, food: 0, alcohol: 0 }
    expect(cellNote(cell)).toBe('미응답·예상')
    expect(cellNote({ ...cell, type: 'ABSENT', source: 'SELF' })).toBe('불참')
    expect(cellNote({ ...cell, type: 'EXEMPT', source: 'HOST' })).toBe('면제')
    expect(cellNote({ ...cell, source: 'AUTO' })).toBe('알코올·자동')
  })
  it('긴 금액도 사람을 열로 나누지 않으며 원 금액을 축약하지 않는다', () => {
    const pages = capturePages({ ...view, table: { ...view.table, grandTotal: 1_000_000_000_000 } })
    expect(pages[0].lines).toEqual(lines.slice(0, 8))
    expect(pages.flatMap((page) => page.transfers)).toEqual(transfers)
  })
  it('10명은 차수마다 8행과 2행으로 나누고 뒤에 요약을 표시한다', () => {
    const pages = capturePages({ ...view, table: { ...view.table, lines: lines.slice(0, 10), rounds: rounds.slice(0, 1), adjustments: [], transfers: [] } })
    expect(pages.map((page) => [page.kind, page.lines.length])).toEqual([['round', 8], ['round', 2], ['summary', 8], ['summary', 2]])
  })
  it('차수가 비어도 전체 정산은 유지하고 잘못된 행 수는 거절한다', () => {
    expect(capturePages({ ...view, table: { ...view.table, rounds: [], adjustments: [], transfers: [] } }).every((page) => page.kind === 'summary')).toBe(true)
    expect(() => capturePages(view, 0)).toThrow(RangeError)
  })
})

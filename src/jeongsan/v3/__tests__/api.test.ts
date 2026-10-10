/**
 * API 연결 계층 — 서버 계약(API.md §1, FC-013·FC-014)을 지키는지, 모드에 따라 목데이터·서버를 고르는지.
 * 서버는 `fetch`를 가짜로 바꿔 흉내 낸다. 환경변수가 모듈을 읽을 때 정해지므로 테스트마다 모듈을 새로 읽는다.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

type Call = { url: string; init: RequestInit }

/** 가짜 서버 — 받은 요청을 기록하고, 정해 둔 응답을 차례로 돌려준다 */
function fakeServer(...responses: { status: number; body?: unknown }[]) {
  const calls: Call[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const r = responses.shift() ?? { status: 500 }
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status })
  }))
  return calls
}

async function load(apiBase: string) {
  vi.resetModules()
  vi.stubEnv('VITE_JEONGSAN_API_BASE_URL', apiBase)
  const api = await import('../api')
  const gateway = await import('../gateway')
  const store = await import('../store')
  return { ...api, ...gateway, useV3: store.useV3 }
}

const ME = { id: 7, nickname: '🌸봄이🌸', profileImageUrl: null, displayName: null, needsName: true }

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('모드 고르기', () => {
  it('서버 주소가 없으면 목데이터 모드 — 목데이터 술자리로 시작한다', async () => {
    const m = await load('')
    expect(m.isApiMode()).toBe(false)
    expect(Object.keys(m.useV3.getState().rooms).length).toBeGreaterThan(0)
  })

  it('서버 주소가 있으면 API 모드 — 가짜 술자리·사람·알림 없이 빈 상태로 시작한다', async () => {
    const m = await load('https://api.test')
    expect(m.isApiMode()).toBe(true)
    const s = m.useV3.getState()
    expect(s.rooms).toEqual({})
    expect(s.users).toEqual([])
    expect(s.notifications).toEqual([])
  })
})

describe('요청 형식', () => {
  it('쿠키 인증이라 모든 요청에 credentials: include, 본문은 JSON으로 보낸다', async () => {
    const calls = fakeServer({ status: 200, body: { ...ME, displayName: '김동규', needsName: false } })
    const m = await load('https://api.test')
    await m.api.putDisplayName('김동규')
    expect(calls[0].url).toBe('https://api.test/api/v1/users/me/display-name')
    expect(calls[0].init.method).toBe('PUT')
    expect(calls[0].init.credentials).toBe('include')
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ displayName: '김동규' })
  })

  it('오류 응답은 code·message를 그대로 담은 ApiError가 된다(API.md §1.2)', async () => {
    fakeServer({ status: 409, body: { code: 'DISPLAY_NAME_ALREADY_SET', message: '이미 등록했어요', errors: null } })
    const m = await load('https://api.test')
    await expect(m.api.putDisplayName('김동규')).rejects.toMatchObject({ status: 409, code: 'DISPLAY_NAME_ALREADY_SET' })
  })

  it('서버에 닿지 못하면 status 0 · NETWORK_ERROR — 화면은 "연결이 불안정해요"를 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const m = await load('https://api.test')
    await expect(m.api.me()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  it('로그인 뒤 돌아올 주소(returnTo)를 붙인다 — 카톡 링크로 들어온 사람이 첫 화면으로 튕기지 않게', async () => {
    const m = await load('https://api.test')
    expect(m.api.kakaoLoginUrl('/jungsan/j/k7Qx2')).toBe('https://api.test/api/v1/auth/kakao/login?returnTo=%2Fjungsan%2Fj%2Fk7Qx2')
    expect(m.api.kakaoLoginUrl()).toBe('https://api.test/api/v1/auth/kakao/login')
  })
})

describe('서버 응답 → 화면 모델', () => {
  it('실명이 아직 없으면 이름은 빈칸, needsName은 그대로 — L2가 먼저 뜬다', async () => {
    const m = await load('https://api.test')
    expect(m.toUser(ME)).toMatchObject({ id: 7, displayName: '', nickname: '🌸봄이🌸', needsName: true })
  })

  it('같은 사람이면 응답에 아직 없는 스푼·계좌는 이전 값을 이어 쓴다', async () => {
    const m = await load('https://api.test')
    const prev = { id: 7, displayName: '', spoonCount: 12, payout: { bank: '국민', accountNo: '1', holder: '김' } }
    expect(m.toUser({ ...ME, displayName: '김동규', needsName: false }, prev)).toMatchObject({ spoonCount: 12, payout: prev.payout })
    expect(m.toUser(ME, { ...prev, id: 8 })).toMatchObject({ spoonCount: 0, payout: undefined })
  })
})

describe('gateway — 화면이 부르는 입구', () => {
  it('로그인 확인: 서버가 내 정보를 주면 스토어에 넣고 true', async () => {
    fakeServer({ status: 200, body: ME })
    const m = await load('https://api.test')
    expect(await m.gateway.loadMe()).toBe(true)
    expect(m.useV3.getState().me).toMatchObject({ id: 7, needsName: true })
  })

  it('로그인 확인: 401이면 로그아웃 상태(false), 스토어는 그대로', async () => {
    fakeServer({ status: 401, body: { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다' } })
    const m = await load('https://api.test')
    expect(await m.gateway.loadMe()).toBe(false)
    expect(m.useV3.getState().me.id).toBe(0)
  })

  it('실명 등록 성공: 서버 응답으로 내 정보가 바뀌고 needsName이 풀린다', async () => {
    fakeServer({ status: 200, body: { ...ME, displayName: '김동규', needsName: false } })
    const m = await load('https://api.test')
    expect(await m.gateway.confirmName('  김동규  ')).toBeNull()
    expect(m.useV3.getState().me).toMatchObject({ displayName: '김동규', needsName: false })
  })

  it('실명 등록이 이미 끝난 사람(409)이면 바꿀 수 없다는 문구를 돌려준다', async () => {
    fakeServer({ status: 409, body: { code: 'DISPLAY_NAME_ALREADY_SET', message: 'conflict' } })
    const m = await load('https://api.test')
    expect(await m.gateway.confirmName('김동규')).toBe('이미 이름을 정했어요. 정한 이름은 바꿀 수 없어요')
  })

  it('규칙에 안 맞는 이름은 서버까지 보내지 않는다(서버와 같은 2~10자 규칙)', async () => {
    const calls = fakeServer()
    const m = await load('https://api.test')
    expect(await m.gateway.confirmName('규')).toBe('성까지 적어주세요')
    expect(calls).toHaveLength(0)
  })

  it('목데이터 모드에서는 서버를 부르지 않고 스토어가 바로 바꾼다', async () => {
    const calls = fakeServer()
    const m = await load('')
    expect(await m.gateway.confirmName('김동구')).toBeNull()
    expect(calls).toHaveLength(0)
    expect(m.useV3.getState().me).toMatchObject({ displayName: '김동구', needsName: false })
  })
})

describe('로그아웃·탈퇴', () => {
  it('로그아웃은 POST /auth/logout 을 부르고, 서버가 실패해도 화면의 술자리·내 정보를 비운다', async () => {
    const calls = fakeServer({ status: 200, body: { ...ME, displayName: '김동규', needsName: false } }, { status: 500 })
    const m = await load('https://api.test')
    await m.gateway.loadMe()
    expect(m.useV3.getState().me.id).toBe(7)
    await m.gateway.logout()
    expect(calls[1].url).toBe('https://api.test/api/v1/auth/logout')
    expect(calls[1].init.method).toBe('POST')
    expect(m.useV3.getState().me.id).toBe(0)
    expect(Object.keys(m.useV3.getState().rooms)).toHaveLength(0)
  })

  it('탈퇴는 DELETE /users/me — 실패하면 문구를 돌려주고 화면은 그대로 둔다', async () => {
    const calls = fakeServer({ status: 200, body: { ...ME, displayName: '김동규', needsName: false } }, { status: 500, body: { code: 'X', message: '잠시 뒤 다시 시도해주세요' } }, { status: 204 })
    const m = await load('https://api.test')
    await m.gateway.loadMe()
    expect(await m.gateway.deleteAccount()).toBe('잠시 뒤 다시 시도해주세요')
    expect(m.useV3.getState().me.id).toBe(7)
    expect(await m.gateway.deleteAccount()).toBeNull()
    expect(calls[2].url).toBe('https://api.test/api/v1/users/me')
    expect(calls[2].init.method).toBe('DELETE')
    expect(m.useV3.getState().me.id).toBe(0)
  })
})

describe('알림 (API v8)', () => {
  it('서버가 준 제목을 그대로 쓰고, 명단에서 빠진 사람의 알림은 내 술자리로 보낸다', async () => {
    fakeServer(
      { status: 200, body: { ...ME, displayName: '김동규', needsName: false } },
      { status: 200, body: [] },
      {
        status: 200, body: [
          { id: 1, type: 'MEMBER_EXCLUDED', gatheringId: 9, settlementUnitId: 9, title: '10/9 술자리에서 빠졌어요', body: '인원(4명) 밖이라 이번 정산에서 빠졌어요', createdAt: '2026-10-10T00:00:00Z', readAt: null },
          { id: 2, type: 'SETTLED', gatheringId: 9, settlementUnitId: 9, title: '정산이 나왔어요', body: '김동규님께 15,000원', createdAt: '2026-10-10T00:00:00Z', readAt: null },
        ],
      },
    )
    const m = await load('https://api.test')
    await m.gateway.loadMe()
    await m.gateway.loadMine()
    const [gone, settled] = m.useV3.getState().notifications
    expect(gone).toMatchObject({ title: '10/9 술자리에서 빠졌어요', body: '인원(4명) 밖이라 이번 정산에서 빠졌어요', link: '/jungsan' })
    expect(settled.link).toBe('/jungsan/r/9/pay')
  })
})

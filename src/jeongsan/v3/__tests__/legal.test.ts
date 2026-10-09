/**
 * 개인정보처리방침·지원 페이지 — 스토어 심사에 넣는 공개 주소. 로그인 없이 열려야 하고, 운영 정보가 비어 있으면 안 된다.
 */
import { describe, expect, it } from 'vitest'
import { OVERSEAS_TRANSFERS, SERVER_LOCATION, unfilled } from '../legal'
import { isV3JoinRoute, isV3PublicRoute, isV3Route } from '../routes'

describe('공개 안내 페이지', () => {
  it('개인정보처리방침·지원 주소는 로그인 없이 여는 공개 경로다', () => {
    expect(isV3PublicRoute('/jungsan/privacy')).toBe(true)
    expect(isV3PublicRoute('/jungsan/support')).toBe(true)
    // 로그인 뒤 화면 경로와 겹치지 않는다
    expect(isV3Route('/jungsan/privacy')).toBe(false)
    expect(isV3JoinRoute('/jungsan/privacy')).toBe(false)
  })

  it('보호책임자·문의 이메일·서버 위치가 모두 채워져 있다 — 자리표시로 배포하지 않는다', () => {
    expect(unfilled()).toEqual([])
  })

  it('서버가 국외에 있으면 국외 이전 고지에 그 나라가 들어 있다 — 개인정보 보호법 제28조의8', () => {
    const domestic = /대한민국|서울|춘천|ap-seoul|ap-chuncheon/.test(SERVER_LOCATION)
    if (!domestic) expect(OVERSEAS_TRANSFERS.some((t) => SERVER_LOCATION.includes(t.country))).toBe(true)
  })
})

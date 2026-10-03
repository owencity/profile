/**
 * 링크 공유 문구 — 단톡방에 뿌릴 한 줄. 받는 사람이 링크만 보고 뭘 하면 되는지 알아야 하고,
 * 공개된 자리라 금액은 넣지 않는다. 앱(`Share.kt`)도 같은 문구.
 */
import { describe, expect, it } from 'vitest'
import { MOCK_ROOMS } from '../mock'
import { isV3Route } from '../routes'
import { shareMessage, shareUrl } from '../share'

const room = (id: number) => structuredClone(MOCK_ROOMS.find((g) => g.id === id)!)

describe('공유 주소', () => {
  it('참여 입구 주소를 지금 열린 곳 기준으로 만든다(끝 슬래시는 정리)', () => {
    expect(shareUrl('https://jungsan.devkdk.com/', 'k7Qx2')).toBe('https://jungsan.devkdk.com/jungsan/j/k7Qx2')
    expect(shareUrl('http://localhost:5199', 'k7Qx2')).toBe('http://localhost:5199/jungsan/j/k7Qx2')
  })
})

describe('공유 문구', () => {
  const url = 'https://x/jungsan/j/k7Qx2'

  it('응답 받는 중이면 "차수마다 마셨는지만 눌러주세요"', () => {
    expect(shareMessage(room(101), url)).toBe(`[정산어택] 동규님의 9/28 술자리\n차수마다 마셨는지만 눌러주세요 👉 ${url}`)
  })

  it('차수가 아직 없으면 먼저 들어오라고 한다', () => {
    const g = { ...room(101), rounds: [] }
    expect(shareMessage(g, url)).toContain('먼저 들어와 있으면 금액이 나올 때 알려드려요')
  })

  it('정산 뒤면 금액 확인을 권한다', () => {
    expect(shareMessage(room(102), url)).toContain('정산 금액을 확인하고 보내주세요')
  })

  it('문구에 금액을 넣지 않는다 — 단톡방은 공개된 자리다', () => {
    for (const id of [101, 102]) expect(shareMessage(room(id), url)).not.toMatch(/\d{1,3},\d{3}|원/)
  })
})

describe('경로', () => {
  it('내 술자리에서 여는 계좌 화면은 v3가 맡는다', () => {
    expect(isV3Route('/jungsan/me/account')).toBe(true)
  })
})

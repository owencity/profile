/**
 * 화면이 부르는 동작의 입구 — 목데이터 모드면 스토어를 바로 바꾸고, API 모드면 서버를 부른 뒤 **서버 응답으로** 스토어를 채운다.
 *
 * 서버 PR이 하나씩 들어올 때마다 여기 동작을 하나씩 API로 옮긴다(FC-014 §14 순서). 아직 옮기지 않은 동작은 화면이
 * 스토어를 직접 부른다 — 그 동작은 목데이터 모드에서만 의미가 있다.
 *
 * 반환값 규칙: 성공이면 `null`, 실패면 **사용자에게 보여줄 문구**. 화면은 문구를 그대로 띄우기만 한다.
 */
import { ApiError, api, isApiMode, toUser } from './api'
import { validateName } from './name'
import { useV3 } from './store'

/** 서버 오류 코드 → 화면 문구. 없는 코드는 서버 message를 그대로 쓴다(API.md §1.2) */
const MESSAGES: Record<string, string> = {
  DISPLAY_NAME_ALREADY_SET: '이미 이름을 정했어요. 정한 이름은 바꿀 수 없어요',
  UNAUTHENTICATED: '로그인이 풀렸어요. 다시 로그인해주세요',
  TOKEN_EXPIRED: '로그인이 풀렸어요. 다시 로그인해주세요',
}

export const messageOf = (e: unknown): string =>
  e instanceof ApiError ? (MESSAGES[e.code] ?? e.message) : '잠시 뒤 다시 시도해주세요'

export const gateway = {
  /**
   * 로그인 여부를 서버에 묻고 내 정보를 스토어에 넣는다. 로그인돼 있으면 true.
   * 목데이터 모드는 서버가 없으므로 false — 로그인 버튼이 상태만 켠다.
   */
  async loadMe(): Promise<boolean> {
    if (!isApiMode()) return false
    try {
      const m = await api.me()
      useV3.getState().setMe(toUser(m, useV3.getState().me))
      return true
    } catch {
      return false // 401 = 로그아웃 상태. 네트워크 오류도 로그인 화면으로 둔다
    }
  },

  /** L2·P1 실명 등록(FC-013). 앞단 검증은 서버와 같은 규칙(2~10자)이라 서버까지 가기 전에 막는다 */
  async confirmName(name: string): Promise<string | null> {
    const errors = validateName(name)
    if (errors.length > 0) return errors[0]
    if (!isApiMode()) {
      useV3.getState().confirmName(name)
      return null
    }
    try {
      const m = await api.putDisplayName(name.trim())
      useV3.getState().setMe(toUser(m, useV3.getState().me))
      return null
    } catch (e) {
      return messageOf(e)
    }
  },
}

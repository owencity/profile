/** 브라우저·계정별 동의 표시다. 서버의 법적 동의 이력이나 앱의 동의 기록을 대신하지 않는다. */
export const WEB_TERMS_VERSION = '2026-11-10'

const validUserId = (userId: number) => Number.isSafeInteger(userId) && userId > 0
export const termsAcceptanceKey = (userId: number) => `jeongsan:terms:${WEB_TERMS_VERSION}:user:${userId}`

export function hasAcceptedTerms(userId: number): boolean {
  if (!validUserId(userId)) return false
  try { return globalThis.localStorage?.getItem(termsAcceptanceKey(userId)) === 'accepted' }
  catch { return false }
}

export function rememberTermsAcceptance(userId: number): void {
  if (!validUserId(userId)) return
  try { globalThis.localStorage?.setItem(termsAcceptanceKey(userId), 'accepted') }
  catch { /* 저장이 제한된 브라우저에서는 현재 화면의 동의만 유지하고 다음 방문에 다시 확인한다. */ }
}

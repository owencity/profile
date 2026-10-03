/**
 * L2 이름(실명) 확인의 규칙 — 앱(`v3/NameRules.kt`)도 같은 길이·같은 문구.
 * 실명을 받는 이유: 총무가 은행 앱의 입금자명과 참여자를 맞춰 봐야 한다.
 * 형식(한글 2~5자 등)은 검사하지 않는다 — 외국인·복성·영문 이름을 막지 않기 위해서다.
 * 10자는 참여자 줄·타임라인·알림 문구("○○님이 보냈대요")에서 깨지지 않는 길이다.
 */
export const MIN_NAME = 2
export const MAX_NAME = 10
export const NAME_GUIDE = '실명을 정확하게 성까지 적어주세요! 그래야 총무가 헷갈리지 않아요!'

/** 저장 전에 막아야 하는 것. 빈 배열이면 저장해도 된다 */
export function validateName(name: string): string[] {
  const n = name.trim()
  if (!n) return ['이름을 넣어주세요']
  if ([...n].length < MIN_NAME) return ['성까지 적어주세요']
  if ([...n].length > MAX_NAME) return [`이름은 ${MAX_NAME}자까지예요`]
  return []
}

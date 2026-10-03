/**
 * L2 이름 확인의 규칙 — 앱(`v3/NameRules.kt`)도 같은 길이·같은 문구.
 * 10자는 참여자 줄·타임라인·알림 문구("○○님이 보냈대요")에서 깨지지 않는 길이다.
 */
export const MAX_NAME = 10

/** 저장 전에 막아야 하는 것. 빈 배열이면 저장해도 된다 */
export function validateName(name: string): string[] {
  const n = name.trim()
  if (!n) return ['이름을 넣어주세요']
  if ([...n].length > MAX_NAME) return [`이름은 ${MAX_NAME}자까지예요`]
  return []
}

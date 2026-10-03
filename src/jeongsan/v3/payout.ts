/**
 * A1 계좌 등록의 규칙 — 은행 목록과 입력 검증. 앱(`v3/PayoutRules.kt`)도 같은 목록·같은 문구.
 */
import type { Payout } from './model'

/** 은행 — 버튼으로 고른다(직접 치지 않게). 많이 쓰는 순서 */
export const BANKS = [
  '카카오뱅크', '토스뱅크', '국민', '신한', '우리', '하나', '농협', '기업',
  '케이뱅크', 'SC제일', '새마을금고', '우체국', '수협', '신협', '부산', '대구',
] as const

/** 계좌번호 입력 정리 — 숫자와 하이픈만 남긴다. 은행 앱에서 복사해 온 "3333-01-…"를 그대로 받으려고 하이픈은 둔다 */
export const cleanAccountNo = (text: string) => text.replace(/[^\d-]/g, '').slice(0, 24)

/** 저장 전에 막아야 하는 것. 빈 배열이면 저장해도 된다 */
export function validatePayout(p: Payout): string[] {
  const errors: string[] = []
  if (!p.bank) errors.push('은행을 골라주세요')
  const digits = p.accountNo.replace(/-/g, '')
  if (digits.length < 8 || digits.length > 16) errors.push('계좌번호를 확인해주세요 (숫자 8~16자리)')
  if (!p.holder.trim()) errors.push('예금주를 넣어주세요')
  else if (p.holder.trim().length > 20) errors.push('예금주는 20자까지예요')
  return errors
}

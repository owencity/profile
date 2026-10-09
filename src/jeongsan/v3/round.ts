/**
 * 차수 편집(R2)의 규칙 — 화면과 떼어 둔다. 앱도 같은 프리셋·같은 검증을 옮겨 쓴다.
 *
 * ⚠ 여기서 하는 덧셈(술 합계)은 **입력값 검증용**이다. 1인당 금액 계산이 아니다 —
 * 정산 계산은 서버 `core`만 한다.
 */
import type { DrinkItem, Gathering, Id, Money } from './model'

/** 술 프리셋 — docs/SCREENS.md §5 R2. 가격은 병당 기본값이고 탭해서 고친다. */
export const DRINK_PRESETS: readonly DrinkItem[] = [
  { name: '소주', unitPrice: 5_000, quantity: 1 },
  { name: '맥주', unitPrice: 5_000, quantity: 1 },
  { name: '막걸리', unitPrice: 4_000, quantity: 1 },
  { name: '하이볼', unitPrice: 7_000, quantity: 1 },
  { name: '와인', unitPrice: 30_000, quantity: 1 },
]

/** 한 차수 금액 상한 — 오타(0 하나 더)를 잡기 위한 값. 서버 검증과 별개로 둔다. */
export const MAX_ROUND_TOTAL: Money = 10_000_000

export type RoundDraft = {
  /** 새 차수면 없다 */
  id?: Id
  total: Money
  drinks: DrinkItem[]
  payerParticipantId: Id
}

/** 입력칸 문자열 → 원. 숫자 외 글자는 버린다("184,000원" → 184000). */
export function parseAmount(text: string): Money {
  const digits = text.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export const drinksTotal = (drinks: DrinkItem[]): Money =>
  drinks.reduce((sum, d) => sum + d.unitPrice * d.quantity, 0)

/** 저장 전에 막아야 하는 것. 빈 배열이면 저장해도 된다. */
export function validateRound(d: RoundDraft, g: Gathering): string[] {
  const errors: string[] = []
  if (d.total <= 0) errors.push('금액을 넣어주세요')
  else if (d.total > MAX_ROUND_TOTAL) errors.push('금액이 너무 커요. 0을 하나 더 넣지 않았는지 확인해주세요')
  if (d.drinks.some((x) => x.unitPrice <= 0)) errors.push('술 가격을 넣어주세요')
  if (d.drinks.some((x) => x.quantity < 1)) errors.push('병 수는 1 이상이어야 해요')
  if (d.drinks.some((x) => !x.name.trim())) errors.push('술 이름을 넣어주세요')
  if (d.total > 0 && drinksTotal(d.drinks) > d.total) errors.push('술값 합계가 이 차수 금액보다 커요')
  if (!g.participants.some((p) => p.id === d.payerParticipantId)) errors.push('낸 사람을 골라주세요')
  return errors
}

/** 차수 이름은 순서로 정한다. 중간 차수를 지우면 뒤 차수가 당겨진다(1·2·3차 → 2차 삭제 → 1·2차). */
/**
 * 차수 번호를 다시 매긴다. start: 이 정산방의 첫 차수 번호 — 다음 차 총무의 정산방은 술자리 전체 번호를 이어받는다
 * (B의 첫 차수가 3차). 서버 모드는 서버가 준 seq 를 그대로 쓰고 이 함수는 목데이터에서만 쓴다
 */
export function relabel<T extends { seq: number; label: string }>(rounds: T[], start = 1): T[] {
  return [...rounds].sort((a, b) => a.seq - b.seq).map((r, i) => ({ ...r, seq: start + i, label: `${start + i}차` }))
}

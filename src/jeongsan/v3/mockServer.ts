/**
 * ⚠ 서버 흉내 — 정산 미리보기(`POST .../settlement/preview`)와 정산하기의 결과를 만든다.
 *
 * 프론트는 금액을 계산하지 않는다(SCREENS.md §8). 그런데 목데이터 단계에서 R3 미리보기와
 * 정산 뒤 송금 목록이 응답에 따라 움직여야 흐름을 끝까지 걸어볼 수 있다. 그래서 **계산을 이
 * 파일 하나에 가두고**, 화면은 이 결과를 "서버가 준 값"으로만 다룬다. 백엔드 v3 API가 붙으면
 * 이 파일을 통째로 지우고 호출부를 API로 바꾼다.
 *
 * 규칙은 실제 계산(CALC_RULES_V2)이 아니라 흉내다: 차수마다 술값은 알코올끼리, 나머지는
 * 참석자(논알코올·알코올)끼리 나누고 100원 아래는 버린다. 버린 자투리는 결제자가 떠안는다.
 * 면제·불참은 0원.
 */
import type { Gathering, Id, Money, ResponseType, RoundResponse, TransferBasis } from './model'
import { responseOf } from './model'
import { drinksTotal } from './round'

export type PreviewLine = {
  participantId: Id
  /** 이 사람이 부담하는 합계(결제자 본인 몫 포함) */
  total: Money
  /** 응답이 없어 자동응답(전 차수 참석·알코올)으로 계산되는가 */
  auto: boolean
  rounds: TransferBasis[]
}

export type PreviewTransfer = { fromParticipantId: Id; toParticipantId: Id; amount: Money; basis: TransferBasis[] }

export type SettlePreview = {
  /** 정산하기 요청에 같이 보낸다 — 그 사이 입력이 바뀌었으면 서버가 409로 거절한다 */
  inputRevision: number
  /** 서버 미리보기의 입력 해시 — 정산하기에 그대로 돌려보낸다(ADR-004). 목데이터는 없다 */
  inputHash?: string
  lines: PreviewLine[]
  transfers: PreviewTransfer[]
}

/** 응답이 빈 칸은 정산 때 "참석·알코올"로 채운다 — REQUIREMENTS 자동응답 규칙 */
export function withAutoResponses(g: Gathering): RoundResponse[] {
  const filled = [...g.responses]
  for (const p of g.participants) {
    for (const r of g.rounds) {
      if (!responseOf(g, p.id, r.id)) filled.push({ participantId: p.id, roundId: r.id, type: 'DRANK', source: 'AUTO' })
    }
  }
  return filled
}

const floor100 = (n: number) => Math.floor(n / 100) * 100

export function mockPreview(g: Gathering): SettlePreview {
  const responses = withAutoResponses(g)
  const typeOf = (pid: Id, rid: Id): ResponseType =>
    responses.find((x) => x.participantId === pid && x.roundId === rid)!.type

  // share[pid][roundId] = 그 차수 부담액
  const share = new Map<Id, Map<Id, Money>>(g.participants.map((p) => [p.id, new Map()]))

  for (const r of g.rounds) {
    const eaters = g.participants.filter((p) => ['SOBER', 'DRANK'].includes(typeOf(p.id, r.id)))
    const drinkers = eaters.filter((p) => typeOf(p.id, r.id) === 'DRANK')
    const drinkPool = drinkers.length > 0 ? Math.min(drinksTotal(r.drinks), r.total) : 0
    const foodPool = r.total - drinkPool

    let othersSum = 0
    for (const p of g.participants) {
      if (p.id === r.payerParticipantId) continue
      const t = typeOf(p.id, r.id)
      let amount = 0
      if (eaters.includes(p) && eaters.length > 0) amount += floor100(foodPool / eaters.length)
      if (t === 'DRANK') amount += floor100(drinkPool / drinkers.length)
      share.get(p.id)!.set(r.id, amount)
      othersSum += amount
    }
    // 결제자는 나머지를 떠안는다(자기 몫 + 자투리). 아무도 참석 안 했으면 전부.
    share.get(r.payerParticipantId)?.set(r.id, r.total - othersSum)
  }

  const lines: PreviewLine[] = g.participants.map((p) => {
    const rounds = g.rounds.map((r) => ({ roundId: r.id, type: typeOf(p.id, r.id), amount: share.get(p.id)!.get(r.id) ?? 0 }))
    return {
      participantId: p.id,
      total: rounds.reduce((s, x) => s + x.amount, 0),
      auto: responses.some((x) => x.participantId === p.id && x.source === 'AUTO'),
      rounds,
    }
  })

  // 송금: 결제자가 아닌 사람 → 그 차수 결제자. 같은 사람에게 보낼 건 한 번으로 묶는다.
  const byPair = new Map<string, PreviewTransfer>()
  for (const r of g.rounds) {
    for (const p of g.participants) {
      if (p.id === r.payerParticipantId) continue
      const amount = share.get(p.id)!.get(r.id) ?? 0
      if (amount <= 0) continue
      const key = `${p.id}>${r.payerParticipantId}`
      const t = byPair.get(key) ?? { fromParticipantId: p.id, toParticipantId: r.payerParticipantId, amount: 0, basis: [] }
      t.amount += amount
      t.basis.push({ roundId: r.id, type: typeOf(p.id, r.id), amount })
      byPair.set(key, t)
    }
  }

  return { inputRevision: g.inputRevision, lines, transfers: [...byPair.values()] }
}

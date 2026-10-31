import { request } from './api'
import type { GatheringStatus, ResponseType } from './model'

export type TableLine = { participantId: number; name: string; total: number; paidTotal: number }
export type TableRound = { roundId: number; seq: number; payerParticipantId: number; total: number; foodTotal: number; alcoholTotal: number; displayTotal: number
  cells: { participantId: number; type: ResponseType; food: number; alcohol: number; amount: number; source: 'SELF' | 'HOST' | 'AUTO' | 'UNANSWERED' }[] }
export type TableAdjustment = { recipientParticipantId: number; cells: Record<string, number> }
export type SettlementTable = {
  gatheringId: number; settlementUnitId: number; title: string; status: GatheringStatus; isEstimate: boolean
  generatedAt: string; inputRevision: number; inputHash: string
  table: { lines: TableLine[]; rounds: TableRound[]; adjustments: TableAdjustment[]; grandTotal: number
    transfers: { fromParticipantId: number; toParticipantId: number; amount: number }[] }
}
export const fetchSettlementTable = (gatheringId: number, unitId: number) =>
  request<SettlementTable>('GET', `/api/v1/gatherings/${gatheringId}/settlement-units/${unitId}/settlement/table`)

/** 화면 밖 열뿐 아니라 긴 차수 목록도 나눠서 캡처에 누락되지 않게 한다. 금액은 재계산하지 않는다. */
export function capturePages(view: SettlementTable) {
  const pages: { lines: TableLine[]; rounds: TableRound[]; adjustments: TableAdjustment[]; transfers: SettlementTable['table']['transfers'] }[] = []
  const peoplePerPage = view.table.grandTotal.toLocaleString('ko-KR').length > 9 ? 1 : 2
  for (let personStart = 0; personStart < view.table.lines.length; personStart += peoplePerPage) {
    const lines = view.table.lines.slice(personStart, personStart + peoplePerPage)
    for (let roundStart = 0; roundStart < view.table.rounds.length; roundStart += 2) {
      pages.push({ lines, rounds: view.table.rounds.slice(roundStart, roundStart + 2), adjustments: [], transfers: [] })
    }
    // 조정이 많은 정산도 마지막 페이지 높이를 무한히 늘리지 않는다.
    for (let adjustmentStart = 0; adjustmentStart < view.table.adjustments.length; adjustmentStart += 4) {
      pages.push({ lines, rounds: [], adjustments: view.table.adjustments.slice(adjustmentStart, adjustmentStart + 4), transfers: [] })
    }
    const transfers = view.table.transfers.filter((transfer) => lines.some((line) => line.participantId === transfer.fromParticipantId))
    for (let transferStart = 0; transferStart < transfers.length; transferStart += 6) {
      pages.push({ lines, rounds: [], adjustments: [], transfers: transfers.slice(transferStart, transferStart + 6) })
    }
  }
  return pages
}

export function cellNote(cell: TableRound['cells'][number]): string {
  if (cell.source === 'UNANSWERED') return '미응답·예상'
  if (cell.type === 'ABSENT') return '불참'
  if (cell.type === 'EXEMPT') return '면제'
  const label = cell.type === 'DRANK' ? '알코올' : '논알코올'
  return cell.source === 'AUTO' ? `${label}·자동` : cell.source === 'HOST' ? `${label}·총무` : label
}

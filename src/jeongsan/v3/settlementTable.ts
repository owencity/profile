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

export type TablePage = { kind: 'round' | 'adjustment' | 'summary' | 'transfer'; lines: TableLine[]; round?: TableRound; adjustment?: TableAdjustment; transfers: SettlementTable['table']['transfers'] }

/** 인원이 늘어도 열은 유지하고 긴 캡처만 행으로 나눈다. 금액은 서버 표시값 그대로다. */
export function capturePages(view: SettlementTable, rowsPerPage = 8): TablePage[] {
  if (!Number.isSafeInteger(rowsPerPage) || rowsPerPage < 1) throw new RangeError('rowsPerPage must be positive')
  const pages: TablePage[] = []
  const groups: TableLine[][] = []
  for (let start = 0; start < view.table.lines.length; start += rowsPerPage) groups.push(view.table.lines.slice(start, start + rowsPerPage))
  for (const round of view.table.rounds) for (const lines of groups) pages.push({ kind: 'round', lines, round, transfers: [] })
  for (const adjustment of view.table.adjustments) for (const lines of groups) pages.push({ kind: 'adjustment', lines, adjustment, transfers: [] })
  for (const lines of groups) pages.push({ kind: 'summary', lines, transfers: [] })
  for (let start = 0; start < view.table.transfers.length; start += rowsPerPage) pages.push({ kind: 'transfer', lines: [], transfers: view.table.transfers.slice(start, start + rowsPerPage) })
  return pages
}

export function cellNote(cell: TableRound['cells'][number]): string {
  if (cell.source === 'UNANSWERED') return '미응답·예상'
  if (cell.type === 'ABSENT') return '불참'
  if (cell.type === 'EXEMPT') return '면제'
  const label = cell.type === 'DRANK' ? '알코올' : '논알코올'
  return cell.source === 'AUTO' ? `${label}·자동` : cell.source === 'HOST' ? `${label}·총무` : label
}

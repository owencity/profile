import type { SettlementTable } from './settlementTable'

export const canExportSettlement = (view: SettlementTable) => !view.isEstimate && ['SETTLING', 'COMPLETED'].includes(view.status) && view.table.lines.length > 0

/** 전체 인원은 보존한다. 거대한 캔버스를 만들거나 일부를 자르는 대신 생성 전에 거절한다. */
export function exportScale(width: number, height: number): number {
  if (![width, height].every(v => Number.isFinite(v) && v > 0)) throw new RangeError('Invalid image size')
  const scale = Math.min(2, 8192 / width, 8192 / height, Math.sqrt(12_000_000 / (width * height)))
  if (scale < 1) throw new RangeError('Image too large')
  return scale
}

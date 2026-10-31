import { describe, expect, it } from 'vitest'
import { canExportSettlement, exportScale } from '../settlementImageExport'
import type { SettlementTable } from '../settlementTable'

const view: SettlementTable = { gatheringId: 1, settlementUnitId: 2, title: '술자리', status: 'SETTLING', isEstimate: false, generatedAt: '2026-10-31T00:00:00Z', inputHash: 'x', inputRevision: 1,
  table: { lines: [{ participantId: 1, name: '김하나', total: 1000, paidTotal: 1000 }], rounds: [], adjustments: [], transfers: [], grandTotal: 1000 } }

describe('확정 전체 이미지', () => {
  it('입금 완료 전에도 금액이 확정됐으면 저장할 수 있지만 예상·빈 표는 안 된다', () => {
    expect(canExportSettlement(view)).toBe(true)
    expect(canExportSettlement({ ...view, status: 'COMPLETED' })).toBe(true)
    expect(canExportSettlement({ ...view, status: 'OPEN', isEstimate: true })).toBe(false)
    expect(canExportSettlement({ ...view, isEstimate: true })).toBe(false)
    expect(canExportSettlement({ ...view, table: { ...view.table, lines: [] } })).toBe(false)
  })
  it('25명 전체 가로폭을 유지하면서 해상도를 메모리 한도에 맞춘다', () => {
    const width = 360 + 25 * 150
    const height = 1800
    const scale = exportScale(width, height)
    expect(scale).toBeGreaterThanOrEqual(1)
    expect(width * scale).toBeLessThanOrEqual(8192)
    expect(width * height * scale * scale).toBeLessThanOrEqual(12_000_001)
  })
  it.each([[0, 100], [Infinity, 100], [9000, 100], [4000, 4000]])('지원 범위 밖 %s×%s는 잘라내거나 할당하기 전에 거절한다', (width, height) => {
    expect(() => exportScale(width, height)).toThrow(RangeError)
  })
})

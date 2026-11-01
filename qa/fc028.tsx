// 개발 서버에서만 여는 화면 검증 fixture. 운영 index.html은 이 모듈을 불러오지 않는다.
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import JeongsanApp from '../src/jeongsan/JeongsanApp'
import { SettlementTablePanel } from '../src/jeongsan/v3/SettlementTablePanel'
import type { GuestMe, GuestMoney, GuestPreview } from '../src/jeongsan/v3/guestApi'
import type { SettlementTable } from '../src/jeongsan/v3/settlementTable'
import '../src/index.css'

if (!import.meta.env.DEV) throw new Error('로컬 검증 전용')
const preview: GuestPreview = { gatheringId: 1, title: '금요일 술자리', date: '2026-10-31', participantCount: 4, status: 'OPEN', settlementUnits: [{ id: 10, status: 'OPEN', host: { displayName: '김총무', spoonCount: 7 }, rounds: [{ id: 101, seq: 1, total: 37400 }, { id: 102, seq: 2, total: 104000 }] }] }
let me: GuestMe | null = null
let money: GuestMoney = { gatheringId: 1, settlementUnitId: 10, participantId: 2, status: 'OPEN', isEstimate: true, available: true, errorCode: null, total: 36100, settledAt: null, transfers: [{ id: null, toParticipantId: 1, toDisplayName: '김총무', amount: 36100, status: 'PREVIEW', payout: null, basis: [{ roundId: 101, type: 'DRANK', amount: 10100 }, { roundId: 102, type: 'SOBER', amount: 26000 }] }] }
const table: SettlementTable = { gatheringId: 1, settlementUnitId: 10, title: preview.title, status: 'SETTLING', isEstimate: false, generatedAt: '2026-10-31T13:00:00Z', inputRevision: 4, inputHash: 'fixture', table: {
  lines: ['김총무', '김하나', '김하나', '서진호'].map((name, index) => ({ participantId: index + 1, name, total: [36100, 36100, 33100, 36100][index], paidTotal: index === 0 ? 141400 : 0 })),
  rounds: preview.settlementUnits[0].rounds.map((round, index) => ({ roundId: round.id, seq: round.seq, payerParticipantId: 1, total: round.total, foodTotal: index ? 104000 : 28400, alcoholTotal: index ? 0 : 9000, displayTotal: round.total,
    cells: [1, 2, 3, 4].map((participantId, cellIndex) => ({ participantId, type: cellIndex === 2 ? 'SOBER' : 'DRANK', food: index ? 26000 : 7100, alcohol: index ? 0 : [3000, 3000, 0, 3000][cellIndex], amount: index ? 26000 : [10100, 10100, 7100, 10100][cellIndex], source: cellIndex === 3 ? 'AUTO' : 'SELF' })) })),
  adjustments: [], grandTotal: 141400, transfers: [2, 3, 4].map((participantId, index) => ({ fromParticipantId: participantId, toParticipantId: 1, amount: [36100, 33100, 36100][index] })),
} }
let activeTable = table
const json = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status })
window.fetch = async (input, init) => {
  const url = new URL(String(input), window.location.origin)
  const path = url.pathname
  if (path.endsWith('/auth/me')) return json({ code: 'UNAUTHENTICATED' }, 401)
  if (path === '/api/v1/join/fixture') return json(preview)
  if (path === '/api/v1/guest/session') return json(null, 204)
  if (path.endsWith('/settlement/table')) return json(activeTable)
  if (path === '/api/v1/guest/gatherings/1/me') return me ? json(me) : json({ code: 'NOT_PARTICIPANT' }, 403)
  if (path === '/api/v1/guest/join/fixture') {
    const body = JSON.parse(String(init?.body))
    me = { gatheringId: 1, title: preview.title, participantId: 2, displayName: body.displayName, canEditName: true, settlementUnits: [{ id: 10, status: 'OPEN', inputRevision: 1, included: true }], rounds: preview.settlementUnits[0].rounds.map((round) => ({ ...round, settlementUnitId: 10 })), responses: body.responses.map((answer: { roundId: number; type: string }) => ({ ...answer, source: 'SELF' })) }
    return json(me)
  }
  if (path.endsWith('/responses/me') && me) {
    const body = JSON.parse(String(init?.body))
    if (body.displayName && body.displayName !== me.displayName) {
      if (!me.canEditName) return json({ code: 'GUEST_NAME_LOCKED' }, 409)
      if (body.expectedDisplayName !== me.displayName) return json({ code: 'GUEST_NAME_STALE' }, 409)
      me.displayName = body.displayName
    }
    me.responses = body.answers.map((answer: { roundId: number; type: string }) => ({ ...answer, source: 'SELF' }))
    return json(null, 204)
  }
  if (path.endsWith('/settlement')) return json(money)
  if (path.endsWith('/sent')) { money.transfers[0].status = 'SENT'; return json(null, 204) }
  return json({ code: 'FIXTURE_NOT_FOUND', message: path }, 404)
}
export function Harness() {
  const [host, setHost] = useState(false)
  const [version, setVersion] = useState(0)
  const [width, setWidth] = useState(390)
  function manyPeople() {
    const lines = Array.from({ length: 25 }, (_, i) => ({ participantId: i + 1, name: i === 24 ? '긴이름확인참여자' : '김하나', total: i < 12 ? 3000 : 2000, paidTotal: i === 0 ? 62000 : 0 }))
    activeTable = { ...table, title: '25명 술자리', table: { grandTotal: 62000, lines, adjustments: [],
      rounds: [1, 2].map((seq) => ({ roundId: seq, seq, payerParticipantId: 1, total: seq === 1 ? 37000 : 25000, foodTotal: 25000, alcoholTotal: seq === 1 ? 12000 : 0, displayTotal: seq === 1 ? 37000 : 25000,
        cells: lines.map((line, i) => ({ participantId: line.participantId, type: i < 12 ? 'DRANK' : 'SOBER', source: i === 24 ? 'AUTO' : 'SELF', food: 1000, alcohol: seq === 1 && i < 12 ? 1000 : 0, amount: seq === 1 && i < 12 ? 2000 : 1000 })) })),
      transfers: lines.slice(1).map((line) => ({ fromParticipantId: line.participantId, toParticipantId: 1, amount: line.total })),
    } }
    setHost(true); setVersion((value) => value + 1)
  }
  function saveRenderedImage() {
    const image = document.querySelector<HTMLImageElement>('.js-capture-image')
    if (!image) return
    const link = document.createElement('a')
    link.href = image.src; link.download = 'fc028-capture.png'; link.click()
  }
  function settle() {
    if (me) { me.settlementUnits[0].status = 'SETTLING'; me.canEditName = false }
    money = { ...money, status: 'SETTLING', isEstimate: false, settledAt: table.generatedAt, transfers: money.transfers.map((transfer) => ({ ...transfer, id: 1, status: 'WAITING', payout: { bank: '검증은행', accountNo: '00123456789', holder: '김총무' } })) }
    setVersion((value) => value + 1)
  }
  return <><nav style={{ padding: 12, background: '#fff0cc', display: new URLSearchParams(window.location.search).get('phone') === '1' ? 'none' : undefined }}>로컬 가상 응답 · 운영 데이터 아님 <button onClick={() => setHost(!host)}>{host ? '참여 화면' : '총무 표'}</button><button onClick={manyPeople}>25명 표</button><button onClick={() => { activeTable = table; setVersion((v) => v + 1) }}>4명 표</button><button onClick={settle}>정산 확정 fixture</button><button onClick={() => setWidth(width === 390 ? 320 : 390)}>{width === 390 ? '320px' : '390px'}</button><button onClick={saveRenderedImage}>검증용 PNG 보존</button></nav><div style={{ width, maxWidth: '100%', margin: 'auto' }}>{host ? <div className="js-root"><div className="js-shell"><SettlementTablePanel key={version} gatheringId={1} unitId={10} onClose={() => setHost(false)} /></div></div> : <JeongsanApp key={version} route="/jungsan/j/fixture" navigate={() => undefined} />}</div></>
}
createRoot(document.getElementById('root')!).render(<Harness />)

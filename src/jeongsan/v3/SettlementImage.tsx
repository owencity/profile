import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SettlementTable } from './settlementTable'
import { cellNote } from './settlementTable'
import { exportScale, canExportSettlement } from './settlementImageExport'

/** 화면 표와 독립적인 넓이로 그려 모바일에서 화면 밖 인원이 잘리는 것을 막는다. */
export function SettlementImage({ view }: { view: SettlementTable }) {
  const card = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const running = useRef(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  if (!canExportSettlement(view)) return null
  const name = (id: number) => `${view.table.lines.find(p => p.participantId === id)?.name ?? '참여자'} #${id}`
  const money = (value?: number) => value === undefined ? '—' : value.toLocaleString('ko-KR')
  const filename = `정산어택-${view.settlementUnitId}-v${view.inputRevision}.png`
  async function generate() {
    if (!card.current || running.current) return
    running.current = true; setBusy(true); setError('')
    try {
      await document.fonts.ready
      const rect = card.current.getBoundingClientRect()
      const scale = exportScale(rect.width, rect.height)
      const { default: html2canvas } = await import('html2canvas-pro')
      const canvas = await html2canvas(card.current, { backgroundColor: '#ffffff', scale, windowWidth: Math.ceil(rect.width) })
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG')), 'image/png'))
      canvas.width = 0; canvas.height = 0
      if (alive.current) setUrl(URL.createObjectURL(blob))
    } catch {
      if (alive.current) setError('이미지를 만들지 못했어요. 표가 너무 크거나 기기 메모리가 부족할 수 있어요. 전체 표는 아래에서 확인할 수 있습니다.')
    } finally { running.current = false; if (alive.current) setBusy(false) }
  }
  return <section className="js-settlement-export" aria-label="확정 정산표 이미지 저장">
    <strong>정산 금액이 확정되었습니다!</strong>
    <p>전원이 가로로 들어간 정산표 이미지를 저장해 단톡방에 공유하세요. 참여자는 앱 없이 보낼 대상과 금액을 확인할 수 있어요.</p>
    <button className="js-mini" disabled={busy} onClick={() => { void generate() }}>{busy ? '이미지 만드는 중…' : '전체 정산표 이미지 만들기'}</button>
    {error && <p role="alert">{error}</p>}
    {url && <><a className="js-mini" href={url} download={filename}>정산표 PNG 다운로드</a><p>아래 이미지를 확대해 확인할 수 있어요. 다운로드가 열리지 않으면 이미지를 길게 눌러 저장해주세요.</p><a href={url} target="_blank" rel="noreferrer">이미지 크게 보기</a><img className="js-capture-image" src={url} alt={`${view.title} 전원 가로형 정산표`} /></>}
    {createPortal(<div className="js-export-offscreen" aria-hidden="true"><div ref={card} className="js-export-canvas" style={{ width: Math.max(800, 360 + view.table.lines.length * 150) }}>
      <h2>정산어택 · {view.title}</h2><p>금액 확정 · 정산방 #{view.settlementUnitId} · {view.generatedAt} 기준 · 단위: 원</p>
      <table><colgroup><col style={{ width: 200 }} /><col style={{ width: 140 }} />{view.table.lines.map(p => <col key={p.participantId} />)}</colgroup>
        <thead><tr><th>차수·항목</th><th>결제액</th>{view.table.lines.map(p => <th key={p.participantId}>{p.name}<br />#{p.participantId}</th>)}</tr></thead>
        <tbody><tr className="js-export-send"><th>최종 보낼 금액<br /><small>받는 사람별 송금</small></th><td>—</td>{view.table.lines.map(p => {
          const outgoing = view.table.transfers.filter(t => t.fromParticipantId === p.participantId)
          return <td key={p.participantId}>{outgoing.length ? outgoing.map(t => <div key={t.toParticipantId}><span>→ {name(t.toParticipantId)}</span><strong>{money(t.amount)}원</strong></div>) : <strong>보낼 돈 없음</strong>}</td>
        })}</tr><tr className="js-export-round"><th colSpan={view.table.lines.length + 2}>아래는 계산 근거입니다 · 송금은 위 ‘최종 보낼 금액’을 확인해주세요</th></tr>
          {view.table.rounds.map(round => <Round key={round.roundId} view={view} round={round} />)}
          {view.table.adjustments.map(a => <tr key={a.recipientParticipantId}><th>원 단위 조정<br />{name(a.recipientParticipantId)} 결제분</th><td>—</td>{view.table.lines.map(p => <td key={p.participantId}>{money(a.cells[String(p.participantId)] ?? 0)}</td>)}</tr>)}
          <tr className="js-export-total"><th>전체 부담<br /><small>보낼 금액과 다릅니다</small></th><td>{money(view.table.grandTotal)}</td>{view.table.lines.map(p => <td key={p.participantId}>{money(p.total)}</td>)}</tr>
          <tr><th>이미 결제한 금액</th><td>—</td>{view.table.lines.map(p => <td key={p.participantId}>{money(p.paidTotal)}</td>)}</tr>
        </tbody></table>
      <h3>송금 안내 · 확정 당시 금액</h3>
      {view.table.transfers.length ? view.table.transfers.map(t => <p key={`${t.fromParticipantId}-${t.toParticipantId}`}>{name(t.fromParticipantId)} → {name(t.toParticipantId)} : {money(t.amount)}원</p>) : <p>보낼 금액이 없습니다.</p>}
      <p>표시 금액의 원 미만 차이는 원 단위 조정에 반영됩니다.</p><p>이 이미지는 확정 당시 금액입니다. 입금 확인과 문의는 총무에게 해주세요.</p>
    </div></div>, document.body)}
  </section>
}

function Round({ view, round }: { view: SettlementTable; round: SettlementTable['table']['rounds'][number] }) {
  const cells = view.table.lines.map(p => round.cells.find(c => c.participantId === p.participantId))
  const payer = view.table.lines.find(p => p.participantId === round.payerParticipantId)
  return <><tr className="js-export-round"><th colSpan={view.table.lines.length + 2}>{round.seq}차 · 결제자 {payer?.name ?? '참여자'} #{round.payerParticipantId} · {round.total.toLocaleString('ko-KR')}원</th></tr>
    <tr><th>참여</th><td>—</td>{cells.map((c, i) => <td key={view.table.lines[i].participantId}>{c ? cellNote(c) : '—'}</td>)}</tr>
    {(['food', 'alcohol', 'amount'] as const).map((field, i) => <tr key={field}><th>{['안주', '술', '차수 부담 (조정 전)'][i]}</th><td>{i === 2 ? '—' : (i === 0 ? round.foodTotal : round.alcoholTotal).toLocaleString('ko-KR')}</td>{cells.map((c, j) => <td key={view.table.lines[j].participantId}>{c?.[field].toLocaleString('ko-KR') ?? '—'}</td>)}</tr>)}
  </>
}

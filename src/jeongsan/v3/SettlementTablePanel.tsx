import { useEffect, useRef, useState } from 'react'
import { fetchSettlementTable, capturePages, cellNote } from './settlementTable'
import type { SettlementTable, TableLine, TableRound, TableAdjustment } from './settlementTable'
import { messageOf } from './gateway'
import { won } from './model'
import './guest.css'

export function SettlementTablePanel({ gatheringId, unitId, onClose }: { gatheringId: number; unitId: number; onClose: () => void }) {
  const [view, setView] = useState<SettlementTable | null>(null)
  const [error, setError] = useState('')
  const [capture, setCapture] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetchSettlementTable(gatheringId, unitId).then((value) => { if (!cancelled) setView(value) }).catch((failure: unknown) => { if (!cancelled) setError(messageOf(failure)) })
    return () => { cancelled = true }
  }, [gatheringId, unitId, revision])
  const refresh = () => { setView(null); setError(''); setRevision((value) => value + 1) }
  return <section className="js-table-panel" aria-label="총무 정산표">
    <div className="js-allsame"><button className="js-mini" onClick={onClose}>정산방으로</button><button className="js-mini" onClick={refresh}>최신 표 보기</button>{view && <button className="js-mini" aria-pressed={capture} onClick={() => setCapture(!capture)}>{capture ? '전체 표로 보기' : '캡처용으로 보기'}</button>}</div>
    {error ? <p role="alert">{error}</p> : !view ? <p role="status">정산표를 불러오고 있어요…</p> : <>
      <h2>{view.title} · 정산표</h2>
      <p>{view.isEstimate ? '응답이 바뀌면 금액도 바뀌는 예상 표예요.' : '확정된 정산표예요.'} 캡처한 이미지는 자동으로 갱신되지 않아요.</p>
      <p className="js-hint">안주·음료는 함께 나누고 술은 알코올 참여자끼리 나눠요. 셀의 원 미만 금액은 하단 조정에 반영되어 최종 합계와 일치해요.</p>
      {capture ? <><p>모든 사람과 차수를 여러 장으로 나눴어요. 각 장을 캡처하거나 이미지로 열어 저장해주세요.</p>{capturePages(view).map((page, index, pages) => <CaptureCard key={`${revision}-${index}`} view={view} page={page} index={index} count={pages.length} />)}</> : <><div className="js-table-scroll" tabIndex={0} role="region" aria-label="가로로 넘기는 전체 정산표"><MoneyTable view={view} lines={view.table.lines} rounds={view.table.rounds} adjustments={view.table.adjustments} /></div><TransferList view={view} transfers={view.table.transfers} /></>}
    </>}
  </section>
}

function MoneyTable({ view, lines, rounds, adjustments }: { view: SettlementTable; lines: TableLine[]; rounds: TableRound[]; adjustments: TableAdjustment[] }) {
  const nameOf = (participantId: number) => view.table.lines.find((line) => line.participantId === participantId)?.name ?? '결제자'
  return <table className="js-money-table"><caption>{view.isEstimate ? '예상' : '확정'} · 정산 {view.settlementUnitId} · {new Date(view.generatedAt).toLocaleString('ko-KR')} 기준</caption>
    <thead><tr><th scope="col">차수·항목</th><th scope="col">결제액</th>{lines.map((line) => <th scope="col" key={line.participantId}>{line.name}<small>#{line.participantId}</small></th>)}</tr></thead>
    <tbody>{rounds.map((round) => <RoundRows key={round.roundId} round={round} lines={lines} payer={nameOf(round.payerParticipantId)} />)}
      {adjustments.map((adjustment) => <tr key={adjustment.recipientParticipantId}><th scope="row">원 단위 조정<small>{nameOf(adjustment.recipientParticipantId)} 결제분</small></th><td>—</td>{lines.map((line) => <td key={line.participantId}><Amount value={adjustment.cells[String(line.participantId)] ?? 0} /></td>)}</tr>)}
    </tbody>
    <tfoot><tr><th scope="row">전체 차수 합계</th><td><Amount value={view.table.grandTotal} /></td>{lines.map((line) => <td key={line.participantId}><Amount value={line.total} /></td>)}</tr></tfoot>
  </table>
}
function RoundRows({ round, lines, payer }: { round: TableRound; lines: TableLine[]; payer: string }) {
  return <>
    <tr className="js-round-heading"><th colSpan={lines.length + 2} scope="rowgroup">{round.seq}차 · 결제자 {payer} · {won(round.total)}</th></tr>
    <tr><th scope="row">참여</th><td>—</td>{lines.map((line) => { const cell = round.cells.find((candidate) => candidate.participantId === line.participantId); return <td className="js-cell-note" key={line.participantId}>{cell ? cellNote(cell) : '—'}</td> })}</tr>
    {(['food', 'alcohol'] as const).map((item) => <tr key={item}><th scope="row">{item === 'food' ? '안주·음료' : '술'}</th><td><Amount value={item === 'food' ? round.foodTotal : round.alcoholTotal} /></td>{lines.map((line) => <td key={line.participantId}><Amount value={round.cells.find((cell) => cell.participantId === line.participantId)?.[item]} /></td>)}</tr>)}
  </>
}

function Amount({ value }: { value?: number }) {
  const text = value?.toLocaleString('ko-KR') ?? '—'
  return <span className="js-money-value" data-long={text.length > 9}>{text}</span>
}
function CaptureCard({ view, page, index, count }: { view: SettlementTable; page: ReturnType<typeof capturePages>[number]; index: number; count: number }) {
  const card = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function renderImage() {
    if (!card.current || busy) return
    setBusy(true); setError('')
    try {
      await document.fonts.ready
      const { default: html2canvas } = await import('html2canvas-pro')
      const canvas = await html2canvas(card.current, { backgroundColor: '#ffffff', scale: 2 })
      setImage(canvas.toDataURL('image/png'))
    } catch { setError('이미지를 만들지 못했어요. 아래 표를 화면 캡처해주세요.') }
    finally { setBusy(false) }
  }
  return <article className="js-capture-page">
    <div ref={card} className="js-capture-card"><header><b>정산어택 · {view.title}</b><span>{index + 1} / {count}장</span></header><MoneyTable view={view} {...page} /><TransferList view={view} transfers={page.transfers} /><p>단위: 원 · 마지막 합계는 모든 차수의 최종 금액입니다.</p><p>표시된 셀과 최종 합계의 차이는 원 단위 조정에 포함됩니다.</p></div>
    <button className="js-mini" disabled={busy} onClick={() => { void renderImage() }}>{busy ? '이미지 만드는 중…' : `${index + 1}장 이미지로 보기`}</button>
    {error && <p role="alert">{error}</p>}{image && <div><p>이미지를 길게 눌러 저장하거나 화면을 캡처해주세요.</p><img className="js-capture-image" src={image} alt={`${view.title} 정산표 ${index + 1}/${count}장`} /><button className="js-mini" onClick={() => setImage('')}>이미지 닫기</button></div>}
  </article>
}

function TransferList({ view, transfers }: { view: SettlementTable; transfers: SettlementTable['table']['transfers'] }) {
  if (!transfers.length) return null
  const nameOf = (participantId: number) => `${view.table.lines.find((line) => line.participantId === participantId)?.name ?? '참여자'} (#${participantId})`
  return <section><h3>{view.isEstimate ? '예상 송금 안내' : '송금 안내'}</h3><ul>{transfers.map((transfer) => <li key={`${transfer.fromParticipantId}-${transfer.toParticipantId}`}>{nameOf(transfer.fromParticipantId)} → {nameOf(transfer.toParticipantId)} · {won(transfer.amount)}</li>)}</ul></section>
}

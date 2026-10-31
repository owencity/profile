import { useEffect, useRef, useState } from 'react'
import { fetchSettlementTable, capturePages, cellNote } from './settlementTable'
import type { SettlementTable, TablePage } from './settlementTable'
import { messageOf } from './gateway'
import { won } from './model'
import './guest.css'
import { SettlementImage } from './SettlementImage'

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
      <SettlementImage key={`${gatheringId}-${unitId}-${revision}-${view.inputHash}`} view={view} />
      <p>{view.isEstimate ? '응답이 바뀌면 금액도 바뀌는 예상 표예요.' : '확정된 정산표예요.'} 캡처한 이미지는 자동으로 갱신되지 않아요.</p>
      <p className="js-hint">안주·음료는 함께 나누고 술은 알코올 참여자끼리 나눠요. 셀의 원 미만 금액은 하단 조정에 반영되어 최종 합계와 일치해요.</p>
      {capture ? <><p>참여자를 한 줄씩 표시하고, 긴 표는 8행씩 나눴어요. 각 장을 캡처하거나 이미지로 열어 저장해주세요.</p>{capturePages(view).map((page, index, pages) => <CaptureCard key={`${revision}-${index}`} view={view} page={page} index={index} count={pages.length} />)}</> : capturePages(view, Number.MAX_SAFE_INTEGER).map((page, index) => <MoneyTable key={index} view={view} page={page} />)}
    </>}
  </section>
}

function MoneyTable({ view, page }: { view: SettlementTable; page: TablePage }) {
  const nameOf = (id: number) => `${view.table.lines.find((line) => line.participantId === id)?.name ?? '참여자'} #${id}`
  const round = page.round
  const title = round ? `${round.seq}차 · 결제 ${nameOf(round.payerParticipantId)} · ${won(round.total)}`
    : page.adjustment ? `원 단위 조정 · ${nameOf(page.adjustment.recipientParticipantId)} 결제분`
      : page.kind === 'summary' ? `전체 정산 · 총 결제 ${won(view.table.grandTotal)}` : '송금 안내'
  const headings = round ? ['이름', '참여', '안주·음료', '술', '차수 부담'] : page.adjustment ? ['이름', '조정액'] : page.kind === 'summary' ? ['이름', '전체 부담', '이미 결제'] : ['보내는 사람', '받는 사람', '금액']
  return <table className="js-money-table" data-kind={page.kind}><caption><b>{title}</b><br />{view.isEstimate ? '예상' : '확정'} · 정산 {view.settlementUnitId} · {new Date(view.generatedAt).toLocaleString('ko-KR')} 기준</caption>
    <thead><tr>{headings.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
    <tbody>{page.lines.map((line) => {
      const cell = round?.cells.find((candidate) => candidate.participantId === line.participantId)
      return <tr key={line.participantId}><th scope="row">{line.name}<small>#{line.participantId}</small></th>
        {round ? <><td className="js-cell-note">{cell ? cellNote(cell) : '—'}</td><td><Amount value={cell?.food} /></td><td><Amount value={cell?.alcohol} /></td><td><Amount value={cell?.amount} /></td></>
          : page.adjustment ? <td><Amount value={page.adjustment.cells[String(line.participantId)] ?? 0} /></td>
            : <><td><Amount value={line.total} /></td><td><Amount value={line.paidTotal} /></td></>}
      </tr>
    })}{page.transfers.map((transfer) => <tr key={`${transfer.fromParticipantId}-${transfer.toParticipantId}`}><th scope="row">{nameOf(transfer.fromParticipantId)}</th><td>{nameOf(transfer.toParticipantId)}</td><td><Amount value={transfer.amount} /></td></tr>)}</tbody>
  </table>
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
    <div ref={card} className="js-capture-card"><header><b>정산어택 · {view.title}</b><span>{index + 1} / {count}장</span></header><MoneyTable view={view} page={page} /><p>단위: 원 · 차수 부담은 표시용이며 최종 부담에는 원 단위 조정이 포함됩니다.</p><p>보낼 돈은 ‘송금 안내’를 확인해주세요. 이미 결제한 돈과 전체 부담은 다릅니다.</p></div>
    <button className="js-mini" disabled={busy} onClick={() => { void renderImage() }}>{busy ? '이미지 만드는 중…' : `${index + 1}장 이미지로 보기`}</button>
    {error && <p role="alert">{error}</p>}{image && <div><p>이미지를 길게 눌러 저장하거나 화면을 캡처해주세요.</p><img className="js-capture-image" src={image} alt={`${view.title} 정산표 ${index + 1}/${count}장`} /><button className="js-mini" onClick={() => setImage('')}>이미지 닫기</button></div>}
  </article>
}

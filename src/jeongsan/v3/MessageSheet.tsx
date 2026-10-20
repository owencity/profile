/**
 * 메시지 신고·차단 시트(FC-024, App Store 1.2) — 정산방 타임라인에서 남의 메시지 옆 [⋯]을 누르면 올라온다.
 *
 * 처음엔 [신고하기]·[○○님 차단하기] 두 줄. 신고는 사유를 하나 골라야 보내지고, 차단은 한 번 더 확인한다.
 * 차단은 메시지만 숨긴다 — 같은 술자리의 명단·금액·송금은 그대로라는 것을 확인 문구에 적는다.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReportReason } from './safety'
import { REPORT_REASONS } from './safety'

type Props = {
  authorName: string
  body: string
  onClose: () => void
  onReport: (reason: ReportReason) => void
  onBlock: () => void
}

export function MessageSheet({ authorName, body, onClose, onReport, onBlock }: Props) {
  const [step, setStep] = useState<'menu' | 'report' | 'block'>('menu')
  const [reason, setReason] = useState<ReportReason | null>(null)
  const sheet = useRef<HTMLDivElement>(null)

  // 열리면 시트로 포커스, Esc로 닫기 — 키보드·스크린리더에서도 갇히지 않게
  useEffect(() => {
    sheet.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="js-scrim" onClick={onClose}>
      <div ref={sheet} className="js-sheet" role="dialog" aria-modal="true" aria-label={`${authorName}님의 메시지`} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="js-sheethd">
          <b>{authorName}님의 메시지</b>
          <button type="button" className="js-linkbtn" onClick={onClose}>닫기</button>
        </div>
        <p className="js-msgquote">{body}</p>

        {step === 'menu' && (
          <div className="js-msgmenu">
            <button type="button" className="js-cta2" onClick={() => setStep('report')}>신고하기</button>
            <button type="button" className="js-cta2 warn" onClick={() => setStep('block')}>{authorName}님 차단하기</button>
          </div>
        )}

        {step === 'report' && (
          <>
            <div className="js-lab">무엇이 문제인가요?</div>
            <div className="js-reasons" role="radiogroup" aria-label="신고 사유">
              {REPORT_REASONS.map((r) => (
                <button key={r.value} type="button" role="radio" aria-checked={reason === r.value}
                  className={`js-reason${reason === r.value ? ' on' : ''}`} onClick={() => setReason(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
            <p className="js-lead small">신고한 메시지는 나에게서 바로 사라지고, 운영자가 24시간 안에 확인해요.</p>
            <button type="button" className="js-cta" disabled={!reason} onClick={() => reason && onReport(reason)}>신고</button>
          </>
        )}

        {step === 'block' && (
          <>
            <p className="js-lead small">
              차단하면 {authorName}님의 메시지가 모든 술자리에서 나에게 보이지 않아요. 상대에게는 알리지 않아요.
              같은 술자리의 정산·금액·송금은 그대로예요. 내 계정 화면에서 언제든 풀 수 있어요.
            </p>
            <button type="button" className="js-cta warn" onClick={onBlock}>차단하기</button>
          </>
        )}
      </div>
    </div>
  )
}

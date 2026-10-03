/**
 * R4 참여자 관리 시트(총무) — docs/SCREENS.md §5.
 *
 * 정산방 참여자 줄에서 한 사람을 누르면 아래에서 올라온다. 그 사람의 차수별 응답을 보고,
 * 차수마다 [면제]를 켜고 끄고, 정산 전이면 [이 술자리에서 내보내기].
 * 면제를 끄면 그 칸은 빈칸(응답 전)으로 돌아간다 — flow-changes FC-010.
 */
import { useEffect, useRef, useState } from 'react'
import type { Gathering, Id } from './model'
import { RESPONSE_LABEL, responseOf } from './model'
import { removeBlockedReason } from './store'
import { SHOW_EXEMPT } from './features'

type Props = {
  g: Gathering
  participantId: Id
  onClose: () => void
  onExempt: (roundId: Id, exempt: boolean) => void
  onRemove: () => void
}

export function ParticipantSheet({ g, participantId, onClose, onExempt, onRemove }: Props) {
  const p = g.participants.find((x) => x.id === participantId)
  const [confirm, setConfirm] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const open = g.status === 'OPEN'

  // 열리면 시트로 포커스, Esc로 닫기 — 키보드·스크린리더에서도 갇히지 않게
  useEffect(() => {
    sheet.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!p) return null
  const blocked = removeBlockedReason(g, participantId)
  const paid = g.rounds.filter((r) => r.payerParticipantId === participantId)

  return (
    <div className="js-scrim" onClick={onClose}>
      <div
        ref={sheet}
        className="js-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${p.displayName}님 관리`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="js-sheethd">
          <b>{p.displayName}</b>
          {paid.length > 0 && <span className="js-role">{paid.map((r) => r.label).join('·')} 낸 사람</span>}
          <button type="button" className="js-linkbtn" onClick={onClose}>닫기</button>
        </div>

        {!open && <p className="js-lead small">정산한 뒤에는 {SHOW_EXEMPT ? '면제·내보내기를 바꿀' : '내보낼'} 수 없어요.</p>}

        <ul className="js-exlist">
          {g.rounds.map((r) => {
            const cur = responseOf(g, participantId, r.id)
            const exempt = cur?.type === 'EXEMPT'
            return (
              <li key={r.id}>
                <span className="lb">{r.label}</span>
                <span className={`st${cur ? '' : ' none'}`}>{cur ? RESPONSE_LABEL[cur.type] : '아직 응답 안 함'}</span>
                {SHOW_EXEMPT && <button
                  type="button"
                  role="switch"
                  aria-checked={exempt}
                  aria-label={`${r.label} 면제`}
                  className={`js-exbtn${exempt ? ' on' : ''}`}
                  disabled={!open}
                  onClick={() => onExempt(r.id, !exempt)}
                >
                  {exempt ? '면제 🎁' : '면제'}
                </button>}
              </li>
            )
          })}
        </ul>
        {open && SHOW_EXEMPT && <p className="js-hint">면제를 풀면 그 차수는 다시 응답을 받아요.</p>}

        {open && (
          <div className="js-sheetfoot">
            {blocked ? (
              <p className="js-hint center">{blocked}</p>
            ) : (
              <button
                type="button"
                className={`js-del${confirm ? ' armed' : ''}`}
                onClick={() => (confirm ? onRemove() : setConfirm(true))}
                onBlur={() => setConfirm(false)}
              >
                {confirm ? `한 번 더 누르면 ${p.displayName}님을 내보내요` : '이 술자리에서 내보내기'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

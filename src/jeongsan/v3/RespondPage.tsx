/**
 * P2 내 응답 — docs/SCREENS.md §5.
 *
 * 차수마다 [불참][논알코올][알코올] 하나. 위의 [전 차수 똑같이]로 한 번에 채울 수 있다.
 * 총무가 면제로 지정한 칸은 버튼 대신 잠긴 안내가 보인다. 정산 전까지 다시 고칠 수 있다.
 */
import { useState } from 'react'
import type { Gathering, Id, ResponseType } from './model'
import { RESPONSE_LABEL, SELF_CHOICES, isLockedByHost, responseOf, won } from './model'
import { ResponseRow } from './ResponseRow'
import { BackButton } from './BackButton'

type Props = {
  g: Gathering
  /** 나의 참여자 id */
  meId: Id
  onBack: () => void
  onSubmit: (answers: { roundId: Id; type: ResponseType }[]) => void
}

export function RespondPage({ g, meId, onBack, onSubmit }: Props) {
  const editable = g.rounds.filter((r) => !isLockedByHost(responseOf(g, meId, r.id)))
  const [draft, setDraft] = useState<Record<Id, ResponseType | undefined>>(() =>
    Object.fromEntries(editable.map((r) => [r.id, responseOf(g, meId, r.id)?.type])),
  )
  const filled = editable.every((r) => draft[r.id])
  const already = editable.some((r) => responseOf(g, meId, r.id)?.source === 'SELF')
  const allSame = (t: ResponseType) => setDraft(Object.fromEntries(editable.map((r) => [r.id, t])))

  return (
    <div className="js-shell narrow js-p2">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="정산방으로" />
        <div className="js-rtitle"><b>{already ? '응답 고치기' : '응답하기'}</b></div>
      </header>

      <p className="js-lead">차수마다 하나만 고르면 끝이에요.</p>

      {editable.length > 1 && (
        <section className="js-field">
          <div className="js-lab">전 차수 똑같이</div>
          <div className="js-allsame">
            {SELF_CHOICES.map((t) => (
              <button key={t} type="button" className="js-mini" onClick={() => allSame(t)}>{RESPONSE_LABEL[t]}</button>
            ))}
          </div>
        </section>
      )}

      <ul className="js-resplist">
        {g.rounds.map((r) => {
          const locked = isLockedByHost(responseOf(g, meId, r.id))
          return (
            <li key={r.id} className="js-respitem">
              <div className="hd">
                <b>{r.label}</b>
                <span>{won(r.total)}</span>
              </div>
              {locked ? (
                <div className="js-locked">총무가 면제로 지정했어요 🎁</div>
              ) : (
                <ResponseRow label={r.label} value={draft[r.id]} onChange={(t) => setDraft({ ...draft, [r.id]: t })} />
              )}
            </li>
          )
        })}
      </ul>

      <div className="js-r2btns stick">
        {!filled && <div className="js-hint center">모든 차수를 골라야 저장할 수 있어요</div>}
        <button
          className="js-cta"
          disabled={!filled}
          onClick={() => onSubmit(editable.map((r) => ({ roundId: r.id, type: draft[r.id]! })))}
        >
          응답 완료
        </button>
      </div>
    </div>
  )
}

/**
 * R3 정산하기 확인(총무) — docs/SCREENS.md §5.
 *
 * 1인당 금액 미리보기(서버 결과 그대로) · 미응답자 경고 · [정산하기].
 * 미응답자 이름을 누르면 그 자리에서 차수별 응답을 대신 넣을 수 있다 — 단톡방에서 "나 2차
 * 안 갔어"라고 말만 한 사람을 위해 총무가 화면을 떠나지 않고 고치게 하려는 것이다.
 */
import { useState } from 'react'
import type { Gathering, Id, ResponseType } from './model'
import { RESPONSE_LABEL, hostOf, nameOf, responseOf, unrespondedParticipants, won } from './model'
import type { SettlePreview } from './mockServer'
import { ResponseRow } from './ResponseRow'
import { BackButton } from './BackButton'

type Props = {
  g: Gathering
  /** 서버 미리보기 결과 */
  preview: SettlePreview
  onBack: () => void
  onRespondFor: (participantId: Id, roundId: Id, type: ResponseType) => void
  onSettle: (inputRevision: number) => 'OK' | 'STALE' | 'DENIED'
}

export function SettlePage({ g, preview, onBack, onRespondFor, onSettle }: Props) {
  const host = hostOf(g)
  const missing = unrespondedParticipants(g)
  const [editing, setEditing] = useState<Id | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sum = preview.lines.reduce((s, l) => s + l.total, 0)
  const roundsTotal = g.rounds.reduce((s, r) => s + r.total, 0)

  const settle = () => {
    const res = onSettle(preview.inputRevision)
    if (res === 'STALE') setError('그 사이 응답이 바뀌었어요. 바뀐 금액을 확인하고 다시 눌러주세요')
    if (res === 'DENIED') setError('지금은 정산할 수 없어요')
  }

  return (
    <div className="js-shell narrow js-r3">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="정산방으로" />
        <div className="js-rtitle"><b>정산하기</b></div>
      </header>

      {missing.length > 0 && (
        <section className="js-autowarn" aria-label="응답 없는 사람">
          <b>{missing.map((p) => p.displayName).join(', ')}</b>
          <span>응답이 없어 전 차수 참석·알코올로 계산돼요. 이름을 누르면 대신 넣을 수 있어요.</span>
          <div className="js-autonames">
            {missing.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`js-mini${editing === p.id ? ' on' : ''}`}
                aria-expanded={editing === p.id}
                onClick={() => setEditing(editing === p.id ? null : p.id)}
              >
                {p.displayName} 응답 넣기
              </button>
            ))}
          </div>
        </section>
      )}

      {editing !== null && (
        <section className="js-proxy" aria-label={`${nameOf(g, editing)}님 응답 대신 넣기`}>
          <div className="hd">
            <b>{nameOf(g, editing)}님 응답</b>
            <button type="button" className="js-linkbtn" onClick={() => setEditing(null)}>닫기</button>
          </div>
          {g.rounds.map((r) => {
            const cur = responseOf(g, editing, r.id)
            return (
              <div key={r.id} className="row">
                <span className="lb">{r.label}</span>
                {cur?.type === 'EXEMPT' ? (
                  <span className="js-locked">면제</span>
                ) : (
                  <ResponseRow compact label={r.label} value={cur?.type} onChange={(t) => onRespondFor(editing, r.id, t)} />
                )}
              </div>
            )
          })}
        </section>
      )}

      <section aria-labelledby="h-preview">
        <h2 id="h-preview" className="js-lab">한 사람당 금액</h2>
        <ul className="js-preview">
          {preview.lines.map((l) => {
            const p = g.participants.find((x) => x.id === l.participantId)!
            const paid = g.rounds.some((r) => r.payerParticipantId === p.id)
            return (
              <li key={l.participantId}>
                <div className="who">
                  <b>{p.displayName}</b>
                  {p.id === host.id && <span className="js-role host">총무</span>}
                  {paid && <span className="js-role">낸 사람</span>}
                  {l.auto && <span className="js-role auto">자동</span>}
                </div>
                <strong>{won(l.total)}</strong>
                <small className="why">
                  {l.rounds.map((b) => `${g.rounds.find((r) => r.id === b.roundId)?.label} ${RESPONSE_LABEL[b.type]}`).join(' · ')}
                </small>
              </li>
            )
          })}
        </ul>
        <div className="js-drinksum">
          합계 <b>{won(sum)}</b>
          {sum !== roundsTotal && <span className="js-warntext"> · 차수 합계 {won(roundsTotal)}와 달라요</span>}
        </div>
      </section>

      <p className="js-lead small">정산하면 금액이 고정돼요. 아무도 보내기 전이면 되돌릴 수 있어요.</p>

      {error && <div className="js-errs" role="alert">{error}</div>}

      <div className="js-r2btns stick">
        <button className="js-cta" onClick={settle}>정산하기</button>
      </div>
    </div>
  )
}

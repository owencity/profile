/**
 * W3 — 전체 내역. `/g/{token}/all`
 *
 * 전원의 체크 내역과 금액을 모두에게 공개한다. **공개성이 자정작용을 한다** (SPEC §5).
 * 기술로 거짓 체크를 막지 않는 대신 서로 보이게 하는 것이 의도된 설계다.
 */
import type { Gathering, Settlement } from '../types'
import { attKey } from '../types'
import { won } from '../api'
import { Bar, PersonRow, Shell, TransferRow, Url } from '../ui'

export function AllPage({
  g, s, onBack,
}: {
  g: Gathering
  s: Settlement
  onBack: () => void
}) {
  const nameOf = (id: number) => g.participants.find((p) => p.id === id)?.name ?? '?'

  const summary = (pid: number) =>
    g.rounds
      .map((r) => {
        const a = g.attendance[attKey(pid, r.id)]
        if (!a?.attended) return `${r.seq}차 불참`
        return `${r.seq}차 참석·${a.drank ? '음주' : '논알콜'}`
      })
      .join(' / ')

  return (
    <Shell>
      <Url path={`/g/${g.shareToken}/all`} />
      <Bar
        title="전체 내역"
        onBack={onBack}
        step={g.status === 'CONFIRMED' ? '확정됨' : '수집 중'}
        tone={g.status === 'CONFIRMED' ? 'on' : undefined}
      />

      {g.participants.map((p) => (
        <PersonRow
          key={p.id}
          p={p}
          sub={summary(p.id)}
          right={
            <span className="js-amt">
              {p.exempt ? '면제' : s.amounts[p.id]?.toLocaleString() ?? '—'}
            </span>
          }
        />
      ))}

      <div className="js-prog" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink2)', lineHeight: 1.85 }}>
          {g.rounds.map((r) => (
            <div key={r.id}>
              {r.label} {won(r.total)}{' '}
              <span style={{ color: 'var(--ink3)' }}>(술 {r.alcohol.toLocaleString()})</span> ·{' '}
              {nameOf(r.payerId)} 결제
            </div>
          ))}
          {g.extras.map((e) => (
            <div key={e.id}>
              {e.label} {won(e.amount)}{' '}
              <span style={{ color: 'var(--ink3)' }}>
                ({e.bearerIds.map(nameOf).join('·')} 부담)
              </span>{' '}
              · {nameOf(e.payerId)} 결제
            </div>
          ))}
          <b style={{ color: 'var(--p600)' }}>
            합계 {won(s.grandTotal)} = 각자 부담 합계
          </b>
        </div>
      </div>

      <div className="js-lab">송금 목록</div>
      {s.transfers.map((t) => (
        <TransferRow
          key={`${t.fromId}-${t.toId}`}
          from={nameOf(t.fromId)}
          to={nameOf(t.toId)}
          amount={t.amount}
        />
      ))}

      <div className="js-hint" style={{ marginTop: 12 }}>
        <b>한 사람이 두 곳에 나눠 보내는 것은 정상입니다.</b> 차수마다 결제한 사람이 달라
        각자 받을 돈이 있기 때문입니다.
      </div>

      <button
        className="js-cta2"
        style={{ marginTop: 'auto', borderColor: 'var(--p500)', color: 'var(--p600)' }}
        onClick={() => alert('이미지로 저장 (mock)')}
      >
        🖼 이 화면을 이미지로 저장
      </button>
    </Shell>
  )
}

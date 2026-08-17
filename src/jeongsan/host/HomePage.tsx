/**
 * H0 — 내 모임. 앱을 열면 나오는 첫 화면.
 *
 * 상태는 `수집 중 / 확정됨(입금 n/m) / 완료` 세 가지로 보이지만
 * **DB status 는 COLLECTING·CONFIRMED 둘뿐**이다. "완료"는 입금 수로 계산해 표시한다.
 * 상태값을 늘리면 되돌리기·입금 취소 때 전이 규칙이 복잡해지기만 한다.
 */
import type { GatheringSummary } from '../types'
import { dateLabel, won } from '../api'
import { Bar, Shell } from '../ui'

function statusOf(s: GatheringSummary) {
  if (s.status === 'COLLECTING') {
    return { label: '수집 중', tone: 'var(--p600)' as const }
  }
  if (s.payableCount > 0 && s.paidCount >= s.payableCount) {
    return { label: '완료', tone: 'var(--ink3)' as const }
  }
  return { label: '확정됨', tone: 'var(--ok)' as const }
}

export function HomePage({
  list, onOpen, onCreate,
}: {
  list: GatheringSummary[]
  onOpen: (id: number) => void
  onCreate: () => void
}) {
  return (
    <Shell>
      <Bar title="내 모임" step="동규" />
      <button className="js-add" style={{ padding: 14, fontSize: 14 }} onClick={onCreate}>
        + 새 모임 만들기
      </button>

      {list.map((s) => {
        const st = statusOf(s)
        const collecting = s.status === 'COLLECTING'
        const value = collecting ? s.respondedCount : s.paidCount
        const total = collecting ? s.expectedCount ?? s.participantCount : s.payableCount
        const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
        const done = !collecting && total > 0 && value >= total

        return (
          <button
            key={s.id}
            className="js-card"
            onClick={() => onOpen(s.id)}
            style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <div className="t">
              {s.name}
              <em style={{ color: st.tone }}>{st.label}</em>
            </div>
            <div className="js-kv">
              <span>
                {dateLabel(s.date)} ·{' '}
                {collecting && s.expectedCount ? `예상 ${s.expectedCount}명` : `${s.participantCount}명`}
              </span>
            </div>
            <div className="js-kv" style={{ paddingTop: 7 }}>
              <b style={{ fontSize: 16 }}>{won(s.grandTotal)}</b>
              <span style={{ fontWeight: 800, color: collecting ? 'var(--p600)' : done ? 'var(--ok)' : 'var(--acc-strong)' }}>
                {collecting ? `응답 ${value} / ${total}` : `입금 ${value} / ${total}`}
                {done && ' ✓'}
              </span>
            </div>
            <div className="js-track" style={{ background: '#eef2f7' }}>
              <div className={`js-fill${done ? ' ok' : ''}`} style={{ width: `${pct}%` }} />
            </div>
          </button>
        )
      })}

      <div className="js-hint" style={{ marginTop: 'auto' }}>
        상태는 <b>수집 중 · 확정됨(입금 n/m) · 완료</b> 세 가지로 보이지만
        저장되는 상태값은 <b>둘뿐</b>입니다. "완료"는 입금 수로 계산해 표시합니다.
      </div>
    </Shell>
  )
}

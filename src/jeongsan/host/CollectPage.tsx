/**
 * H3 — 수집 현황. **사람 지정은 전부 여기서** 한다.
 *
 * 주최자 본인은 모임 생성 시 전체 참석·음주로 자동 설정되고 여기서 수정한다 (v5 ④).
 * 진행률의 분모는 `expectedCount`(본인 포함)이고 **계산 분모와는 무관하다.**
 */
import type { Gathering } from '../types'
import { attKey } from '../types'
import { won } from '../api'
import { Bar, Card, KV, PersonRow, Progress, Shell } from '../ui'

export function CollectPage({
  g, onConfirm, onRoster, onShare, onBack,
}: {
  g: Gathering
  onConfirm: () => void
  onRoster: () => void
  onShare: () => void
  onBack: () => void
}) {
  const nameOf = (id: number) => g.participants.find((p) => p.id === id)?.name ?? '?'
  const expected = g.expectedCount ?? g.participants.length

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
      <Bar title={g.name} onBack={onBack} step="수집 중" />

      <Progress
        value={g.participants.length}
        total={expected}
        unit="명 참여"
        onEdit={() => alert('예상 인원 수정 (mock)')}
      />

      {g.participants.map((p) => (
        <PersonRow
          key={p.id}
          p={p}
          off={!p.responded}
          sub={p.responded ? summary(p.id) : '대신 체크하기 ›'}
          right={
            p.isHost ? (
              <span className="js-tag mut">자동 · 수정</span>
            ) : p.responded ? (
              <span className="js-tag ok">완료</span>
            ) : (
              <span className="js-tag no">미체크</span>
            )
          }
        />
      ))}

      <div className="js-lab">사람 지정</div>

      <Card title="차수 결제자">
        {g.rounds.map((r) => (
          <KV key={r.id} k={r.label} v={nameOf(r.payerId)} />
        ))}
      </Card>

      {g.extras.map((e) => (
        <Card key={e.id} title={`${e.label} ${won(e.amount)}`}>
          <KV k="결제" v={nameOf(e.payerId)} />
          <KV k="부담할 사람" v={e.bearerIds.map(nameOf).join(' · ')} />
        </Card>
      ))}

      <Card title="면제자" right="지정">
        <KV
          k={
            g.participants.some((p) => p.exempt)
              ? g.participants.filter((p) => p.exempt).map((p) => p.name).join(' · ')
              : '없음 · 부담 0이 되고 분모에서 빠집니다'
          }
          sub
        />
      </Card>

      <button className="js-cta js-bottom" onClick={onConfirm}>
        지금 확정하기
      </button>
      <div className="js-ctarow" style={{ marginTop: 9 }}>
        <button className="js-cta2" onClick={onRoster}>
          명단
        </button>
        <button className="js-cta2" onClick={onShare}>
          링크 다시 공유
        </button>
      </div>
    </Shell>
  )
}

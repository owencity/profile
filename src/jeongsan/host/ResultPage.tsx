/**
 * H4 — 결과 / 입금 관리.
 *
 * 입금은 **양쪽이 누른다** (SPEC §5-b). `SENT` 인데 `RECEIVED` 가 아닌 상태가
 * 화면에 그대로 보이면 "나 보냈는데?" vs "안 왔는데?" 분쟁이 대화가 아니라 화면에서 드러난다.
 *
 * 확정 후 뒤늦게 참여를 요청한 사람이 있으면 배너로 뜬다 (v8 ⑮).
 * [되돌리고 추가] 는 상태 전이와 참여자 생성을 한 번에 한다.
 */
import type { Gathering, Settlement } from '../types'
import { won } from '../api'
import { Bar, PersonRow, Progress, Shell, WarnBox } from '../ui'

export function ResultPage({
  g, s, joinRequest, onReopen, onBack, onShare,
}: {
  g: Gathering
  s: Settlement
  /** 확정 후 참여를 요청한 사람의 이름. 없으면 undefined. */
  joinRequest?: string
  onReopen: () => void
  onBack: () => void
  onShare: () => void
}) {
  const payers = g.participants.filter((p) => (s.breakdown[p.id]?.netAmount ?? 0) > 0)
  const debtors = g.participants.filter((p) => (s.breakdown[p.id]?.netAmount ?? 0) < 0)
  const paid = debtors.filter((p) => p.paymentStatus === 'RECEIVED').length
  const sent = debtors.find((p) => p.paymentStatus === 'SENT')

  // 재정산으로 차액이 생긴 사람 (§5-c)
  const diffs = g.participants
    .map((p) => ({ p, diff: (s.amounts[p.id] ?? 0) - (p.paidAmount ?? 0) }))
    .filter(({ p, diff }) => p.paidAmount != null && diff !== 0)

  return (
    <Shell>
      <Bar title="정산 완료" onBack={onBack} step="확정됨" tone="on" />

      {joinRequest && (
        <WarnBox
          title={`🔔 ${joinRequest}님이 뒤늦게 참여를 요청했어요`}
          actions={[
            { label: '되돌리고 추가', onClick: onReopen, primary: true },
            { label: '무시', onClick: () => alert('무시 (mock)') },
          ]}
        >
          되돌리면 <b>{joinRequest}님이 참여</b>하고 전원이 다시 계산됩니다.
          <br />
          이미 입금한 <b>{paid}명에게 차액</b>이 생깁니다.
        </WarnBox>
      )}

      <Progress
        value={paid}
        total={debtors.length}
        unit="명 입금"
        ok={debtors.length > 0 && paid >= debtors.length}
      />

      {payers.map((p) => (
        <PersonRow
          key={p.id}
          p={p}
          sub={`${won(s.breakdown[p.id]?.paidTotal ?? 0)} 결제${p.id === s.mainPayerId ? ' · 대표결제자' : ''}`}
          right={<span className="js-amt mut">받는 사람</span>}
        />
      ))}

      {debtors.map((p) => (
        <PersonRow
          key={p.id}
          p={p}
          sub={won(Math.abs(s.breakdown[p.id]?.netAmount ?? 0))}
          right={
            p.paymentStatus === 'RECEIVED' ? (
              <span className="js-tag done">확인됨</span>
            ) : p.paymentStatus === 'SENT' ? (
              <span className="js-tag wait">보냈다고 함</span>
            ) : (
              <span className="js-tag acc">미입금</span>
            )
          }
        />
      ))}

      {diffs.length > 0 && (
        <>
          <div className="js-lab">재정산 차액</div>
          {diffs.map(({ p, diff }) => (
            <div key={p.id} className="js-tf">
              <b>{p.name}</b>
              <span className="r" style={{ color: diff > 0 ? 'var(--acc-strong)' : 'var(--ok)' }}>
                {diff > 0 ? `추가 ${won(diff)}` : `환불 ${won(-diff)}`}
              </span>
            </div>
          ))}
        </>
      )}

      {sent && (
        <>
          <div className="js-hint">
            <b>보냈다고 함</b> 상태의 {sent.name}님을 확인하셨나요?
          </div>
          <button className="js-cta2 ok" onClick={() => alert('받았어요 확인 (mock)')}>
            {sent.name} · 받았어요 확인
          </button>
        </>
      )}

      <div className="js-ctarow" style={{ marginTop: 14 }}>
        <button
          className="js-cta2"
          style={{ borderColor: 'var(--p500)', color: 'var(--p600)' }}
          onClick={() => alert('이미지로 저장 (mock)')}
        >
          🖼 이미지로
        </button>
        <button className="js-cta" onClick={onShare}>
          단톡에 공유
        </button>
      </div>
      <button className="js-cta2 warn" onClick={onReopen}>
        되돌리기 (수정하기)
      </button>
    </Shell>
  )
}

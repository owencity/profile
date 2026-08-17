/**
 * H3-b — 확정 미리보기. **주최자가 개입하는 유일한 시점.**
 *
 * 확정을 두 단계로 나눈 이유는 수정 비용을 사후 통보가 아니라 사전 고지로 옮기려는 것이다.
 * 경고는 **금액보다 먼저** 보이게 배치한다 — 금액을 먼저 보면 "이 정도면 됐네" 하고
 * 스크롤해서 수락을 누른다. 그리고 경고가 **진행을 막지는 않는다** (SPEC §5).
 *
 * `inputHash` 를 그대로 되돌려 보내 미리보기와 수락 사이의 경합을 막는다 (ADR-004).
 */
import type { Gathering, Settlement } from '../types'
import { won } from '../api'
import { Bar, FixedNotice, PersonRow, Progress, Shell, TransferRow, WarnBox } from '../ui'

export function ConfirmPage({
  g, s, onAccept, onRoster, onShare, onBack,
}: {
  g: Gathering
  s: Settlement
  onAccept: () => void
  onRoster: () => void
  onShare: () => void
  onBack: () => void
}) {
  const nameOf = (id: number) => g.participants.find((p) => p.id === id)?.name ?? '?'
  const actual = g.participants.length
  const expected = g.expectedCount
  const short = expected != null && actual < expected
  const over = expected != null && actual > expected

  // 결제해서 받을 돈이 있는데 계좌를 등록하지 않은 사람
  const missingPayout = g.participants.filter(
    (p) => (s.breakdown[p.id]?.netAmount ?? 0) > 0 && !p.payout,
  )

  return (
    <Shell>
      <Bar
        title="이대로 확정할까요?"
        onBack={onBack}
        step={short || over ? '확인 필요' : undefined}
        tone={short || over ? 'warn' : undefined}
      />

      {short && (
        <WarnBox
          title="⚠ 등록한 인원과 다릅니다"
          actions={[
            { label: '링크 다시 공유', onClick: onShare, primary: true },
            { label: `${actual}명으로 확정`, onClick: onAccept },
          ]}
        >
          참여자 수 <b>{expected}명</b> · 실제 참여 <b>{actual}명</b>
          <br />
          아직 안 들어온 분이 있어요. 지금 확정하면 <b>{actual}명이 나눠 냅니다.</b>
        </WarnBox>
      )}

      {over && (
        <WarnBox
          title="⚠ 등록한 인원보다 많습니다"
          actions={[{ label: '명단 확인', onClick: onRoster, primary: true }]}
        >
          참여자 수 <b>{expected}명</b> · 실제 참여 <b>{actual}명</b>
          <br />
          <b>모르는 분이 들어왔을 수 있습니다.</b> 링크에는 참석자 이름과 금액이 담겨 있습니다.
        </WarnBox>
      )}

      {missingPayout.length > 0 && (
        <div className="js-hint" style={{ margin: '0 0 10px', color: 'var(--warn)' }}>
          💳 <b style={{ color: 'var(--warn)' }}>
            {missingPayout.map((p) => p.name).join(' · ')}님의 계좌가 아직 없어요.
          </b>{' '}
          받을 돈이 있는데 계좌를 알 수 없습니다.{' '}
          <b style={{ color: 'var(--ink3)' }}>확정은 됩니다</b> — 나중에 등록하면 바로 보입니다.
        </div>
      )}

      <Progress value={0} total={1} unit="" />
      <div className="js-prog" style={{ textAlign: 'center', padding: 14, marginTop: -12 }}>
        <div className="n" style={{ fontSize: 26 }}>{won(s.grandTotal)}</div>
        <div style={{ fontSize: 12, color: 'var(--ink2)', fontWeight: 700, marginTop: 3 }}>
          {g.rounds.length}차수 + 기타 {g.extras.length}건
        </div>
      </div>

      {g.participants.map((p) => (
        <PersonRow
          key={p.id}
          p={p}
          sub={p.id === s.mainPayerId ? '대표결제자' : p.exempt ? '면제' : undefined}
          right={<span className="js-amt">{won(s.amounts[p.id] ?? 0)}</span>}
        />
      ))}

      <div className="js-lab">송금 목록</div>
      {s.transfers.map((t) => (
        <TransferRow
          key={`${t.fromId}-${t.toId}`}
          from={nameOf(t.fromId)}
          to={nameOf(t.toId)}
          amount={t.amount}
        />
      ))}

      {s.roundingUnitDowngraded && (
        <div className="js-hint" style={{ color: 'var(--warn)' }}>
          1인당 금액이 작아 100원 단위로는 계산할 수 없어 <b style={{ color: 'var(--warn)' }}>10원 단위로 정산</b>했습니다.
        </div>
      )}

      <FixedNotice
        unit={s.appliedRoundingUnit}
        extra={
          <>
            <br />
            <br />
            <b style={{ color: 'var(--warn)' }}>수락하면 참여자에게 금액이 공개됩니다.</b> 이후
            수정하면 전원이 다시 계산되어 <b>추가금이나 환불이 발생</b>할 수 있습니다.
          </>
        }
      />

      <div className="js-ctarow" style={{ marginTop: 12 }}>
        <button className="js-cta2" onClick={onBack}>
          다시 볼게요
        </button>
        <button className="js-cta" onClick={onAccept}>
          수락
        </button>
      </div>
    </Shell>
  )
}

/**
 * W2 — 내 결과. **이 화면이 제품의 핵심이다. 축약하지 말 것** (SPEC §8).
 *
 * 근거 박스의 규칙 (v9 ⑯ · v11)
 *   1. 항목 금액은 원 단위로 반올림해 표시하고, `올림 조정`이 차이를 흡수한다
 *   2. 조정이 0원이면 그 행을 숨긴다
 *   3. **박스는 화면 맨 위에 크게 쓴 숫자에서 끝난다** — 중간에 끊고 밖에 두면
 *      어느 숫자가 답인지 알 수 없다
 */
import type { Gathering, Participant, Settlement } from '../types'
import { digitsOnly, signedWon, won } from '../api'
import { FixedNotice, Shell, Url } from '../ui'

export function MyResultPage({
  g, me, s, onViewAll,
}: {
  g: Gathering
  me: Participant
  s: Settlement
  onViewAll: () => void
}) {
  const b = s.breakdown[me.id]
  if (!b) return null

  const receiving = b.netAmount > 0
  const amount = Math.abs(b.netAmount)
  // 내가 보낼 곳 / 내게 보낼 사람
  const lines = receiving
    ? s.transfers.filter((t) => t.toId === me.id)
    : s.transfers.filter((t) => t.fromId === me.id)
  const nameOf = (id: number) => g.participants.find((p) => p.id === id)?.name ?? '?'
  const payoutOf = (id: number) => g.participants.find((p) => p.id === id)?.payout

  const copy = (accountNo: string) => {
    void navigator.clipboard?.writeText(digitsOnly(accountNo))
  }

  return (
    <Shell narrow>
      <Url path={`/g/${g.shareToken}`} />

      <div className="js-big">
        <div className="l">
          {me.name}님이 {receiving ? '받을' : '보낼'} 금액
        </div>
        <div className={`v${receiving ? ' recv' : ''}`}>{won(amount)}</div>
      </div>

      <div className="js-why">
        <div className="wt">이렇게 계산됐어요</div>

        {b.rounds.map((r) => (
          <div key={r.roundId} className={`js-wrow${r.attended ? '' : ' mut'}`}>
            <span className="rl">{r.seq}차</span>
            <span className="rd">
              {r.attended ? (r.drank ? '참석 · 음주' : '참석 · 논알콜') : '불참'}
              {r.attended && (
                <small>
                  안주 {r.foodTotal.toLocaleString()} ÷ {r.attendeeCount}명
                  {r.drank && r.alcoholTotal > 0 && (
                    <>
                      <br />
                      술값 {r.alcoholTotal.toLocaleString()} ÷ {r.drinkerCount}명
                    </>
                  )}
                </small>
              )}
            </span>
            <span className="rv">{won(r.amount)}</span>
          </div>
        ))}

        {b.extras.map((e) => (
          <div key={e.extraId} className={`js-wrow${e.bears ? '' : ' mut'}`}>
            <span className="rl">{e.label.slice(0, 2)}</span>
            <span className="rd">
              {e.amount.toLocaleString()}원 ·{' '}
              {e.bears ? `${e.bearerCount}명이 부담` : <b style={{ color: 'var(--ink2)' }}>내 몫은 없어요</b>}
              <small>
                {e.bears
                  ? `${e.amount.toLocaleString()} ÷ ${e.bearerCount}명 = ${e.share.toLocaleString()}`
                  : '결제만 하셨어요'}
              </small>
            </span>
            <span className="rv">{won(e.share)}</span>
          </div>
        ))}

        {/* 조정이 0원이면 숨긴다 */}
        {b.roundingAdjustment !== 0 && (
          <div className="js-wrow adj">
            <span className="rl">올림</span>
            <span className="rd">{g.roundingUnit}원 단위 올림 조정</span>
            <span className="rv">{signedWon(b.roundingAdjustment)}</span>
          </div>
        )}

        {/* 결제한 게 있으면 부담과 결제를 나눠 보여주고, 없으면 바로 결론으로 간다 */}
        {b.paidTotal > 0 ? (
          <>
            <div className="js-wrow adj" style={{ borderTop: 0 }}>
              <span className="rl">몫</span>
              <span className="rd">
                <b>내가 내야 할 금액</b>
              </span>
              <span className="rv">{won(b.finalAmount)}</span>
            </div>
            <div className="js-wrow sub">
              <span className="rl">결제</span>
              <span className="rd">
                <b>내가 결제한 금액</b>
                <small>돌려받습니다</small>
              </span>
              <span className="rv">−{b.paidTotal.toLocaleString()}원</span>
            </div>
            <div className="js-wrow tot">
              <span className="rl">{receiving ? '수령' : '송금'}</span>
              <span className="rd">{receiving ? '받을 금액' : '보낼 금액'}</span>
              <span className="rv">{won(amount)}</span>
            </div>
          </>
        ) : (
          <div className="js-wrow tot">
            <span className="rl">송금</span>
            <span className="rd">보낼 금액</span>
            <span className="rv">{won(amount)}</span>
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <>
          <div className="js-lab">
            {receiving ? '이렇게 받으실 예정이에요' : '이렇게 보내주세요'}
            {lines.length > 1 && <span className="opt"> · {lines.length}곳</span>}
          </div>
          {lines.map((t) => {
            const other = receiving ? t.fromId : t.toId
            const po = receiving ? undefined : payoutOf(other)
            return (
              <div key={`${t.fromId}-${t.toId}`} className={`js-acct${po ? '' : ''}`}>
                <div className="js-kv" style={{ padding: '0 0 6px' }}>
                  <b style={{ fontSize: 14 }}>{nameOf(other)}</b>
                  <b style={{ fontSize: 15 }}>{won(t.amount)}</b>
                </div>
                {po ? (
                  <>
                    <div className="an">{po.accountNo}</div>
                    <div className="am">
                      {po.bankName} · 예금주 {po.accountHolder}
                    </div>
                    <button className="js-copy" onClick={() => copy(po.accountNo)}>
                      계좌번호 복사 (숫자만)
                    </button>
                  </>
                ) : receiving ? (
                  <div className="am">내 계좌로 들어옵니다</div>
                ) : (
                  <div className="am" style={{ color: 'var(--warn)' }}>
                    계좌가 등록되지 않았어요. {nameOf(other)}님께 직접 물어보세요.
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {!receiving && (
        <button
          className={`js-cta${me.paymentStatus === 'NONE' ? ' acc' : ''}`}
          style={me.paymentStatus !== 'NONE' ? { background: 'var(--ok)', boxShadow: 'none' } : undefined}
          onClick={() => alert('보냈어요 (mock)')}
        >
          {me.paymentStatus === 'NONE'
            ? '보냈어요'
            : me.paymentStatus === 'SENT'
              ? '보냈다고 표시됨 · 확인 대기'
              : '입금 확인됨 ✓'}
        </button>
      )}

      <FixedNotice unit={g.roundingUnit} />

      <button className="js-cta2" onClick={onViewAll}>
        전체 내역 보기
      </button>

      <div className="js-footer">
        광고를 넣지 않습니다. 후원해주시면 서버 비용에 보태겠습니다.
        <br />
        <a href="https://www.devkdk.com" target="_blank" rel="noreferrer">
          ☕ 개발자에게 커피 한 잔
        </a>
      </div>
    </Shell>
  )
}

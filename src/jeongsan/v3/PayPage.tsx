/**
 * P3 내 금액 — docs/SCREENS.md §5.
 *
 * 받는 사람마다 카드 한 장: 금액 · 근거(차수별) · 계좌 + [계좌 복사] · [보냈어요].
 * 금액과 근거는 서버가 준 값을 그대로 보여준다(프론트는 계산하지 않는다).
 */
import { useEffect, useState } from 'react'
import { copyableAccountNo, copyableAmount } from './payout'
import type { Gathering, Id, Transfer } from './model'
import { RESPONSE_LABEL, won } from './model'
import { BackButton } from './BackButton'

type Props = {
  g: Gathering
  meId: Id
  onBack: () => void
  /** 이 화면을 열었다 — 목록의 [정산금액 확인] 뱃지를 뗀다 */
  onSeen: () => void
  onSent: (transferId: Id) => void
}

export function PayPage({ g, meId, onBack, onSeen, onSent }: Props) {
  const outgoing = g.transfers.filter((t) => t.fromParticipantId === meId)
  // 열었을 때 한 번만. onSeen은 렌더마다 새 함수라 의존성에서 뺀다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onSeen() }, [g.id, meId])

  return (
    <div className="js-shell narrow js-p3">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="정산방으로" />
        <div className="js-rtitle"><b>보낼 돈</b></div>
      </header>

      {outgoing.length === 0 ? (
        <div className="js-homeempty">보낼 돈이 없어요</div>
      ) : (
        outgoing.map((t) => <PayCard key={t.id} g={g} t={t} onSent={onSent} />)
      )}
    </div>
  )
}

function PayCard({ g, t, onSent }: { g: Gathering; t: Transfer; onSent: (id: Id) => void }) {
  const to = g.participants.find((p) => p.id === t.toParticipantId)
  const [open, setOpen] = useState(false)
  /** 방금 복사한 것 — 버튼 문구를 잠깐 바꾼다 */
  const [copied, setCopied] = useState<'acct' | 'amt' | null>(null)
  const payout = to?.payout

  // 이체 화면 칸에 붙여 넣을 값이라 둘 다 숫자만 복사한다(payout.ts) — 하이픈·쉼표·"원"·은행 이름이 섞이면 잘린다
  const copy = async (which: 'acct' | 'amt') => {
    const text = which === 'acct' ? (payout ? copyableAccountNo(payout.accountNo) : '') : copyableAmount(t.amount)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      // 복사가 막힌 환경 — 값이 화면에 그대로 보이니 직접 고르게 둔다
    }
  }

  return (
    <section className={`js-paycard ${t.status.toLowerCase()}`} aria-label={`${to?.displayName}님께 보낼 돈`}>
      <div className="hd">
        <b>{to?.displayName}님께</b>
        <strong>{won(t.amount)}</strong>
        {t.status !== 'CONFIRMED' && (
          <button type="button" className="js-mini" onClick={() => copy('amt')}>{copied === 'amt' ? '금액 복사했어요' : '금액 복사'}</button>
        )}
      </div>

      {t.basis && t.basis.length > 0 && (
        <>
          <button type="button" className="js-basisbtn" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? '근거 접기 ▴' : '어떻게 나온 금액인가요? ▾'}
          </button>
          {open && (
            <ul className="js-basis">
              {t.basis.map((b) => {
                const r = g.rounds.find((x) => x.id === b.roundId)
                return (
                  <li key={b.roundId}>
                    <span>{r?.label} · {RESPONSE_LABEL[b.type]}</span>
                    <b>{won(b.amount)}</b>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {payout ? (
        <div className="js-acct">
          <div>
            <small>{payout.bank} · {payout.holder}</small>
            <b className="no">{payout.accountNo}</b>
          </div>
          <button type="button" className="js-mini" onClick={() => copy('acct')}>{copied === 'acct' ? '번호만 복사했어요' : '계좌 복사'}</button>
        </div>
      ) : (
        <div className="js-acct none">{to?.displayName}님이 계좌를 등록하면 보여드릴게요</div>
      )}

      {t.status === 'WAITING' && t.notReceivedAt && (
        <div className="js-warnline">{to?.displayName}님이 아직 입금을 확인 못 했대요. 보낸 내역을 확인해주세요</div>
      )}

      {t.status === 'WAITING' && (
        <button className="js-cta" disabled={!payout} onClick={() => onSent(t.id)}>
          {t.notReceivedAt ? '다시 보냈어요' : '보냈어요'}
        </button>
      )}
      {t.status === 'SENT' && <div className="js-paystate">확인 기다리는 중이에요</div>}
      {t.status === 'CONFIRMED' && <div className="js-paystate ok">✓ {to?.displayName}님이 확인했어요</div>}
    </section>
  )
}

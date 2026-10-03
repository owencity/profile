/**
 * A1 계좌 등록 — docs/SCREENS.md §5. 결제자가 돈을 받을 계좌를 **한 번** 등록하면 다음부터 재사용한다.
 *
 * 은행은 버튼으로 고르고(직접 치지 않게), 직접 치는 건 계좌번호와 예금주뿐이다. 예금주는 표시 이름이 기본값.
 */
import { useState } from 'react'
import type { Payout, User } from './model'
import { BANKS, cleanAccountNo, validatePayout } from './payout'
import { BackButton } from './BackButton'

type Props = {
  me: User
  onBack: () => void
  onSave: (p: Payout) => void
}

export function AccountPage({ me, onBack, onSave }: Props) {
  const [bank, setBank] = useState(me.payout?.bank ?? '')
  const [accountNo, setAccountNo] = useState(me.payout?.accountNo ?? '')
  const [holder, setHolder] = useState(me.payout?.holder ?? me.displayName)
  const [tried, setTried] = useState(false)
  const draft: Payout = { bank, accountNo, holder }
  const errors = validatePayout(draft)
  const editing = !!me.payout

  const save = () => {
    setTried(true)
    if (errors.length === 0) onSave(draft)
  }

  return (
    <div className="js-shell narrow js-a1">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="정산방으로" />
        <div className="js-rtitle"><b>{editing ? '받을 계좌 바꾸기' : '받을 계좌 등록'}</b></div>
      </header>

      <p className="js-lead">한 번 등록하면 다음 술자리에서도 그대로 써요. 보낼 사람들에게만 보여요.</p>

      <section className="js-field">
        <div className="js-lab" id="bank-lab">은행</div>
        <div className="js-banks" role="radiogroup" aria-labelledby="bank-lab">
          {BANKS.map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={bank === b}
              className={`js-payer${bank === b ? ' on' : ''}`}
              onClick={() => setBank(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </section>

      <section className="js-field">
        <label htmlFor="acct-no" className="js-lab">계좌번호</label>
        <input
          id="acct-no"
          className="js-inp big"
          inputMode="numeric"
          autoComplete="off"
          placeholder="숫자만 넣어도 돼요"
          value={accountNo}
          onChange={(e) => setAccountNo(cleanAccountNo(e.target.value))}
        />
      </section>

      <section className="js-field">
        <label htmlFor="acct-holder" className="js-lab">예금주</label>
        <input
          id="acct-holder"
          className="js-inp"
          autoComplete="name"
          maxLength={20}
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
        />
      </section>

      {tried && errors.length > 0 && (
        <div className="js-errs" role="alert">{errors.map((e) => <div key={e}>{e}</div>)}</div>
      )}

      <div className="js-r2btns stick">
        <button className="js-cta" onClick={save}>저장</button>
      </div>
    </div>
  )
}

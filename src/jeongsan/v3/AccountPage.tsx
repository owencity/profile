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
  /** 뒤로가기 버튼이 어디로 가는지(title) — 정산방에서 왔는지 내 술자리에서 왔는지 */
  backTo?: string
  onBack: () => void
  onSave: (p: Payout) => void
  /** 내 술자리에서 연 경우만(API 모드) — 계정 메뉴(로그아웃·탈퇴)를 맨 아래에 둔다 */
  onLogout?: () => void
  onDeleteAccount?: () => void
}

export function AccountPage({ me, backTo = '정산방으로', onBack, onSave, onLogout, onDeleteAccount }: Props) {
  const [armed, setArmed] = useState(false)
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
        <BackButton onClick={onBack} to={backTo} />
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

      {/* 계정 — 탈퇴는 되돌릴 수 없어 두 번 눌러야 한다(차수 지우기와 같은 방식). 앱과 같은 자리·같은 문구 */}
      {(onLogout || onDeleteAccount) && (
        <section className="js-field js-account-menu" aria-label="계정">
          <div className="js-lab">계정</div>
          {onLogout && <button type="button" className="js-cta2" onClick={onLogout}>로그아웃</button>}
          {onDeleteAccount && (
            <>
              {armed && <p className="js-warntext">탈퇴하면 계정과 등록한 계좌가 지워지고 되돌릴 수 없어요. 지난 정산 기록에는 &lsquo;탈퇴한 사용자&rsquo;로 남아요. 진행 중인 정산이 있으면 끝난 뒤에 탈퇴할 수 있어요.</p>}
              <button
                type="button"
                className={`js-del${armed ? ' armed' : ''}`}
                onClick={() => (armed ? onDeleteAccount() : setArmed(true))}
              >
                {armed ? '한 번 더 누르면 탈퇴해요' : '회원 탈퇴'}
              </button>
            </>
          )}
        </section>
      )}

      <div className="js-r2btns stick">
        <button className="js-cta" onClick={save}>저장</button>
      </div>
    </div>
  )
}

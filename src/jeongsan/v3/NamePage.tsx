/**
 * L2 이름 확인 — 첫 로그인 때 한 번(docs/SCREENS.md §2). **실명을 성까지** 받는다 — 총무가 은행 앱의
 * 입금자명과 참여자를 맞춰 보기 때문이다. 칸은 비워 둔다(카카오 닉네임을 채워 두면 그대로 넘어가 실명이 안 모인다).
 * 한 번 정하면 바뀌지 않는다. 카카오 닉네임은 목록에서 `이름(닉네임)`으로 옆에 붙는다.
 */
import { useState } from 'react'
import { nameWithNick, type User } from './model'
import { MAX_NAME, NAME_GUIDE, validateName } from './name'
import { BackButton } from './BackButton'

type Props = {
  me: User
  onBack: () => void
  onConfirm: (name: string) => void
}

export function NamePage({ me, onBack, onConfirm }: Props) {
  const [name, setName] = useState('')
  const [tried, setTried] = useState(false)
  const errors = validateName(name)
  const preview = name.trim() || '김동규'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (errors.length === 0) onConfirm(name.trim())
  }

  return (
    <form className="js-shell narrow js-l2" onSubmit={submit}>
      <header className="js-rtop">
        <BackButton onClick={onBack} to="로그인 화면으로" />
      </header>

      <section className="js-p1hero">
        <span className="js-p1kicker">처음 오셨네요</span>
        <h1>정산방에서 쓸 이름</h1>
        <span className="sub">한 번 정하면 바꿀 수 없어요.</span>
      </section>

      <section className="js-field">
        <label htmlFor="display-name" className="js-lab">실명 <small>{[...name.trim()].length}/{MAX_NAME}</small></label>
        <div className="js-nameguide">{NAME_GUIDE}</div>
        <input
          id="display-name"
          className="js-inp big"
          autoComplete="name"
          placeholder="예: 김동규"
          maxLength={MAX_NAME + 4}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      {/* 실제로 어떻게 보이는지 — 목록엔 이름(닉네임), 알림·타임라인 문장엔 이름만 */}
      <section className="js-namepreview" aria-label="미리보기">
        <span className="js-lab">친구들에겐 이렇게 보여요</span>
        <div className="js-namerow">👤 <b>{nameWithNick({ displayName: preview, nickname: me.nickname })}</b> <small>참여자 목록</small></div>
        <div className="js-tlsys"><span>⚙ {preview}님이 보냈대요. 입금을 확인해주세요</span></div>
      </section>

      {tried && errors.length > 0 && <div className="js-errs" role="alert">{errors.map((e) => <div key={e}>{e}</div>)}</div>}

      <div className="js-r2btns stick">
        <button type="submit" className="js-cta">이 이름으로 시작</button>
      </div>
    </form>
  )
}

/**
 * L2 이름 확인 — 첫 로그인 때 한 번(docs/SCREENS.md §2). 카카오 닉네임을 기본값으로 채워 두고,
 * 친구들이 정산방에서 알아볼 이름인지 확인만 받는다. 대부분은 그대로 [이 이름으로 시작]을 누른다.
 */
import { useState } from 'react'
import type { User } from './model'
import { MAX_NAME, validateName } from './name'
import { BackButton } from './BackButton'

type Props = {
  me: User
  onBack: () => void
  onConfirm: (name: string) => void
}

export function NamePage({ me, onBack, onConfirm }: Props) {
  const [name, setName] = useState(me.displayName)
  const [tried, setTried] = useState(false)
  const errors = validateName(name)
  const preview = name.trim() || '이름'

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
        <span className="sub">카카오 닉네임을 가져왔어요. 친구들이 알아볼 이름으로 바꿔도 돼요.</span>
      </section>

      <section className="js-field">
        <label htmlFor="display-name" className="js-lab">이름 <small>{[...name.trim()].length}/{MAX_NAME}</small></label>
        <input
          id="display-name"
          className="js-inp big"
          autoComplete="nickname"
          maxLength={MAX_NAME + 4}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      {/* 실제로 어떻게 보이는지 — 친구 화면의 알림·타임라인 문구로 미리 보여준다 */}
      <section className="js-namepreview" aria-label="미리보기">
        <span className="js-lab">친구들에겐 이렇게 보여요</span>
        <div className="js-tlsys"><span>⚙ {preview}님이 들어왔어요</span></div>
        <div className="js-tlsys"><span>⚙ {preview}님이 보냈대요. 입금을 확인해주세요</span></div>
      </section>

      {tried && errors.length > 0 && <div className="js-errs" role="alert">{errors.map((e) => <div key={e}>{e}</div>)}</div>}

      <div className="js-r2btns stick">
        <button type="submit" className="js-cta">이 이름으로 시작</button>
      </div>
    </form>
  )
}

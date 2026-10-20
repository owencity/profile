/**
 * L2 이름 확인 — 첫 로그인 때 한 번(docs/SCREENS.md §2). **실명을 성까지** 받는다 — 총무가 은행 앱의
 * 입금자명과 참여자를 맞춰 보기 때문이다. 칸은 비워 둔다(카카오 닉네임을 채워 두면 그대로 넘어가 실명이 안 모인다).
 * 한 번 정하면 바뀌지 않는다. 카카오 닉네임은 목록에서 `이름(닉네임)`으로 옆에 붙는다.
 *
 * 위에 [뒤로가기]를 두지 않는다 — 처음 온 사람에게 "어디로 돌아가나"가 헷갈렸다(2026-10-19 CTO).
 * 다른 계정으로 잘못 들어온 사람만 아래 작은 [로그아웃]으로 나간다.
 */
import { useState } from 'react'
import { nameWithNick, type User } from './model'
import { MAX_NAME, NAME_GUIDE, validateName } from './name'
import { TermsAgree } from './TermsAgree'

type Props = {
  me: User
  /** 잘못 로그인한 사람의 출구 — 서버 로그아웃 뒤 로그인 화면으로 */
  onLogout: () => void
  /** 실패면 보여줄 문구, 성공이면 null(`gateway.confirmName`) */
  onConfirm: (name: string) => Promise<string | null>
}

export function NamePage({ me, onLogout, onConfirm }: Props) {
  const [name, setName] = useState('')
  const [tried, setTried] = useState(false)
  // 서버가 거절한 이유(예: 이미 이름을 정함). 입력을 고치면 지운다
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // 이용약관 동의(FC-024) — 체크해야 시작할 수 있다
  const [agreed, setAgreed] = useState(false)
  const errors = serverError ? [serverError] : validateName(name)
  const preview = name.trim() || '김동규'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (busy || !agreed || validateName(name).length > 0) return
    setBusy(true)
    setServerError(await onConfirm(name.trim()))
    setBusy(false)
  }

  return (
    <form className="js-shell narrow js-l2" onSubmit={submit}>
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
          onChange={(e) => { setName(e.target.value); setServerError(null) }}
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
        <TermsAgree checked={agreed} onChange={setAgreed} />
        <button type="submit" className="js-cta" disabled={busy || !agreed}>{busy ? '저장하는 중…' : '이 이름으로 시작'}</button>
        <button type="button" className="js-linkbtn js-namelogout" onClick={onLogout}>잘못 로그인했나요? 로그아웃</button>
      </div>
    </form>
  )
}

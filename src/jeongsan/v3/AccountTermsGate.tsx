import { useState, type ReactNode } from 'react'
import { SideStreet } from '../SideStreet'
import { gateway } from './gateway'
import type { User } from './model'
import { NamePage } from './NamePage'
import { TermsAgree } from './TermsAgree'
import { hasAcceptedTerms, rememberTermsAcceptance } from './termsAcceptance'

type Props = { me: User; onLogout: () => Promise<void>; children: ReactNode }

/** 서버에서 로그인과 계정 ID를 확인한 뒤에만 표시한다. 이름 유무와 약관 동의를 분리한다. */
export function AccountTermsGate({ me, onLogout, children }: Props) {
  const [accepted, setAccepted] = useState(() => hasAcceptedTerms(me.id))
  const accept = () => {
    rememberTermsAcceptance(me.id)
    setAccepted(true)
  }
  const wrap = (content: ReactNode) => <div className="js-root"><SideStreet />{content}</div>

  if (!Number.isSafeInteger(me.id) || me.id <= 0) {
    return wrap(<main className="js-shell"><p role="status">계정 정보를 확인하고 있어요…</p></main>)
  }
  if (me.needsName) {
    return wrap(<NamePage me={me} termsAccepted={accepted} onLogout={() => { void onLogout() }} onConfirm={async (name) => {
      // 이름 입력을 하는 계정은 같은 화면의 체크로 동의한다. 저장 오류가 나도 동의를 두 번 묻지 않는다.
      accept()
      return gateway.confirmName(name)
    }} />)
  }
  if (!accepted) return wrap(<TermsConsentPage onAccept={accept} onLogout={onLogout} />)
  return children
}

export function TermsConsentPage({ onAccept, onLogout }: { onAccept: () => void; onLogout: () => Promise<void> }) {
  const [agreed, setAgreed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  return (
    <form className="js-shell narrow js-l2" onSubmit={(event) => {
      event.preventDefault()
      if (agreed && !leaving) onAccept()
    }}>
      <section className="js-p1hero">
        <span className="js-p1kicker">정산어택</span>
        <h1>이용약관을 확인해주세요</h1>
        <span className="sub">동의하면 정산어택을 계속 이용할 수 있어요.</span>
      </section>
      <div className="js-r2btns stick">
        <TermsAgree checked={agreed} onChange={setAgreed} />
        <button type="submit" className="js-cta" disabled={!agreed || leaving}>동의하고 시작하기</button>
        <button type="button" className="js-linkbtn js-namelogout" disabled={leaving} onClick={() => {
          setLeaving(true)
          void onLogout().finally(() => setLeaving(false))
        }}>{leaving ? '로그아웃하는 중…' : '다른 계정으로 로그인하기'}</button>
      </div>
    </form>
  )
}

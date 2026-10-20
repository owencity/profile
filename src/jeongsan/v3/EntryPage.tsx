/**
 * P1 참여 입구 — 단톡방 링크(`/jungsan/j/{token}`)를 누른 사람이 처음 보는 화면. docs/SCREENS.md §5.
 *
 * 총무·술자리·차수를 보여주고, **그 자리에서 차수별 응답까지 고르게** 한다(P1+P2 합침, 2026-10-03).
 * 참여자가 누르는 화면이 하나 줄어든다. 링크를 연 것만으로는 참여되지 않는다 — 아래 버튼을 눌러야
 * 명단에 들어간다.
 *
 * **로그인 전에는 미리보기만** 보여주고(누가 초대했는지·술자리·차수 금액), 응답은 로그인한 뒤에 고른다
 * (CTO 결정 2026-10-19). 카카오 로그인은 페이지를 떠났다 돌아오므로, 먼저 고르게 하면 돌아왔을 때
 * 고른 응답이 사라져 한 번 더 골라야 했다. 앱(딥링크 → 로그인 → 이 화면)과 같은 순서다.
 */
import { useState } from 'react'
import { HostCharacter } from '../character/HostCharacter'
import { levelOf, titleOf } from '../character/hostSprite'
import type { Gathering, Id, ResponseType } from './model'
import { RESPONSE_LABEL, SELF_CHOICES, hostOf, participantOfUser, won } from './model'
import { ResponseRow } from './ResponseRow'
import { BackButton } from './BackButton'
import { MAX_NAME, NAME_GUIDE, validateName } from './name'
import { TermsAgree } from './TermsAgree'
import type { LoginProvider } from './api'
import { AppleMark } from '../LoginPage'

type Props = {
  /** 링크가 가리키는 술자리. 없으면 잘못되거나 사라진 링크 */
  g?: Gathering
  meUserId: Id
  loggedIn: boolean
  /** 로그인. 이 자리에서 바로 로그인되면 true(목데이터), 페이지를 떠나면 false */
  /** 로그인 — 카카오(기본) 또는 Apple. 이 자리에서 바로 로그인되면 true(목데이터), 페이지를 떠나면 false */
  onLogin: (provider?: LoginProvider) => boolean
  /** 첫 로그인이라 실명을 아직 안 받았으면 true — P1 안에서 L2(이름 확인)를 같이 받는다 */
  askName?: boolean
  /** name: askName이었을 때 받은 실명 */
  onJoin: (answers: { roundId: Id; type: ResponseType }[], name?: string) => void
  onOpenRoom: () => void
  onHome: () => void
  /** 서버 미리보기는 명단 대신 인원수만 준다 — 있으면 이것을 쓴다 */
  participantCount?: number
  /** 한 술자리에 총무가 둘 이상이면(FC-015) 참여할 차수 묶음을 고른다 */
  choices?: { id: Id; label: string }[]
  onPick?: (id: Id) => void
}

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function EntryPage({ g, meUserId, loggedIn, onLogin, askName, onJoin, onOpenRoom, onHome, participantCount, choices, onPick }: Props) {
  const [draft, setDraft] = useState<Record<Id, ResponseType | undefined>>({})
  const [name, setName] = useState('')
  // 첫 로그인이면 여기서 이용약관 동의도 받는다(FC-024, L2와 같다)
  const [agreed, setAgreed] = useState(false)

  const notice = (title: string, body: string, action?: { label: string; onClick: () => void }) => (
    <div className="js-shell narrow js-p1">
      {loggedIn && (
        <header className="js-rtop">
          <BackButton onClick={onHome} to="내 술자리로" />
        </header>
      )}
      <div className="js-soon">
        <b>{title}</b>
        <span>{body}</span>
        {action && <button className="js-cta2" style={{ maxWidth: 260 }} onClick={action.onClick}>{action.label}</button>}
      </div>
    </div>
  )

  if (!g) return notice('링크가 맞지 않아요', '총무에게 링크를 다시 받아주세요', loggedIn ? { label: '내 술자리로', onClick: onHome } : undefined)
  // 이미 참여한 사람은 입구를 다시 거치지 않는다
  if (loggedIn && participantOfUser(g, meUserId)) return notice('이미 참여 중인 술자리예요', g.title, { label: '정산방으로', onClick: onOpenRoom })
  if (g.status !== 'OPEN') return notice('이미 정산된 술자리예요', '정산이 끝난 뒤에는 참여할 수 없어요', loggedIn ? { label: '내 술자리로', onClick: onHome } : undefined)

  const host = hostOf(g)
  const nameErrors = askName ? validateName(name) : []
  const filled = g.rounds.every((r) => draft[r.id]) && nameErrors.length === 0 && (!askName || agreed)
  const answers = () => g.rounds.map((r) => ({ roundId: r.id, type: draft[r.id]! }))
  const join = () => {
    if (!filled) return
    onJoin(answers(), askName ? name.trim() : undefined)
  }
  const allSame = (t: ResponseType) => setDraft(Object.fromEntries(g.rounds.map((r) => [r.id, t])))

  return (
    <div className="js-shell narrow js-p1">
      {loggedIn && (
        <header className="js-rtop">
          <BackButton onClick={onHome} to="내 술자리로" />
        </header>
      )}

      <section className="js-p1hero">
        <span className="js-p1kicker">{host.displayName}님이 정산어택에 초대했어요</span>
        <h1>{g.title}</h1>
        <span className="sub">{fmtDate(g.date)} · {participantCount ?? g.participants.length}명 참여 중</span>
      </section>

      {loggedIn && choices && choices.length > 1 && (
        <section className="js-field" aria-label="참여할 차수">
          <div className="js-lab">어느 총무의 차수에 참여하나요?</div>
          <div className="js-allsame">
            {choices.map((c) => (
              <button key={c.id} type="button" aria-pressed={c.id === g.id} className={`js-mini${c.id === g.id ? ' on' : ''}`}
                onClick={() => { setDraft({}); onPick?.(c.id) }}>
                {c.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="js-hostcard" aria-label="총무">
        <div className="js-hostav"><HostCharacter spoons={host.spoonCount} /></div>
        <div className="js-hostwho">
          <span className="nm">{host.displayName}<small>총무</small></span>
          <span className={`js-spoonchip lv${levelOf(host.spoonCount)}`}>
            🥄 {host.spoonCount.toLocaleString('ko-KR')} · {titleOf(host.spoonCount)}
          </span>
        </div>
      </section>

      {!loggedIn ? (
        // 로그인 전 — 미리보기만. 응답 버튼은 로그인하고 돌아온 뒤에 보인다
        <>
          <p className="js-lead">
            {g.rounds.length === 0
              ? '총무가 아직 금액을 넣는 중이에요. 로그인하고 참여해두면 금액이 들어올 때 알려드릴게요.'
              : '로그인하면 차수마다 불참·논알코올·알코올 중 하나만 고르면 끝이에요.'}
          </p>
          {g.rounds.length > 0 && (
            <ul className="js-resplist">
              {g.rounds.map((r) => (
                <li key={r.id} className="js-respitem">
                  <div className="hd">
                    <b>{r.label}</b>
                    <span>{won(r.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : g.rounds.length === 0 ? (
        <p className="js-lead">총무가 아직 금액을 넣는 중이에요. 먼저 참여해두면 금액이 들어올 때 알려드릴게요.</p>
      ) : (
        <>
          <p className="js-lead">차수마다 하나만 고르면 참여 끝이에요.</p>
          {g.rounds.length > 1 && (
            <section className="js-field">
              <div className="js-lab">전 차수 똑같이</div>
              <div className="js-allsame">
                {SELF_CHOICES.map((t) => (
                  <button key={t} type="button" className="js-mini" onClick={() => allSame(t)}>{RESPONSE_LABEL[t]}</button>
                ))}
              </div>
            </section>
          )}
          <ul className="js-resplist">
            {g.rounds.map((r) => (
              <li key={r.id} className="js-respitem">
                <div className="hd">
                  <b>{r.label}</b>
                  <span>{won(r.total)}</span>
                </div>
                <ResponseRow label={r.label} value={draft[r.id]} onChange={(t) => setDraft({ ...draft, [r.id]: t })} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 첫 로그인이면 L2(이름 확인)를 여기서 같이 — 화면을 하나 더 거치지 않게 */}
      {loggedIn && askName && (
        <section className="js-field">
          <label htmlFor="entry-name" className="js-lab">정산방에서 쓸 이름</label>
          <div className="js-nameguide">{NAME_GUIDE}</div>
          <input id="entry-name" className="js-inp" autoComplete="name" placeholder="예: 김동규" maxLength={MAX_NAME + 4} value={name} onChange={(e) => setName(e.target.value)} />
          {name.trim() !== '' && nameErrors.length > 0 && <div className="js-hint" role="alert">{nameErrors[0]}</div>}
        </section>
      )}

      <div className="js-r2btns stick">
        {loggedIn ? (
          <>
            {askName && <TermsAgree checked={agreed} onChange={setAgreed} />}
            {!g.rounds.every((r) => draft[r.id]) && <div className="js-hint center">모든 차수를 골라야 참여할 수 있어요</div>}
            <button className="js-cta" disabled={!filled} onClick={join}>
              {g.rounds.length === 0 ? '참여하기' : '참여하고 응답 완료'}
            </button>
          </>
        ) : (
          <>
            {/* 로그인만으로는 명단에 들어가지 않는다 — 돌아와서 [참여하고 응답 완료]를 눌러야 참여 */}
            <div className="js-hint center">로그인한 뒤 응답을 고르면 참여돼요</div>
            <button className="js-cta kakao" onClick={() => onLogin('kakao')}>카카오로 로그인하고 참여하기</button>
            {/* Apple 계정만 있는 사람(앱스토어 심사관 포함)도 참여할 수 있게 — 앱의 Apple 로그인과 같은 계정이 된다 */}
            <button className="js-cta apple" onClick={() => onLogin('apple')}><AppleMark /> Apple로 로그인하고 참여하기</button>
          </>
        )}
      </div>
    </div>
  )
}

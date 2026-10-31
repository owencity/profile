import { useEffect, useRef, useState } from 'react'
import { ApiError } from './api'
import { ensureGuestSession, guestApi, guestError } from './guestApi'
import type { GuestMe, GuestPreview } from './guestApi'
import { HostCharacter } from '../character/HostCharacter'
import { ResponseRow } from './ResponseRow'
import { TermsAgree } from './TermsAgree'
import { NAME_GUIDE, validateName } from './name'
import { RESPONSE_LABEL, SELF_CHOICES } from './model'
import type { ResponseType } from './model'
import './guest.css'

type Loaded = { preview: GuestPreview; me: GuestMe | null }

/** 회원 화면/스토어와 분리하여 비회원 401을 소셜 로그인으로 보내지 않는다. */
export function GuestFlow({ token }: { token: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const preview = await guestApi.preview(token)
        await ensureGuestSession()
        let me: GuestMe | null = null
        try { me = await guestApi.me(preview.gatheringId) } catch (failure) {
          if (!(failure instanceof ApiError && failure.status === 403 && failure.code === 'NOT_PARTICIPANT')) throw failure
        }
        if (!cancelled) { setLoaded({ preview, me }); setError('') }
      } catch (failure) { if (!cancelled) setError(guestError(failure)) }
    }
    void load()
    return () => { cancelled = true }
  }, [token, refresh])

  const reload = () => { setLoaded(null); setError(''); setRefresh((value) => value + 1) }
  const unit = loaded?.preview.settlementUnits.find((candidate) => candidate.id === picked)
    ?? loaded?.preview.settlementUnits.find((candidate) => loaded.me?.settlementUnits.some((mine) => mine.id === candidate.id && mine.included))
    ?? loaded?.preview.settlementUnits.find((candidate) => candidate.status === 'OPEN')
    ?? loaded?.preview.settlementUnits[0]

  return <div className="js-root"><main className="js-shell narrow js-guest">
    <header className="js-p1hero"><span className="js-p1kicker">정산어택 · 간편 응답</span><h1>{loaded?.preview.title ?? '술자리 확인'}</h1><p>앱 설치나 가입 없이, 내 차수만 체크하면 끝!</p></header>
    {error ? <section role="alert"><p>{error}</p><button className="js-mini" onClick={reload}>다시 확인</button></section> : !loaded ? <p role="status">참여 정보를 확인하고 있어요…</p> : <>
      {loaded.preview.settlementUnits.length > 1 && <nav className="js-allsame" aria-label="참여할 정산 선택">{loaded.preview.settlementUnits.map((candidate) => <button className="js-mini" key={candidate.id} aria-pressed={candidate.id === unit?.id} onClick={() => setPicked(candidate.id)}>{candidate.host.displayName} 총무 · {candidate.rounds.map((round) => `${round.seq}차`).join(', ') || '준비 중'}</button>)}</nav>}
      {unit ? <GuestUnit key={`${unit.id}-${refresh}`} token={token} preview={loaded.preview} unit={unit} me={loaded.me} onRefresh={reload} /> : <p>총무가 아직 차수를 준비하고 있어요.</p>}
    </>}
    <p className="js-hint">참여했던 브라우저에서 같은 링크를 다시 열어주세요. 쿠키를 지우거나 다른 기기로 옮기면 기존 참여 정보를 찾을 수 없어요.</p>
    <footer><a href="/jungsan/privacy" target="_blank" rel="noreferrer">개인정보 처리방침</a> · <a href="/jungsan/support" target="_blank" rel="noreferrer">문의</a></footer>
  </main></div>
}

function GuestUnit({ token, preview, unit, me, onRefresh }: {
  token: string; preview: GuestPreview; unit: GuestPreview['settlementUnits'][number]; me: GuestMe | null; onRefresh: () => void
}) {
  const membership = me?.settlementUnits.find((candidate) => candidate.id === unit.id)
  const included = membership?.included === true
  const status = membership?.status ?? unit.status
  const rounds = included ? me!.rounds.filter((round) => round.settlementUnitId === unit.id) : unit.rounds
  const [name, setName] = useState(me?.displayName ?? '')
  const [answers, setAnswers] = useState<Record<number, ResponseType>>(() => Object.fromEntries(me?.responses.map((answer) => [answer.roundId, answer.type]) ?? []))
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(!included)
  const inFlight = useRef(false)
  const nameInput = useRef<HTMLInputElement>(null)
  const editable = status === 'OPEN' && membership?.included !== false
  const fixed = (roundId: number) => me?.responses.some((answer) => answer.roundId === roundId && answer.type === 'EXEMPT')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (inFlight.current || !editable || !editing) return
    const nameError = validateName(name)[0]
    if (nameError) { setError(nameError); nameInput.current?.focus(); return }
    if (!me && !agreed) { setError('이용약관을 확인하고 동의해주세요.'); return }
    if (rounds.some((round) => !answers[round.id])) { setError('차수별 참여 여부를 모두 골라주세요.'); return }
    const payload = rounds.filter((round) => !fixed(round.id)).map((round) => ({ roundId: round.id, type: answers[round.id] }))
    inFlight.current = true; setBusy(true); setError('')
    try {
      if (included) await guestApi.respond(preview.gatheringId, unit.id, payload)
      else await guestApi.join(token, name.trim(), unit.id, payload)
      onRefresh()
    } catch (failure) { setError(guestError(failure)) }
    finally { inFlight.current = false; setBusy(false) }
  }

  return <>
    <section className="js-hostcard"><div className="js-hostav"><HostCharacter spoons={unit.host.spoonCount} /></div><div className="js-hostwho"><span className="nm">{unit.host.displayName}<small>총무</small></span></div></section>
    {membership?.included === false ? <p role="status">이 정산의 참여 대상에서 제외되었어요. 총무에게 확인해주세요.</p> : <>
      {included && <section className="js-banner good" role="status"><b>{me!.displayName}님, 응답을 총무에게 보냈어요</b><span>이 창을 닫아도 돼요. 정산 결과는 총무가 알려드려요.</span></section>}
      {!included && !editable && <p>이미 정산이 시작되어 새로 참여할 수 없어요. 총무에게 확인해주세요.</p>}
      {(included || editable) && <form onSubmit={(event) => { void submit(event) }} noValidate>
        <fieldset disabled={busy} className="js-guest-fields">
          <label className="js-field" htmlFor="guest-name"><span className="js-lab">성이름</span><span className="js-nameguide">{NAME_GUIDE}</span><input ref={nameInput} id="guest-name" className="js-inp" autoComplete="name" placeholder="예: 김동규" value={name} readOnly={me !== null} onChange={(event) => { setName(event.target.value); setError('') }} aria-describedby="guest-error" /></label>
          {editable && editing && rounds.length > 1 && <section><div className="js-lab">전 차수 똑같이</div><div className="js-allsame">{SELF_CHOICES.map((type) => <button type="button" className="js-mini" key={type} onClick={() => setAnswers((previous) => ({ ...previous, ...Object.fromEntries(rounds.filter((round) => !fixed(round.id)).map((round) => [round.id, type])) }))}>{RESPONSE_LABEL[type]}</button>)}</div></section>}
          <ul className="js-resplist">{rounds.map((round) => <li className="js-respitem" key={round.id}><div className="hd"><b>{round.seq}차</b></div>{editable && editing && !fixed(round.id) ? <ResponseRow label={`${round.seq}차`} value={answers[round.id]} onChange={(type) => setAnswers((previous) => ({ ...previous, [round.id]: type }))} /> : <p>{answers[round.id] ? RESPONSE_LABEL[answers[round.id]] : '미응답'}{fixed(round.id) ? ' · 총무 지정' : ''}</p>}</li>)}</ul>
          {rounds.length === 0 && <p>총무가 차수를 준비 중이에요. 먼저 참여해둘 수 있어요.</p>}
          {!me && editable && <TermsAgree checked={agreed} onChange={setAgreed} responseOnly />}
          <p id="guest-error" role={error ? 'alert' : undefined} className="js-guest-error">{error}</p>
          {editable && (editing ? <button type="submit" className="js-cta" disabled={busy}>{busy ? '보내고 있어요…' : included ? '수정한 응답 보내기' : '응답 보내기'}</button> : <button type="button" className="js-mini" onClick={(event) => { event.preventDefault(); setEditing(true) }}>내 응답 수정</button>)}
        </fieldset>
      </form>}

    </>}
    <button className="js-mini" onClick={onRefresh} disabled={busy}>최신 상태 확인</button>
  </>
}


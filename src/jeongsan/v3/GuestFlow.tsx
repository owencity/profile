import { useEffect, useRef, useState } from 'react'
import { ApiError } from './api'
import { ensureGuestSession, guestApi, guestError } from './guestApi'
import type { GuestMe, GuestMoney, GuestPreview } from './guestApi'
import { HostCharacter } from '../character/HostCharacter'
import { ResponseRow } from './ResponseRow'
import { TermsAgree } from './TermsAgree'
import { NAME_GUIDE, validateName } from './name'
import { RESPONSE_LABEL, SELF_CHOICES, won } from './model'
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
    <header className="js-p1hero"><span className="js-p1kicker">정산어택 · 간편 참여</span><h1>{loaded?.preview.title ?? '술자리 확인'}</h1><p>앱 설치나 가입 없이, 내 차수만 체크하면 끝!</p></header>
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
  const inFlight = useRef(false)
  const nameInput = useRef<HTMLInputElement>(null)
  const editable = status === 'OPEN' && membership?.included !== false
  const fixed = (roundId: number) => me?.responses.some((answer) => answer.roundId === roundId && answer.type === 'EXEMPT')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (inFlight.current) return
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
      {included && <section className="js-banner good" role="status"><b>{me!.displayName}님, 참여되어 있어요</b><span>아래에서 내 응답과 금액을 확인하세요.</span></section>}
      {!included && !editable && <p>이미 정산이 시작되어 새로 참여할 수 없어요. 총무에게 확인해주세요.</p>}
      {(included || editable) && <form onSubmit={(event) => { void submit(event) }} noValidate>
        <fieldset disabled={busy} className="js-guest-fields">
          <label className="js-field" htmlFor="guest-name"><span className="js-lab">성이름</span><span className="js-nameguide">{NAME_GUIDE}</span><input ref={nameInput} id="guest-name" className="js-inp" autoComplete="name" placeholder="예: 김동규" value={name} readOnly={me !== null} onChange={(event) => { setName(event.target.value); setError('') }} aria-describedby="guest-error" /></label>
          {editable && rounds.length > 1 && <section><div className="js-lab">전 차수 똑같이</div><div className="js-allsame">{SELF_CHOICES.map((type) => <button type="button" className="js-mini" key={type} onClick={() => setAnswers((previous) => ({ ...previous, ...Object.fromEntries(rounds.filter((round) => !fixed(round.id)).map((round) => [round.id, type])) }))}>{RESPONSE_LABEL[type]}</button>)}</div></section>}
          <ul className="js-resplist">{rounds.map((round) => <li className="js-respitem" key={round.id}><div className="hd"><b>{round.seq}차</b><span>{won(round.total)}</span></div>{editable && !fixed(round.id) ? <ResponseRow label={`${round.seq}차`} value={answers[round.id]} onChange={(type) => setAnswers((previous) => ({ ...previous, [round.id]: type }))} /> : <p>{answers[round.id] ? RESPONSE_LABEL[answers[round.id]] : '미응답'}{fixed(round.id) ? ' · 총무 지정' : ''}</p>}</li>)}</ul>
          {rounds.length === 0 && <p>총무가 차수를 준비 중이에요. 먼저 참여해둘 수 있어요.</p>}
          {!me && editable && <TermsAgree checked={agreed} onChange={setAgreed} />}
          <p id="guest-error" role={error ? 'alert' : undefined} className="js-guest-error">{error}</p>
          {editable && <button type="submit" className="js-cta" disabled={busy}>{busy ? '저장하고 있어요…' : included ? '내 응답 저장' : '이 이름으로 참여하기'}</button>}
        </fieldset>
      </form>}
      {included && <GuestPayment gatheringId={preview.gatheringId} unitId={unit.id} rounds={rounds} />}
    </>}
    <button className="js-mini" onClick={onRefresh} disabled={busy}>최신 상태 확인</button>
  </>
}

function GuestPayment({ gatheringId, unitId, rounds }: { gatheringId: number; unitId: number; rounds: { id: number; seq: number }[] }) {
  const [money, setMoney] = useState<GuestMoney | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  useEffect(() => {
    let cancelled = false
    guestApi.money(gatheringId, unitId).then((value) => { if (!cancelled) setMoney(value) }).catch((failure: unknown) => { if (!cancelled) setError(guestError(failure)) })
    return () => { cancelled = true }
  }, [gatheringId, unitId])
  async function sent(transferId: number) {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError(''); setNotice('')
    try { await guestApi.sent(transferId); setMoney(await guestApi.money(gatheringId, unitId)); setNotice('총무에게 보냈다고 알려드렸어요.') }
    catch (failure) { setError(guestError(failure)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  async function copy(account: string) {
    try { await navigator.clipboard.writeText(account); setNotice('계좌번호를 복사했어요.') }
    catch { setError('복사하지 못했어요. 계좌번호를 길게 눌러 복사해주세요.') }
  }
  return <section className="js-guest-money" aria-label="내 정산 금액"><h2>{money?.isEstimate ? '내 예상 금액' : '내 정산 금액'}</h2>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!money ? !error && <p>금액을 확인하고 있어요…</p> : !money.available ? <p>총무가 금액과 참여 인원을 확인 중이에요. 잠시 뒤 최신 상태를 확인해주세요.</p> : <>
      <strong className="js-guest-total">{won(money.total ?? 0)}</strong><p>{money.isEstimate ? '아직 예상 금액이에요. 정산이 확정되면 송금해주세요.' : '내 전체 부담액이에요. 입금 확인된 금액도 포함되어 있어요.'}</p>
      {money.transfers.map((transfer) => <article className="js-respitem" key={transfer.toParticipantId}><b>{transfer.toDisplayName}님에게 {won(transfer.amount)}</b>
        <details><summary>금액 근거</summary><ul>{transfer.basis.map((basis) => <li key={basis.roundId}>{rounds.find((round) => round.id === basis.roundId)?.seq ?? '?'}차 · {RESPONSE_LABEL[basis.type]} · {won(basis.amount)}</li>)}</ul></details>
        {!money.isEstimate && <>{transfer.payout ? <><p className="js-account">{transfer.payout.bank} {transfer.payout.accountNo}<br />예금주 {transfer.payout.holder}</p><button type="button" className="js-mini" onClick={() => { void copy(transfer.payout!.accountNo) }}>계좌번호 복사</button></> : <p>받는 분의 계좌 등록을 기다리고 있어요.</p>}
          {transfer.status === 'WAITING' && transfer.id !== null ? <><p className="js-hint">은행 앱에서 직접 송금한 다음 눌러주세요.</p><button type="button" className="js-cta" disabled={busy || !transfer.payout} onClick={() => { void sent(transfer.id!) }}>보냈어요</button></> : <p role="status">{transfer.status === 'CONFIRMED' ? '입금 확인 완료' : '입금 확인을 기다리고 있어요'}</p>}
        </>}
      </article>)}
      {!money.isEstimate && money.transfers.length === 0 && <p>보낼 금액이 없어요.</p>}
    </>}
  </section>
}

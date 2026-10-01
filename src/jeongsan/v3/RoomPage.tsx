/**
 * R1 정산방 — v3의 중심 화면(`docs/SCREENS.md` §5).
 *
 * 맨 위 "지금 할 일" 한 줄과 맨 아래 버튼 하나가 짝이다. 나머지(참여자 상태·차수 요약·
 * 타임라인)는 그 할 일의 맥락을 보여줄 뿐이다. 상태 이름(OPEN·SETTLING)은 쓰지 않는다.
 */
import { useEffect, useRef, useState } from 'react'
import { HostCharacter } from '../character/HostCharacter'
import { levelOf, titleOf } from '../character/hostSprite'
import type { Gathering, Id, Participant } from './model'
import { hasResponded, hostOf, nameOf, participantOfUser, won } from './model'
import type { ActionKind } from './nextAction'
import { nextAction } from './nextAction'

type Props = {
  g: Gathering
  meUserId: Id
  onBack: () => void
  onAction: (kind: ActionKind) => void
  onEditRound: (roundId: Id) => void
  onAddRound: () => void
  onSend: (text: string) => void
  onConfirm: (transferId: Id) => void
  onNotReceived: (transferId: Id) => void
}

export function RoomPage({ g, meUserId, onBack, onAction, onEditRound, onAddRound, onSend, onConfirm, onNotReceived }: Props) {
  const host = hostOf(g)
  const me = participantOfUser(g, meUserId)
  const isHost = g.hostUserId === meUserId
  // 정산하기 이후엔 계산 입력이 고정이라 차수를 고칠 수 없다
  const canEditRounds = isHost && g.status === 'OPEN'
  const act = nextAction(g, meUserId)
  const incoming = me ? g.transfers.filter((t) => t.toParticipantId === me.id && t.status !== 'CONFIRMED') : []

  return (
    <div className="js-shell js-room">
      <header className="js-rtop">
        <button className="js-back" onClick={onBack} aria-label="내 술자리로">‹</button>
        <div className="js-rtitle">
          <b>{g.title}</b>
          {g.status === 'COMPLETED' && <span className="js-badge done">완료</span>}
        </div>
        {isHost && <button className="js-more" aria-label="술자리 메뉴" onClick={() => onAction('SHARE')}>⋯</button>}
      </header>

      <section className="js-hostcard" aria-label="총무">
        <div className="js-hostav"><HostCharacter spoons={host.spoonCount} /></div>
        <div className="js-hostwho">
          <span className="nm">{host.displayName}<small>총무{isHost ? ' · 나' : ''}</small></span>
          <span className={`js-spoonchip lv${levelOf(host.spoonCount)}`}>
            🥄 {host.spoonCount.toLocaleString('ko-KR')} · {titleOf(host.spoonCount)}
          </span>
        </div>
      </section>

      <section className={`js-banner ${act.tone}`} role="status">
        <b>{act.banner}</b>
        {act.note && <span>{act.note}</span>}
      </section>

      <People g={g} />

      {g.rounds.length > 0 && (
        <section className="js-rounds" aria-label="차수">
          {g.rounds.map((r) =>
            canEditRounds ? (
              <button key={r.id} className="js-round" onClick={() => onEditRound(r.id)} aria-label={`${r.label} 고치기`}>
                <em>{r.label}</em> {r.total.toLocaleString('ko-KR')}
              </button>
            ) : (
              <span key={r.id} className="js-round"><em>{r.label}</em> {r.total.toLocaleString('ko-KR')}</span>
            ),
          )}
          {canEditRounds && <button className="js-round add" onClick={onAddRound}>+ 차수</button>}
        </section>
      )}

      {incoming.length > 0 && (
        <section className="js-incoming" aria-label="받을 돈">
          <div className="js-lab">받을 돈</div>
          {incoming.map((t) => (
            <div key={t.id} className="js-inrow">
              <div>
                <b>{nameOf(g, t.fromParticipantId)}</b> {won(t.amount)}
                <small>{t.status === 'SENT' ? '보냈대요' : t.notReceivedAt ? '다시 기다리는 중' : '기다리는 중'}</small>
              </div>
              <div className="js-inbtns">
                {t.status === 'SENT' && (
                  <button className="js-mini ghost" onClick={() => onNotReceived(t.id)}>아직 안 들어왔어요</button>
                )}
                <button className="js-mini ok" onClick={() => onConfirm(t.id)}>확인</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <Timeline g={g} meId={me?.id} />

      <Dock
        actionLabel={act.action?.label}
        actionKind={act.action?.kind}
        onAction={onAction}
        onSend={onSend}
        canChat={!!me}
      />
    </div>
  )
}

/** 참여자 줄 — 정산 전엔 응답 여부, 정산 후엔 송금 상태를 점으로 */
function People({ g }: { g: Gathering }) {
  const stateOf = (p: Participant): { mark: string; cls: string; label: string } => {
    if (g.status === 'OPEN') {
      return hasResponded(g, p.id)
        ? { mark: '●', cls: 'ok', label: '응답함' }
        : { mark: '○', cls: 'wait', label: '아직' }
    }
    const out = g.transfers.filter((t) => t.fromParticipantId === p.id)
    if (out.every((t) => t.status === 'CONFIRMED')) return { mark: '✓', cls: 'ok', label: '완료' }
    if (out.some((t) => t.status === 'SENT')) return { mark: '…', cls: 'sent', label: '보냈어요' }
    return { mark: '○', cls: 'wait', label: '대기' }
  }
  return (
    <section className="js-people" aria-label="참여자">
      {g.participants.map((p) => {
        const s = stateOf(p)
        return (
          <div key={p.id} className="js-person" title={`${p.displayName} · ${s.label}`}>
            <div className="js-av">{p.displayName.slice(0, 1)}</div>
            <span className="nm">{p.displayName}</span>
            <span className={`js-pdot ${s.cls}`} aria-label={s.label}>{s.mark}</span>
          </div>
        )
      })}
    </section>
  )
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    : `${d.getMonth() + 1}/${d.getDate()}`
}

function Timeline({ g, meId }: { g: Gathering; meId?: Id }) {
  // 타임라인 상자 안에서만 맨 아래로 — scrollIntoView는 창 전체까지 끌어내려 화면 위가 잘렸다
  const box = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = box.current
    if (el) el.scrollTop = el.scrollHeight
  }, [g.timeline.length])
  return (
    <section ref={box} className="js-tl" aria-label="타임라인">
      {g.timeline.map((e) => {
        if (e.type === 'MESSAGE') {
          const mine = e.authorParticipantId === meId
          return (
            <div key={e.id} className={`js-tlmsg${mine ? ' mine' : ''}`}>
              {!mine && <b>{nameOf(g, e.authorParticipantId!)}</b>}
              <p>{e.body}</p>
              <time>{fmtTime(e.createdAt)}</time>
            </div>
          )
        }
        return (
          <div key={e.id} className={`js-tlsys${e.type === 'SPOON' ? ' spoon' : ''}`}>
            <span>{e.type === 'SPOON' ? '🥄' : '⚙'} {e.body}</span>
            <time>{fmtTime(e.createdAt)}</time>
          </div>
        )
      })}
    </section>
  )
}

function Dock({
  actionLabel, actionKind, onAction, onSend, canChat,
}: {
  actionLabel?: string
  actionKind?: ActionKind
  onAction: (k: ActionKind) => void
  onSend: (t: string) => void
  canChat: boolean
}) {
  const [text, setText] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    onSend(t.slice(0, 500))
    setText('')
  }
  return (
    <div className="js-dock">
      {canChat && (
        <form className="js-chatin" onSubmit={submit}>
          <label htmlFor="room-msg" className="js-sr">메시지</label>
          <input id="room-msg" value={text} onChange={(e) => setText(e.target.value)} placeholder="한마디 남기기" maxLength={500} />
          <button type="submit" disabled={!text.trim()}>보내기</button>
        </form>
      )}
      {actionLabel && actionKind && (
        <button className={`js-cta${actionKind === 'GIVE_SPOON' ? ' acc' : ''}`} onClick={() => onAction(actionKind)}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

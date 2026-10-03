/**
 * 정산어택 v3 라우터 — `docs/SCREENS.md` §2.
 *
 * 옛 `JeongsanApp`(모임 구조)을 고쳐 쓰지 않고 옆에 새로 세운다. v3 경로만 이쪽으로 넘어오고,
 * 모든 화면이 옮겨지면 옛 라우터와 옛 화면을 통째로 지운다.
 */
import './v3.css'
import { useEffect } from 'react'
import { SideStreet } from '../SideStreet'
import { HomePage } from './HomePage'
import { RoomPage } from './RoomPage'
import { RoundEditPage } from './RoundEditPage'
import { RespondPage } from './RespondPage'
import { PayPage } from './PayPage'
import { SettlePage } from './SettlePage'
import { NotificationsPage } from './NotificationsPage'
import { EntryPage } from './EntryPage'
import { entryRoute } from './home'
import { isV3Home } from './routes'
import { seenKey, useV3 } from './store'
import { MOCK_USERS } from './mock'
import { mockPreview } from './mockServer'
import type { Id } from './model'
import { participantOfUser, roundsPaidBy } from './model'
import type { ActionKind } from './nextAction'

type Props = {
  route: string
  navigate: (to: string) => void
  /** 첫 화면(H1)의 뒤로가기 — 로그인 화면으로 돌아간다 */
  onLeave: () => void
  /** 참여 입구(P1)만 로그인 전에도 열린다. 그 밖의 v3 화면은 늘 로그인 뒤라 기본값 true */
  loggedIn?: boolean
  onLogin?: () => boolean
}

export function AppV3({ route, navigate, onLeave, loggedIn = true, onLogin = () => true }: Props) {
  const {
    me, rooms, sendMessage, giveSpoon, markSent, confirmIncoming, notReceived, saveRound, deleteRound,
    createGathering, actAs, respond, respondAsHost, settle,
    notifications, markRead, markAllRead, paySeen, markPaySeen, joinGathering, setExempt, removeParticipant,
  } = useV3()
  const isPaySeen = (roomId: Id) => paySeen.includes(seenKey(roomId, me.id))
  const myAlerts = notifications.filter((n) => n.userId === me.id)

  // 화면을 옮기면 맨 위부터 — 앞 화면의 스크롤 위치가 남아 머리말이 잘린 채 열렸다
  useEffect(() => { window.scrollTo(0, 0) }, [route])

  // 개발용 바 — 지금 보고 있는 술자리(있으면)에서 각 사람의 역할을 같이 보여준다
  const roomInRoute = rooms[Number(route.match(/^\/jungsan\/r\/(\d+)/)?.[1])]
  const roleIn = (userId: Id) => {
    if (!roomInRoute) return ''
    const p = participantOfUser(roomInRoute, userId)
    if (!p) return ''
    if (roomInRoute.hostUserId === userId) return '총무'
    return roundsPaidBy(roomInRoute, p.id).length > 0 ? '결제' : '참여'
  }
  const switchTo = (userId: Id) => {
    actAs(userId)
    // 그 사람이 없는 술자리를 보고 있었다면 그 사람의 첫 화면으로
    if (roomInRoute && !participantOfUser(roomInRoute, userId)) navigate('/jungsan')
  }

  const wrap = (node: React.ReactNode) => (
    <div className="js-root">
      <SideStreet />
      {import.meta.env.DEV && (
        <div className="js-dev v3">
          <span>v3 mock</span>
          <button className={isV3Home(route) ? 'on' : ''} onClick={() => navigate('/jungsan')}>내 술자리</button>
          {Object.values(rooms)
            .filter((r) => participantOfUser(r, me.id))
            .map((r) => (
              <button key={r.id} className={roomInRoute?.id === r.id ? 'on' : ''} onClick={() => navigate(`/jungsan/r/${r.id}`)}>
                {r.title}
              </button>
            ))}
          {/* 내가 없는 술자리는 링크로 들어오기 — 단톡방에서 링크를 누른 것과 같다 */}
          {Object.values(rooms)
            .filter((r) => !participantOfUser(r, me.id))
            .map((r) => (
              <button key={`j${r.id}`} className={route === `/jungsan/j/${r.shareToken}` ? 'on' : ''} onClick={() => navigate(`/jungsan/j/${r.shareToken}`)}>
                🔗 {r.title}
              </button>
            ))}
          <span className="sep">보는 사람</span>
          {MOCK_USERS.map((u) => {
            const role = roleIn(u.id)
            return (
              <button key={u.id} className={me.id === u.id ? 'on' : ''} onClick={() => switchTo(u.id)}>
                {u.displayName}{role && <small> {role}</small>}
              </button>
            )
          })}
        </div>
      )}
      {node}
    </div>
  )

  // ── P1 참여 입구 (링크) ──
  const joinRoute = route.match(/^\/jungsan\/j\/([^/]+)$/)
  if (joinRoute) {
    const token = joinRoute[1]
    const g = Object.values(rooms).find((r) => r.shareToken === token)
    return wrap(
      <EntryPage
        // 보는 사람이 바뀌면 고르던 응답을 비운다
        key={`${token}:${me.id}`}
        g={g}
        meUserId={me.id}
        loggedIn={loggedIn}
        onLogin={onLogin}
        onJoin={(answers) => {
          const id = joinGathering(token, answers)
          if (id !== null) navigate(`/jungsan/r/${id}`)
        }}
        onOpenRoom={() => g && navigate(`/jungsan/r/${g.id}`)}
        onHome={() => navigate('/jungsan')}
      />,
    )
  }

  // ── H1 내 술자리 ──
  if (isV3Home(route)) {
    return wrap(
      <HomePage
        // 보는 사람이 바뀌면 처음 열 탭도 그 사람 기준으로 다시 고른다
        key={me.id}
        me={me}
        rooms={Object.values(rooms)}
        onBack={onLeave}
        // 참여자는 정산방보다 할 일 화면(응답하기·내 금액)을 먼저 — home.ts entryRoute
        onOpen={(id) => navigate(entryRoute(rooms[id], me.id, isPaySeen(id)))}
        paySeen={isPaySeen}
        unread={myAlerts.filter((n) => !n.read).length}
        onOpenAlerts={() => navigate('/jungsan/notifications')}
        onCreate={() => {
          // 입력 없이 바로 만들고 1차 입력으로 — SCREENS.md §3.1
          const id = createGathering()
          navigate(`/jungsan/r/${id}/round/new`)
        }}
      />,
    )
  }

  // ── N1 알림함 ──
  if (route === '/jungsan/notifications') {
    return wrap(
      <NotificationsPage
        items={myAlerts}
        onBack={() => navigate('/jungsan')}
        onReadAll={markAllRead}
        onOpen={(n) => { markRead(n.id); navigate(n.link) }}
      />,
    )
  }

  // ── R2 차수 편집 ──
  const roundRoute = route.match(/^\/jungsan\/r\/(\d+)\/round\/(new|\d+)$/)
  if (roundRoute) {
    const g = rooms[Number(roundRoute[1])]
    const back = () => navigate(`/jungsan/r/${roundRoute[1]}`)
    if (!g) return wrap(<Soon title="없는 술자리예요" onBack={() => navigate('/jungsan')} />)
    if (g.hostUserId !== me.id) return wrap(<Soon title="차수는 총무만 고칠 수 있어요" onBack={back} />)
    if (g.status !== 'OPEN') return wrap(<Soon title="정산한 뒤에는 차수를 고칠 수 없어요" onBack={back} />)
    const round = roundRoute[2] === 'new' ? undefined : g.rounds.find((r) => r.id === Number(roundRoute[2]))
    if (roundRoute[2] !== 'new' && !round) return wrap(<Soon title="없는 차수예요" onBack={back} />)
    return wrap(
      <RoundEditPage
        // 새 차수를 연달아 넣을 때 경로가 같아도 입력칸을 비우도록 차수 수로 새로 그린다
        key={round ? `r${round.id}` : `new${g.rounds.length}`}
        g={g}
        round={round}
        onBack={back}
        onSave={(draft, andNext) => {
          saveRound(g.id, draft)
          navigate(andNext ? `/jungsan/r/${g.id}/round/new` : `/jungsan/r/${g.id}`)
        }}
        onDelete={round ? () => { deleteRound(g.id, round.id); back() } : undefined}
      />,
    )
  }

  // ── R3 정산하기 · P2 내 응답 · P3 내 금액 ──
  const step = route.match(/^\/jungsan\/r\/(\d+)\/(settle|respond|pay)$/)
  if (step) {
    const g = rooms[Number(step[1])]
    const back = () => navigate(`/jungsan/r/${step[1]}`)
    if (!g) return wrap(<Soon title="없는 술자리예요" onBack={() => navigate('/jungsan')} />)
    const mine = participantOfUser(g, me.id)
    if (!mine) return wrap(<Soon title="이 술자리에 참여하지 않았어요" onBack={() => navigate('/jungsan')} />)

    if (step[2] === 'settle') {
      if (g.hostUserId !== me.id) return wrap(<Soon title="정산은 총무만 할 수 있어요" onBack={back} />)
      if (g.status !== 'OPEN') return wrap(<Soon title="이미 정산한 술자리예요" onBack={back} />)
      if (g.rounds.length === 0) return wrap(<Soon title="차수를 먼저 넣어주세요" onBack={back} />)
      if (g.participants.length < 2) return wrap(<Soon title="혼자서는 정산할 수 없어요. 링크를 먼저 보내주세요" onBack={back} />)
      return wrap(
        <SettlePage
          g={g}
          preview={mockPreview(g)}
          onBack={back}
          onRespondFor={(pid, rid, t) => respondAsHost(g.id, pid, rid, t)}
          onSettle={(rev) => {
            const res = settle(g.id, rev)
            if (res === 'OK') back()
            return res
          }}
        />,
      )
    }

    if (step[2] === 'respond') {
      if (g.status !== 'OPEN') return wrap(<Soon title="정산된 뒤에는 응답을 고칠 수 없어요" onBack={back} />)
      if (g.rounds.length === 0) return wrap(<Soon title="아직 차수가 없어요" onBack={back} />)
      return wrap(
        <RespondPage
          key={`${g.id}:${mine.id}`}
          g={g}
          meId={mine.id}
          onBack={back}
          onSubmit={(answers) => { respond(g.id, answers); back() }}
        />,
      )
    }

    if (g.status === 'OPEN') return wrap(<Soon title="아직 정산 전이에요" onBack={back} />)
    return wrap(
      <PayPage g={g} meId={mine.id} onBack={back} onSeen={() => markPaySeen(g.id)} onSent={(tid) => markSent(g.id, tid)} />,
    )
  }

  const room = route.match(/^\/jungsan\/r\/(\d+)$/)
  if (room) {
    const g = rooms[Number(room[1])]
    if (!g) return wrap(<Soon title="없는 술자리예요" onBack={() => navigate('/jungsan')} />)

    // 하단 버튼이 가는 곳. 아직 없는 화면은 준비 중으로 둔다(순서: SCREENS.md §9).
    const onAction = (kind: ActionKind) => {
      switch (kind) {
        case 'GIVE_SPOON': return giveSpoon(g.id)
        case 'CONFIRM_INCOMING':
          document.querySelector('.js-incoming')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        case 'SHARE': return navigate(`/jungsan/r/${g.id}/share`)
        case 'SETTLE': return navigate(`/jungsan/r/${g.id}/settle`)
        case 'EDIT_FIRST_ROUND': return navigate(`/jungsan/r/${g.id}/round/new`)
        case 'RESPOND':
        case 'EDIT_RESPONSE': return navigate(`/jungsan/r/${g.id}/respond`)
        case 'VIEW_PAY':
        case 'RESEND': return navigate(`/jungsan/r/${g.id}/pay`)
        case 'REGISTER_ACCOUNT': return navigate('/jungsan/account')
      }
    }

    return wrap(
      <RoomPage
        g={g}
        meUserId={me.id}
        onBack={() => navigate('/jungsan')}
        onAction={onAction}
        onEditRound={(rid) => navigate(`/jungsan/r/${g.id}/round/${rid}`)}
        onAddRound={() => navigate(`/jungsan/r/${g.id}/round/new`)}
        onSend={(t) => sendMessage(g.id, t)}
        onConfirm={(tid) => confirmIncoming(g.id, tid)}
        onNotReceived={(tid) => notReceived(g.id, tid)}
        onExempt={(pid, rid, ex) => setExempt(g.id, pid, rid, ex)}
        onRemove={(pid) => { removeParticipant(g.id, pid) }}
      />,
    )
  }

  const sub = route.match(/^\/jungsan\/r\/(\d+)\/(\w+)$/)
  return wrap(
    <Soon
      title="아직 만들고 있는 화면이에요"
      onBack={() => navigate(sub ? `/jungsan/r/${sub[1]}` : '/jungsan')}
    />,
  )
}

function Soon({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="js-shell">
      <div className="js-soon">
        <b>{title}</b>
        <button className="js-cta2" style={{ maxWidth: 240 }} onClick={onBack}>돌아가기</button>
      </div>
    </div>
  )
}

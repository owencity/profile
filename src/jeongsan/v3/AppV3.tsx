/**
 * 정산어택 v3 라우터 — `docs/SCREENS.md` §2.
 *
 * 옛 `JeongsanApp`(모임 구조)을 고쳐 쓰지 않고 옆에 새로 세운다. v3 경로만 이쪽으로 넘어오고,
 * 모든 화면이 옮겨지면 옛 라우터와 옛 화면을 통째로 지운다.
 *
 * 화면의 동작은 모두 `gateway`를 거친다 — 목데이터면 스토어를 바로 바꾸고, API 모드면 서버를 부른 뒤
 * 서버 응답으로 스토어를 채운다. 실패하면 gateway가 돌려준 문구를 토스트로 띄운다.
 */
import './v3.css'
import { useEffect, useState } from 'react'
import { SideStreet } from '../SideStreet'
import { HomePage } from './HomePage'
import { RoomPage } from './RoomPage'
import { RoundEditPage } from './RoundEditPage'
import { RespondPage } from './RespondPage'
import { PayPage } from './PayPage'
import { SettlePage } from './SettlePage'
import { NotificationsPage } from './NotificationsPage'
import { EntryPage } from './EntryPage'
import { AccountPage } from './AccountPage'
import { NamePage } from './NamePage'
import { isApiMode } from './api'
import { gateway } from './gateway'
import { entryRoute } from './home'
import { isV3Home } from './routes'
import { seenKey, useV3 } from './store'
import type { SettlePreview } from './mockServer'
import type { Gathering, Id } from './model'
import { entryChoiceLabel, toEntryRooms } from './serverModel'
import { paymentRequestMessage, shareMessage, shareUrl } from './share'
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

/** 링크 입구(P1)의 서버 미리보기 — 토큰별로 한 번 읽는다 */
type Entry = { token: string; rooms: Gathering[]; count: number } | { token: string; error: string }

export function AppV3({ route, navigate, onLeave, loggedIn = true, onLogin = () => true }: Props) {
  const { me, rooms, actAs, notifications, paySeen, setExempt, users } = useV3()
  const isPaySeen = (roomId: Id) => paySeen.includes(seenKey(roomId, me.id))
  const myAlerts = notifications.filter((n) => n.userId === me.id)
  const api = isApiMode()

  // 화면을 옮기면 맨 위부터 — 앞 화면의 스크롤 위치가 남아 머리말이 잘린 채 열렸다
  useEffect(() => { window.scrollTo(0, 0) }, [route])

  // 잠깐 떴다 사라지는 안내(링크 복사, 서버 오류 등)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(id)
  }, [toast])

  /** gateway 결과가 문구면 토스트로 띄운다. 성공이면 true */
  const ok = async (p: Promise<string | null>) => {
    const err = await p
    if (err) setToast(err)
    return err === null
  }

  // ── 서버에서 읽기(API 모드) ──
  // 화면에 들어올 때마다 다시 읽는다. 이미 스토어에 있으면 먼저 그대로 그리고 뒤에서 새로 고친다.
  // 스토어에 없는 정산방(주소로 바로 들어옴)은 읽는 동안 "불러오는 중"을 보여준다 — `loaded`가 그 표시다.
  const roomIdInRoute = Number(route.match(/^\/jungsan\/r\/(\d+)/)?.[1])
  const [loaded, setLoaded] = useState<string | null>(null)
  useEffect(() => {
    if (!api || !loggedIn || route.startsWith('/jungsan/j/')) return
    let live = true
    const id = roomIdInRoute
    const load = Number.isNaN(id) || !useV3.getState().rooms[id] ? gateway.loadMine() : gateway.loadRoom(id)
    void load.then((err) => {
      if (!live) return
      if (err) setToast(err)
      setLoaded(route)
    })
    return () => { live = false }
  }, [api, loggedIn, route, roomIdInRoute])
  const loading = api && loaded !== route

  // 링크 입구 미리보기(API 모드, 로그인 전에도)
  const joinToken = route.match(/^\/jungsan\/j\/([^/]+)$/)?.[1]
  const [entry, setEntry] = useState<Entry | null>(null)
  const [pickedUnit, setPickedUnit] = useState<Id | null>(null)
  useEffect(() => {
    if (!api || !joinToken) return
    let live = true
    void gateway.joinPreview(joinToken).then((r) => {
      if (!live) return
      setEntry(typeof r === 'string' ? { token: joinToken, error: r } : { token: joinToken, rooms: toEntryRooms(r, joinToken), count: r.participantCount })
      setPickedUnit(null)
    })
    return () => { live = false }
  }, [api, joinToken])

  // 정산하기(R3) 미리보기 — 금액은 서버가 계산한다. 응답을 대신 넣으면 입력 버전이 바뀌어 다시 읽는다
  const settleRoom = route.match(/^\/jungsan\/r\/(\d+)\/settle$/) ? rooms[roomIdInRoute] : undefined
  const settleKey = settleRoom ? `${settleRoom.id}:${settleRoom.inputRevision}` : null
  const [preview, setPreview] = useState<{ key: string; data: SettlePreview } | null>(null)
  useEffect(() => {
    if (!settleKey) return
    let live = true
    void gateway.preview(Number(settleKey.split(':')[0])).then((r) => {
      if (!live) return
      if (typeof r === 'string') setToast(r)
      else setPreview({ key: settleKey, data: r })
    })
    return () => { live = false }
  }, [settleKey])

  /**
   * 링크 공유 — 폰 브라우저(카톡 인앱 포함)는 OS 공유 시트(Web Share API), 안 되면 문구+링크를 복사한다.
   * 스펙(SCREENS §7)의 "카카오톡 공유(JS SDK)"는 카카오 앱 키·도메인 등록이 필요해 그때 이 자리에 먼저 끼운다.
   */
  const shareRoom = async (g: Gathering) => {
    const url = shareUrl(window.location.origin, g.shareToken)
    const text = shareMessage(g, url)
    try {
      if (navigator.share) {
        await navigator.share({ title: `${g.title} — 정산어택`, text })
        return
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return // 사용자가 공유 시트를 닫음
    }
    try {
      await navigator.clipboard.writeText(text)
      setToast('초대 문구와 링크를 복사했어요. 단톡방에 붙여 넣어주세요')
    } catch {
      setToast(`이 링크를 보내주세요: ${url}`)
    }
  }

  /** 입금 요청(FC-020) — 정산 뒤 사람별 금액·계좌를 단톡방에. 공유 시트가 없으면 복사 */
  const requestPayment = async (g: Gathering) => {
    const text = paymentRequestMessage(g, shareUrl(window.location.origin, g.shareToken))
    try {
      if (navigator.share) {
        await navigator.share({ title: `${g.title} — 입금 요청`, text })
        return
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
      setToast('입금 요청 문구를 복사했어요. 단톡방에 붙여 넣어주세요')
    } catch {
      setToast('복사하지 못했어요. 보낼 돈 화면에서 금액을 확인해주세요')
    }
  }

  // 개발용 바 — 지금 보고 있는 술자리(있으면)에서 각 사람의 역할을 같이 보여준다
  const roomInRoute = rooms[roomIdInRoute]
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
          <span>{api ? 'v3 api' : 'v3 mock'}</span>
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
          {!api && <span className="sep">보는 사람</span>}
          {!api && users.map((u) => {
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
      {toast && <div className="js-toast" role="status">{toast}</div>}
    </div>
  )

  // ── P1 참여 입구 (링크) ──
  if (joinToken) {
    const token = joinToken
    // 이미 들어가 있는 정산방이 있으면 입구 대신 그리로 안내한다(스토어에 있을 때)
    const mineHere = Object.values(rooms).find((r) => r.shareToken === token && participantOfUser(r, me.id))
    let g: Gathering | undefined
    let choices: { id: Id; label: string }[] | undefined
    let count: number | undefined
    if (!api || (loggedIn && mineHere)) {
      g = mineHere ?? Object.values(rooms).find((r) => r.shareToken === token)
    } else {
      if (!entry || entry.token !== token) return wrap(<Soon title="링크를 확인하는 중이에요" onBack={() => navigate('/jungsan')} />)
      if ('rooms' in entry) {
        g = entry.rooms.find((r) => r.id === pickedUnit) ?? entry.rooms[0]
        choices = entry.rooms.map((r) => ({ id: r.id, label: entryChoiceLabel(r) }))
        count = entry.count
      }
    }
    return wrap(
      <EntryPage
        // 보는 사람이 바뀌면 고르던 응답을 비운다
        key={`${token}:${me.id}`}
        g={g}
        meUserId={me.id}
        loggedIn={loggedIn}
        onLogin={onLogin}
        participantCount={count}
        choices={choices}
        onPick={setPickedUnit}
        // 첫 로그인이면 P1에서 이름 확인(L2)을 같이 받는다 — 확인한 이름으로 참여한다
        askName={me.needsName}
        onJoin={async (answers, name) => {
          // 실명 등록이 성공한 뒤에 참여한다 — 실패하면 참여를 보내지 않는다(FC-013, FC-014 §5)
          if (name !== undefined) {
            const err = await gateway.confirmName(name)
            if (err) { setToast(err); return }
          }
          const r = await gateway.join(token, g?.id ?? null, answers)
          if ('error' in r) setToast(r.error)
          else navigate(`/jungsan/r/${r.id}`)
        }}
        onOpenRoom={() => g && navigate(`/jungsan/r/${g.id}`)}
        onHome={() => navigate('/jungsan')}
      />,
    )
  }

  // ── L2 이름 확인 — 첫 로그인이면 내 술자리 대신 한 번 ──
  if (isV3Home(route) && me.needsName) {
    return wrap(<NamePage key={me.id} me={me} onBack={onLeave} onConfirm={gateway.confirmName} />)
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
        onEditAccount={() => navigate('/jungsan/me/account')}
        onCreate={async () => {
          // 입력 없이 바로 만들고 1차 입력으로 — SCREENS.md §3.1
          const r = await gateway.createGathering()
          if ('error' in r) setToast(r.error)
          else navigate(`/jungsan/r/${r.id}/round/new`)
        }}
      />,
    )
  }

  // ── A1 계좌 (내 술자리에서 들어온 경우 — 저장하면 내 술자리로) ──
  if (route === '/jungsan/me/account') {
    return wrap(
      <AccountPage key={me.id} me={me} backTo="내 술자리로" onBack={() => navigate('/jungsan')}
        // 계정 메뉴는 서버 계정이 있을 때만(목데이터에는 로그아웃할 계정이 없다)
        onLogout={api ? async () => { await gateway.logout(); onLeave() } : undefined}
        onDeleteAccount={api ? async () => {
          const err = await gateway.deleteAccount()
          if (err) setToast(err)
          else onLeave()
        } : undefined}
        onSave={async (p) => {
          if (await ok(gateway.registerPayout(p))) { setToast('받을 계좌를 저장했어요'); navigate('/jungsan') }
        }} />,
    )
  }

  // ── N1 알림함 ──
  if (route === '/jungsan/notifications') {
    return wrap(
      <NotificationsPage
        items={myAlerts}
        onBack={() => navigate('/jungsan')}
        onReadAll={() => void gateway.markAllRead()}
        onOpen={(n) => { void gateway.markRead(n.id); navigate(n.link) }}
      />,
    )
  }

  // 주소로 바로 들어와 아직 서버에서 못 읽은 정산방
  const missing = (back: () => void) =>
    wrap(loading ? <Soon title="불러오는 중이에요" onBack={back} /> : <Soon title="없는 술자리예요" onBack={back} />)

  // ── R2 차수 편집 ──
  const roundRoute = route.match(/^\/jungsan\/r\/(\d+)\/round\/(new|\d+)$/)
  if (roundRoute) {
    const g = rooms[Number(roundRoute[1])]
    const back = () => navigate(`/jungsan/r/${roundRoute[1]}`)
    if (!g) return missing(() => navigate('/jungsan'))
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
        onSave={async (draft, andNext, mine, headcount) => {
          const r = await gateway.saveRound(g.id, draft, mine, headcount)
          if ('error' in r) { setToast(r.error); return }
          navigate(andNext ? `/jungsan/r/${g.id}/round/new` : `/jungsan/r/${g.id}`)
        }}
        onDelete={round ? async () => { if (await ok(gateway.deleteRound(g.id, round.id))) back() } : undefined}
      />,
    )
  }

  // ── R3 정산하기 · P2 내 응답 · P3 내 금액 ──
  const step = route.match(/^\/jungsan\/r\/(\d+)\/(settle|respond|pay|account)$/)
  if (step) {
    const g = rooms[Number(step[1])]
    const back = () => navigate(`/jungsan/r/${step[1]}`)
    if (!g) return missing(() => navigate('/jungsan'))
    const mine = participantOfUser(g, me.id)
    if (!mine) return wrap(<Soon title="이 술자리에 참여하지 않았어요" onBack={() => navigate('/jungsan')} />)

    // A1 — 계좌는 사람 단위라 술자리와 상관없이 저장되고, 저장하면 왔던 정산방으로 돌아간다
    if (step[2] === 'account') {
      return wrap(<AccountPage key={me.id} me={me} onBack={back} onSave={async (p) => { if (await ok(gateway.registerPayout(p))) back() }} />)
    }

    if (step[2] === 'settle') {
      if (g.hostUserId !== me.id) return wrap(<Soon title="정산은 총무만 할 수 있어요" onBack={back} />)
      if (g.status !== 'OPEN') return wrap(<Soon title="이미 정산한 술자리예요" onBack={back} />)
      if (g.rounds.length === 0) return wrap(<Soon title="차수를 먼저 넣어주세요" onBack={back} />)
      if (g.participants.length < 2) return wrap(<Soon title="혼자서는 정산할 수 없어요. 링크를 먼저 보내주세요" onBack={back} />)
      // 미리보기는 지금 입력 버전의 것만 쓴다 — 응답을 고친 직후의 옛 금액으로 정산하지 않게
      if (!preview || preview.key !== settleKey) return wrap(<Soon title="금액을 계산하는 중이에요" onBack={back} />)
      return wrap(
        <SettlePage
          g={g}
          preview={preview.data}
          onBack={back}
          onRespondFor={(pid, rid, t) => void ok(gateway.respondAsHost(g.id, pid, rid, t))}
          onSettle={async (p) => {
            const res = await gateway.settle(g.id, p)
            if (res === 'OK') back()
            // 그 사이 바뀌었으면 정산방을 다시 읽어 새 미리보기를 받는다
            if (res === 'STALE') void gateway.loadRoom(g.id)
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
          onSubmit={async (answers) => { if (await ok(gateway.respond(g.id, answers))) back() }}
        />,
      )
    }

    if (g.status === 'OPEN') return wrap(<Soon title="아직 정산 전이에요" onBack={back} />)
    return wrap(
      <PayPage g={g} meId={mine.id} onBack={back}
        onSeen={() => void gateway.markPaySeen(g.id)}
        onSent={(tid) => void ok(gateway.markSent(g.id, tid))} />,
    )
  }

  const room = route.match(/^\/jungsan\/r\/(\d+)$/)
  if (room) {
    const g = rooms[Number(room[1])]
    if (!g) return missing(() => navigate('/jungsan'))

    // 하단 버튼이 가는 곳. 아직 없는 화면은 준비 중으로 둔다(순서: SCREENS.md §9).
    const onAction = (kind: ActionKind) => {
      switch (kind) {
        case 'GIVE_SPOON': return void ok(gateway.giveSpoon(g.id))
        case 'CONFIRM_INCOMING':
          document.querySelector('.js-incoming')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        case 'SHARE': return void shareRoom(g)
        case 'REQUEST_PAYMENT': return void requestPayment(g)
        // 인원을 들어온 사람 수로 — 모두 응답했으면 이 순간 자동 정산된다
        case 'INCLUDE_EXTRA': return void ok(gateway.setHeadcount(g.id, g.participants.length))
        case 'SETTLE': return navigate(`/jungsan/r/${g.id}/settle`)
        case 'EDIT_FIRST_ROUND': return navigate(`/jungsan/r/${g.id}/round/new`)
        case 'RESPOND':
        case 'EDIT_RESPONSE': return navigate(`/jungsan/r/${g.id}/respond`)
        case 'VIEW_PAY':
        case 'RESEND': return navigate(`/jungsan/r/${g.id}/pay`)
        case 'REGISTER_ACCOUNT': return navigate(`/jungsan/r/${g.id}/account`)
      }
    }

    // 같은 술자리에 내가 총무인 정산방이 이미 있으면(다음 차를 이미 맡음) 새로 만들지 않고 그리로
    const myNext = Object.values(rooms).find((r) =>
      r.id !== g.id && r.hostUserId === me.id && r.gatheringId !== undefined && r.gatheringId === g.gatheringId)

    return wrap(
      <RoomPage
        g={g}
        meUserId={me.id}
        onBack={() => navigate('/jungsan')}
        onAction={onAction}
        onEditRound={(rid) => navigate(`/jungsan/r/${g.id}/round/${rid}`)}
        onAddRound={() => navigate(`/jungsan/r/${g.id}/round/new`)}
        onSend={(t) => void ok(gateway.sendMessage(g.id, t))}
        onConfirm={(tid) => void ok(gateway.confirmIncoming(g.id, tid))}
        onNotReceived={(tid) => void ok(gateway.notReceived(g.id, tid))}
        // 면제는 서버 API 보류(SETTLEMENT_UNITS §4.2) — 화면에서도 꺼져 있다(features.SHOW_EXEMPT)
        onExempt={(pid, rid, ex) => setExempt(g.id, pid, rid, ex)}
        onRemove={(pid) => void ok(gateway.removeParticipant(g.id, pid))}
        myNextRoomId={myNext?.id}
        onOpenMyNext={() => myNext && navigate(`/jungsan/r/${myNext.id}`)}
        onStartNext={async (participantIds) => {
          // 같은 술자리 안에 내가 총무인 정산 단위 → 바로 다음 차 금액 입력(FC-015)
          const r = await gateway.createUnit(g.id, participantIds)
          if ('error' in r) { setToast(r.error); return }
          setToast('다음 차 총무가 됐어요. 금액을 넣어주세요')
          navigate(`/jungsan/r/${r.id}/round/new`)
        }}
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

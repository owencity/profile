/**
 * 정산어택 v3 라우터 — `docs/SCREENS.md` §2.
 *
 * 옛 `JeongsanApp`(모임 구조)을 고쳐 쓰지 않고 옆에 새로 세운다. v3 경로만 이쪽으로 넘어오고,
 * 모든 화면이 옮겨지면 옛 라우터와 옛 화면을 통째로 지운다.
 */
import './v3.css'
import { SideStreet } from '../SideStreet'
import { RoomPage } from './RoomPage'
import { useV3 } from './store'
import type { ActionKind } from './nextAction'

type Props = { route: string; navigate: (to: string) => void }

export function AppV3({ route, navigate }: Props) {
  const { me, rooms, sendMessage, giveSpoon, confirmIncoming, notReceived } = useV3()

  const wrap = (node: React.ReactNode) => (
    <div className="js-root">
      <SideStreet />
      {import.meta.env.DEV && (
        <div className="js-dev v3">
          <span>v3 mock</span>
          {Object.values(rooms).map((r) => (
            <button key={r.id} className={route === `/jungsan/r/${r.id}` ? 'on' : ''} onClick={() => navigate(`/jungsan/r/${r.id}`)}>
              {r.title}
            </button>
          ))}
        </div>
      )}
      {node}
    </div>
  )

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
        case 'EDIT_FIRST_ROUND': return navigate(`/jungsan/r/${g.id}/round`)
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
        onSend={(t) => sendMessage(g.id, t)}
        onConfirm={(tid) => confirmIncoming(g.id, tid)}
        onNotReceived={(tid) => notReceived(g.id, tid)}
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

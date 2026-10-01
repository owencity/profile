/**
 * N1 알림함 — docs/SCREENS.md §2. 푸시를 놓쳐도(권한 거부 등) 여기서 다시 본다.
 * 누르면 읽음 처리하고 그 알림이 가리키는 화면으로 간다.
 */
import type { AppNotification } from './model'
import { BackButton } from './BackButton'

type Props = {
  items: AppNotification[]
  onBack: () => void
  onOpen: (n: AppNotification) => void
  onReadAll: () => void
}

function ago(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  if (min < 60 * 24) return `${Math.round(min / 60)}시간 전`
  return `${Math.round(min / 60 / 24)}일 전`
}

export function NotificationsPage({ items, onBack, onOpen, onReadAll }: Props) {
  const unread = items.filter((n) => !n.read).length
  return (
    <div className="js-shell narrow js-n1">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="내 술자리로" />
        <div className="js-rtitle"><b>알림</b></div>
        {unread > 0 && <button type="button" className="js-linkbtn" onClick={onReadAll}>모두 읽음</button>}
      </header>

      {items.length === 0 ? (
        <div className="js-homeempty">아직 알림이 없어요</div>
      ) : (
        <ul className="js-nlist">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" className={`js-nrow${n.read ? '' : ' unread'}`} onClick={() => onOpen(n)}>
                <b>{n.title}</b>
                <span>{n.body}</span>
                <time>{ago(n.createdAt)}</time>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

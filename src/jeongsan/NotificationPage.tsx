/**
 * 알림함 — `/jungsan/alerts`
 *
 * **정산은 금액이 나왔다고 끝이 아니라 입금까지 돼야 끝난다.**
 * 그래서 알림이 한 번으로 안 끝난다 — 금액이 확정될 때 한 번, 입금이 밀리면 또 한 번.
 *
 * 안 읽은 것을 위로 올리지 않고 **시간 순서 그대로** 둔다. 정산은 "언제 무슨 일이
 * 있었는지"가 근거라서, 순서를 흔들면 흐름을 못 읽는다. 대신 안 읽은 것에 점을 찍는다.
 */
import type { AppNotification, NotificationKind } from './types'
import { Bar, Shell } from './ui'

/** 알림 종류마다 성격이 다르다 — 재촉인지, 알림인지, 다툼인지가 한눈에 보여야 한다. */
const KIND: Record<NotificationKind, { icon: string; tone: string }> = {
  GATHERING_OPENED: { icon: '🍻', tone: '' },
  CHECK_REQUEST: { icon: '✅', tone: 'act' },
  SETTLED: { icon: '💰', tone: '' },
  PAYMENT_REMINDER: { icon: '⏰', tone: 'warn' },
  DISPUTE_OPENED: { icon: '🙋', tone: 'warn' },
  DISPUTE_MESSAGE: { icon: '💬', tone: 'act' },
  PAYMENT_RECEIVED: { icon: '🎉', tone: 'ok' },
}

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}일 전` : iso.slice(5, 10).replace('-', '/')
}

export function NotificationPage({
  items, onOpen, onReadAll, onBack,
}: {
  items: AppNotification[]
  onOpen: (n: AppNotification) => void
  onReadAll: () => void
  onBack: () => void
}) {
  const unread = items.filter((n) => !n.read).length

  return (
    <Shell narrow>
      <Bar title="알림" onBack={onBack} />

      {unread > 0 && (
        <button className="js-cta2" style={{ marginTop: 4 }} onClick={onReadAll}>
          안 읽은 {unread}개 모두 읽음으로
        </button>
      )}

      {items.length === 0 && (
        <div className="js-empty" style={{ marginTop: 24 }}>
          <div className="t">알림이 없어요</div>
          <div className="s">술자리가 열리거나 정산이 시작되면 여기로 옵니다.</div>
        </div>
      )}

      <div className="js-alerts">
        {items.map((n) => {
          const k = KIND[n.kind]
          return (
            <button
              key={n.id}
              className={`js-alert ${k.tone}${n.read ? '' : ' unread'}`}
              onClick={() => onOpen(n)}
            >
              <span className="ic">{k.icon}</span>
              <span className="body">
                <span className="t">
                  {n.title}
                  {!n.read && <i className="dot" />}
                </span>
                <span className="b">{n.body}</span>
              </span>
              <span className="ago">{ago(n.createdAt)}</span>
            </button>
          )
        })}
      </div>
    </Shell>
  )
}

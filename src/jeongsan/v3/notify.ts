/**
 * 상태 전이 → 알림. 술자리의 전(prev)과 후(next)를 비교해 누구에게 무슨 알림을 보낼지 정한다.
 *
 * 서버에선 도메인 이벤트(정산됨·보냈어요·안 들어왔어요·완료)를 받아 알림·푸시를 만드는 자리다.
 * 동작마다 알림 코드를 흩뿌리지 않고 "무엇이 바뀌었나"만 보고 정하게 해서, 어떤 경로로 상태가
 * 바뀌어도 알림이 빠지지 않게 한다. 행동한 본인에게는 보내지 않는다.
 */
import type { AppNotification, Gathering } from './model'
import { hostOf, nameOf, won } from './model'

export type NewNotification = Omit<AppNotification, 'id' | 'read' | 'createdAt'>

const userOf = (g: Gathering, participantId: number) => g.participants.find((p) => p.id === participantId)!.userId

export function notificationsFor(prev: Gathering, next: Gathering): NewNotification[] {
  const out: NewNotification[] = []
  const room = `/jungsan/r/${next.id}`
  const host = hostOf(next)

  // ── 정산됨: 참여자 모두에게 "입금액을 확인해주세요" ──
  if (prev.status === 'OPEN' && next.status !== 'OPEN') {
    const autoIds = new Set(next.responses.filter((r) => r.source === 'AUTO').map((r) => r.participantId))
    for (const p of next.participants) {
      if (p.id === host.id) continue
      const outgoing = next.transfers.filter((t) => t.fromParticipantId === p.id)
      const auto = autoIds.has(p.id) ? ' · 응답이 없어 전 차수 참석·알코올로 계산됐어요' : ''
      if (outgoing.length > 0) {
        const first = outgoing[0]
        const more = outgoing.length > 1 ? ` 외 ${outgoing.length - 1}건` : ''
        out.push({
          userId: p.userId, roomId: next.id, link: `${room}/pay`,
          title: '정산이 나왔어요! 입금액을 확인해주세요',
          body: `${next.title} · ${nameOf(next, first.toParticipantId)}님께 ${won(first.amount)}${more}${auto}`,
        })
      } else {
        out.push({
          userId: p.userId, roomId: next.id, link: room,
          title: '정산이 나왔어요',
          body: `${next.title} · 보낼 돈이 없어요${auto}`,
        })
      }
    }
    // 자동응답은 총무에게도 알린다(REQUIREMENTS 자동응답 규칙)
    if (autoIds.size > 0) {
      out.push({
        userId: host.userId, roomId: next.id, link: room,
        title: '자동응답으로 계산된 사람이 있어요',
        body: `${next.title} · ${[...autoIds].map((id) => nameOf(next, id)).join('·')}님은 전 차수 참석·알코올로 계산됐어요`,
      })
    }
  }

  // ── 송금 상태 변화 ──
  for (const t of next.transfers) {
    const before = prev.transfers.find((x) => x.id === t.id)
    if (!before) continue
    if (before.status === 'WAITING' && t.status === 'SENT') {
      out.push({
        userId: userOf(next, t.toParticipantId), roomId: next.id, link: room,
        title: `${nameOf(next, t.fromParticipantId)}님이 보냈대요. 입금을 확인해주세요`,
        body: `${next.title} · ${won(t.amount)}`,
      })
    }
    if (before.status === 'SENT' && t.status === 'WAITING' && t.notReceivedAt !== before.notReceivedAt) {
      out.push({
        userId: userOf(next, t.fromParticipantId), roomId: next.id, link: `${room}/pay`,
        title: `${nameOf(next, t.toParticipantId)}님이 아직 입금을 확인 못 했대요`,
        body: `${next.title} · ${won(t.amount)} · 보낸 내역을 확인해주세요`,
      })
    }
  }

  // ── 모두 입금 완료 ──
  if (prev.status !== 'COMPLETED' && next.status === 'COMPLETED') {
    for (const p of next.participants) {
      out.push({
        userId: p.userId, roomId: next.id, link: room,
        title: '정산 완료! 🎉',
        body: `${next.title} · 모두 입금했어요. 7일 뒤 사라져요`,
      })
    }
  }

  return out
}

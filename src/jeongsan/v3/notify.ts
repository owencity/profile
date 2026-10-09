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

  // ── 링크로 새 사람이 참여함: 총무에게 (REQUIREMENTS §10 "참여자가 응답을 남김") ──
  for (const p of next.participants) {
    if (prev.participants.some((x) => x.id === p.id)) continue
    const answered = next.responses.some((r) => r.participantId === p.id)
    out.push({
      userId: host.userId, roomId: next.id, link: room,
      title: `${p.displayName}님이 ${answered ? '참여하고 응답했어요' : '참여했어요'}`,
      body: next.title,
    })
  }

  // ── 총무가 내보냄: 빠진 사람에게 (술자리에 더는 못 들어가니 내 술자리로) ──
  for (const p of prev.participants) {
    if (next.participants.some((x) => x.id === p.id)) continue
    out.push({ userId: p.userId, roomId: next.id, link: '/jungsan', title: `${next.title}에서 빠졌어요`, body: `${host.displayName} 총무가 명단에서 뺐어요` })
  }

  // ── 총무가 면제함: 그 사람에게 ──
  for (const r of next.responses) {
    if (r.type !== 'EXEMPT' || r.source !== 'HOST') continue
    const before = prev.responses.find((x) => x.participantId === r.participantId && x.roundId === r.roundId)
    if (before?.type === 'EXEMPT') continue
    const p = next.participants.find((x) => x.id === r.participantId)
    if (!p || p.id === host.id) continue
    const label = next.rounds.find((x) => x.id === r.roundId)?.label ?? ''
    out.push({ userId: p.userId, roomId: next.id, link: room, title: `${host.displayName} 총무가 ${label}를 면제해줬어요 🎁`, body: next.title })
  }

  // ── 결제자가 계좌를 처음 등록함: 그 사람에게 보낼 돈이 있는 사람에게 (계좌가 없어 [보냈어요]가 꺼져 있었다) ──
  for (const p of next.participants) {
    const before = prev.participants.find((x) => x.id === p.id)
    if (!before || before.payout || !p.payout) continue
    const owe = next.transfers.filter((t) => t.toParticipantId === p.id && t.status !== 'CONFIRMED')
    for (const t of owe) {
      out.push({
        userId: userOf(next, t.fromParticipantId), roomId: next.id, link: `${room}/pay`,
        title: `${p.displayName}님이 계좌를 등록했어요. 이제 보낼 수 있어요`,
        body: `${next.title} · ${won(t.amount)}`,
      })
    }
  }

  // ── 정산됨: 참여자 모두에게 "입금액을 확인해주세요" ──
  if (prev.status === 'OPEN' && next.status !== 'OPEN') {
    // 총무에게(FC-020 SETTLED_HOST) — 자동 정산이면 총무는 누가 마지막 응답을 넣었는지 모른다. 직접 정산했으면 본인이라 빠진다
    out.push({ userId: host.userId, roomId: next.id, link: room, title: '계산이 끝났어요. 단톡방에 입금 요청을 보내주세요', body: next.title })
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

/**
 * v3 목데이터 저장소. 목업이라도 **누른 게 남아야** 흐름을 끝까지 걸어볼 수 있다.
 * 백엔드 v3 API가 붙으면 각 동작이 API 호출로 바뀌고, 상태 전이는 서버가 결정한다
 * (여기 전이 규칙은 `DOMAIN_DB_DESIGN_V2.md` §3을 흉내 낸 것이다).
 */
import { create } from 'zustand'
import type { Gathering, Id, TimelineEntry, User } from './model'
import { hostOf, nameOf, participantOfUser } from './model'
import { ME, MOCK_ROOMS } from './mock'

type State = {
  me: User
  rooms: Record<Id, Gathering>
  sendMessage: (roomId: Id, text: string) => void
  giveSpoon: (roomId: Id) => void
  markSent: (roomId: Id, transferId: Id) => void
  confirmIncoming: (roomId: Id, transferId: Id) => void
  notReceived: (roomId: Id, transferId: Id) => void
}

const now = () => new Date().toISOString()

function push(g: Gathering, entry: Omit<TimelineEntry, 'id' | 'createdAt'>): Gathering {
  const id = Math.max(0, ...g.timeline.map((t) => t.id)) + 1
  return { ...g, timeline: [...g.timeline, { ...entry, id, createdAt: now() }] }
}

/** 모든 송금이 확인되면 완료. 참여자 2명 이상이면 총무 기본 스푼 1 — §5.3 */
function completeIfDone(g: Gathering): Gathering {
  if (g.status !== 'SETTLING' || !g.transfers.every((t) => t.status === 'CONFIRMED')) return g
  const host = hostOf(g)
  const bonus = g.participants.length >= 2 ? 1 : 0
  const done: Gathering = {
    ...g,
    status: 'COMPLETED',
    completedAt: now(),
    participants: g.participants.map((p) => (p.id === host.id ? { ...p, spoonCount: p.spoonCount + bonus } : p)),
  }
  return push(done, { type: 'SYSTEM', body: '모두 입금 완료! 🎉' })
}

export const useV3 = create<State>((set) => {
  const update = (roomId: Id, fn: (g: Gathering, meId: Id) => Gathering) =>
    set((s) => {
      const g = s.rooms[roomId]
      const me = g && participantOfUser(g, s.me.id)
      if (!g || !me) return s
      return { rooms: { ...s.rooms, [roomId]: fn(g, me.id) } }
    })

  return {
    me: ME,
    rooms: Object.fromEntries(MOCK_ROOMS.map((g) => [g.id, g])),

    sendMessage: (roomId, text) =>
      update(roomId, (g, meId) => push(g, { type: 'MESSAGE', authorParticipantId: meId, body: text })),

    giveSpoon: (roomId) =>
      update(roomId, (g, meId) => {
        const host = hostOf(g)
        if (g.spoonGivers.includes(meId) || host.id === meId || g.status === 'OPEN') return g
        const next: Gathering = {
          ...g,
          spoonGivers: [...g.spoonGivers, meId],
          participants: g.participants.map((p) => (p.id === host.id ? { ...p, spoonCount: p.spoonCount + 1 } : p)),
        }
        return push(next, { type: 'SPOON', authorParticipantId: meId, body: `${nameOf(g, meId)}님이 총무에게 한 스푼 줬어요` })
      }),

    markSent: (roomId, transferId) =>
      update(roomId, (g, meId) => {
        const t = g.transfers.find((x) => x.id === transferId)
        if (!t || t.fromParticipantId !== meId || t.status !== 'WAITING') return g
        const next = { ...g, transfers: g.transfers.map((x) => (x.id === transferId ? { ...x, status: 'SENT' as const, sentAt: now() } : x)) }
        return push(next, { type: 'SYSTEM', body: `${nameOf(g, meId)}님이 보냈어요` })
      }),

    confirmIncoming: (roomId, transferId) =>
      update(roomId, (g, meId) => {
        const t = g.transfers.find((x) => x.id === transferId)
        if (!t || t.toParticipantId !== meId || t.status === 'CONFIRMED') return g
        const next = {
          ...g,
          transfers: g.transfers.map((x) => (x.id === transferId ? { ...x, status: 'CONFIRMED' as const, confirmedAt: now() } : x)),
        }
        return completeIfDone(push(next, { type: 'SYSTEM', body: `${nameOf(g, meId)}님이 ${nameOf(g, t.fromParticipantId)}님 입금을 확인했어요` }))
      }),

    notReceived: (roomId, transferId) =>
      update(roomId, (g, meId) => {
        const t = g.transfers.find((x) => x.id === transferId)
        if (!t || t.toParticipantId !== meId || t.status !== 'SENT') return g
        const next = {
          ...g,
          transfers: g.transfers.map((x) => (x.id === transferId ? { ...x, status: 'WAITING' as const, notReceivedAt: now() } : x)),
        }
        return push(next, { type: 'SYSTEM', body: `${nameOf(g, meId)}님이 아직 ${nameOf(g, t.fromParticipantId)}님 입금을 확인 못 했어요` })
      }),
  }
})

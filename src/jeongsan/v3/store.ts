/**
 * v3 목데이터 저장소. 목업이라도 **누른 게 남아야** 흐름을 끝까지 걸어볼 수 있다.
 * 백엔드 v3 API가 붙으면 각 동작이 API 호출로 바뀌고, 상태 전이는 서버가 결정한다
 * (여기 전이 규칙은 `DOMAIN_DB_DESIGN_V2.md` §3을 흉내 낸 것이다).
 */
import { create } from 'zustand'
import type { AppNotification, Gathering, Id, Payout, ResponseType, RoundResponse, TimelineEntry, User } from './model'
import { hasResponded, hostOf, isLockedByHost, nameOf, participantOfUser, responseOf } from './model'
import { ME, MOCK_NOTIFICATIONS, MOCK_ROOMS, MOCK_USERS } from './mock'
import { mockPreview, withAutoResponses } from './mockServer'
import { notificationsFor } from './notify'
import type { RoundDraft } from './round'
import { relabel } from './round'
import { autoTitle } from './home'

type State = {
  me: User
  rooms: Record<Id, Gathering>
  sendMessage: (roomId: Id, text: string) => void
  giveSpoon: (roomId: Id) => void
  markSent: (roomId: Id, transferId: Id) => void
  confirmIncoming: (roomId: Id, transferId: Id) => void
  notReceived: (roomId: Id, transferId: Id) => void
  /** 새 차수면 만든 차수의 id, 거부되면 null */
  saveRound: (roomId: Id, draft: RoundDraft) => Id | null
  deleteRound: (roomId: Id, roundId: Id) => void
  /** 입력 없이 새 술자리를 만들고 id를 돌려준다. 만든 사람이 총무이자 첫 참여자다 */
  createGathering: () => Id
  /** 개발용 — 다른 사람 시점으로 보기 */
  actAs: (userId: Id) => void
  /** 내 응답 저장(P2). 총무가 면제로 지정한 칸은 건너뛴다 */
  respond: (roomId: Id, answers: { roundId: Id; type: ResponseType }[]) => void
  /** 총무가 R3에서 미응답자 응답을 대신 넣는다 */
  respondAsHost: (roomId: Id, participantId: Id, roundId: Id, type: ResponseType) => void
  /**
   * 정산하기(R3). 미리보기 때의 `inputRevision`을 같이 보낸다 — 그 사이 입력이 바뀌었으면
   * 서버가 409로 거절하는 것을 흉내 내 'STALE'을 돌려준다.
   */
  settle: (roomId: Id, inputRevision: number) => 'OK' | 'STALE' | 'DENIED'

  /** 모든 사람의 알림 — 화면은 지금 보는 사람 것만 거른다 */
  notifications: AppNotification[]
  markRead: (notificationId: Id) => void
  markAllRead: () => void
  /** 정산금액(P3)을 열어본 `방:사람` — [정산금액 확인] 뱃지를 떼는 기준 */
  paySeen: string[]
  markPaySeen: (roomId: Id) => void
  /**
   * 링크로 들어와 참여하고 응답까지 한 번에(P1). 링크를 연 것만으로는 참여되지 않는다 — 이 동작을
   * 해야 명단에 들어간다. 참여된 술자리 id, 참여할 수 없으면(없는 링크·정산 뒤) null.
   * 이미 참여 중이면 아무것도 바꾸지 않고 id만 돌려준다.
   */
  joinGathering: (shareToken: string, answers: { roundId: Id; type: ResponseType }[]) => Id | null
  /**
   * 총무가 한 사람의 한 차수를 면제하거나 해제한다(R4). 면제는 `EXEMPT`·`HOST`로 잠기고, 해제하면 그 칸은
   * **빈칸(응답 전)**으로 돌아간다 — 참여자가 다시 고르고, 안 고르면 정산 때 자동응답(flow-changes FC-010).
   */
  setExempt: (roomId: Id, participantId: Id, roundId: Id, exempt: boolean) => void
  /**
   * 총무가 정산 전 한 사람을 내보낸다(R4). 결제자는 내보낼 수 없다 — 그 차수의 돈을 받을 사람이
   * 사라지기 때문이다. 거부되면 이유 문구, 성공하면 null.
   */
  removeParticipant: (roomId: Id, participantId: Id) => string | null
  /** 목데이터의 사람들 — 보는 사람 전환 때 여기서 꺼낸다(등록한 계좌가 전환 뒤에도 남게) */
  users: User[]
  /**
   * 내 받을 계좌 등록·변경(A1). 사람 단위라 내가 들어간 **진행 중인** 술자리 모두에 반영한다
   * (완료된 술자리는 바꾸지 않는다 — 이미 끝난 송금의 기록이다).
   */
  registerPayout: (payout: Payout) => void
}

/** R4 내보내기를 막는 이유. 없으면 null — 화면이 버튼을 끄고 이유를 보여주는 데도 쓴다 */
export function removeBlockedReason(g: Gathering, participantId: Id): string | null {
  if (g.status !== 'OPEN') return '정산한 뒤에는 내보낼 수 없어요'
  const p = g.participants.find((x) => x.id === participantId)
  if (!p) return '이미 없는 사람이에요'
  if (p.userId === g.hostUserId) return '총무는 내보낼 수 없어요'
  if (g.rounds.some((r) => r.payerParticipantId === participantId)) return '결제자는 내보낼 수 없어요. 차수의 낸 사람을 먼저 바꿔주세요'
  return null
}

export const seenKey = (roomId: Id, userId: Id) => `${roomId}:${userId}`

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

export const useV3 = create<State>((set, get) => {
  /** 술자리를 바꾸고, 바뀐 만큼 알림을 쌓는다(행동한 본인은 빼고) — 서버의 이벤트 → 알림 흉내 */
  const commit = (s: State, prev: Gathering, next: Gathering): Partial<State> => {
    if (next === prev) return {}
    const startId = Math.max(0, ...s.notifications.map((n) => n.id)) + 1
    const fresh = notificationsFor(prev, next)
      .filter((n) => n.userId !== s.me.id)
      .map((n, i) => ({ ...n, id: startId + i, createdAt: now(), read: false }))
    return { rooms: { ...s.rooms, [next.id]: next }, notifications: [...fresh, ...s.notifications] }
  }

  const update = (roomId: Id, fn: (g: Gathering, meId: Id) => Gathering) =>
    set((s) => {
      const g = s.rooms[roomId]
      const me = g && participantOfUser(g, s.me.id)
      if (!g || !me) return s
      return commit(s, g, fn(g, me.id))
    })

  return {
    me: ME,
    rooms: Object.fromEntries(MOCK_ROOMS.map((g) => [g.id, g])),
    notifications: MOCK_NOTIFICATIONS,
    paySeen: [],
    users: MOCK_USERS,

    registerPayout: (payout) =>
      set((s) => {
        const p = { bank: payout.bank, accountNo: payout.accountNo.trim(), holder: payout.holder.trim() }
        const me = { ...s.me, payout: p }
        let acc: State = { ...s, me, users: s.users.map((u) => (u.id === me.id ? me : u)) }
        for (const g of Object.values(s.rooms)) {
          const mine = participantOfUser(g, me.id)
          if (!mine || g.status === 'COMPLETED') continue
          const first = !mine.payout
          let next: Gathering = { ...g, participants: g.participants.map((x) => (x.id === mine.id ? { ...x, payout: p } : x)) }
          next = push(next, { type: 'SYSTEM', body: `${me.displayName}님이 받을 계좌를 ${first ? '등록했어요' : '바꿨어요'}` })
          acc = { ...acc, ...commit(acc, g, next) }
        }
        return acc
      }),

    markRead: (id) =>
      set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllRead: () =>
      set((s) => ({ notifications: s.notifications.map((n) => (n.userId === s.me.id ? { ...n, read: true } : n)) })),
    markPaySeen: (roomId) =>
      set((s) => {
        const key = seenKey(roomId, s.me.id)
        return s.paySeen.includes(key) ? s : { paySeen: [...s.paySeen, key] }
      }),

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

    // 차수 입력은 총무만, 정산 전에만 — 정산하기 이후 계산 입력은 고정이다(REQUIREMENTS 불변식 5)
    saveRound: (roomId, draft) => {
      let created: Id | null = null
      update(roomId, (g) => {
        if (g.hostUserId !== get().me.id || g.status !== 'OPEN') return g
        const exists = draft.id !== undefined && g.rounds.some((r) => r.id === draft.id)
        const fields = { total: draft.total, drinks: draft.drinks, payerParticipantId: draft.payerParticipantId }
        let rounds
        if (exists) {
          rounds = g.rounds.map((r) => (r.id === draft.id ? { ...r, ...fields } : r))
        } else {
          created = Math.max(0, ...g.rounds.map((r) => r.id)) + 1
          rounds = relabel([...g.rounds, { id: created, seq: g.rounds.length + 1, label: '', ...fields }])
        }
        const label = rounds.find((r) => r.id === (exists ? draft.id : created))!.label
        const next = { ...g, rounds, inputRevision: g.inputRevision + 1 }
        return push(next, { type: 'SYSTEM', body: `${label} ${draft.total.toLocaleString('ko-KR')}원을 ${exists ? '고쳤어요' : '넣었어요'}` })
      })
      return created
    },

    deleteRound: (roomId, roundId) =>
      update(roomId, (g) => {
        const target = g.rounds.find((r) => r.id === roundId)
        if (!target || g.hostUserId !== get().me.id || g.status !== 'OPEN') return g
        const next = {
          ...g,
          rounds: relabel(g.rounds.filter((r) => r.id !== roundId)),
          responses: g.responses.filter((r) => r.roundId !== roundId),
          inputRevision: g.inputRevision + 1,
        }
        return push(next, { type: 'SYSTEM', body: `${target.label}를 지웠어요` })
      }),

    createGathering: () => {
      const { me, rooms } = get()
      const all = Object.values(rooms)
      const id = Math.max(0, ...all.map((g) => g.id)) + 1
      const pid = Math.max(0, ...all.flatMap((g) => g.participants.map((p) => p.id))) + 1
      const today = new Date()
      const g: Gathering = {
        id,
        title: autoTitle(today),
        date: today.toISOString(),
        hostUserId: me.id,
        status: 'OPEN',
        // 목데이터용 링크 토큰. 실제로는 서버가 발급한다
        shareToken: Math.random().toString(36).slice(2, 7),
        inputRevision: 0,
        participants: [{ id: pid, userId: me.id, displayName: me.displayName, spoonCount: me.spoonCount, payout: me.payout }],
        rounds: [],
        responses: [],
        transfers: [],
        timeline: [{ id: 1, type: 'SYSTEM', body: `${me.displayName}님이 술자리를 만들었어요`, createdAt: today.toISOString() }],
        spoonGivers: [],
      }
      set((s) => ({ rooms: { ...s.rooms, [id]: g } }))
      return id
    },

    actAs: (userId) => {
      const user = get().users.find((u) => u.id === userId)
      if (user) set({ me: user })
    },

    respond: (roomId, answers) =>
      update(roomId, (g, meId) => {
        if (g.status !== 'OPEN') return g
        const first = !hasResponded(g, meId)
        let responses = g.responses
        for (const a of answers) {
          // 참여자는 면제를 고를 수 없고, 총무가 면제로 정한 칸은 못 바꾼다
          if (a.type === 'EXEMPT' || isLockedByHost(responseOf(g, meId, a.roundId))) continue
          if (!g.rounds.some((r) => r.id === a.roundId)) continue
          responses = setResponse(responses, { participantId: meId, roundId: a.roundId, type: a.type, source: 'SELF' })
        }
        const next = { ...g, responses, inputRevision: g.inputRevision + 1 }
        return push(next, { type: 'SYSTEM', body: `${nameOf(g, meId)}님이 ${first ? '응답했어요' : '응답을 고쳤어요'}` })
      }),

    respondAsHost: (roomId, participantId, roundId, type) =>
      update(roomId, (g) => {
        if (g.hostUserId !== get().me.id || g.status !== 'OPEN') return g
        if (!g.participants.some((p) => p.id === participantId) || !g.rounds.some((r) => r.id === roundId)) return g
        const responses = setResponse(g.responses, { participantId, roundId, type, source: 'HOST' })
        return { ...g, responses, inputRevision: g.inputRevision + 1 }
      }),

    joinGathering: (shareToken, answers) => {
      const { me, rooms } = get()
      const g = Object.values(rooms).find((x) => x.shareToken === shareToken)
      if (!g) return null
      if (participantOfUser(g, me.id)) return g.id
      if (g.status !== 'OPEN') return null

      const pid = Math.max(0, ...Object.values(rooms).flatMap((x) => x.participants.map((p) => p.id))) + 1
      let next: Gathering = {
        ...g,
        participants: [...g.participants, { id: pid, userId: me.id, displayName: me.displayName, spoonCount: me.spoonCount, payout: me.payout }],
      }
      next = push(next, { type: 'SYSTEM', body: `${me.displayName}님이 들어왔어요` })
      let responses = next.responses
      for (const a of answers) {
        // 새로 온 사람은 면제를 고를 수 없다 — 면제는 총무만 정한다
        if (a.type === 'EXEMPT' || !g.rounds.some((r) => r.id === a.roundId)) continue
        responses = setResponse(responses, { participantId: pid, roundId: a.roundId, type: a.type, source: 'SELF' })
      }
      if (responses !== next.responses) {
        next = push({ ...next, responses }, { type: 'SYSTEM', body: `${me.displayName}님이 응답했어요` })
      }
      // 명단이 바뀌면 미리보기 결과도 바뀐다 — 총무가 보던 미리보기로는 정산할 수 없게
      next = { ...next, inputRevision: next.inputRevision + 1 }
      set((s) => commit(s, g, next))
      return g.id
    },

    setExempt: (roomId, participantId, roundId, exempt) =>
      update(roomId, (g) => {
        if (g.hostUserId !== get().me.id || g.status !== 'OPEN') return g
        const round = g.rounds.find((r) => r.id === roundId)
        if (!round || !g.participants.some((p) => p.id === participantId)) return g
        const cur = responseOf(g, participantId, roundId)
        if (exempt === (cur?.type === 'EXEMPT')) return g
        const responses = exempt
          ? setResponse(g.responses, { participantId, roundId, type: 'EXEMPT', source: 'HOST' })
          : g.responses.filter((r) => !(r.participantId === participantId && r.roundId === roundId))
        const next = { ...g, responses, inputRevision: g.inputRevision + 1 }
        const who = nameOf(g, participantId)
        return push(next, { type: 'SYSTEM', body: exempt ? `${who}님 ${round.label}를 면제했어요 🎁` : `${who}님 ${round.label} 면제를 풀었어요` })
      }),

    removeParticipant: (roomId, participantId) => {
      const g = get().rooms[roomId]
      if (!g || g.hostUserId !== get().me.id) return '총무만 내보낼 수 있어요'
      const blocked = removeBlockedReason(g, participantId)
      if (blocked) return blocked
      const next: Gathering = {
        ...g,
        participants: g.participants.filter((p) => p.id !== participantId),
        responses: g.responses.filter((r) => r.participantId !== participantId),
        inputRevision: g.inputRevision + 1,
      }
      set((s) => commit(s, g, push(next, { type: 'SYSTEM', body: `${nameOf(g, participantId)}님이 빠졌어요` })))
      return null
    },

    settle: (roomId, inputRevision) => {
      const g = get().rooms[roomId]
      if (!g || g.hostUserId !== get().me.id || g.status !== 'OPEN' || g.rounds.length === 0 || g.participants.length < 2) {
        return 'DENIED'
      }
      if (g.inputRevision !== inputRevision) return 'STALE'

      const preview = mockPreview(g)
      const autoNames = preview.lines.filter((l) => l.auto).map((l) => nameOf(g, l.participantId))
      const settled: Gathering = {
        ...g,
        status: 'SETTLING',
        responses: withAutoResponses(g),
        transfers: preview.transfers.map((t, i) => ({ id: i + 1, status: 'WAITING' as const, ...t })),
      }
      const hostName = hostOf(g).displayName
      const body = autoNames.length > 0
        ? `${hostName}님이 정산했어요 · ${autoNames.join('·')}님은 응답이 없어 전 차수 참석·알코올로 계산됐어요`
        : `${hostName}님이 정산했어요`
      // 보낼 돈이 하나도 없으면(총무 혼자 다 냈고 나머지가 모두 면제 등) 바로 완료
      const next = completeIfDone(push(settled, { type: 'SYSTEM', body }))
      set((s) => commit(s, g, next))
      return 'OK'
    },
  }
})

/** 한 칸(참여자 × 차수)의 응답을 바꾸거나 새로 넣는다 */
function setResponse(list: RoundResponse[], r: RoundResponse): RoundResponse[] {
  const rest = list.filter((x) => !(x.participantId === r.participantId && x.roundId === r.roundId))
  return [...rest, r]
}

/**
 * v3 목데이터 저장소. 목업이라도 **누른 게 남아야** 흐름을 끝까지 걸어볼 수 있다.
 * 백엔드 v3 API가 붙으면 각 동작이 API 호출로 바뀌고, 상태 전이는 서버가 결정한다
 * (여기 전이 규칙은 `DOMAIN_DB_DESIGN_V2.md` §3을 흉내 낸 것이다).
 */
import { create } from 'zustand'
import type { AppNotification, Gathering, Id, Payout, ResponseType, RoundResponse, TimelineEntry, User } from './model'
import { hasResponded, hostOf, isLockedByHost, nameOf, participantOfUser, responseOf, allIn, HEADCOUNT_MIN, HEADCOUNT_MAX } from './model'
import { ME, MOCK_NOTIFICATIONS, MOCK_ROOMS, MOCK_USERS } from './mock'
import { isApiMode } from './api'
import { mockPreview, withAutoResponses } from './mockServer'
import { notificationsFor } from './notify'
import type { RoundDraft } from './round'
import { relabel } from './round'
import { autoTitle } from './home'
import { validateName } from './name'

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
  /**
   * 새 술자리를 만들고 id를 돌려준다. 만든 사람이 총무이자 첫 참여자다. 제목이 없으면 `M/d 술자리`.
   * 다음 차를 다른 사람이 계산했을 때도 이걸 쓴다 — 그 사람이 총무인 **완전히 별개의** 술자리다(사람도 새로 들어온다)
   */
  createGathering: (title?: string) => Id
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
  /** 인원(총무 포함, FC-020) — 총무·정산 전. 2~50으로 맞춘다. 이 인원이 모두 응답하면 자동 정산 */
  setHeadcount: (roomId: Id, headcount: number) => void

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
  /**
   * 실명 등록(L2, 목데이터 모드). 사람 단위라 내가 들어간 모든 술자리의 내 이름도 같이 바꾼다
   * (서버는 users.display_name을 조인한다 — FC-013). 확인하면 `needsName`이 풀린다.
   */
  confirmName: (name: string) => void
  /** 서버가 준 내 정보로 바꾼다(API 모드, `gateway.ts`) */
  setMe: (me: User) => void
  /**
   * 서버 술자리 하나의 정산방들로 바꾼다(API 모드). 그 술자리의 옛 정산방은 지운다 — 단위가 늘거나 내가 빠졌을 수 있다.
   * viewed: 내가 정산금액을 열어본 정산방 id(D5)
   */
  replaceGathering: (gatheringId: Id, rooms: Gathering[], viewed: Id[]) => void
  /** 내 술자리 전체를 바꾼다(API 모드, H1 새로고침) */
  replaceAllRooms: (rooms: Gathering[], viewed: Id[]) => void
  setNotifications: (list: AppNotification[]) => void
  /**
   * 다음 차를 내가 계산 — 같은 술자리 안에 내가 총무인 정산방(정산 단위)을 만든다(FC-015, CTO 2026-10-06).
   * 링크·사람 신원은 같은 술자리 것을 쓰고, 계산 대상은 고른 사람만. 목데이터 모드용 — API 모드는 gateway 가 서버를 부른다
   */
  createUnit: (roomId: Id, participantIds: Id[]) => Id | null
}

/** API 모드에서 로그인 확인 전의 나 — 화면은 로그인 화면이라 그려지지 않는다 */
const NOBODY: User = { id: 0, displayName: '', spoonCount: 0, needsName: false }

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
  const commit = (s: State, prev: Gathering, after: Gathering): Partial<State> => {
    if (after === prev) return {}
    // 자동 정산(FC-020) — 어떤 동작이든(응답·참여·대리 응답·인원 변경·차수 삭제) "모두 모였다"로 바뀐 순간 정산한다.
    // 알림 규칙처럼 전·후만 보고 정해서, 경로마다 정산 코드를 흩뿌리지 않는다. 서버는 같은 판정을 트랜잭션 안에서 한다
    const next = !allIn(prev) && allIn(after) ? settleNow(after, true) : after
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

  // API 모드는 목데이터 없이 빈 상태로 시작한다 — 실제 사용자에게 가짜 술자리가 보이면 안 된다
  const apiMode = isApiMode()
  return {
    me: apiMode ? NOBODY : ME,
    rooms: apiMode ? {} : Object.fromEntries(MOCK_ROOMS.map((g) => [g.id, g])),
    notifications: apiMode ? [] : MOCK_NOTIFICATIONS,
    paySeen: [],
    users: apiMode ? [] : MOCK_USERS,

    setMe: (me) =>
      set((s) => ({ me, users: s.users.some((u) => u.id === me.id) ? s.users.map((u) => (u.id === me.id ? me : u)) : [...s.users, me] })),

    replaceGathering: (gatheringId, rooms, viewed) =>
      set((s) => {
        const kept = Object.values(s.rooms).filter((g) => (g.gatheringId ?? g.id) !== gatheringId)
        const ids = new Set(rooms.map((g) => g.id))
        const paySeen = [...s.paySeen.filter((k) => !ids.has(Number(k.split(':')[0]))), ...viewed.map((id) => seenKey(id, s.me.id))]
        return { rooms: Object.fromEntries([...kept, ...rooms].map((g) => [g.id, g])), paySeen }
      }),

    replaceAllRooms: (rooms, viewed) =>
      set((s) => ({ rooms: Object.fromEntries(rooms.map((g) => [g.id, g])), paySeen: viewed.map((id) => seenKey(id, s.me.id)) })),

    setNotifications: (notifications) => set({ notifications }),

    createUnit: (roomId, participantIds) => {
      const { me, rooms } = get()
      const src = rooms[roomId]
      const mine = src && participantOfUser(src, me.id)
      if (!src || !mine) return null
      const all = Object.values(rooms)
      const id = Math.max(0, ...all.map((g) => g.id)) + 1
      const gatheringId = src.gatheringId ?? src.id
      // 차수 번호는 술자리 전체에서 이어진다 — B의 첫 차수는 3차(SETTLEMENT_UNITS §1.1-5)
      const siblings = all.filter((g) => (g.gatheringId ?? g.id) === gatheringId)
      const lastSeq = Math.max(0, ...siblings.flatMap((g) => g.rounds.map((r) => r.seq)))
      const picked = new Set([...participantIds, mine.id])
      const now = new Date().toISOString()
      const g: Gathering = {
        ...src,
        id,
        gatheringId,
        title: src.title,
        hostUserId: me.id,
        status: 'OPEN',
        inputRevision: 0,
        completedAt: undefined,
        participants: src.participants.filter((p) => picked.has(p.id)),
        rounds: [],
        responses: [],
        transfers: [],
        timeline: [...src.timeline, { id: Math.max(0, ...src.timeline.map((t) => t.id)) + 1, type: 'SYSTEM', body: `${me.displayName}님이 추가 차수의 총무가 되었어요`, createdAt: now }],
        spoonGivers: [],
        firstSeq: lastSeq + 1,
        // 다음 차 인원의 시작값은 고른 사람 + 나(FC-020) — R2에서 바꿀 수 있다
        headcount: Math.max(HEADCOUNT_MIN, picked.size),
      }
      set((s) => ({ rooms: { ...s.rooms, [id]: g, [src.id]: src.gatheringId ? src : { ...src, gatheringId } } }))
      return id
    },

    confirmName: (name) =>
      set((s) => {
        const displayName = name.trim()
        if (validateName(displayName).length > 0) return s
        const me: User = { ...s.me, displayName, needsName: false }
        // 서버는 참여자 이름을 따로 저장하지 않고 users.display_name을 읽는다 — 완료된 방까지 모두 바뀐다
        const rooms = Object.fromEntries(
          Object.values(s.rooms).map((g) => [
            g.id,
            { ...g, participants: g.participants.map((p) => (p.userId === me.id ? { ...p, displayName } : p)) },
          ]),
        )
        return { me, users: s.users.map((u) => (u.id === me.id ? me : u)), rooms }
      }),

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
          rounds = relabel([...g.rounds, { id: created, seq: Number.MAX_SAFE_INTEGER, label: '', ...fields }], g.firstSeq)
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
          rounds: relabel(g.rounds.filter((r) => r.id !== roundId), g.firstSeq),
          responses: g.responses.filter((r) => r.roundId !== roundId),
          inputRevision: g.inputRevision + 1,
        }
        return push(next, { type: 'SYSTEM', body: `${target.label}를 지웠어요` })
      }),

    createGathering: (title) => {
      const { me, rooms } = get()
      const all = Object.values(rooms)
      const id = Math.max(0, ...all.map((g) => g.id)) + 1
      const pid = Math.max(0, ...all.flatMap((g) => g.participants.map((p) => p.id))) + 1
      const today = new Date()
      const g: Gathering = {
        id,
        title: title?.trim() || autoTitle(today),
        date: today.toISOString(),
        hostUserId: me.id,
        status: 'OPEN',
        // 목데이터용 링크 토큰. 실제로는 서버가 발급한다
        shareToken: Math.random().toString(36).slice(2, 7),
        inputRevision: 0,
        participants: [{ id: pid, userId: me.id, displayName: me.displayName, nickname: me.nickname, spoonCount: me.spoonCount, payout: me.payout }],
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
        participants: [...g.participants, { id: pid, userId: me.id, displayName: me.displayName, nickname: me.nickname, spoonCount: me.spoonCount, payout: me.payout }],
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
      set((s) => commit(s, g, settleNow(g, false)))
      return 'OK'
    },

    setHeadcount: (roomId, headcount) =>
      update(roomId, (g) => {
        if (g.hostUserId !== get().me.id || g.status !== 'OPEN') return g
        const n = Math.min(HEADCOUNT_MAX, Math.max(HEADCOUNT_MIN, Math.round(headcount)))
        return n === g.headcount ? g : { ...g, headcount: n }
      }),
  }
})

/**
 * 정산(서버 흉내) — 미리보기대로 송금을 만들고 금액을 고정한다. 수동([지금 계산하기])과 자동(FC-020)이 같이 쓴다.
 * 응답 없는 칸은 전 차수 참석·알코올(AUTO)로 채운다. 보낼 돈이 하나도 없으면 바로 완료
 */
function settleNow(g: Gathering, auto: boolean): Gathering {
  const preview = mockPreview(g)
  const autoNames = preview.lines.filter((l) => l.auto).map((l) => nameOf(g, l.participantId))
  const settled: Gathering = {
    ...g,
    status: 'SETTLING',
    responses: withAutoResponses(g),
    transfers: preview.transfers.map((t, i) => ({ id: i + 1, status: 'WAITING' as const, ...t })),
  }
  const who = auto ? '모두 응답해서 자동으로 계산했어요' : `${hostOf(g).displayName}님이 정산했어요`
  const body = autoNames.length > 0 ? `${who} · ${autoNames.join('·')}님은 응답이 없어 전 차수 참석·알코올로 계산됐어요` : who
  return completeIfDone(push(settled, { type: 'SYSTEM', body }))
}

/** 한 칸(참여자 × 차수)의 응답을 바꾸거나 새로 넣는다 */
function setResponse(list: RoundResponse[], r: RoundResponse): RoundResponse[] {
  const rest = list.filter((x) => !(x.participantId === r.participantId && x.roundId === r.roundId))
  return [...rest, r]
}

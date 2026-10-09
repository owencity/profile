/**
 * 화면이 부르는 동작의 입구 — 목데이터 모드면 스토어를 바로 바꾸고, API 모드면 서버를 부른 뒤 **서버 응답으로** 스토어를 채운다.
 * 화면 코드는 모드를 모른다. 서버 계약은 `jungsan_attack` `docs/SETTLEMENT_UNITS.md` §4(API v5).
 *
 * API 모드의 원칙: 바꾸는 요청을 보낸 뒤 그 술자리를 **다시 읽어** 스토어를 통째로 바꾼다(`refresh`). 서버가 상태 전이·
 * 알림·타임라인을 만들므로 프론트가 결과를 흉내 내지 않는다 — 한 번 더 읽는 비용으로 화면과 서버가 어긋날 일을 없앤다.
 *
 * 반환값 규칙: 성공이면 `null`(또는 결과 값), 실패면 **사용자에게 보여줄 문구**. 화면은 문구를 그대로 띄우기만 한다.
 */
import { ApiError, api, isApiMode, toUser } from './api'
import type { ServerNotification } from './api'
import type { AppNotification, Gathering, Id, Payout, ResponseType } from './model'
import type { SettlePreview } from './mockServer'
import { mockPreview } from './mockServer'
import { validateName } from './name'
import type { RoundDraft } from './round'
import type { ServerGathering, ServerJoinPreview } from './serverModel'
import { toPreview, toRooms } from './serverModel'
import { useV3 } from './store'

/** 서버 오류 코드 → 화면 문구. 없는 코드는 서버 message를 그대로 쓴다(API.md §1.2) */
const MESSAGES: Record<string, string> = {
  DISPLAY_NAME_ALREADY_SET: '이미 이름을 정했어요. 정한 이름은 바꿀 수 없어요',
  UNAUTHENTICATED: '로그인이 풀렸어요. 다시 로그인해주세요',
  TOKEN_EXPIRED: '로그인이 풀렸어요. 다시 로그인해주세요',
  SETTLEMENT_INPUT_CHANGED: '그 사이 응답이 바뀌었어요. 금액을 다시 확인해주세요',
  SETTLEMENT_UNIT_NOT_OPEN: '이미 정산한 차수예요',
  NOT_SETTLEMENT_UNIT_HOST: '이 차수의 총무만 할 수 있어요',
  NOT_SETTLEMENT_UNIT_MEMBER: '이 차수의 계산 대상이 아니에요',
  REMOVE_HOST: '총무는 뺄 수 없어요',
  REMOVE_PAYER: '결제자는 뺄 수 없어요. 차수의 낸 사람을 먼저 바꿔주세요',
  TRANSFER_ALREADY_SENT: '이미 보낸 사람이 있어서 되돌릴 수 없어요',
  NO_ROUNDS: '차수를 먼저 넣어주세요',
}

export const messageOf = (e: unknown): string =>
  e instanceof ApiError ? (MESSAGES[e.code] ?? e.message) : '잠시 뒤 다시 시도해주세요'

const s = () => useV3.getState()

/** 정산방 → 서버 경로에 쓰는 (술자리 id, 정산 단위 id) */
function ctx(roomId: Id): { gid: Id; uid: Id } {
  const g = s().rooms[roomId]
  return { gid: g?.gatheringId ?? roomId, uid: roomId }
}

/** 서버 술자리 하나를 스토어에 — 그 술자리의 정산방들을 통째로 바꾼다 */
function put(g: ServerGathering) {
  const rooms = toRooms(g)
  const viewed = g.settlementUnits.filter((u) => u.me.settlementViewed).map((u) => u.id)
  s().replaceGathering(g.id, rooms, viewed)
}

async function refresh(gid: Id) {
  put(await api.gathering(gid))
}

/** 바꾸는 요청 → 그 술자리 다시 읽기. 실패면 문구 */
async function mutate(gid: Id, call: () => Promise<unknown>): Promise<string | null> {
  try {
    await call()
    await refresh(gid)
    return null
  } catch (e) {
    return messageOf(e)
  }
}

/** 알림 종류 → 누르면 갈 곳(FC-005). 송금 관련은 보낼 돈(P3), 그 밖은 정산방 */
const PAY_TYPES = new Set(['SETTLED', 'NOT_RECEIVED', 'PAYOUT_REGISTERED'])
function toNotification(n: ServerNotification, meId: Id): AppNotification {
  const rooms = Object.values(s().rooms)
  const roomId = n.settlementUnitId ?? rooms.find((g) => (g.gatheringId ?? g.id) === n.gatheringId)?.id ?? 0
  return {
    id: n.id,
    userId: meId,
    roomId,
    title: n.body,
    body: '',
    link: PAY_TYPES.has(n.type) ? `/jungsan/r/${roomId}/pay` : `/jungsan/r/${roomId}`,
    createdAt: n.createdAt,
    read: n.readAt !== null,
  }
}

/** 정산 단위 생성의 멱등 키(SETTLEMENT_UNITS §4.2) */
const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`.replace(/\./g, ''))

export const gateway = {
  /**
   * 로그인 여부를 서버에 묻고 내 정보를 스토어에 넣는다. 로그인돼 있으면 true.
   * 목데이터 모드는 서버가 없으므로 false — 로그인 버튼이 상태만 켠다.
   */
  async loadMe(): Promise<boolean> {
    if (!isApiMode()) return false
    try {
      const m = await api.me()
      s().setMe(toUser(m, s().me))
      return true
    } catch {
      return false // 401 = 로그아웃 상태. 네트워크 오류도 로그인 화면으로 둔다
    }
  },

  /** L2·P1 실명 등록(FC-013). 앞단 검증은 서버와 같은 규칙(2~10자)이라 서버까지 가기 전에 막는다 */
  async confirmName(name: string): Promise<string | null> {
    const errors = validateName(name)
    if (errors.length > 0) return errors[0]
    if (!isApiMode()) {
      s().confirmName(name)
      return null
    }
    try {
      s().setMe(toUser(await api.putDisplayName(name.trim()), s().me))
      return null
    } catch (e) {
      return messageOf(e)
    }
  },

  /** 내 술자리 전부 + 알림(H1 들어올 때). 목데이터는 할 일 없음 */
  async loadMine(): Promise<string | null> {
    if (!isApiMode()) return null
    try {
      const [list, notes] = await Promise.all([api.myGatherings(), api.notifications()])
      s().replaceAllRooms(list.flatMap(toRooms), list.flatMap((g) => g.settlementUnits.filter((u) => u.me.settlementViewed).map((u) => u.id)))
      s().setNotifications(notes.map((n) => toNotification(n, s().me.id)))
      return null
    } catch (e) {
      return messageOf(e)
    }
  },

  /** 정산방 하나를 서버에서 다시 읽는다(정산방에 들어올 때·당겨서 새로고침) */
  async loadRoom(roomId: Id): Promise<string | null> {
    if (!isApiMode()) return null
    try {
      await refresh(ctx(roomId).gid)
      return null
    } catch (e) {
      return messageOf(e)
    }
  },

  /** 새 술자리(H1 [+ 새 술자리]). 만든 정산방 id 또는 문구 */
  async createGathering(): Promise<{ id: Id } | { error: string }> {
    if (!isApiMode()) return { id: s().createGathering() }
    try {
      const g = await api.createGathering()
      put(g)
      return { id: g.settlementUnits[0].id }
    } catch (e) {
      return { error: messageOf(e) }
    }
  },

  /** 다음 차는 내가 계산했어요 — 같은 술자리 안에 내가 총무인 정산 단위(FC-015). 계산 대상은 고른 사람 + 나 */
  async createUnit(roomId: Id, participantIds: Id[]): Promise<{ id: Id } | { error: string }> {
    if (!isApiMode()) {
      const id = s().createUnit(roomId, participantIds)
      return id === null ? { error: '이 술자리에 참여 중이 아니에요' } : { id }
    }
    const { gid } = ctx(roomId)
    const me = s().rooms[roomId]?.participants.find((p) => p.userId === s().me.id)
    try {
      const ids = [...new Set([...(me ? [me.id] : []), ...participantIds])]
      // 다음 차 인원의 시작값은 고른 사람 + 나(FC-020) — R2에서 바꿀 수 있다
      const u = await api.createUnit(gid, uuid(), ids, ids.length)
      await refresh(gid)
      return { id: u.id }
    } catch (e) {
      return { error: messageOf(e) }
    }
  },

  /**
   * 차수 저장(R2) + 총무 본인 응답(FC-019 A). 새 차수면 만든 차수 id.
   * 응답은 새 차수거나 값이 바뀌었을 때만 보낸다 — 같은 값을 또 보내면 타임라인에 "응답을 고쳤어요"가 쌓인다.
   * 서버 변경 없이 기존 `PUT U/responses/me`를 차수 저장 뒤에 한 번 더 부른다.
   */
  async saveRound(roomId: Id, draft: RoundDraft, mine?: ResponseType, headcount?: number): Promise<{ id: Id } | { error: string }> {
    const before = s().rooms[roomId]
    const meP = before?.participants.find((p) => p.userId === s().me.id)
    const prev = draft.id !== undefined && meP ? before?.responses.find((x) => x.participantId === meP.id && x.roundId === draft.id)?.type : undefined
    const answer = (id: Id) => (mine && mine !== prev ? [{ roundId: id, type: mine }] : [])
    // 인원(FC-020)은 바뀌었을 때만 — 응답을 넣은 뒤에 바꿔야 "모두 모였다" 판정이 새 응답까지 본다
    const headcountChanged = headcount !== undefined && headcount !== before?.headcount
    if (!isApiMode()) {
      const id = s().saveRound(roomId, draft) ?? draft.id ?? 0
      const a = answer(id)
      if (a.length > 0) s().respond(roomId, a)
      if (headcountChanged) s().setHeadcount(roomId, headcount)
      return { id }
    }
    const { gid, uid } = ctx(roomId)
    const body = { total: draft.total, payerParticipantId: draft.payerParticipantId, drinks: draft.drinks }
    try {
      const r = draft.id !== undefined ? await api.putRound(gid, uid, draft.id, body) : await api.addRound(gid, uid, body)
      const a = answer(r.id)
      // 차수는 들어갔는데 응답만 실패하면 정산 때 "응답 없음"으로 보이는 것뿐이라, 차수 저장을 실패로 돌리지 않는다
      if (a.length > 0) await api.respond(gid, uid, a).catch(() => {})
      // 인원은 서버가 아직 모르면(FC-020 배포 전) 실패해도 차수 저장은 성공으로 둔다
      if (headcountChanged) await api.putHeadcount(gid, uid, headcount).catch(() => {})
      await refresh(gid)
      return { id: r.id }
    } catch (e) {
      return { error: messageOf(e) }
    }
  },

  async deleteRound(roomId: Id, roundId: Id): Promise<string | null> {
    if (!isApiMode()) {
      s().deleteRound(roomId, roundId)
      return null
    }
    const { gid, uid } = ctx(roomId)
    return mutate(gid, () => api.deleteRound(gid, uid, roundId))
  },

  /** 내 응답(P2) */
  async respond(roomId: Id, answers: { roundId: Id; type: ResponseType }[]): Promise<string | null> {
    if (!isApiMode()) {
      s().respond(roomId, answers)
      return null
    }
    const { gid, uid } = ctx(roomId)
    return mutate(gid, () => api.respond(gid, uid, answers))
  },

  /** 총무 대리 응답(R3) */
  async respondAsHost(roomId: Id, participantId: Id, roundId: Id, type: ResponseType): Promise<string | null> {
    if (!isApiMode()) {
      s().respondAsHost(roomId, participantId, roundId, type)
      return null
    }
    const { gid, uid } = ctx(roomId)
    return mutate(gid, () => api.respondFor(gid, uid, participantId, [{ roundId, type }]))
  },

  /** 정산 미리보기(R3) — 금액은 서버 Core 가 계산한다. 목데이터는 고정값 흉내 */
  async preview(roomId: Id): Promise<SettlePreview | string> {
    if (!isApiMode()) return mockPreview(s().rooms[roomId])
    const { gid, uid } = ctx(roomId)
    try {
      return toPreview(await api.preview(gid, uid))
    } catch (e) {
      return messageOf(e)
    }
  },

  /** 정산하기 — 미리보기 때의 입력 버전·해시를 같이 보낸다. 그 사이 바뀌었으면 STALE */
  async settle(roomId: Id, preview: SettlePreview): Promise<'OK' | 'STALE' | 'DENIED' | { error: string }> {
    if (!isApiMode()) return s().settle(roomId, preview.inputRevision)
    const { gid, uid } = ctx(roomId)
    try {
      put(await api.settle(gid, uid, preview.inputRevision, preview.inputHash ?? ''))
      return 'OK'
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SETTLEMENT_INPUT_CHANGED') return 'STALE'
      if (e instanceof ApiError && e.status === 403) return 'DENIED'
      return { error: messageOf(e) }
    }
  },

  /** 정산금액(P3)을 열어봤다(D5) — 뱃지를 뗀다. 실패해도 화면은 막지 않는다 */
  async markPaySeen(roomId: Id): Promise<void> {
    s().markPaySeen(roomId)
    if (!isApiMode()) return
    const { gid, uid } = ctx(roomId)
    await api.markViewed(gid, uid).catch(() => {})
  },

  async markSent(roomId: Id, transferId: Id): Promise<string | null> {
    if (!isApiMode()) {
      s().markSent(roomId, transferId)
      return null
    }
    return mutate(ctx(roomId).gid, () => api.sent(transferId))
  },

  async confirmIncoming(roomId: Id, transferId: Id): Promise<string | null> {
    if (!isApiMode()) {
      s().confirmIncoming(roomId, transferId)
      return null
    }
    return mutate(ctx(roomId).gid, () => api.confirm(transferId))
  },

  async notReceived(roomId: Id, transferId: Id): Promise<string | null> {
    if (!isApiMode()) {
      s().notReceived(roomId, transferId)
      return null
    }
    return mutate(ctx(roomId).gid, () => api.notReceived(transferId))
  },

  /** 타임라인 메시지 — 술자리 하나에 하나라 어느 정산방에서 써도 같은 곳에 남는다 */
  async sendMessage(roomId: Id, text: string): Promise<string | null> {
    if (!isApiMode()) {
      s().sendMessage(roomId, text)
      return null
    }
    const { gid } = ctx(roomId)
    return mutate(gid, () => api.sendMessage(gid, text))
  },

  /** 받을 계좌(A1) — 사람 단위. 저장 뒤 내 정보와 내 술자리를 다시 읽는다(계좌 공개가 바뀐다) */
  async registerPayout(payout: Payout): Promise<string | null> {
    if (!isApiMode()) {
      s().registerPayout(payout)
      return null
    }
    try {
      await api.putPayout(payout)
      await gateway.loadMe()
      return await gateway.loadMine()
    } catch (e) {
      return messageOf(e)
    }
  },

  /** 계산 대상에서 빼기(R4) — 그 정산 단위에서만. 공유 참여자는 남는다 */
  async removeParticipant(roomId: Id, participantId: Id): Promise<string | null> {
    if (!isApiMode()) return s().removeParticipant(roomId, participantId)
    const { gid, uid } = ctx(roomId)
    return mutate(gid, () => api.removeMember(gid, uid, participantId))
  },

  /** 스푼(🥄) — 복수 총무 지급 규칙이 서버에서 미결(SETTLEMENT_UNITS §7)이라 API 모드에선 아직 열지 않는다 */
  async giveSpoon(roomId: Id): Promise<string | null> {
    if (!isApiMode()) {
      s().giveSpoon(roomId)
      return null
    }
    return '스푼은 곧 열려요'
  },

  async markRead(id: Id): Promise<void> {
    s().markRead(id)
    if (isApiMode()) await api.readNotification(id).catch(() => {})
  },

  async markAllRead(): Promise<void> {
    s().markAllRead()
    if (isApiMode()) await api.readAllNotifications().catch(() => {})
  },

  /** 링크 미리보기(P1, 로그인 없이) — API 모드만. 목데이터는 화면이 스토어에서 찾는다 */
  async joinPreview(token: string): Promise<ServerJoinPreview | string> {
    try {
      return await api.joinPreview(token)
    } catch (e) {
      return messageOf(e)
    }
  },

  /** 링크로 참여 + 응답(P1) — 고른 정산 단위에. 들어간 정산방 id */
  async join(token: string, unitId: Id | null, answers: { roundId: Id; type: ResponseType }[]): Promise<{ id: Id } | { error: string }> {
    if (!isApiMode()) {
      const id = s().joinGathering(token, answers)
      return id === null ? { error: '참여할 수 없는 링크예요' } : { id }
    }
    if (unitId === null) return { error: '참여할 차수를 골라주세요' }
    try {
      const r = await api.join(token, unitId, answers)
      await refresh(r.gatheringId)
      return { id: unitId }
    } catch (e) {
      return { error: messageOf(e) }
    }
  },
}

/** 목데이터 모드에서 미리보기 화면 등이 바로 쓰는 정산방 조회 */
export const roomOf = (roomId: Id): Gathering | undefined => s().rooms[roomId]

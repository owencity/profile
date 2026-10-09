/**
 * 서버(API v5, `jungsan_attack` `docs/SETTLEMENT_UNITS.md` §4) 응답 → 화면 모델.
 *
 * 서버의 술자리 하나에는 **총무별 정산 단위(SettlementUnit)** 가 여럿 있을 수 있다(FC-015, CTO 2026-10-06).
 * 정산 단위는 총무·상태·차수·명단·송금을 각자 가져서 지금 화면의 "정산방(Gathering)"과 모양이 같다.
 * 그래서 **정산 단위 하나 = 화면의 정산방 하나**로 바꿔 끼운다 — 세 플랫폼에서 검증된 화면·규칙(할 일 배너, 뱃지,
 * 정산, 송금)을 그대로 쓰기 위해서다. 정산방 id 는 정산 단위 id, 원래 술자리 id 는 `gatheringId`.
 */
import type { Gathering, Id, Participant, ResponseSource, ResponseType, TransferBasis, TransferStatus } from './model'

export type ServerParticipant = {
  id: number; userId: number; displayName: string; nickname: string | null; spoonCount: number
  hasPayout: boolean; payout: { bank: string; accountNo: string; holder: string } | null
}
export type ServerUnit = {
  id: number; hostParticipantId: number; status: Gathering['status']; inputRevision: number
  /** 총무가 넣은 인원(FC-020). 서버가 아직 안 주면 undefined */
  headcount?: number | null
  completedAt: string | null; participantIds: number[]
  me: { included: boolean; settlementViewed: boolean }
}
export type ServerGathering = {
  id: number; title: string; date: string; createdByUserId: number; shareToken: string
  status: Gathering['status']; completedAt: string | null; deleteScheduledAt: string | null
  participants: ServerParticipant[]
  settlementUnits: ServerUnit[]
  rounds: { id: number; settlementUnitId: number; seq: number; total: number; payerParticipantId: number; drinks: { name: string; unitPrice: number; quantity: number }[] }[]
  responses: { participantId: number; roundId: number; type: ResponseType; source: ResponseSource }[]
  transfers: {
    id: number; settlementUnitId: number; fromParticipantId: number; toParticipantId: number; amount: number
    status: TransferStatus; sentAt: string | null; confirmedAt: string | null; notReceivedAt: string | null; basis: TransferBasis[]
  }[]
  timeline: { id: number; settlementUnitId: number | null; type: 'MESSAGE' | 'SYSTEM' | 'SPOON'; authorParticipantId: number | null; body: string; createdAt: string }[]
  me: { participantId: number }
}

/** 공개 미리보기 `GET /join/{token}` — 이름·응답·계좌는 없다 */
export type ServerJoinPreview = {
  title: string; date: string; status: Gathering['status']; participantCount: number
  settlementUnits: { id: number; status: Gathering['status']; host: { displayName: string; spoonCount: number }; rounds: { id: number; seq: number; total: number }[] }[]
}

/** 미리보기 `GET …/settlement/preview` */
export type ServerPreview = {
  settlementUnitId: number; inputRevision: number; inputHash: string
  lines: { participantId: number; total: number; auto: boolean; rounds: TransferBasis[] }[]
  transfers: { from: number; to: number; amount: number; basis: TransferBasis[] }[]
}

const toParticipant = (p: ServerParticipant): Participant => ({
  id: p.id,
  userId: p.userId,
  displayName: p.displayName,
  nickname: p.nickname ?? undefined,
  spoonCount: p.spoonCount,
  payout: p.payout ?? undefined,
})

/**
 * 정산방 이름 — 한 술자리에 총무가 둘 이상이면 같은 이름이 두 줄 뜨므로 담당 차수를 붙인다("10/9 술자리 · 3차부터").
 * 총무가 하나면 원래 이름 그대로.
 */
function unitTitle(g: ServerGathering, unit: ServerUnit): string {
  if (g.settlementUnits.length < 2) return g.title
  const seqs = g.rounds.filter((r) => r.settlementUnitId === unit.id).map((r) => r.seq)
  if (seqs.length === 0) return `${g.title} · 다음 차`
  return `${g.title} · ${Math.min(...seqs)}차부터`
}

/** 서버 술자리 하나 → 내가 들어 있는 정산 단위마다 정산방 하나 */
export function toRooms(g: ServerGathering): Gathering[] {
  return g.settlementUnits
    .filter((u) => u.me.included || u.hostParticipantId === g.me.participantId)
    .map((u) => toRoom(g, u))
}

export function toRoom(g: ServerGathering, u: ServerUnit): Gathering {
  const members = new Set(u.participantIds)
  const host = g.participants.find((p) => p.id === u.hostParticipantId)
  const rounds = g.rounds.filter((r) => r.settlementUnitId === u.id).sort((a, b) => a.seq - b.seq)
  const roundIds = new Set(rounds.map((r) => r.id))
  return {
    id: u.id,
    gatheringId: g.id,
    title: unitTitle(g, u),
    // 서버는 날짜만 준다(LocalDate) — 화면은 ISO 로 다루므로 그날 정오로 둔다(시간대가 달라도 날짜가 밀리지 않게)
    date: `${g.date}T12:00:00`,
    hostUserId: host?.userId ?? -1,
    status: u.status,
    shareToken: g.shareToken,
    inputRevision: u.inputRevision,
    headcount: u.headcount ?? undefined,
    completedAt: u.completedAt ?? undefined,
    participants: g.participants.filter((p) => members.has(p.id)).map(toParticipant),
    // 차수 이름은 프론트가 붙인다(FC-014 D4). seq 는 술자리 전체 번호라 B의 첫 차수는 "3차"가 된다
    rounds: rounds.map((r) => ({ id: r.id, seq: r.seq, label: `${r.seq}차`, total: r.total, payerParticipantId: r.payerParticipantId, drinks: r.drinks })),
    responses: g.responses.filter((x) => roundIds.has(x.roundId) && members.has(x.participantId)),
    transfers: g.transfers
      .filter((t) => t.settlementUnitId === u.id)
      .map((t) => ({
        id: t.id, fromParticipantId: t.fromParticipantId, toParticipantId: t.toParticipantId, amount: t.amount, status: t.status,
        sentAt: t.sentAt ?? undefined, confirmedAt: t.confirmedAt ?? undefined, notReceivedAt: t.notReceivedAt ?? undefined, basis: t.basis,
      })),
    // 타임라인은 술자리 하나에 하나다 — 어느 정산방에서 보든 같은 대화가 보인다
    timeline: g.timeline.map((e) => ({ id: e.id, type: e.type, authorParticipantId: e.authorParticipantId ?? undefined, body: e.body, createdAt: e.createdAt })),
    // 서버가 다음 차수에 붙일 번호 — 술자리 전체에서 가장 큰 번호 다음(SETTLEMENT_UNITS §4.2 "전체 seq 채번")
    nextSeq: Math.max(0, ...g.rounds.map((r) => r.seq)) + 1,
    // 스푼 기록은 아직 서버 계약에 없다(SETTLEMENT_UNITS §7 미결)
    spoonGivers: [],
  }
}

/** 이 정산방에서 내가 정산금액을 열어봤나(D5, 단위별) */
export const settlementViewedOf = (g: ServerGathering, unitId: Id) =>
  g.settlementUnits.find((u) => u.id === unitId)?.me.settlementViewed ?? false

/** 서버 미리보기 → 화면 미리보기(R3). inputHash 는 정산하기 요청에 그대로 돌려보낸다 */
export const toPreview = (p: ServerPreview) => ({
  inputRevision: p.inputRevision,
  inputHash: p.inputHash,
  lines: p.lines.map((l) => ({ participantId: l.participantId, total: l.total, auto: l.auto, rounds: l.rounds })),
  transfers: p.transfers.map((t) => ({ fromParticipantId: t.from, toParticipantId: t.to, amount: t.amount, basis: t.basis })),
})

/**
 * 링크 미리보기(P1, 로그인 전) → 입구 화면이 그리는 정산방들. 아직 정산 전인 단위만 고를 수 있다.
 * 명단은 공개되지 않으므로(인원수만) 총무 한 사람만 넣는다 — 입구 화면은 총무·차수·금액만 쓴다.
 */
export function toEntryRooms(p: ServerJoinPreview, token: string): Gathering[] {
  return p.settlementUnits
    .filter((u) => u.status === 'OPEN')
    .map((u) => {
      const rounds = [...u.rounds].sort((a, b) => a.seq - b.seq)
      return {
        id: u.id,
        title: p.title,
        date: `${p.date}T12:00:00`,
        hostUserId: -1,
        status: u.status,
        shareToken: token,
        inputRevision: 0,
        participants: [{ id: -1, userId: -1, displayName: u.host.displayName, spoonCount: u.host.spoonCount }],
        rounds: rounds.map((r) => ({ id: r.id, seq: r.seq, label: `${r.seq}차`, total: r.total, payerParticipantId: -1, drinks: [] })),
        responses: [],
        transfers: [],
        timeline: [],
        spoonGivers: [],
      }
    })
}

/** 입구에서 고르는 단위 이름 — "김동규님 · 1·2차", 차수가 아직 없으면 "김동규님 · 금액 넣는 중" */
export const entryChoiceLabel = (g: Gathering) =>
  `${g.participants[0]?.displayName ?? '총무'}님 · ${g.rounds.length === 0 ? '금액 넣는 중' : g.rounds.map((r) => r.seq).join('·') + '차'}`

/**
 * 정산방 메시지 신고·차단(FC-024, App Store 1.2 사용자 생성 콘텐츠). 앱 `v3/Safety.kt`와 같은 규칙.
 *
 * 누구에게 어떤 메시지를 숨기나 — 서버도 같은 기준으로 타임라인을 걸러서 준다. 프론트는 신고·차단 직후
 * 다시 읽기 전에도 바로 사라지게 같은 판정을 한 번 더 한다.
 * - 내가 신고한 메시지 → 나에게서 숨김
 * - 서로 다른 2명이 신고한 메시지 → 모두에게서 숨김(CTO 결정 2026-10-20)
 * - 내가 차단한 사람이 쓴 메시지 → 모든 술자리에서 나에게서 숨김. 명단·금액·송금은 그대로(돈 계산을 깨지 않는다)
 * 시스템 소식(SYSTEM·SPOON)은 사람이 쓴 글이 아니라 숨기지 않고, 신고·차단 메뉴도 없다.
 */
import type { Gathering, Id, TimelineEntry } from './model'

export type ReportReason = 'ABUSE' | 'SEXUAL' | 'SPAM' | 'OTHER'

/** 신고 사유 — 화면에 이 순서로 */
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'ABUSE', label: '욕설·비방' },
  { value: 'SEXUAL', label: '음란·불쾌한 내용' },
  { value: 'SPAM', label: '스팸·광고' },
  { value: 'OTHER', label: '기타' },
]

/** 서로 다른 신고자가 이만큼 모이면 모두에게서 숨긴다 */
export const HIDE_FOR_ALL_REPORTS = 2

export type Report = { key: string; reporterUserId: Id }
export type Block = { blockerUserId: Id; blockedUserId: Id; displayName: string }
export type Moderation = { reports: Report[]; blocks: Block[] }

export const EMPTY_MODERATION: Moderation = { reports: [], blocks: [] }

/** 메시지의 전역 열쇠 — 한 술자리의 정산방들은 타임라인을 같이 쓴다 */
export const entryKey = (g: Gathering, entryId: Id) => `${g.gatheringId ?? g.id}:${entryId}`

const authorUserId = (g: Gathering, e: TimelineEntry) => g.participants.find((p) => p.id === e.authorParticipantId)?.userId

/** 이 사람이 이 메시지를 신고·차단할 수 있나 — 남이 쓴 메시지만 */
export const canModerate = (g: Gathering, e: TimelineEntry, viewerUserId: Id) => {
  if (e.type !== 'MESSAGE') return false
  const author = authorUserId(g, e)
  return author !== undefined && author !== viewerUserId
}

/** 이 사람에게 보여 줄 타임라인 */
export function visibleTimeline(g: Gathering, viewerUserId: Id, m: Moderation): TimelineEntry[] {
  const blocked = new Set(m.blocks.filter((b) => b.blockerUserId === viewerUserId).map((b) => b.blockedUserId))
  return g.timeline.filter((e) => {
    if (e.type !== 'MESSAGE') return true
    const key = entryKey(g, e.id)
    const reporters = new Set(m.reports.filter((r) => r.key === key).map((r) => r.reporterUserId))
    if (reporters.has(viewerUserId) || reporters.size >= HIDE_FOR_ALL_REPORTS) return false
    const author = authorUserId(g, e)
    return author === undefined || !blocked.has(author)
  })
}

/** 내가 차단한 사람 목록(계정 화면) */
export const myBlocks = (m: Moderation, viewerUserId: Id) => m.blocks.filter((b) => b.blockerUserId === viewerUserId)

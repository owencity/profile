/**
 * 정산방(R1) 맨 위 "지금 할 일" 한 줄과 하단 버튼 하나 — `docs/SCREENS.md` §4.
 *
 * **위에서부터 먼저 걸리는 조건 하나만** 돌려준다. 상태 이름(OPEN·SETTLING)을 화면에
 * 드러내지 않는 게 이 함수의 존재 이유다. 앱도 이 규칙을 그대로 옮긴다.
 */
import type { Gathering, Id } from './model'
import {
  daysUntilDelete, hasResponded, hostOf, nameOf, participantOfUser, roundsPaidBy,
  unrespondedParticipants, won,
} from './model'

export type ActionKind =
  | 'EDIT_FIRST_ROUND' | 'SHARE' | 'SETTLE' | 'VIEW_PAY' | 'CONFIRM_INCOMING'
  | 'REGISTER_ACCOUNT' | 'RESPOND' | 'EDIT_RESPONSE' | 'RESEND' | 'GIVE_SPOON'
  /** 정산 뒤 총무가 단톡방에 사람별 금액·계좌를 보낸다(FC-020) */
  | 'REQUEST_PAYMENT'
  /** 인원보다 더 들어온 사람까지 함께 정산 — 인원을 들어온 사람 수로 늘린다(FC-020) */
  | 'INCLUDE_EXTRA'

export type NextAction = {
  /** 배너 한 줄 */
  banner: string
  /** 배너 아래 보조 한 줄 (자동응답 안내 등) */
  note?: string
  /** 하단 버튼. 없으면 버튼을 그리지 않는다 */
  action?: { kind: ActionKind; label: string }
  tone: 'todo' | 'wait' | 'done'
}

export function nextAction(g: Gathering, meUserId: Id): NextAction {
  const me = participantOfUser(g, meUserId)
  if (!me) return { banner: '참여하고 체크해 주세요', action: { kind: 'RESPOND', label: '참여하고 체크하기' }, tone: 'todo' }

  const isHost = g.hostUserId === meUserId
  const autoNote = g.responses.some((r) => r.participantId === me.id && r.source === 'AUTO')
    ? '응답이 없어 전 차수 참석·알코올로 계산됐어요'
    : undefined

  if (g.status === 'COMPLETED') {
    const days = daysUntilDelete(g)
    const banner = `정산 끝! ${days ?? 7}일 뒤 사라져요`
    const canSpoon = !isHost && !g.spoonGivers.includes(me.id)
    return { banner, note: autoNote, tone: 'done', action: canSpoon ? { kind: 'GIVE_SPOON', label: '🥄 한 스푼' } : undefined }
  }

  // 결제자인데 계좌가 없으면 무엇보다 먼저
  if (roundsPaidBy(g, me.id).length > 0 && !me.payout) {
    return { banner: '받을 계좌를 등록해주세요', note: autoNote, tone: 'todo', action: { kind: 'REGISTER_ACCOUNT', label: '계좌 등록' } }
  }

  if (g.status === 'OPEN') {
    if (isHost) {
      if (g.rounds.length === 0) return { banner: '1차 금액을 넣어주세요', tone: 'todo', action: { kind: 'EDIT_FIRST_ROUND', label: '1차 입력' } }
      if (g.participants.length === 1) return { banner: '링크를 보내서 사람들을 불러주세요', tone: 'todo', action: { kind: 'SHARE', label: '링크 공유' } }
      const waiting = unrespondedParticipants(g).length
      return {
        banner: g.autoSettlementError ? '예상 금액을 계산하지 못했어요 · 입력을 확인해주세요'
          : g.headcount !== undefined && g.participants.length > g.headcount
            ? `예상 ${g.headcount}명보다 많은 ${g.participants.length}명이 응답 명단에 있어요`
            : waiting > 0 ? `${waiting}명이 아직 응답 안 했어요 · 명단을 확인해주세요` : '모두 응답했어요',
        note: '명단에서 잘못된 응답자를 제외하고 예상 금액을 확인한 뒤 확정해주세요.',
        tone: waiting > 0 ? 'wait' : 'todo', action: { kind: 'SETTLE', label: '명단 확인 · 정산 확정' },
      }
    }
    const labels = g.rounds.map((r) => r.label).join('·')
    return hasResponded(g, me.id)
      ? {
          banner: '응답을 총무에게 보냈어요. 총무가 확인 후 정산해요',
          tone: 'wait', action: { kind: 'EDIT_RESPONSE', label: '응답 고치기' },
        }
      : { banner: `${labels} 응답을 남겨주세요`, tone: 'todo', action: { kind: 'RESPOND', label: '응답하기' } }
  }

  // ── SETTLING ──
  // 순서 원칙: 남을 막고 있는 일이 먼저다(SCREENS.md §4). [보냈어요]를 누른 사람은 내 확인만
  // 기다리며 멈춰 있지만, 내가 보낼 돈은 나만 늦어진다.
  const outgoing = g.transfers.filter((t) => t.fromParticipantId === me.id)
  const incoming = g.transfers.filter((t) => t.toParticipantId === me.id)

  const sentIn = incoming.find((t) => t.status === 'SENT')
  if (sentIn) {
    return {
      banner: `${nameOf(g, sentIn.fromParticipantId)}님이 보냈대요. 확인해주세요`,
      tone: 'todo', action: { kind: 'CONFIRM_INCOMING', label: '입금 확인하기' },
    }
  }
  const bounced = outgoing.find((t) => t.status === 'WAITING' && t.notReceivedAt)
  if (bounced) {
    return {
      banner: `${nameOf(g, bounced.toParticipantId)}님이 아직 입금을 확인 못 했어요`,
      note: autoNote, tone: 'todo', action: { kind: 'VIEW_PAY', label: '다시 확인 요청' },
    }
  }
  const toSend = outgoing.find((t) => t.status === 'WAITING')
  if (toSend) {
    return {
      banner: `${nameOf(g, toSend.toParticipantId)}님께 ${won(toSend.amount)}을 보내주세요`,
      note: autoNote, tone: 'todo', action: { kind: 'VIEW_PAY', label: '보낼 돈 보기' },
    }
  }
  const waitingIn = incoming.filter((t) => t.status === 'WAITING').length
  if (waitingIn > 0) {
    // 총무는 계산이 끝나면 단톡방에 입금 요청을 돌린다(FC-020) — 사람별 금액·계좌가 담긴 문구
    return isHost
      ? { banner: '계산 끝! 단톡방에 입금 요청을 보내주세요', tone: 'todo', action: { kind: 'REQUEST_PAYMENT', label: '입금 요청 보내기' } }
      : { banner: `${waitingIn}명 입금 기다리는 중`, tone: 'wait', action: { kind: 'SHARE', label: '링크 다시 공유' } }
  }
  if (outgoing.some((t) => t.status === 'SENT')) {
    return { banner: '확인 기다리는 중이에요', note: autoNote, tone: 'wait' }
  }
  // 내 송금이 모두 확인됨
  if (!isHost && !g.spoonGivers.includes(me.id)) {
    return { banner: `끝! ${hostOf(g).displayName} 총무에게 한 스푼 어때요?`, tone: 'done', action: { kind: 'GIVE_SPOON', label: '🥄 한 스푼' } }
  }
  return { banner: '다른 사람들 입금을 기다리는 중이에요', tone: 'wait' }
}

/** 미리보기 진입 권한. 목표 인원은 제한이 아니다. */
export const canSettleNow = (g: Gathering, meUserId: Id) =>
  g.status === 'OPEN' && g.hostUserId === meUserId && g.rounds.length > 0 && g.participants.length >= 2

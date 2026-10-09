/**
 * 정산방(R1) 맨 위 "지금 할 일" 한 줄과 하단 버튼 하나 — `docs/SCREENS.md` §4.
 *
 * **위에서부터 먼저 걸리는 조건 하나만** 돌려준다. 상태 이름(OPEN·SETTLING)을 화면에
 * 드러내지 않는 게 이 함수의 존재 이유다. 앱도 이 규칙을 그대로 옮긴다.
 */
import type { Gathering, Id } from './model'
import {
  daysUntilDelete, extraParticipants, hasResponded, hostOf, nameOf, participantOfUser, respondedCount, roundsPaidBy,
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
      // 인원보다 더 들어왔으면 총무 확인이 먼저(CTO 결정 2026-10-09) — 그대로면 인원만큼만 계산되고 뒤에 온 사람은 빠진다
      const extras = extraParticipants(g)
      if (extras.length > 0) {
        return {
          banner: `현재 ${g.participants.length}명이 참여했어요 · 인원(${g.headcount}명)이 맞는지 확인해주세요`,
          note: `그대로면 ${g.headcount}명으로 계산되고 ${extras.map((p) => p.displayName).join('·')}님은 빠져요`,
          tone: 'todo', action: { kind: 'INCLUDE_EXTRA', label: `${g.participants.length}명 모두 포함하기` },
        }
      }
      const waiting = unrespondedParticipants(g).length
      // 인원을 넣었으면 다 모일 때 서버가 자동 정산한다(FC-020) — 총무는 링크만 돌리면 된다.
      // 안 들어오는 사람이 있을 때의 [지금 계산하기]는 R1 배너 아래 작은 버튼(canSettleNow)
      if (g.headcount !== undefined && waiting + Math.max(0, g.headcount - g.participants.length) > 0) {
        return {
          banner: `${g.headcount}명 중 ${respondedCount(g)}명 응답했어요 · 다 모이면 자동으로 계산돼요`,
          tone: 'wait', action: { kind: 'SHARE', label: '링크 공유' },
        }
      }
      return waiting > 0
        ? { banner: `${waiting}명이 아직 응답 안 했어요 · 준비되면 정산하세요`, tone: 'wait', action: { kind: 'SETTLE', label: '지금 계산하기' } }
        : { banner: '모두 응답했어요', tone: 'todo', action: { kind: 'SETTLE', label: '지금 계산하기' } }
    }
    const labels = g.rounds.map((r) => r.label).join('·')
    // 인원 밖에 들어온 사람 — 총무가 포함하면 함께, 아니면 이번 정산에서 빠진다
    if (extraParticipants(g).some((p) => p.id === me.id)) {
      return hasResponded(g, me.id)
        ? { banner: '인원이 다 찼어요 · 총무가 포함하면 함께 정산돼요', tone: 'wait', action: { kind: 'EDIT_RESPONSE', label: '응답 고치기' } }
        : { banner: `${labels} 응답을 남겨주세요`, note: '인원이 다 찼어요 · 총무가 포함하면 함께 정산돼요', tone: 'todo', action: { kind: 'RESPOND', label: '응답하기' } }
    }
    return hasResponded(g, me.id)
      ? {
          banner: g.headcount !== undefined ? '응답 완료! 다 모이면 자동으로 계산돼요' : '응답 완료! 총무가 정산하면 알려드릴게요',
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

/**
 * R1 배너 아래 작은 [지금 계산하기](FC-020) — 인원을 넣어 자동 정산을 기다리는 중인데, 끝까지 안 들어오는 사람이 있으면
 * 총무가 직접 마무리한다. 하단 버튼은 [링크 공유]라 이 버튼이 따로 있어야 한다.
 */
export const canSettleNow = (g: Gathering, meUserId: Id) =>
  g.status === 'OPEN' && g.hostUserId === meUserId && g.headcount !== undefined && g.rounds.length > 0 && g.participants.length >= 2 &&
  // 인원보다 더 들어왔으면 "안 들어온 사람"이 없다 — 그때는 [포함하기]만
  extraParticipants(g).length === 0

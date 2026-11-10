/**
 * 링크 공유 — 단톡방에 뿌릴 초대 문구와 주소. 앱(`v3/Share.kt`)도 같은 문구를 쓴다.
 *
 * 받는 사람이 링크만 보고도 "뭘 하면 되는지" 알게 한 줄로 쓴다. 금액은 넣지 않는다 — 단톡방은 공개된 자리고,
 * 금액은 정산 뒤 총무가 공유한 이미지에서 본다.
 */
import type { Gathering } from './model'
import { hostOf, nameOf, won } from './model'

/** 공유 주소 — 참여 입구(P1). 배포 도메인이 아니어도(로컬·미리보기) 지금 열린 곳 기준으로 만든다 */
export const shareUrl = (origin: string, token: string) => `${origin.replace(/\/$/, '')}/jungsan/j/${token}`

/**
 * OS 공유 시트를 쓸지 — 폰(터치 화면)만. PC 브라우저의 공유 창(윈도우 공유)은 카카오톡이 없고 링크 복사도 없어서
 * 총무가 링크를 꺼내지 못했다(2026-10-20). PC는 문구와 링크를 바로 복사한다.
 */
export const prefersShareSheet = (hasShareApi: boolean, coarsePointer: boolean) => hasShareApi && coarsePointer

export function shareMessage(g: Gathering, url: string): string {
  const host = hostOf(g).displayName
  const ask = g.status === 'OPEN'
    ? g.rounds.length > 0 ? '가입 없이 이름과 차수별 참석·음주만 알려주세요' : '총무가 차수를 입력하면 이 링크에서 응답해주세요'
    : '정산 결과는 총무가 공유한 이미지에서 확인해주세요'
  return `[정산어택] ${host}님의 ${g.title}\n${ask} 👉 ${url}`
}

/**
 * 입금 요청(FC-020) — 정산 뒤 총무가 단톡방에 보낸다. 사람별 보낼 금액과 받을 계좌를 한 번에 담는다.
 * 받는 사람이 둘 이상이면(차수마다 낸 사람이 다름) 받는 사람별로 묶는다. 이미 확인된 송금은 뺀다.
 */
export function paymentRequestMessage(g: Gathering): string {
  const open = g.transfers.filter((t) => t.status !== 'CONFIRMED')
  const receivers = [...new Set(open.map((t) => t.toParticipantId))]
  const blocks = receivers.map((to) => {
    const p = g.participants.find((x) => x.id === to)
    const account = p?.payout ? `${p.payout.bank} ${p.payout.accountNo} (${p.payout.holder})` : '계좌는 총무에게 확인해주세요'
    const lines = open.filter((t) => t.toParticipantId === to).map((t) => `· ${nameOf(g, t.fromParticipantId)} ${won(t.amount)}`)
    return [`→ ${nameOf(g, to)}님께 보내주세요`, ...lines, `   ${account}`].join('\n')
  })
  return [`[정산어택] ${g.title} 계산 끝!`, ...blocks, '입금 후 총무에게 알려주세요. 자세한 계산은 총무가 공유한 정산 이미지를 확인해주세요.'].join('\n')
}

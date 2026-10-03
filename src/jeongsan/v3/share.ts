/**
 * 링크 공유 — 단톡방에 뿌릴 초대 문구와 주소. 앱(`v3/Share.kt`)도 같은 문구를 쓴다.
 *
 * 받는 사람이 링크만 보고도 "뭘 하면 되는지" 알게 한 줄로 쓴다. 금액은 넣지 않는다 — 단톡방은 공개된 자리고,
 * 금액은 정산 뒤 각자 화면에서 본다.
 */
import type { Gathering } from './model'
import { hostOf } from './model'

/** 공유 주소 — 참여 입구(P1). 배포 도메인이 아니어도(로컬·미리보기) 지금 열린 곳 기준으로 만든다 */
export const shareUrl = (origin: string, token: string) => `${origin.replace(/\/$/, '')}/jungsan/j/${token}`

export function shareMessage(g: Gathering, url: string): string {
  const host = hostOf(g).displayName
  const ask = g.status === 'OPEN'
    ? g.rounds.length > 0 ? '차수마다 마셨는지만 눌러주세요' : '먼저 들어와 있으면 금액이 나올 때 알려드려요'
    : '정산 금액을 확인하고 보내주세요'
  return `[정산어택] ${host}님의 ${g.title}\n${ask} 👉 ${url}`
}

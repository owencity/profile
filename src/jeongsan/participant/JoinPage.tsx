/**
 * W0 — 참여하기. `/g/{token}` 하나가 상태에 따라 분기한다 (SPEC §3 · §8).
 *
 * **로그인을 먼저 받는다.** 카카오톡 인앱 브라우저에서는 이미 카톡에 로그인돼 있어
 * 동의 화면에 본인 프로필이 뜨고 탭 한두 번으로 끝난다. 그리고 단톡방 링크 카드(OG)에
 * 이미 모임 이름이 떠 있으므로 로그인 전에 모임 정보를 또 보여줄 필요가 적다.
 *
 * 대신 **확인 화면에 모임 정보를 충분히 보여준다.** 잘못 뿌려진 링크를 받은 사람이
 * "이거 내 모임 아니네"를 알아채는 지점이 여기 하나뿐이다.
 */
import { useState } from 'react'
import type { Gathering } from '../types'
import { dateLabel, googleEnabled, won } from '../api'
import { Bar, Card, KV, PersonRow, Shell, Url, WarnBox } from '../ui'

type Step = 'login' | 'confirm'

export function JoinPage({
  g, onJoined, onViewAll,
}: {
  g: Gathering
  onJoined: (name: string) => void
  onViewAll: () => void
}) {
  const [step, setStep] = useState<Step>('login')
  // 로그인 계정 닉네임. 실제로는 useAuthStore 의 user.nickname 을 쓴다.
  const nickname = '🌸봄이🌸'
  const [name, setName] = useState('')

  const host = g.participants.find((p) => p.id === g.hostParticipantId)
  const current = g.participants.length
  const expected = g.expectedCount
  const full = expected != null && current >= expected

  // ── 확정 후 진입 → 참여 불가
  if (g.status === 'CONFIRMED') {
    return (
      <Shell>
        <Url path={`/g/${g.shareToken}`} />
        <Bar title={g.name} step="확정됨" tone="on" />
        <WarnBox title="이미 정산이 확정되었어요">
          확정 후에는 참여할 수 없습니다.
          <br />
          <b>빠지셨다면 주최자에게 알려주세요.</b> 주최자가 되돌려서 추가할 수 있습니다.
        </WarnBox>
        <div className="js-hint">
          지금 참여하면 <b>나눌 사람 수가 바뀌어</b> 이미 공유된 금액이 전부 달라집니다.
        </div>
        <button className="js-cta acc" onClick={() => alert('주최자에게 알림을 보냈습니다 (mock)')}>
          주최자에게 알리기
        </button>
        <button className="js-cta2" onClick={onViewAll}>
          전체 내역 보기
        </button>
      </Shell>
    )
  }

  // ── 1단계 · 로그인
  if (step === 'login') {
    return (
      <Shell>
        <Url path={`/g/${g.shareToken}`} />
        <div className="js-join-hero">
          <div className="l">정산에 참여하려면 로그인이 필요해요</div>
          <div className="v">{g.name}</div>
          <div className="d">
            {dateLabel(g.date)} · {host?.name}님이 만든 모임
          </div>
        </div>
        <div className="js-hint" style={{ textAlign: 'center' }}>
          닉네임과 프로필 사진만 받습니다. <b>동명이인을 구분하기 위한 것</b>입니다.
        </div>
        <button className="js-cta kakao js-bottom" onClick={() => setStep('confirm')}>
          카카오로 시작하기
        </button>
        {googleEnabled && (
          <button className="js-cta2 google" onClick={() => setStep('confirm')}>
            구글로 시작하기
          </button>
        )}
      </Shell>
    )
  }

  // ── 2단계 · 참여 확인
  return (
    <Shell>
      <Url path={`/g/${g.shareToken}`} />
      <Bar title="참여자가 맞습니까?" />

      <div className="js-prow" style={{ borderBottom: 0, paddingTop: 0 }}>
        <div className="js-av">🌸</div>
        <div>
          <div className="js-pn">{nickname}</div>
          <div className="js-ps">카카오 계정으로 로그인됨</div>
        </div>
      </div>

      <Card title={g.name} right={dateLabel(g.date)}>
        {g.rounds.map((r) => (
          <KV key={r.id} k={r.label} v={won(r.total)} />
        ))}
        {g.extras.map((e) => (
          <KV key={e.id} k={e.label} v={won(e.amount)} />
        ))}
      </Card>

      <div className="js-lab">
        지금 {current}명이 참여 중
        {expected != null && <span className="opt"> · 예상 {expected}명</span>}
      </div>
      {g.participants.map((p) => (
        <PersonRow key={p.id} p={p} />
      ))}

      <div className="js-lab">모임에서 쓸 이름</div>
      <input
        className="js-inp"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={nickname}
      />
      <div className="js-hint">
        <b>총무와 다른 분들이 알아볼 수 있는 이름</b>으로 적어주세요. 닉네임이 기본값입니다.
      </div>

      <div className="js-confirm">
        <div className="ct">참여하면 이렇게 됩니다</div>
        <ul>
          <li>
            <b>{name.trim() || nickname}</b> 이라는 이름으로 참여합니다
          </li>
          <li>
            <b>나눌 사람 수에 포함됩니다</b>
            <span className="n">
              {current}명 → {current + 1}명
            </span>
          </li>
          <li>내 이름과 프로필 사진이 모임 사람들에게 보입니다</li>
        </ul>
      </div>

      {full && (
        <div className="js-hint" style={{ color: 'var(--warn)' }}>
          ⚠ <b style={{ color: 'var(--warn)' }}>예상 인원이 이미 찼습니다.</b> 참여하면
          주최자 확인을 기다린 뒤 명단에 들어갑니다.
        </div>
      )}

      <div className="js-ctarow">
        <button className="js-cta2" onClick={() => setStep('login')}>
          취소
        </button>
        <button className="js-cta" onClick={() => onJoined(name.trim() || nickname)}>
          {full ? '참여 요청' : '참여하기'}
        </button>
      </div>
    </Shell>
  )
}

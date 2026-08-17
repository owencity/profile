/**
 * W0 — 참여하기.
 *
 * 한 URL(`/g/{token}`)이 상태에 따라 분기한다 (SPEC §3 · §8).
 *   미참여 + COLLECTING → W0-1 모임 정보 → 로그인 → W0-2 이름 확인
 *   미참여 + CONFIRMED  → W0-차단
 */
import { useState } from 'react'
import type { Gathering } from '../types'
import { dateLabel, won } from '../api'
import { Bar, Card, KV, PersonRow, Shell, Url, WarnBox } from '../ui'

type Step = 'info' | 'name'

export function JoinPage({
  g, onJoined, onViewAll,
}: {
  g: Gathering
  onJoined: (name: string) => void
  onViewAll: () => void
}) {
  const [step, setStep] = useState<Step>('info')
  // 로그인 닉네임. 실제로는 useAuthStore 의 user.nickname 을 가져온다.
  const nickname = '🌸봄이🌸'
  const [name, setName] = useState('')

  const host = g.participants.find((p) => p.id === g.hostParticipantId)

  // ── W0-차단 · 확정 후 진입
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

  // ── W0-2 · 이름 확인 (로그인 직후)
  if (step === 'name') {
    return (
      <Shell>
        <Url path={`/g/${g.shareToken}`} />
        <Bar title="거의 다 됐어요" onBack={() => setStep('info')} />
        <div className="js-prow" style={{ borderBottom: 0, paddingTop: 0 }}>
          <div className="js-av">🌸</div>
          <div>
            <div className="js-pn">{nickname}</div>
            <div className="js-ps">카카오 계정 닉네임</div>
          </div>
        </div>
        <div className="js-lab">모임에서 쓸 이름</div>
        <input
          className="js-inp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={nickname}
          autoFocus
        />
        <div className="js-hint">
          <b>총무와 다른 분들이 알아볼 수 있는 이름</b>으로 적어주세요.
          <br />
          닉네임이 기본값이고, 나중에 바꿀 수 있습니다.
        </div>
        <button
          className="js-cta acc"
          onClick={() => onJoined(name.trim() || nickname)}
        >
          이 이름으로 참여하기
        </button>
      </Shell>
    )
  }

  // ── W0-1 · 모임 정보 + 로그인
  return (
    <Shell>
      <Url path={`/g/${g.shareToken}`} />
      <Bar title={g.name} step="수집 중" />
      <div className="js-hint" style={{ marginTop: 0 }}>
        {dateLabel(g.date)} · {host?.name}님이 만든 모임
      </div>

      <Card>
        {g.rounds.map((r) => (
          <KV key={r.id} k={r.label} v={won(r.total)} />
        ))}
        {g.extras.map((e) => (
          <KV key={e.id} k={e.label} v={won(e.amount)} />
        ))}
      </Card>

      <div className="js-lab">지금 {g.participants.length}명이 참여 중</div>
      {g.participants.map((p) => (
        <PersonRow key={p.id} p={p} />
      ))}
      <div className="js-hint">
        여기 보이는 이름은 <b>각자 직접 적은 이름</b>입니다. 아바타 자리에는 프로필 사진이 들어갑니다.
      </div>

      <button className="js-cta kakao" style={{ marginTop: 16 }} onClick={() => setStep('name')}>
        카카오로 참여하기
      </button>
      <button className="js-cta2 google" onClick={() => setStep('name')}>
        구글로 참여하기
      </button>
    </Shell>
  )
}

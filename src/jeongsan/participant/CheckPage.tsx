/**
 * W1 — 체크. 차수별 참석·음주를 본인만 찍는다.
 *
 * 결제자로 지정된 사람에게는 **계좌 등록 블록**이 함께 뜬다 (v11 ⑱).
 * 주최자가 남의 계좌를 알아내 입력할 이유가 없다.
 */
import { useState } from 'react'
import type { Gathering, Id, Participant } from '../types'
import { attKey } from '../types'
import { won } from '../api'
import { Bar, FixedNotice, Shell, Toggle, Url } from '../ui'

export function CheckPage({
  g, me, onSubmit,
}: {
  g: Gathering
  me: Participant
  onSubmit: () => void
}) {
  const [att, setAtt] = useState(() => {
    const init: Record<Id, { attended: boolean; drank: boolean }> = {}
    g.rounds.forEach((r) => {
      init[r.id] = g.attendance[attKey(me.id, r.id)] ?? { attended: false, drank: false }
    })
    return init
  })
  const [payout, setPayout] = useState(me.payout ?? { bankName: '', accountNo: '', accountHolder: me.name })

  // 이 사람이 결제한 항목 — 있으면 받을 돈이 생기므로 계좌가 필요하다
  const paidRounds = g.rounds.filter((r) => r.payerId === me.id)
  const paidExtras = g.extras.filter((e) => e.payerId === me.id)
  const paidTotal = paidRounds.reduce((s, r) => s + r.total, 0) + paidExtras.reduce((s, e) => s + e.amount, 0)
  const isPayer = paidTotal > 0

  const toggleAttend = (id: Id) =>
    setAtt((prev) => {
      const next = !prev[id].attended
      // 불참이면 음주도 반드시 false — 계산 엔진이 모순으로 거부한다
      return { ...prev, [id]: { attended: next, drank: next ? prev[id].drank : false } }
    })

  const toggleDrank = (id: Id) =>
    setAtt((prev) =>
      prev[id].attended ? { ...prev, [id]: { ...prev[id], drank: !prev[id].drank } } : prev,
    )

  return (
    <Shell narrow>
      <Url path={`/g/${g.shareToken}`} />
      <Bar title={g.name} />

      <div className="js-prow" style={{ borderBottom: 0, paddingTop: 0 }}>
        <div className="js-av">{me.name.slice(0, 1)}</div>
        <div>
          <div className="js-pn">
            {me.name}
            <button
              style={{
                fontSize: 11, color: 'var(--p600)', fontWeight: 800, marginLeft: 7,
                background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => alert('이름 수정 (mock)')}
            >
              이름 수정
            </button>
          </div>
          <div className="js-ps">
            {me.provider === 'kakao' ? '카카오' : '구글'} 계정 · 본인 것만 체크됩니다
          </div>
        </div>
      </div>

      {/* **묻는 단위는 "이 술자리에 왔냐"가 아니라 "몇 차에 있었냐"다.**
          1차만 있다 간 사람과 끝까지 남은 사람이 같은 금액을 내면 안 된다.
          그래서 차수마다 따로 묻고, 문구도 "참석"이 아니라 "1차 참석"으로 박는다. */}
      {g.rounds.map((r) => (
        <div key={r.id}>
          <div className="js-lab">{r.label}</div>
          <Toggle
            label={`${r.label} 참석`}
            on={att[r.id].attended}
            onToggle={() => toggleAttend(r.id)}
          />
          <Toggle
            // 논알콜이면 술값을 안 나눠 갖는다. 이 한 칸이 금액을 크게 가른다.
            label="술 마셨어요"
            on={att[r.id].drank}
            onToggle={() => toggleDrank(r.id)}
            sub
            disabled={!att[r.id].attended}
          />
          {att[r.id].attended && !att[r.id].drank && (
            <div className="js-hint" style={{ marginLeft: 16, marginTop: -2 }}>
              논알콜로 처리돼 <b>{r.label} 술값은 빠집니다</b>.
            </div>
          )}
        </div>
      ))}

      {isPayer && (
        <div
          className="js-box"
          style={{ background: 'var(--acc-bg)', borderColor: '#f6d8b8', marginTop: 16 }}
        >
          <div className="bt" style={{ color: 'var(--acc-strong)' }}>
            💳 결제자로 지정되셨어요
          </div>
          <div className="bn" style={{ marginBottom: 10 }}>
            {[...paidRounds.map((r) => r.label), ...paidExtras.map((e) => e.label)].join(' · ')} —{' '}
            <b style={{ color: 'var(--acc-strong)' }}>{won(paidTotal)}을 돌려받으실 예정</b>입니다.
            <br />
            받을 계좌를 등록해주세요.
          </div>
          <div className="js-row2">
            <input
              className="js-inp"
              placeholder="은행"
              value={payout.bankName}
              onChange={(e) => setPayout({ ...payout, bankName: e.target.value })}
              style={{ background: '#fff' }}
            />
          </div>
          <input
            className="js-inp"
            placeholder="계좌번호"
            value={payout.accountNo}
            onChange={(e) => setPayout({ ...payout, accountNo: e.target.value })}
            style={{ background: '#fff', marginTop: 6 }}
          />
        </div>
      )}

      <FixedNotice
        unit={g.roundingUnit}
        extra={<>모두의 체크 내역은 서로에게 공개됩니다.</>}
      />
      <button className="js-cta js-bottom" onClick={onSubmit}>
        제출하기
      </button>

      {/*
        본인 탈퇴 — 수집 중에만 가능하다. SPEC §9가 범위 밖으로 둔 것은
        "승인이 필요한 참여 취소"이고, 승인 없는 본인 탈퇴는 다르다.
        잘못 들어온 사람이 스스로 빠지면 주최자가 할 일이 없어진다.
        확정 후에는 금액이 확정됐으므로 불가하다.
      */}
      <button
        className="js-leave"
        onClick={() => {
          if (window.confirm('이 모임에서 나가시겠어요?\n체크한 내용도 함께 지워집니다.')) {
            alert('모임에서 나갔습니다 (mock)')
          }
        }}
      >
        이 모임에서 나가기
      </button>
    </Shell>
  )
}

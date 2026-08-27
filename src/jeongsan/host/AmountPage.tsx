/**
 * H2 — 금액 입력. **사람 없이 되는 것만** 받는다.
 *
 * 결제자는 "전부 내가"가 기본이라 참여자가 0명이어도 차수 입력이 완결된다.
 * "항목마다 달라요"를 고르면 사람이 모인 뒤 H3에서 지정한다.
 * 기타 항목도 차수와 같게 여기서는 **금액만** 받는다 (v5 ⑤).
 */
import { useState } from 'react'
import type { Gathering } from '../types'
import { won } from '../api'
import { Bar, Card, KV, Radio, Shell } from '../ui'

export function AmountPage({
  g, onNext, onBack,
}: {
  g: Gathering
  onNext: () => void
  onBack: () => void
}) {
  const [allMine, setAllMine] = useState(false)
  const nameOf = (id: number) => g.participants.find((p) => p.id === id)?.name ?? '?'

  return (
    <Shell narrow>
      <Bar title="금액 입력" onBack={onBack} step="2 / 2" />

      {g.rounds.map((r) => (
        <Card key={r.id} title={r.label}>
          <KV k="총액" v={won(r.total)} />
          {r.drinkItems ? (
            <>
              {r.drinkItems.map((d) => (
                <KV
                  key={d.name}
                  k={`${d.name} ${d.bottleCount}병 × ${d.unitPrice.toLocaleString()}`}
                  v={(d.bottleCount * d.unitPrice).toLocaleString()}
                  sub
                />
              ))}
              <KV k="술값 합계" v={won(r.alcohol)} />
            </>
          ) : (
            <KV k="그중 술값" v={won(r.alcohol)} />
          )}
        </Card>
      ))}
      <button className="js-add">+ 차수 추가</button>

      <div className="js-lab">기타 항목</div>
      {g.extras.map((e) => (
        <Card key={e.id} title={e.label}>
          <KV k="금액" v={won(e.amount)} />
        </Card>
      ))}
      <button className="js-add">+ 기타 항목 추가</button>

      <div className="js-lab">
        누가 결제했나요 <span className="opt">· 차수와 기타 항목 전부</span>
      </div>
      <Radio label="전부 내가 냈어요" on={allMine} onSelect={() => setAllMine(true)} />
      <Radio label="항목마다 달라요" on={!allMine} onSelect={() => setAllMine(false)} />

      {!allMine && (
        <Card>
          {g.rounds.map((r) => (
            <KV key={r.id} k={r.label} v={nameOf(r.payerId)} />
          ))}
          {g.extras.map((e) => (
            <KV key={e.id} k={e.label} v={nameOf(e.payerId)} />
          ))}
          <KV k="참여자가 들어온 뒤 H3에서 지정합니다" sub />
        </Card>
      )}

      <div className="js-hint">
        결제자 · 부담자 · 면제자는 <b>사람이 모인 뒤</b> 수집 현황에서 지정합니다.
      </div>

      <button className="js-cta js-bottom" onClick={onNext}>
        링크 만들기
      </button>
    </Shell>
  )
}

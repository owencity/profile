/**
 * 차수별 술 입력 — 총무가 영수증을 보고 적는다.
 *
 * **총무는 총액과 술병 갯수만 적는다.** 누가 몇 잔 마셨는지는 안 적는다 —
 * 그건 알 수도 없고, 적으라고 하면 총무가 정산을 포기한다.
 * 술값을 누가 나눠 가질지는 참여자가 각자 "마셨다/안 마셨다"를 찍어서 정해진다.
 *
 * 술은 **종류별로** 받는다. 소주와 위스키를 한 줄로 합치면 "술값 12만원"이 되는데,
 * 그러면 논알콜인 사람이 억울해도 근거를 못 본다. 종류·병수·단가가 남아야
 * 나중에 "이게 왜 이 금액이냐"에 답할 수 있다.
 */
import { useState } from 'react'
import type { DrinkItem, Money } from '../types'
import { Bar, Shell } from '../ui'

const won = (n: Money) => `${n.toLocaleString()}원`

/** 자주 쓰는 것들. 매번 타이핑하면 총무가 지친다. */
const PRESET = [
  { name: '소주', unitPrice: 5000 },
  { name: '맥주', unitPrice: 6000 },
  { name: '막걸리', unitPrice: 6000 },
  { name: '하이볼', unitPrice: 9000 },
]

export function DrinkInputPage({
  roundLabel, total, initial = [], onSave, onBack,
}: {
  roundLabel: string
  /** 이 차수 총액(영수증 합계). 술값이 총액을 넘으면 경고한다. */
  total: Money
  initial?: DrinkItem[]
  onSave: (items: DrinkItem[]) => void
  onBack: () => void
}) {
  const [items, setItems] = useState<DrinkItem[]>(initial)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [count, setCount] = useState('1')

  const sum = items.reduce((n, d) => n + d.bottleCount * d.unitPrice, 0)
  const over = sum > total
  const canAdd = name.trim() !== '' && Number(price) > 0 && Number(count) > 0

  const add = () => {
    setItems((prev) => [...prev, {
      name: name.trim(),
      bottleCount: Number(count),
      unitPrice: Number(price),
    }])
    setName(''); setPrice(''); setCount('1')
  }

  return (
    <Shell narrow>
      <Bar title={`${roundLabel} 술 입력`} onBack={onBack} />

      {/* 영수증 OCR 자리. 아직 없다는 걸 숨기지 않는다 —
          "곧 됩니다"라고만 써두면 사용자가 눌러보고 아무 일도 없어 더 답답하다. */}
      <button className="js-add" disabled style={{ opacity: 0.55, cursor: 'default' }}>
        📷 영수증으로 자동 입력 · 준비 중
      </button>
      <div className="js-hint" style={{ marginTop: -4, marginBottom: 12 }}>
        지금은 직접 적어주세요. 영수증 사진에서 술 종류와 금액을 읽어오는 기능을 준비하고 있습니다.
      </div>

      <div className="js-lab">
        {roundLabel} 총액 <span className="opt">· 영수증 합계</span>
      </div>
      <div className="js-kv" style={{ fontSize: 15 }}>
        <span>전체</span>
        <b>{won(total)}</b>
      </div>

      <div className="js-lab">술 종류별로 적어주세요</div>

      {items.length === 0 && (
        <div className="js-hint" style={{ marginBottom: 8 }}>
          아직 없습니다. 안 적으면 <b>술값 구분 없이 전원이 똑같이 나눕니다</b>.
        </div>
      )}

      {items.map((d, i) => (
        <div key={i} className="js-drow">
          <b>{d.name}</b>
          <span className="q">{d.bottleCount}병 × {d.unitPrice.toLocaleString()}</span>
          <span className="a">{won(d.bottleCount * d.unitPrice)}</span>
          <button
            className="js-mini"
            onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
          >
            삭제
          </button>
        </div>
      ))}

      {items.length > 0 && (
        <div className="js-kv" style={{ marginTop: 8, fontSize: 14 }}>
          <span>술값 합계</span>
          <b style={{ color: over ? 'var(--warn)' : 'var(--ink)' }}>{won(sum)}</b>
        </div>
      )}
      {over && (
        <div className="js-hint" style={{ color: 'var(--warn)' }}>
          술값이 총액보다 큽니다. 병수나 단가를 다시 봐주세요.
        </div>
      )}

      <div className="js-lab">추가</div>
      <div className="js-chips" style={{ marginBottom: 8 }}>
        {PRESET.map((p) => (
          <button
            key={p.name}
            className="js-chip"
            onClick={() => { setName(p.name); setPrice(String(p.unitPrice)) }}
          >
            {p.name}
          </button>
        ))}
      </div>

      <input
        className="js-inp"
        value={name}
        placeholder="술 이름 (예: 참이슬, 카스, 하이볼)"
        onChange={(e) => setName(e.target.value)}
      />
      <div className="js-row2" style={{ marginTop: 8 }}>
        <input
          className="js-inp" type="number" inputMode="numeric"
          value={price} placeholder="병당 가격"
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          className="js-inp" type="number" inputMode="numeric" min={1}
          value={count} placeholder="병수"
          onChange={(e) => setCount(e.target.value)}
        />
      </div>
      <button
        className="js-cta2"
        style={{ marginTop: 8, ...(canAdd ? {} : { opacity: 0.45 }) }}
        disabled={!canAdd}
        onClick={add}
      >
        + 추가
      </button>

      <button className="js-cta js-bottom" onClick={() => onSave(items)}>
        저장
      </button>
    </Shell>
  )
}

/**
 * R2 차수 편집(총무) — docs/SCREENS.md §5.
 *
 * 텍스트 입력은 금액과 (직접 입력한) 술 이름·가격뿐이다. 술은 프리셋 칩 한 번 + 병 수 [−][+]로
 * 끝나게 한다. 웹에는 [영수증 찍기]가 없다(SCREENS.md §7 — 앱 전용).
 */
import { useState } from 'react'
import type { DrinkItem, Gathering, Id, ResponseType, Round } from './model'
import { hostOf, nextRoundLabel, responseOf, won } from './model'
import { ResponseRow } from './ResponseRow'
import type { RoundDraft } from './round'
import { DRINK_PRESETS, drinksTotal, parseAmount, validateRound } from './round'
import { BackButton } from './BackButton'

type Props = {
  g: Gathering
  /** 새 차수면 없다 */
  round?: Round
  onBack: () => void
  /** 저장. `andNext`면 저장 뒤 다음 차수를 연다. `mine`은 총무 본인의 이 차수 응답(FC-019) */
  onSave: (draft: RoundDraft, andNext: boolean, mine: ResponseType) => void
  onDelete?: () => void
}

export function RoundEditPage({ g, round, onBack, onSave, onDelete }: Props) {
  const host = hostOf(g)
  const [amountText, setAmountText] = useState(round ? round.total.toLocaleString('ko-KR') : '')
  const [drinks, setDrinks] = useState<DrinkItem[]>(round?.drinks ?? [])
  const [payer, setPayer] = useState<Id>(round?.payerParticipantId ?? host.id)
  // 결제자는 거의 항상 총무라 고르는 칸을 접어 둔다. 이미 다른 사람이 낸 차수면 펼친 채로 연다
  const [payerOpen, setPayerOpen] = useState(payer !== host.id)
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const [tried, setTried] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // 총무 본인 응답(FC-019 A) — 대부분 마시니 알코올이 눌린 채 보이고, 안 마신 날은 여기서 한 번 바꾼다.
  // 숨은 기본값이 아니라 화면에 보이는 기본값이다. 고치는 중이면 이미 넣은 응답을 보여준다
  const [mine, setMine] = useState<ResponseType>(() => {
    const cur = round ? responseOf(g, host.id, round.id)?.type : undefined
    return cur && cur !== 'EXEMPT' ? cur : 'DRANK'
  })

  const total = parseAmount(amountText)
  const draft: RoundDraft = { id: round?.id, total, drinks, payerParticipantId: payer }
  const errors = validateRound(draft, g)
  const label = round?.label ?? nextRoundLabel(g)

  const addDrink = (d: DrinkItem) => {
    // 같은 술 칩을 또 누르면 줄을 늘리지 않고 병 수를 올린다
    const i = drinks.findIndex((x) => x.name === d.name && x.unitPrice === d.unitPrice)
    if (i >= 0) return setDrinks(drinks.map((x, k) => (k === i ? { ...x, quantity: x.quantity + 1 } : x)))
    setDrinks([...drinks, { ...d }])
  }
  const setDrink = (i: number, patch: Partial<DrinkItem>) =>
    setDrinks(drinks.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const removeDrink = (i: number) => setDrinks(drinks.filter((_, k) => k !== i))

  const save = (andNext: boolean) => {
    setTried(true)
    if (errors.length === 0) onSave(draft, andNext, mine)
  }

  return (
    <div className="js-shell narrow js-r2">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="정산방으로" />
        <div className="js-rtitle"><b>{label}{round ? ' 고치기' : ' 넣기'}</b></div>
      </header>

      <section className="js-field">
        <label htmlFor="round-total" className="js-lab">얼마 나왔나요?</label>
        <div className="js-amount">
          <input
            id="round-total"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amountText}
            onChange={(e) => {
              const n = parseAmount(e.target.value)
              setAmountText(n ? n.toLocaleString('ko-KR') : '')
            }}
          />
          <span>원</span>
        </div>
      </section>

      <section className="js-field">
        <div className="js-lab">어떤 술을 마셨나요? <small>안 마신 차수면 비워두세요</small></div>
        <div className="js-presets">
          {DRINK_PRESETS.map((p) => (
            <button key={p.name} type="button" className="js-preset" onClick={() => addDrink(p)}>+ {p.name}</button>
          ))}
          <button type="button" className="js-preset ghost" onClick={() => addDrink({ name: '', unitPrice: 0, quantity: 1 })}>
            + 직접 입력
          </button>
        </div>

        {drinks.length > 0 && (
          <ul className="js-drinks">
            {drinks.map((d, i) => (
              <li key={i} className="js-drink">
                <input
                  className="nm"
                  aria-label="술 이름"
                  value={d.name}
                  placeholder="술 이름"
                  onChange={(e) => setDrink(i, { name: e.target.value })}
                />
                {editingPrice === i ? (
                  <input
                    className="pr"
                    aria-label={`${d.name || '술'} 병당 가격`}
                    inputMode="numeric"
                    autoFocus
                    value={d.unitPrice ? d.unitPrice.toLocaleString('ko-KR') : ''}
                    onChange={(e) => setDrink(i, { unitPrice: parseAmount(e.target.value) })}
                    onBlur={() => setEditingPrice(null)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingPrice(null) }}
                  />
                ) : (
                  <button type="button" className="pr" onClick={() => setEditingPrice(i)} aria-label={`${d.name || '술'} 병당 가격 고치기`}>
                    {d.unitPrice ? won(d.unitPrice) : '가격'}
                  </button>
                )}
                <div className="js-qty" role="group" aria-label={`${d.name || '술'} 병 수`}>
                  <button type="button" onClick={() => setDrink(i, { quantity: Math.max(1, d.quantity - 1) })} aria-label="한 병 빼기" disabled={d.quantity <= 1}>−</button>
                  <b aria-live="polite">{d.quantity}</b>
                  <button type="button" onClick={() => setDrink(i, { quantity: d.quantity + 1 })} aria-label="한 병 더하기">+</button>
                </div>
                <button type="button" className="rm" onClick={() => removeDrink(i)} aria-label={`${d.name || '술'} 지우기`}>×</button>
              </li>
            ))}
          </ul>
        )}
        {drinks.length > 0 && (
          <div className="js-drinksum">술 합계 <b>{won(drinksTotal(drinks))}</b></div>
        )}
      </section>

      <section className="js-field">
        <div className="js-lab">나는 이 차수에</div>
        <ResponseRow label={`내 ${label}`} value={mine} onChange={setMine} />
      </section>

      {/*
        총무 = 받는 사람(2026-10-06 CTO 결정). 다음 차를 다른 사람이 계산했으면 그 사람이 정산방에서
        [다음 차는 내가 계산했어요]로 따로 술자리를 만든다. 같은 자리에서 카드가 안 돼 대신 낸 경우만 여기서 고른다
      */}
      {!payerOpen ? (
        <section className="js-field">
          <div className="js-payerline">
            <span>낸 사람 <b>나(총무)</b></span>
            <button type="button" className="js-linkbtn" onClick={() => setPayerOpen(true)}>다른 사람이 냈어요</button>
          </div>
        </section>
      ) : (
      <section className="js-field">
        <div className="js-lab">누가 냈나요?</div>
        <div className="js-hint">다음 장소를 다른 사람이 계산했다면, 그 사람이 정산방에서 [다음 차는 내가 계산했어요]로 새 술자리를 만들면 돼요</div>
        <div className="js-payers" role="radiogroup" aria-label="낸 사람">
          {g.participants.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={payer === p.id}
              className={`js-payer${payer === p.id ? ' on' : ''}`}
              onClick={() => setPayer(p.id)}
            >
              {p.id === host.id ? '나' : p.displayName}
            </button>
          ))}
        </div>
        {g.participants.length === 1 && <div className="js-hint">사람들이 들어오면 여기서 고를 수 있어요</div>}
      </section>
      )}

      {tried && errors.length > 0 && (
        <div className="js-errs" role="alert">
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      <div className="js-r2btns">
        <button className="js-cta" onClick={() => save(false)}>저장</button>
        <button className="js-cta2" onClick={() => save(true)}>저장하고 다음 차수 넣기</button>
        {onDelete && (
          <button
            className={`js-del${confirmDelete ? ' armed' : ''}`}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            onBlur={() => setConfirmDelete(false)}
          >
            {confirmDelete ? `한 번 더 누르면 ${label}를 지워요` : `${label} 지우기`}
          </button>
        )}
      </div>
    </div>
  )
}

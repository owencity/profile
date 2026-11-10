import { useRef, useState } from 'react'
import type { Gathering } from './model'
import { HEADCOUNT_MAX, HEADCOUNT_MIN, responseProgressLabel, validateTotalHeadcount } from './model'

type Props = { g: Gathering; onSave?: (totalHeadcount: number) => Promise<string | null> }

/** 전체 응답 인원을 따로 정한다. 차수마다 적은 예상 참석 인원은 변경하지 않는다. */
export function TotalHeadcountCard({ g, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const canEdit = g.status === 'OPEN' && onSave !== undefined
  const inputId = `total-headcount-${g.id}`

  const save = async () => {
    if (!canEdit || pending.current) return
    const value = Number(text)
    const invalid = validateTotalHeadcount(value)
    if (invalid) { setError(invalid); return }
    pending.current = true
    setSaving(true)
    setError(null)
    try {
      const failure = await onSave(value)
      if (failure) setError(failure)
      else setEditing(false)
    } catch {
      setError('총인원을 저장하지 못했어요. 연결을 확인하고 다시 시도해주세요')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <section className="js-totalheadcount" aria-label="총 정산인원">
    <div className="js-totalheadcount-heading">
      <div><b>총 정산인원 (나 포함)</b><p>{g.totalHeadcount === undefined ? '미설정' : `${g.totalHeadcount}명`}</p></div>
      {canEdit && !editing && <button type="button" className="js-mini" onClick={() => {
        setText(g.totalHeadcount?.toString() ?? '')
        setError(null)
        setEditing(true)
      }}>{g.totalHeadcount === undefined ? '총인원 설정' : '총인원 수정'}</button>}
    </div>
    {g.status === 'OPEN' && <p className="js-totalheadcount-progress">{responseProgressLabel(g)}</p>}
    {g.status === 'OPEN' && g.totalHeadcount !== undefined && g.participants.length > g.totalHeadcount &&
      <p className="js-totalheadcount-error">현재 명단은 {g.participants.length}명이에요. 총 정산인원보다 많으니 명단과 총인원을 검토해주세요.</p>}
    <p className="js-hint">모든 차수를 통틀어 응답할 사람 수예요. 차수별 참석 인원과 달라도 괜찮아요.</p>
    {editing && canEdit && <form noValidate onSubmit={(event) => { event.preventDefault(); void save() }}>
      <label htmlFor={inputId} className="js-lab">총무인 나를 포함해 몇 명인가요?</label>
      <div className="js-totalheadcount-edit">
        <input id={inputId} type="number" inputMode="numeric" min={HEADCOUNT_MIN} max={HEADCOUNT_MAX} step={1}
          value={text} onChange={(event) => { setText(event.target.value); setError(null) }} disabled={saving}
          autoFocus aria-invalid={error !== null} aria-describedby={error ? `${inputId}-error` : undefined} />
        <span>명</span>
        <button className="js-mini" type="submit" disabled={saving}>{saving ? '저장 중…' : '총인원 저장'}</button>
        <button className="js-mini ghost" type="button" disabled={saving} onClick={() => setEditing(false)}>취소</button>
      </div>
      {error && <p className="js-totalheadcount-error" id={`${inputId}-error`} role="alert">{error}</p>}
    </form>}
    {g.status !== 'OPEN' && <p className="js-hint">정산을 확정한 뒤에는 총인원을 수정할 수 없어요.</p>}
  </section>
}

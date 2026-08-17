/**
 * 모임 날짜 선택.
 *
 * 네이티브 `<input type="date">` 는 브라우저 기본 팝업이 떠서 디자인과 따로 논다.
 * 그런데 **캘린더를 예쁘게 만드는 것보다 캘린더를 안 열게 하는 것이 낫다** —
 * 술자리 정산은 당일이나 다음날에 하므로 `어제`·`오늘` 두 칩이 대부분을 덮는다.
 * 그 밖의 날짜일 때만 캘린더를 펼친다.
 */
import { useState } from 'react'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

/** 로컬 자정 기준 `YYYY-MM-DD`. `toISOString()` 은 UTC로 밀려 하루가 어긋난다. */
export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function dateLabel(iso: string): string {
  const d = fromISO(iso)
  return `${iso.replace(/-/g, '. ')} (${DOW[d.getDay()]})`
}

const shift = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function DatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const today = toISO(new Date())
  const yesterday = shift(-1)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => {
    const d = fromISO(value || today)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const isPreset = value === today || value === yesterday

  // 달력 격자 — 1일이 있는 주의 일요일부터 6주(42칸)
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  const moveMonth = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))

  const pick = (iso: string) => {
    onChange(iso)
    setOpen(false)
  }

  return (
    <div>
      <div className="js-chips">
        <button
          type="button"
          className={`js-chip${value === yesterday ? ' on' : ''}`}
          onClick={() => pick(yesterday)}
        >
          어제
        </button>
        <button
          type="button"
          className={`js-chip${value === today ? ' on' : ''}`}
          onClick={() => pick(today)}
        >
          오늘
        </button>
        <button
          type="button"
          className={`js-chip${!isPreset ? ' on' : ''}`}
          onClick={() => setOpen((v) => !v)}
        >
          {isPreset ? '다른 날짜' : dateLabel(value)} {open ? '▴' : '▾'}
        </button>
      </div>

      {!open && (
        <div className="js-dp-value">{value ? dateLabel(value) : '날짜를 골라주세요'}</div>
      )}

      {open && (
        <div className="js-dp">
          <div className="js-dp-head">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달">
              ‹
            </button>
            <b>
              {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
            </b>
            <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">
              ›
            </button>
          </div>

          <div className="js-dp-grid">
            {DOW.map((d, i) => (
              <div key={d} className={`js-dp-dow${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>
                {d}
              </div>
            ))}
            {cells.map((d) => {
              const iso = toISO(d)
              const other = d.getMonth() !== cursor.getMonth()
              return (
                <button
                  key={iso}
                  type="button"
                  className={[
                    'js-dp-day',
                    other ? 'dim' : '',
                    iso === value ? 'on' : '',
                    iso === today && iso !== value ? 'today' : '',
                    d.getDay() === 0 ? 'sun' : d.getDay() === 6 ? 'sat' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pick(iso)}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

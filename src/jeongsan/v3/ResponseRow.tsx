/**
 * 한 차수의 응답 버튼 [불참][논알코올][알코올] — P2(참여자)와 R3(총무 대리 입력)가 같이 쓴다.
 * 고르는 건 버튼 세 개 중 하나뿐이라 라디오 그룹으로 둔다.
 */
import type { ResponseType } from './model'
import { RESPONSE_LABEL, SELF_CHOICES } from './model'

type Props = {
  label: string
  value?: ResponseType
  onChange: (t: ResponseType) => void
  /** 자리를 줄여야 할 때(R3 안쪽) */
  compact?: boolean
}

export function ResponseRow({ label, value, onChange, compact }: Props) {
  return (
    <div className={`js-resp${compact ? ' compact' : ''}`} role="radiogroup" aria-label={`${label} 응답`}>
      {SELF_CHOICES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          className={`js-respbtn ${t.toLowerCase()}${value === t ? ' on' : ''}`}
          onClick={() => onChange(t)}
        >
          {RESPONSE_LABEL[t]}
        </button>
      ))}
    </div>
  )
}

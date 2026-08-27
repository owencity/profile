/**
 * 모임 만들기 — 로그인 후 "새 모임 만들기"로 들어온다.
 *
 * **먼저 종류를 고르게 한다.** 번개와 주기는 이후 흐름이 다르다 —
 * 번개는 술자리를 지금 같이 만들어야 하고(날짜·인원이 필요하다),
 * 주기는 모임만 만들고 술자리는 나중에 추가한다.
 * 종류를 나중에 묻거나 설정 안으로 숨기면, 사용자는 자기가 뭘 만들었는지 모른 채
 * 다음 화면에서 헤맨다.
 */
import { useState } from 'react'
import type { GroupType } from '../types'
import { Bar, Shell } from '../ui'
import { DatePicker, toISO } from '../DatePicker'

const TYPES: { key: GroupType; title: string; desc: string }[] = [
  {
    key: 'RECURRING',
    title: '주기 모임',
    desc: '계속 만나는 사람들. 술자리를 여러 번 열고 그때마다 정산합니다.',
  },
  {
    key: 'FLASH',
    title: '번개 모임',
    desc: '오늘 한 번. 술자리 하나로 끝나고, 정산 후 2주 뒤 목록에서 사라집니다.',
  },
]

export function CreateGroupPage({
  onCreate, onBack,
}: {
  onCreate: (v: { name: string; groupType: GroupType; gatheringDate?: string; expectedCount?: number }) => void
  onBack: () => void
}) {
  const [groupType, setGroupType] = useState<GroupType>('RECURRING')
  const [name, setName] = useState('')
  const [date, setDate] = useState(() => toISO(new Date()))
  const [count, setCount] = useState('4')

  const flash = groupType === 'FLASH'
  const countN = Number(count)
  // 번개만 날짜·인원이 필요하다. 주기는 이름만 있으면 만들 수 있다.
  const valid = name.trim().length > 0 && (!flash || countN >= 2)

  return (
    <Shell narrow>
      <Bar title="새 모임" onBack={onBack} />

      <div className="js-lab" style={{ marginTop: 4 }}>어떤 모임인가요?</div>
      {TYPES.map((t) => (
        <button
          key={t.key}
          className={`js-radio${groupType === t.key ? ' on' : ''}`}
          style={{ alignItems: 'flex-start', paddingTop: 13, paddingBottom: 13 }}
          onClick={() => setGroupType(t.key)}
        >
          <span className="js-dot" style={{ marginTop: 2 }} />
          <span>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>{t.title}</span>
            <span
              style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--ink3)', marginTop: 3, lineHeight: 1.55,
              }}
            >
              {t.desc}
            </span>
          </span>
        </button>
      ))}

      <div className="js-lab">모임 이름</div>
      <input
        className="js-inp"
        value={name}
        placeholder={flash ? '예: 8월 26일 번개' : '예: 신림팸'}
        onChange={(e) => setName(e.target.value)}
      />

      {/* 번개일 때만 나타난다 — 주기 모임에는 날짜가 없다(술자리마다 따로 잡는다) */}
      {flash && (
        <>
          <div className="js-lab">언제 만나나요?</div>
          <DatePicker value={date} onChange={setDate} />

          <div className="js-lab">
            몇 명 오나요? <span className="opt">· 본인 포함</span>
          </div>
          <input
            className="js-inp"
            type="number"
            inputMode="numeric"
            min={2}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <div className="js-hint">
            정확하지 않아도 됩니다. <b>모르는 사람이 링크로 들어왔을 때</b> 확인받는 기준으로만
            씁니다 — 계산에는 쓰지 않습니다.
          </div>
        </>
      )}

      <button
        className="js-cta js-bottom"
        onClick={() =>
          onCreate({
            name: name.trim(),
            groupType,
            gatheringDate: flash ? date : undefined,
            expectedCount: flash ? countN : undefined,
          })
        }
        style={valid ? undefined : { opacity: 0.45 }}
        disabled={!valid}
      >
        {flash ? '번개 만들고 링크 받기' : '모임 만들기'}
      </button>
      {!valid && (
        <div className="js-hint" style={{ textAlign: 'center', color: 'var(--warn)' }}>
          {name.trim() ? '인원을 2명 이상으로 적어주세요' : '모임 이름을 적어주세요'}
        </div>
      )}
    </Shell>
  )
}

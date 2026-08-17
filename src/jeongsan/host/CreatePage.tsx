/**
 * H1 — 모임 만들기.
 *
 * **명단을 입력하지 않는다.** 참여자 수만 받고 사람은 링크로 들어온다 (v4~v6).
 * 그 숫자는 확정 전 인원 불일치 경고에만 쓰고 **계산에는 쓰지 않는다.**
 * 반올림 단위 선택도 화면에서 뺐다 — DB 컬럼과 계산 엔진은 그대로 두어
 * 나중에 화면만 다시 붙일 수 있게 했다.
 */
import { useState } from 'react'
import { Bar, Shell } from '../ui'
import { DatePicker, toISO } from '../DatePicker'

export function CreatePage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [name, setName] = useState('8월 팀 회식')
  const [date, setDate] = useState(() => toISO(new Date()))
  const [myName, setMyName] = useState('동규')
  const [bank, setBank] = useState('국민은행')
  const [account, setAccount] = useState('123456-78-901234')
  const [count, setCount] = useState('5')
  const valid = Number(count) >= 2

  return (
    <Shell>
      <Bar title="새 모임" onBack={onBack} step="1 / 2" />

      <div className="js-lab">모임 이름</div>
      <input className="js-inp" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="js-lab">모임 날짜</div>
      <DatePicker value={date} onChange={setDate} />

      <div className="js-lab">
        내 이름 <span className="opt">· 참여자에게 보입니다</span>
      </div>
      <input className="js-inp" value={myName} onChange={(e) => setMyName(e.target.value)} />
      <div className="js-hint">카카오 닉네임을 가져왔습니다. 바꿀 수 있어요</div>

      <div className="js-lab">
        내 계좌 <span className="opt">· 내가 받을 때 쓰입니다</span>
      </div>
      <input className="js-inp" value={bank} onChange={(e) => setBank(e.target.value)} />
      <input
        className="js-inp"
        style={{ marginTop: 6 }}
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />
      <div className="js-hint">
        <b>다른 사람이 결제한 차수가 있으면, 그 사람 계좌는 본인이 등록합니다.</b>
      </div>

      {/*
        참여자 수는 필수다. 이 숫자가 "정원을 넘는 참여는 주최자 승인" 게이트의
        기준이라, 비어 있으면 방어가 통째로 사라진다.
        사후 개설이라 주최자는 인원을 알고, H3에서 나중에 고칠 수 있으니 틀려도 된다.
      */}
      <div className="js-lab">
        참여자 수 <span className="opt">· 본인 포함 · 필수</span>
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
        <b>{myName || '주최자'}님을 포함한 인원</b>을 적어주세요. 명단은 적지 않아도 됩니다 —
        <b> 링크로 각자 들어옵니다.</b>
      </div>
      <div className="js-confirm" style={{ marginTop: 10 }}>
        <div className="ct">이 숫자가 하는 일</div>
        <ul>
          <li>확정 전에 <b>빠진 사람이 있으면</b> 알려드립니다</li>
          <li>
            <b>모르는 사람이 들어오면</b> 주최자 확인을 받습니다
            <span className="n">{Number(count) || 0}명 초과 시</span>
          </li>
        </ul>
      </div>

      <button
        className="js-cta js-bottom"
        onClick={onNext}
        style={valid ? undefined : { opacity: 0.45 }}
      >
        모임 만들고 링크 받기
      </button>
      {!valid && (
        <div className="js-hint" style={{ textAlign: 'center', color: 'var(--warn)' }}>
          참여자 수를 2명 이상으로 적어주세요
        </div>
      )}
    </Shell>
  )
}

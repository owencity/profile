/**
 * 모임 검색해서 참가 — `/jungsan/search`
 *
 * 링크 참가와 나란히 있는 **두 번째 입구**다. 링크는 단톡방에 있어야 하는데,
 * 뒤늦게 합류하는 사람은 그 링크를 못 받는 일이 많다. 이름으로 찾아 들어올 길을 연다.
 *
 * **찾는 것과 들어가는 것을 분리한다.** 검색 결과는 누구나 볼 수 있지만
 * (이름·인원·최근 활동), 멤버 명단과 정산 내역은 비밀번호를 통과해야 보인다.
 * 이름만 알면 누구나 찾을 수 있으니 검색 자체를 막으면 기능이 죽고,
 * 아무나 들어오게 두면 남의 술자리 금액이 노출된다.
 */
import { useMemo, useState } from 'react'
import type { GroupSearchResult } from '../types'
import { searchGroups } from '../mock'
import { Bar, Shell } from '../ui'

export function SearchGroupPage({
  onJoin, onBack,
}: {
  /** 비밀번호까지 맞은 뒤에만 불린다. */
  onJoin: (group: GroupSearchResult) => void
  onBack: () => void
}) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<GroupSearchResult | null>(null)
  const [pw, setPw] = useState('')
  const [wrong, setWrong] = useState(false)

  const results = useMemo(() => searchGroups(q), [q])
  const tooShort = q.trim().length > 0 && q.trim().length < 2

  // ── 2단계: 비밀번호 ─────────────────────────────
  if (picked) {
    return (
      <Shell narrow>
        <Bar title="모임 참가" onBack={() => { setPicked(null); setPw(''); setWrong(false) }} />

        <div className="js-card" style={{ marginTop: 4 }}>
          <div className="js-gtitle">
            <span className={`js-tag ${picked.groupType === 'FLASH' ? 'flash' : ''}`}>
              {picked.groupType === 'FLASH' ? '번개' : '주기'}
            </span>
            <b>{picked.name}</b>
          </div>
          <div className="gm">
            총무 <b className="own">{picked.ownerName}</b>
            <span className="sep">·</span>
            멤버 {picked.memberCount}명
          </div>
        </div>

        <div className="js-lab">참가 비밀번호</div>
        <input
          className="js-inp"
          type="password"
          value={pw}
          placeholder="총무에게 받은 비밀번호"
          onChange={(e) => { setPw(e.target.value); setWrong(false) }}
        />
        {wrong && (
          <div className="js-hint" style={{ color: 'var(--warn)' }}>
            비밀번호가 맞지 않습니다.
          </div>
        )}
        <div className="js-hint">
          모임 안에서는 <b>누가 얼마를 냈는지</b>가 다 보입니다. 그래서 비밀번호를 받습니다.
        </div>

        <button
          className="js-cta js-bottom"
          disabled={!pw.trim()}
          style={pw.trim() ? undefined : { opacity: 0.45 }}
          onClick={() => {
            // 목업 — 서버가 붙으면 POST /groups/{id}/join 이 판정한다.
            // 여기서 맞다/틀리다를 프론트가 정하면 안 된다. 지금은 흐름만 태운다.
            if (pw.trim() === '0000') { setWrong(true); return }
            onJoin(picked)
          }}
        >
          참가하기
        </button>
      </Shell>
    )
  }

  // ── 1단계: 검색 ─────────────────────────────────
  return (
    <Shell narrow>
      <Bar title="모임 찾기" onBack={onBack} />

      <input
        className="js-inp"
        style={{ marginTop: 4 }}
        value={q}
        placeholder="모임 이름으로 검색"
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {tooShort && <div className="js-hint">두 글자 이상 입력해주세요.</div>}

      {!q.trim() && (
        <div className="js-empty" style={{ marginTop: 24 }}>
          <div className="t">모임 이름을 아시나요?</div>
          <div className="s">
            총무에게 <b>정확한 모임 이름</b>을 물어보세요.
            <br />
            링크를 받았다면 그 링크로 바로 들어갈 수 있습니다.
          </div>
        </div>
      )}

      {q.trim().length >= 2 && results.length === 0 && (
        <div className="js-empty" style={{ marginTop: 24 }}>
          <div className="t">찾는 모임이 없어요</div>
          <div className="s">
            이름이 정확한지 확인해주세요. 모임 이름은 <b>띄어쓰기까지</b> 같아야 합니다.
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="js-lab">검색 결과 {results.length}개</div>
          <div className="js-glist">
            {results.map((g) => (
              <button key={g.id} className="js-gcard" onClick={() => setPicked(g)}>
                <div className="js-gtitle">
                  <span className={`js-tag ${g.groupType === 'FLASH' ? 'flash' : ''}`}>
                    {g.groupType === 'FLASH' ? '번개' : '주기'}
                  </span>
                  <b>{g.name}</b>
                </div>
                <div className="gm">
                  총무 <b className="own">{g.ownerName}</b>
                  <span className="sep">·</span>
                  멤버 {g.memberCount}명
                  <span className="sep">·</span>
                  {/* 죽은 모임인지 알려주는 단서. 이게 없으면 아무 데나 들어갔다 나온다. */}
                  {g.lastGatheringDate
                    ? `최근 ${g.lastGatheringDate.slice(5).replace('-', '/')}`
                    : '아직 술자리 없음'}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}

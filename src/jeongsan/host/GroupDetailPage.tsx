/**
 * 모임 상세 — 모임 하나를 열면 나오는 화면.
 *
 * **모임 안의 술자리 목록**이 본체다. 여기서 새 술자리를 만들거나 지난 정산을 다시 본다.
 *
 * 번개(FLASH)와 주기(RECURRING)가 다르게 동작한다
 *   주기  술자리를 계속 추가한다
 *   번개  술자리가 딱 하나. **"새 술자리" 버튼을 아예 보여주지 않는다** —
 *         눌러도 서버가 409 로 막을 버튼을 띄우면 사용자는 고장으로 받아들인다
 */
import type { GroupDetail } from '../types'
import { dateLabel } from '../api'
import { Bar, Shell } from '../ui'

function statusLabel(s: GroupDetail['gatherings'][number]['status']) {
  return s === 'COLLECTING'
    ? { text: '수집 중', cls: 'ok' as const }
    : { text: '확정됨', cls: 'done' as const }
}

export function GroupDetailPage({
  group, isOwner, onOpenGathering, onNewGathering, onInvite, onBack, gatheringInfo, onSelfJoin,
}: {
  group: GroupDetail
  isOwner: boolean
  onOpenGathering: (id: number) => void
  onNewGathering: () => void
  onInvite: () => void
  onBack: () => void
  /** 술자리별 총무와 내 참여 여부. 목록 API 에 없는 값이라 따로 넘긴다. */
  gatheringInfo?: (id: number) => { hostName: string; joined: boolean } | undefined
  /** 참여자가 스스로 정산에 들어간다. */
  onSelfJoin?: (gatheringId: number) => void
}) {
  const flash = group.groupType === 'FLASH'

  return (
    <Shell>
      <Bar title={group.name} onBack={onBack} step={flash ? '번개' : '주기'} />

      {/* 멤버 — 이름만 훑을 수 있으면 된다. 관리는 총무만. */}
      <div className="js-lab" style={{ marginTop: 4 }}>
        멤버 <span className="opt">· {group.members.length}명</span>
      </div>
      <div className="js-chips">
        {group.members.map((m) => (
          <span key={m.userId} className={`js-chip${m.role === 'OWNER' ? ' on' : ''}`}>
            {m.nickname}
            {m.role === 'OWNER' && ' · 총무'}
          </span>
        ))}
      </div>

      {isOwner && (
        <button className="js-cta2" style={{ marginTop: 10 }} onClick={onInvite}>
          초대 링크 복사
        </button>
      )}

      {/* 술자리 */}
      <div className="js-lab" style={{ marginTop: 20 }}>
        술자리 <span className="opt">· {group.gatherings.length}회</span>
      </div>

      {group.gatherings.length === 0 && (
        <div className="js-gempty">
          아직 술자리가 없습니다.
          <br />
          {isOwner ? <b>첫 술자리를 만들어보세요.</b> : '총무가 만들면 여기 보입니다.'}
        </div>
      )}

      <div className="js-glist">
        {group.gatherings.map((g) => {
          const st = statusLabel(g.status)
          const info = gatheringInfo?.(g.id)
          return (
            <button key={g.id} className="js-gcard" onClick={() => onOpenGathering(g.id)}>
              <div className="gh">
                <span className="gn">{g.name}</span>
                <span className={`js-tag ${st.cls}`}>{st.text}</span>
              </div>
              <div className="gm">
                {dateLabel(g.date)}
                {/* **총무는 술자리마다 다르다.** 모임 개설자가 아니라 이 자리를 맡은 사람이다 —
                    이번엔 내가, 다음엔 네가 계산하는 게 실제 모습이다. */}
                {info && (
                  <>
                    <span className="sep">·</span>
                    총무 <b className="own">{info.hostName}</b>
                  </>
                )}
                {info && !info.joined && g.status === 'COLLECTING' && (
                  <>
                    <span className="sep">·</span>
                    <span style={{ color: 'var(--acc-strong)', fontWeight: 800 }}>참여 안 함</span>
                  </>
                )}
              </div>
              {/* **총무가 명단을 짜지 않는다.** 참여자가 스스로 들어온다 —
                  총무가 고르게 하면 반드시 빠뜨린 사람이 생기고, 그 사람은 정산에서 누락된다. */}
              {info && !info.joined && g.status === 'COLLECTING' && onSelfJoin && (
                <span
                  className="js-mini"
                  style={{ marginTop: 8, display: 'inline-block' }}
                  onClick={(e) => { e.stopPropagation(); onSelfJoin(g.id) }}
                >
                  이 술자리 정산에 참여하기
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 번개는 술자리를 더 못 만든다 — 버튼 자체를 숨긴다 */}
      {isOwner && !flash && (
        <button className="js-add" style={{ marginTop: 10 }} onClick={onNewGathering}>
          + 새 술자리
        </button>
      )}

      {flash && (
        <div className="js-hint" style={{ marginTop: 12 }}>
          번개 모임은 <b>술자리 하나</b>로 끝납니다. 정산이 확정되고 <b>2주 뒤</b> 목록에서
          사라지지만, 결제 내역에는 남습니다.
        </div>
      )}
    </Shell>
  )
}

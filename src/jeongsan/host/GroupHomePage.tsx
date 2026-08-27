/**
 * H0 — 내 모임. 로그인하면 처음 나오는 화면.
 *
 * **총무인 모임과 참여자로 있는 모임을 갈라서 보여준다.** 둘은 할 수 있는 일이
 * 다르다 — 총무는 금액을 넣고 확정하지만, 참여자는 자기 체크만 한다.
 * 한 목록에 섞어두면 "여기서 뭘 할 수 있지"를 매번 다시 판단해야 한다.
 *
 * 용어 — **모임(Group)** 안에 **술자리(Gathering)** 가 들어간다.
 *   주기(RECURRING)  계속 만나는 고정 멤버. 술자리를 여러 개 담는다
 *   번개(FLASH)      1회성. 술자리 딱 하나. 정산 확정 +14일 뒤 목록에서 사라진다
 */
import type { GroupSummary } from '../types'
import { Bar, Shell } from '../ui'

function TypeBadge({ type }: { type: GroupSummary['groupType'] }) {
  const flash = type === 'FLASH'
  return (
    <span className={`js-gtype${flash ? ' flash' : ''}`}>
      {flash ? '번개' : '주기'}
    </span>
  )
}

function GroupCard({ g, onOpen }: { g: GroupSummary; onOpen: (id: number) => void }) {
  return (
    <button className="js-gcard" onClick={() => onOpen(g.id)}>
      <div className="gh">
        <TypeBadge type={g.groupType} />
        <span className="gn">{g.name}</span>
      </div>
      <div className="gm">
        {/* 참여 중인 모임에서는 **누가 총무인지**가 멤버 수보다 먼저 궁금하다 —
            뭘 물어보거나 돈을 보낼 상대이기 때문이다. */}
        {g.role === 'MEMBER' && (
          <>
            총무 <b className="own">{g.ownerName}</b>
            <span className="sep">·</span>
          </>
        )}
        멤버 {g.memberCount}명
        <span className="sep">·</span>
        {g.gatheringCount > 0 ? `술자리 ${g.gatheringCount}회` : '아직 술자리 없음'}
      </div>
    </button>
  )
}

export function GroupHomePage({
  groups, meName, onOpen, onCreate,
}: {
  groups: GroupSummary[]
  /** 로그인한 사람의 닉네임. mock 모드에서는 없다. */
  meName?: string
  onOpen: (id: number) => void
  onCreate: () => void
}) {
  const owned = groups.filter((g) => g.role === 'OWNER')
  const joined = groups.filter((g) => g.role === 'MEMBER')

  return (
    <Shell>
      <Bar title="내 모임" step={meName} />

      <button className="js-add" style={{ padding: 14, fontSize: 14 }} onClick={onCreate}>
        + 새 모임 만들기
      </button>

      {groups.length === 0 && (
        <div className="js-gempty">
          아직 모임이 없습니다.
          <br />
          <b>새 모임을 만들거나</b>, 총무가 보내준 링크로 들어오세요.
        </div>
      )}

      {owned.length > 0 && (
        <>
          <div className="js-gsec">
            내가 총무인 모임
            <span className="n">{owned.length}</span>
          </div>
          <div className="js-glist">
            {owned.map((g) => <GroupCard key={g.id} g={g} onOpen={onOpen} />)}
          </div>
        </>
      )}

      {joined.length > 0 && (
        <>
          <div className="js-gsec">
            참여 중인 모임
            <span className="n">{joined.length}</span>
          </div>
          <div className="js-glist">
            {joined.map((g) => <GroupCard key={g.id} g={g} onOpen={onOpen} />)}
          </div>
        </>
      )}
    </Shell>
  )
}

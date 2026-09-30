/**
 * H1 내 술자리 — docs/SCREENS.md §5. 로그인하면 가장 먼저 보이는 화면.
 *
 * 모임(Group)은 없다. 내가 참여한 술자리만 진행 중 / 완료로 나눠 보여주고, 각 줄에는
 * 그 방에서 "지금 할 일" 한 줄을 붙인다 — 목록에서 이미 무엇을 해야 하는지 보이게.
 */
import { HostCharacter } from '../character/HostCharacter'
import { levelOf, titleOf } from '../character/hostSprite'
import type { Gathering, Id, User } from './model'
import { daysUntilDelete } from './model'
import { myRooms } from './home'
import { nextAction } from './nextAction'

type Props = {
  me: User
  rooms: Gathering[]
  onOpen: (id: Id) => void
  onCreate: () => void
  /** 로그인 화면으로 돌아간다 — 첫 화면이라 돌아갈 곳은 로그인뿐이다 */
  onBack: () => void
}

export function HomePage({ me, rooms, onOpen, onCreate, onBack }: Props) {
  const { active, done } = myRooms(rooms, me.id)
  const neverHosted = me.spoonCount === 0 && !rooms.some((g) => g.hostUserId === me.id)

  return (
    <div className="js-shell js-home">
      <header className="js-rtop">
        <button className="js-back" onClick={onBack} aria-label="로그인 화면으로">‹</button>
        <div className="js-rtitle"><b>내 술자리</b></div>
      </header>

      <section className="js-mecard" aria-label="내 총무 캐릭터">
        <div className="js-meav"><HostCharacter spoons={me.spoonCount} px={3.2} /></div>
        <div className="js-mewho">
          <b>{me.displayName}</b>
          <span className={`js-spoonchip lv${levelOf(me.spoonCount)}`}>🥄 {me.spoonCount.toLocaleString('ko-KR')} · {titleOf(me.spoonCount)}</span>
          {neverHosted && <small>첫 정산을 만들어보세요. 총무를 할수록 캐릭터가 자라요</small>}
        </div>
      </section>

      <section aria-labelledby="h-active">
        <h2 id="h-active" className="js-lab">진행 중</h2>
        {active.length === 0 ? (
          <div className="js-homeempty">진행 중인 술자리가 없어요</div>
        ) : (
          <ul className="js-rlist">
            {active.map((g) => <RoomRow key={g.id} g={g} meId={me.id} onOpen={onOpen} />)}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="h-done">
          <h2 id="h-done" className="js-lab">완료</h2>
          <ul className="js-rlist done">
            {done.map((g) => <RoomRow key={g.id} g={g} meId={me.id} onOpen={onOpen} />)}
          </ul>
        </section>
      )}

      <div className="js-dock">
        <button className="js-cta" onClick={onCreate}>+ 새 술자리</button>
      </div>
    </div>
  )
}

function RoomRow({ g, meId, onOpen }: { g: Gathering; meId: Id; onOpen: (id: Id) => void }) {
  const isHost = g.hostUserId === meId
  const days = daysUntilDelete(g)
  const act = nextAction(g, meId)
  return (
    <li>
      <button className={`js-rrow ${act.tone}`} onClick={() => onOpen(g.id)}>
        <span className="top">
          <b>{g.title}</b>
          <span className={`js-role${isHost ? ' host' : ''}`}>{isHost ? '총무' : '참여'}</span>
          {g.status === 'COMPLETED' && <span className="js-badge done">완료</span>}
        </span>
        <span className="todo">{days !== null ? `${days}일 뒤 사라져요` : act.banner}</span>
      </button>
    </li>
  )
}

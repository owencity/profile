/**
 * H1 내 술자리 — docs/SCREENS.md §5. 로그인하면 가장 먼저 보이는 화면.
 *
 * 모임(Group)은 없다. 내가 들어간 술자리를 탭 세 개로 나눈다: [내가 총무] [참여 중] [완료].
 * 각 줄에는 그 방의 "지금 할 일" 한 줄을 붙여, 방에 들어가기 전에 무엇을 할지 보이게 한다.
 */
import { useState } from 'react'
import { HostCharacter } from '../character/HostCharacter'
import { levelOf, titleOf } from '../character/hostSprite'
import type { Gathering, Id, User } from './model'
import { daysUntilDelete, hostOf } from './model'
import type { HomeTab } from './home'
import { TAB_LABEL, initialTab, myRoomTabs, rowBadge, tabHasTodo } from './home'
import { nextAction } from './nextAction'
import { BackButton } from './BackButton'

type Props = {
  me: User
  rooms: Gathering[]
  onOpen: (id: Id) => void
  onCreate: () => void
  /** 로그인 화면으로 돌아간다 — 첫 화면이라 돌아갈 곳은 로그인뿐이다 */
  onBack: () => void
  /** 이 방의 정산금액을 이미 열어봤는가 — [정산금액 확인] 뱃지 기준 */
  paySeen: (roomId: Id) => boolean
  unread: number
  onOpenAlerts: () => void
  onEditAccount: () => void
}

const EMPTY: Record<HomeTab, string> = {
  HOSTING: '총무로 연 술자리가 없어요. 아래 [+ 새 술자리]로 시작해요',
  JOINED: '참여 중인 술자리가 없어요. 친구가 보낸 링크로 들어올 수 있어요',
  DONE: '완료된 술자리가 없어요. 완료되면 7일 동안 여기 남아요',
}

const TABS: HomeTab[] = ['HOSTING', 'JOINED', 'DONE']

export function HomePage({ me, rooms, onOpen, onCreate, onBack, paySeen, unread, onOpenAlerts, onEditAccount }: Props) {
  const tabs = myRoomTabs(rooms, me.id)
  const [tab, setTab] = useState<HomeTab>(() => initialTab(tabs, me.id))
  const neverHosted = me.spoonCount === 0 && !rooms.some((g) => g.hostUserId === me.id)
  const list = tabs[tab]

  return (
    <div className="js-shell js-home">
      <header className="js-rtop">
        <BackButton onClick={onBack} to="로그인 화면으로" />
        <div className="js-rtitle"><b>내 술자리</b></div>
        <button type="button" className="js-bell" onClick={onOpenAlerts} aria-label={`알림${unread ? ` ${unread}개 안 읽음` : ''}`}>
          🔔{unread > 0 && <span className="n">{unread}</span>}
        </button>
      </header>

      <section className="js-mecard" aria-label="내 총무 캐릭터">
        <div className="js-meav"><HostCharacter spoons={me.spoonCount} px={3.2} /></div>
        <div className="js-mewho">
          <b>{me.displayName}</b>
          <span className={`js-spoonchip lv${levelOf(me.spoonCount)}`}>🥄 {me.spoonCount.toLocaleString('ko-KR')} · {titleOf(me.spoonCount)}</span>
          {neverHosted && <small>첫 정산을 만들어보세요. 총무를 할수록 캐릭터가 자라요</small>}
          {/* 받을 계좌 — 결제자가 됐을 때 매번 묻지 않게 여기서 미리 넣고 바꾼다 */}
          <button type="button" className="js-acctline" onClick={onEditAccount}>
            {me.payout ? <>받을 계좌 <b>{me.payout.bank} {me.payout.accountNo}</b> · 바꾸기</> : <>받을 계좌 등록하기 ›</>}
          </button>
        </div>
      </section>

      <div className="js-tabs" role="tablist" aria-label="술자리 나누기">
        {TABS.map((t) => {
          const todo = t !== 'DONE' && tabHasTodo(tabs[t], me.id)
          return (
            <button
              key={t}
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls="home-panel"
              className={`js-tab${tab === t ? ' on' : ''}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABEL[t]} <span className="n">{tabs[t].length}</span>
              {todo && <i className="dot" aria-label="할 일 있음" />}
            </button>
          )
        })}
      </div>

      <section id="home-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {list.length === 0 ? (
          <div className="js-homeempty">{EMPTY[tab]}</div>
        ) : (
          <ul className={`js-rlist${tab === 'DONE' ? ' done' : ''}`}>
            {list.map((g) => <RoomRow key={g.id} g={g} meId={me.id} tab={tab} seen={paySeen(g.id)} onOpen={onOpen} />)}
          </ul>
        )}
      </section>

      <div className="js-dock">
        <button className="js-cta" onClick={onCreate}>+ 새 술자리</button>
      </div>
    </div>
  )
}

function RoomRow({ g, meId, tab, seen, onOpen }: { g: Gathering; meId: Id; tab: HomeTab; seen: boolean; onOpen: (id: Id) => void }) {
  const isHost = g.hostUserId === meId
  const days = daysUntilDelete(g)
  const act = nextAction(g, meId)
  const badge = rowBadge(g, meId, seen)
  return (
    <li>
      <button className={`js-rrow ${act.tone}`} onClick={() => onOpen(g.id)}>
        <span className="top">
          <b>{g.title}</b>
          {badge && <span className="js-newbadge">{badge}</span>}
          {/* 탭이 이미 역할을 말해주니, 역할이 섞이는 [완료]에서만 붙인다. [참여 중]엔 누가 총무인지 */}
          {tab === 'DONE' && <span className={`js-role${isHost ? ' host' : ''}`}>{isHost ? '총무' : '참여'}</span>}
          {tab === 'JOINED' && <span className="js-role">{hostOf(g).displayName} 총무</span>}
          {g.status === 'COMPLETED' && <span className="js-badge done">완료</span>}
        </span>
        <span className="todo">{days !== null ? `${days}일 뒤 사라져요` : act.banner}</span>
      </button>
    </li>
  )
}

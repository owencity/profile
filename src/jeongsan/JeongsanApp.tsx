/**
 * 정산어택 서브앱 진입점.
 *
 * 라우팅 (SPEC §3 · §8)
 *   /jungsan               H0 내 모임
 *   /jungsan/new           H1 모임 만들기
 *   /jungsan/:id/amount    H2 금액 입력
 *   /jungsan/:id/collect   H3 수집 현황
 *   /jungsan/:id/confirm   H3-b 확정 미리보기
 *   /jungsan/:id/roster    H5 명단
 *   /jungsan/:id/result    H4 결과·입금
 *
 *   /g/:token       ← 한 URL이 상태에 따라 분기한다
 *                     미참여+COLLECTING → W0-1/W0-2 · 미참여+CONFIRMED → W0-차단
 *                     참여+COLLECTING   → W1      · 참여+CONFIRMED    → W2
 *   /g/:token/all   W3 전체 내역
 *   /gr/:token      모임 참여 — 술자리가 아니라 **모임**의 멤버가 된다
 *   /jungsan/search        모임 검색해서 참가 (비밀번호)
 *   /jungsan/alerts        알림함
 *   /jungsan/dispute/:id   이의제기 채팅
 *
 * 백엔드가 붙기 전에는 mock 으로 돈다. 개발용 전환 바로 화면을 오갈 수 있다.
 */
import { useEffect, useMemo, useState } from 'react'
import './jeongsan.css'
import { fetchGathering, fetchGroup, fetchMe, fetchMyGroups, fetchPreview, isMock, kakaoLoginUrl } from './api'
import {
  makeDispute, makeGathering, makeGroup, makeToken, mockDisputes, mockGathering,
  mockGatherings, mockGroupDetails, mockGroups, mockNotifications, mockSettlement, MOCK_IDS,
} from './mock'
import type { AppNotification, Dispute, Gathering, GroupDetail, Id, Me, Settlement } from './types'
import { GroupHomePage } from './host/GroupHomePage'
import { CreateGroupPage } from './host/CreateGroupPage'
import { GroupDetailPage } from './host/GroupDetailPage'
import { CreatePage } from './host/CreatePage'
import { AmountPage } from './host/AmountPage'
import { DrinkInputPage } from './host/DrinkInputPage'
import { CollectPage } from './host/CollectPage'
import { ConfirmPage } from './host/ConfirmPage'
import { RosterPage } from './host/RosterPage'
import { ResultPage } from './host/ResultPage'
import { JoinPage } from './participant/JoinPage'
import { CheckPage } from './participant/CheckPage'
import { MyResultPage } from './participant/MyResultPage'
import { AllPage } from './participant/AllPage'
import { JoinGroupPage } from './participant/JoinGroupPage'
import { SearchGroupPage } from './participant/SearchGroupPage'
import { DisputePage } from './DisputePage'
import { NotificationPage } from './NotificationPage'
import { LoginPage } from './LoginPage'
import { PixelCitySky } from './PixelCitySky'
import { SideStreet } from './SideStreet'

type Props = {
  /** 현재 경로. 포트폴리오 App.tsx 가 넘긴다. */
  route: string
  navigate: (to: string) => void
}

export default function JeongsanApp({ route, navigate }: Props) {
  const [s, setS] = useState<Settlement>(mockSettlement)
  const [groups, setGroups] = useState(mockGroups)

  // 목업이지만 **만든 것이 남아야** 흐름을 끝까지 걸을 수 있다. 그래서 단일 값이 아니라
  // id 로 찾는 보관함으로 둔다 — 예전엔 술자리를 무엇을 열든 mockGathering 하나가
  // 나와서, 모임 상세의 술자리 3개가 전부 같은 화면이었다.
  const [groupDetails, setGroupDetails] = useState<Record<number, GroupDetail>>(mockGroupDetails)
  const [gatherings, setGatherings] = useState<Record<number, Gathering>>(mockGatherings)

  // 지금 보고 있는 술자리. 라우트의 id 로 고르고, 없으면 목업 기본값으로 떨어진다.
  const [currentGid, setCurrentGid] = useState<Id>(1)
  const g = gatherings[currentGid] ?? mockGathering
  const setG = (next: Gathering) => setGatherings((m) => ({ ...m, [next.id]: next }))

  // 이의제기와 알림. 목업이라도 **주고받은 게 남아야** 조율 흐름을 걸어볼 수 있다.
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes)
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications)

  // 방금 연 모임. 술자리를 만들 때 "어느 모임에 넣을지" 알아야 한다.
  const [currentGroupId, setCurrentGroupId] = useState<number>(100)
  const groupDetail = groupDetails[currentGroupId] ?? mockGroupDetails[100]

  // 개발용 — 어떤 참여자 시점으로 볼지, 그리고 상태를 강제로 바꿔본다
  const [asId, setAsId] = useState<Id>(MOCK_IDS.재훈)
  const [joined, setJoined] = useState(true)
  // 로그인 상태. mock 모드에서는 개발용 전환 바로 껐다 켠다.
  const [loggedIn, setLoggedIn] = useState(false)
  // 로그인한 사용자. 아래 `me`(목업 참여자)와 다른 개념이라 이름을 나눈다.
  const [authUser, setAuthUser] = useState<Me | null>(null)

  // 탭 제목·파비콘을 포트폴리오("김동규 | Backend Developer")가 아니라
  // 정산어택으로 바꾼다. index.html 은 두 서브앱이 공유하는 정적 파일이라
  // 여기서 CSR 로 덮어써야 한다. 독립 배포(jungsan.devkdk.com)에서도
  // JeongsanApp 이 항상 떠 있으니 그대로 적용된다.
  useEffect(() => {
    const prevTitle = document.title
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const prevIconHref = iconLink?.href

    document.title = '정산어택'
    if (iconLink) iconLink.href = '/jeongsan-icon.svg'

    return () => {
      document.title = prevTitle
      if (iconLink && prevIconHref) iconLink.href = prevIconHref
    }
  }, [])

  // 로그인 상태를 **서버에 물어본다.** 쿠키가 httpOnly 라 JS 로는 읽을 수 없어서
  // 프론트가 스스로 알 방법이 없다 — 이게 없으면 쿠키가 살아 있어도 새로고침할
  // 때마다 로그인 화면이 뜬다.
  useEffect(() => {
    if (isMock()) return
    void fetchMe().then((user) => {
      if (!user) return
      setAuthUser(user)
      setLoggedIn(true)
      void fetchMyGroups().then(setGroups).catch(() => {})
    })
  }, [])

  // 모임 상세 — /jungsan/group/:id 로 들어오면 그 모임을 읽는다.
  useEffect(() => {
    const m = route.match(/^\/jungsan\/group\/(\d+)$/)
    if (!m) return
    const id = Number(m[1])
    setCurrentGroupId(id)
    if (isMock()) return   // 목업은 이미 보관함에 있다
    void fetchGroup(id).then((d) => setGroupDetails((s) => ({ ...s, [id]: d }))).catch(() => {})
  }, [route])

  useEffect(() => {
    const m = route.match(/^\/jungsan\/(\d+)\//)
    if (!m) return
    const id = Number(m[1])
    setCurrentGid(id)          // 목업에서도 **어느 술자리인지**를 반영해야 한다
    if (isMock()) return
    void fetchGathering(id).then((x) => setGatherings((s) => ({ ...s, [id]: x }))).catch(() => {})
    void fetchPreview(id).then(setS).catch(() => {})
  }, [route])

  const me = useMemo(() => g.participants.find((p) => p.id === asId), [g, asId])
  const token = g.shareToken

  const dev = (
    <div className="js-dev">
      <span>mock</span>
      {g.participants.map((p) => (
        <button key={p.id} className={p.id === asId ? 'on' : ''} onClick={() => setAsId(p.id)}>
          {p.name}
        </button>
      ))}
      <button
        className={g.status === 'CONFIRMED' ? 'on' : ''}
        onClick={() =>
          setG({ ...g, status: g.status === 'CONFIRMED' ? 'COLLECTING' : 'CONFIRMED' })
        }
      >
        {g.status === 'CONFIRMED' ? '확정됨' : '수집중'}
      </button>
      <button className={joined ? 'on' : ''} onClick={() => setJoined(!joined)}>
        {joined ? '참여함' : '미참여'}
      </button>
      <button className={loggedIn ? 'on' : ''} onClick={() => setLoggedIn(!loggedIn)}>
        {loggedIn ? '로그인' : '로그아웃'}
      </button>
    </div>
  )

  /**
   * 이의제기를 걸고 그 채팅방으로 보낸다.
   * **거는 순간 방이 열린다** — 사유가 곧 첫 메시지라 따로 또 쓰게 하지 않는다.
   */
  const openDispute = (v: {
    against: Id
    againstName: string
    kind: Dispute['kind']
    reason: string
  }) => {
    const meUserId = authUser?.id ?? MOCK_IDS.동규
    const d = makeDispute({
      gatheringId: g.id,
      kind: v.kind,
      raisedBy: meUserId,
      raisedByName: g.participants.find((p) => p.userId === meUserId)?.name ?? '나',
      against: v.against,
      reason: v.reason,
    })
    setDisputes((prev) => [d, ...prev])
    // 걸린 사람에게 알림이 간다. 방만 열어두고 안 알리면 아무도 안 들어온다.
    setNotifications((prev) => [{
      id: Date.now(),
      kind: 'DISPUTE_OPENED',
      title: '확인 요청이 왔어요',
      body: `${g.name} · ${v.reason}`,
      createdAt: new Date().toISOString(),
      read: false,
      link: `/jungsan/dispute/${d.id}`,
    }, ...prev])
    navigate(`/jungsan/dispute/${d.id}`)
  }

  // 화면 공통 껍데기. rootClass 는 화면별 변형이 필요할 때만 쓴다.
  //
  // **로그인 화면만 도트 도시를 화면 전체 배경으로 쓴다(js-login-mode).**
  // 나머지 화면은 배경을 깔지 않는다 — 목록·금액이 안 읽힌다. 거기서의 8비트 느낌은
  // 배경이 아니라 화면 요소 자체(각진 모서리·굵은 선·솔리드 그림자)로 낸다.
  //
  // PixelCitySky 를 .js-shell "안"이 아니라 .js-root 의 형제로 둔다 — 안에 두면
  // 카드 크기에 갇혀서 화면 전체를 못 덮는다.
  const wrap = (node: React.ReactNode, rootClass = '') => (
    <div className={`js-root ${rootClass}`.trim()}>
      {rootClass.includes('js-login-mode') && <PixelCitySky />}
      {/* 좌우 여백 배경. 넓은 화면에서만, 그리고 로그인 화면이 아닐 때만(CSS 가 결정). */}
      <SideStreet />
      {/* import.meta.env.DEV 로 가린다. isMock() 은 "백엔드가 아직 없다"일 뿐이고
          지금 jungsan.devkdk.com 배포도 백엔드가 없어 isMock() 이 true 다 —
          그걸로 가리면 실서비스에도 이 바가 그대로 떴다(실제로 떴었다).
          DEV 는 `vite build`(Vercel 이 만드는 것) 에서는 항상 false 다. */}
      {import.meta.env.DEV && dev}
      {node}
    </div>
  )

  // ── 알림함 ───────────────────────────────────
  // **정산은 금액이 나왔다고 끝이 아니라 입금까지 돼야 끝난다.**
  // 그래서 알림이 한 번으로 안 끝나고, 볼 곳이 따로 필요하다.
  if (route === '/jungsan/alerts') {
    return wrap(
      <NotificationPage
        items={notifications}
        onReadAll={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onOpen={(n) => {
          setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
          navigate(n.link)
        }}
        onBack={() => navigate('/jungsan')}
      />,
    )
  }

  // ── 이의제기 채팅 ─────────────────────────────
  const disputeRoute = route.match(/^\/jungsan\/dispute\/(\d+)$/)
  if (disputeRoute) {
    const did = Number(disputeRoute[1])
    const d = disputes.find((x) => x.id === did)
    if (d) {
      const meUserId = authUser?.id ?? MOCK_IDS.동규
      const otherId = d.raisedBy === meUserId ? d.against : d.raisedBy
      const other = g.participants.find((p) => p.userId === otherId)
      return wrap(
        <DisputePage
          dispute={d}
          meId={meUserId}
          counterpartName={other?.name ?? '상대방'}
          onSend={(text) =>
            setDisputes((prev) => prev.map((x) =>
              x.id !== did ? x : {
                ...x,
                messages: [...x.messages, {
                  id: Date.now(),
                  senderId: meUserId,
                  senderName: g.participants.find((p) => p.userId === meUserId)?.name ?? '나',
                  text,
                  createdAt: new Date().toISOString(),
                }],
              }))
          }
          onResolve={() =>
            setDisputes((prev) => prev.map((x) =>
              x.id === did ? { ...x, status: 'RESOLVED' } : x))
          }
          onBack={() => navigate(`/jungsan/${d.gatheringId}/result`)}
        />,
      )
    }
  }

  // ── 모임 검색해서 참가 ────────────────────────
  // 링크와 나란히 있는 **두 번째 입구**다. 뒤늦게 합류하는 사람은 링크를 못 받는다.
  if (route === '/jungsan/search') {
    return wrap(
      <SearchGroupPage
        onJoin={(found) => {
          // 목업 — 서버가 붙으면 POST /groups/{id}/join 응답으로 상세를 받는다.
          const detail: GroupDetail = {
            id: found.id, name: found.name, groupType: found.groupType,
            shareToken: null, hasPassword: true,
            members: [
              { userId: 900, nickname: found.ownerName, role: 'OWNER' },
              { userId: authUser?.id ?? 1, nickname: authUser?.nickname ?? '동규', role: 'MEMBER' },
            ],
            gatherings: [],
          }
          setGroupDetails((prev) => ({ ...prev, [found.id]: detail }))
          setGroups((prev) => [{
            id: found.id, name: found.name, groupType: found.groupType,
            role: 'MEMBER', ownerName: found.ownerName,
            memberCount: found.memberCount + 1, gatheringCount: 0,
          }, ...prev])
          navigate(`/jungsan/group/${found.id}`)
        }}
        onBack={() => navigate('/jungsan')}
      />,
    )
  }

  // ── 모임 참여 (/gr/{token}) ───────────────────
  // **술자리 참여(/g/)와 다른 화면이다.** 저쪽은 "이번 정산에 낄게",
  // 이쪽은 "이 모임의 멤버가 될게"다 — API.md §3-b.4.
  const groupInvite = route.match(/^\/gr\/([^/]+)$/)
  if (groupInvite) {
    const inviteToken = groupInvite[1]
    const target = Object.values(groupDetails).find((d) => d.shareToken === inviteToken)
    if (target) {
      return wrap(
        <JoinGroupPage
          group={target}
          onJoin={(name) => {
            // 목업이라도 멤버가 실제로 늘어야 총무 화면에서 확인할 수 있다.
            const userId = Date.now() % 100000
            setGroupDetails((prev) => ({
              ...prev,
              [target.id]: {
                ...prev[target.id],
                members: [...prev[target.id].members, { userId, nickname: name, role: 'MEMBER' }],
              },
            }))
            setGroups((prev) => prev.map((x) =>
              x.id === target.id ? { ...x, memberCount: x.memberCount + 1 } : x))
          }}
          onOpenGathering={(gid) => {
            const target2 = gatherings[gid]
            if (target2) navigate(`/g/${target2.shareToken}`)
          }}
        />,
      )
    }
  }

  // ── 참여자 웹 ────────────────────────────────
  const share = route.match(/^\/g\/([^/]+)(\/all)?$/)
  if (share) {
    const isAll = Boolean(share[2])
    if (isAll) {
      return wrap(<AllPage g={g} s={s} onBack={() => navigate(`/g/${token}`)} />)
    }
    if (!joined) {
      return wrap(
        <JoinPage
          g={g}
          onJoined={() => setJoined(true)}
          onViewAll={() => navigate(`/g/${token}/all`)}
        />,
      )
    }
    if (g.status === 'COLLECTING') {
      return wrap(
        <CheckPage
          g={g}
          me={me!}
          onSubmit={() => {
            // 제출하면 **응답 완료로 바뀌어야** 총무의 수집 현황에 반영된다.
            setG({
              ...g,
              participants: g.participants.map((p) =>
                p.id === asId ? { ...p, responded: true } : p),
            })
          }}
        />,
      )
    }
    return wrap(
      <MyResultPage
        g={g}
        me={me!}
        s={s}
        onViewAll={() => navigate(`/g/${token}/all`)}
        onDispute={() =>
          openDispute({
            against: g.hostUserId,
            againstName: g.hostName,
            kind: 'AMOUNT',
            reason: `제 금액이 맞는지 확인 부탁드려요.`,
          })
        }
      />,
    )
  }

  // ── 주최자 앱 ────────────────────────────────
  // 주최자도 로그인해야 한다. 참여자 경로(/g/)는 JoinPage 가 자체적으로 로그인을 받는다.
  if (!loggedIn) {
    return wrap(
      <LoginPage
        onLogin={() => {
          // mock 모드에는 백엔드가 없다 — 화면 확인용으로 상태만 켠다.
          if (isMock()) { setLoggedIn(true); return }
          // 실제 흐름: 서버가 카카오 인가 화면으로 302 시킨다(API.md §2.1).
          window.location.href = kakaoLoginUrl()
        }}
      />,
      'js-login-mode',
    )
  }

  // 모임 만들기 — 번개/주기를 먼저 고른다.
  if (route === '/jungsan/new') {
    return wrap(
      <CreateGroupPage
        onCreate={(v) => {
          // 목업이라도 **만든 모임이 실제로 남아야** 한다 — 그래야 목록으로 돌아왔을 때
          // 방금 만든 게 보이고 흐름이 이어진다. 서버가 붙으면 POST 응답이 이 자리를 대신한다.
          const { summary, detail, gathering } = makeGroup({
            name: v.name,
            groupType: v.groupType,
            ownerName: authUser?.nickname ?? '동규',
            gatheringDate: v.gatheringDate,
            expectedCount: v.expectedCount,
          })
          setGroups((prev) => [summary, ...prev])
          setGroupDetails((prev) => ({ ...prev, [detail.id]: detail }))
          // 번개면 술자리도 같이 생긴다(FLASH 는 딱 하나) — 보관함에 함께 넣는다.
          if (gathering) setGatherings((prev) => ({ ...prev, [gathering.id]: gathering }))
          navigate(`/jungsan/group/${detail.id}`)
        }}
        onBack={() => navigate('/jungsan')}
      />,
    )
  }

  // 모임 상세 — 그 안의 술자리 목록
  const groupRoute = route.match(/^\/jungsan\/group\/(\d+)$/)
  if (groupRoute) {
    const gid = Number(groupRoute[1])
    const summary = groups.find((x) => x.id === gid)
    return wrap(
      <GroupDetailPage
        group={groupDetail}
        isOwner={summary ? summary.role === 'OWNER' : true}
        onOpenGathering={(id) => navigate(`/jungsan/${id}/collect`)}
        onNewGathering={() => navigate('/jungsan/gathering/new')}
        gatheringInfo={(gid) => {
          const gt = gatherings[gid]
          if (!gt) return undefined
          const meUserId = authUser?.id ?? MOCK_IDS.동규
          return {
            hostName: gt.hostName,
            joined: gt.participants.some((p) => p.userId === meUserId),
          }
        }}
        onSelfJoin={(gid) => {
          const gt = gatherings[gid]
          if (!gt) return
          const meUserId = authUser?.id ?? MOCK_IDS.동규
          const myName = authUser?.nickname ?? '동규'
          setGatherings((prev) => ({
            ...prev,
            [gid]: {
              ...gt,
              participants: [...gt.participants, {
                id: Date.now() % 100000,
                userId: meUserId,
                name: myName,
                // **스스로 들어왔다.** 총무가 부른 게 아니다.
                joinMode: 'SELF',
                exempt: false, responded: false,
                paymentStatus: 'NONE', paidAmount: null,
                isHost: false, provider: 'kakao',
              }],
            },
          }))
          navigate(`/g/${gt.shareToken}`)
        }}
        onInvite={() => {
          // 목업에선 링크를 복사해도 확인할 길이 없다. 참여자가 보는 화면으로 직접 넘어가
          // 흐름을 이어서 걸을 수 있게 한다.
          const t = groupDetail.shareToken
          if (t) navigate(`/gr/${t}`)
        }}
        onBack={() => navigate('/jungsan')}
      />,
    )
  }

  // 술자리 만들기 (모임 안에서)
  if (route === '/jungsan/gathering/new') {
    return wrap(
      <CreatePage
        onNext={(v) => {
          // 새 술자리를 **지금 보고 있는 모임 안에** 넣는다. 예전엔 무엇을 만들든
          // /jungsan/1/amount 로 점프해서, 만든 것과 다음 화면이 아무 상관이 없었다.
          const created = makeGathering({
            name: v.name, date: v.date, hostName: v.myName,
            expectedCount: v.expectedCount,
            payout: { bankName: v.bank, accountNo: v.account, accountHolder: v.myName },
          })
          setGatherings((prev) => ({ ...prev, [created.id]: created }))
          setGroupDetails((prev) => {
            const gd = prev[currentGroupId]
            if (!gd) return prev
            return {
              ...prev,
              [currentGroupId]: {
                ...gd,
                gatherings: [
                  { id: created.id, name: created.name, date: created.date, status: created.status },
                  ...gd.gatherings,
                ],
              },
            }
          })
          setGroups((prev) => prev.map((x) =>
            x.id === currentGroupId ? { ...x, gatheringCount: x.gatheringCount + 1 } : x))
          navigate(`/jungsan/${created.id}/amount`)
        }}
        onBack={() => navigate(`/jungsan/group/${currentGroupId}`)}
      />,
    )
  }

  // 차수별 술 입력 — 총무가 영수증 보고 종류·병수·단가를 적는다
  const drinkRoute = route.match(/^\/jungsan\/(\d+)\/drink\/(\d+)$/)
  if (drinkRoute) {
    const gid = Number(drinkRoute[1])
    const rid = Number(drinkRoute[2])
    const target = gatherings[gid] ?? g
    const round = target.rounds.find((r) => r.id === rid)
    if (round) {
      return wrap(
        <DrinkInputPage
          roundLabel={round.label}
          total={round.total}
          initial={round.drinkItems ?? []}
          onSave={(items) => {
            // 술값 합계가 곧 그 차수의 alcohol 이다 — CALC_RULES 가 정한 규칙이라
            // 프론트가 따로 계산하지 않고 합계만 넘긴다.
            const alcohol = items.reduce((n, d) => n + d.bottleCount * d.unitPrice, 0)
            setGatherings((prev) => ({
              ...prev,
              [gid]: {
                ...target,
                rounds: target.rounds.map((r) =>
                  r.id === rid ? { ...r, drinkItems: items, alcohol } : r),
              },
            }))
            navigate(`/jungsan/${gid}/amount`)
          }}
          onBack={() => navigate(`/jungsan/${gid}/amount`)}
        />,
      )
    }
  }

  const host = route.match(/^\/jungsan\/(\d+)\/(\w+)$/)
  if (host) {
    const id = host[1]
    const page = host[2]
    const back = () => navigate(`/jungsan/${id}/collect`)
    switch (page) {
      case 'amount':
        return wrap(
          <AmountPage
            g={g}
            onNext={() => navigate(`/jungsan/${id}/collect`)}
            onBack={() => navigate('/jungsan')}
            onEditDrinks={(rid) => navigate(`/jungsan/${id}/drink/${rid}`)}
          />,
        )
      case 'collect':
        return wrap(
          <CollectPage
            g={g}
            onConfirm={() => navigate(`/jungsan/${id}/confirm`)}
            onRoster={() => navigate(`/jungsan/${id}/roster`)}
            onShare={() => navigate(`/g/${g.shareToken}`)}
            onBack={() => navigate('/jungsan')}
          />,
        )
      case 'confirm':
        return wrap(
          <ConfirmPage
            g={g}
            s={s}
            onAccept={() => {
              setG({ ...g, status: 'CONFIRMED' })
              navigate(`/jungsan/${id}/result`)
            }}
            onRoster={() => navigate(`/jungsan/${id}/roster`)}
            onShare={() => navigate(`/g/${g.shareToken}`)}
            onBack={back}
          />,
        )
      case 'roster':
        return wrap(
          <RosterPage
            g={g}
            onBack={back}
            onReissue={() => {
              // 링크를 새로 뽑으면 예전 링크는 죽어야 한다 — 그게 재발급의 목적이다.
              setG({ ...g, shareToken: makeToken() })
            }}
          />,
        )
      case 'result':
        return wrap(
          <ResultPage
            g={g}
            s={s}
            joinRequest="지원"
            onReopen={() => {
              setG({ ...g, status: 'COLLECTING' })
              navigate(`/jungsan/${id}/collect`)
            }}
            onBack={() => navigate('/jungsan')}
            onShare={() => navigate(`/g/${g.shareToken}`)}
            onRemind={() => {
              // 미입금자에게 재촉 알림. 정산은 입금까지 돼야 끝난다.
              const owing = g.participants.filter((p) => p.paymentStatus !== 'RECEIVED' && !p.isHost)
              setNotifications((prev) => [{
                id: Date.now(),
                kind: 'PAYMENT_REMINDER',
                title: '아직 입금이 안 됐어요',
                body: `${g.name} · ${owing.length}명에게 알림을 보냈습니다`,
                createdAt: new Date().toISOString(),
                read: false,
                link: `/jungsan/${g.id}/result`,
              }, ...prev])
            }}
            onDispute={(pid, name) => {
              const p = g.participants.find((x) => x.id === pid)
              openDispute({
                against: p?.userId ?? pid,
                againstName: name,
                kind: 'PAYMENT',
                reason: `${name}님, 입금이 아직 확인되지 않았습니다. 확인 부탁드려요.`,
              })
            }}
          />,
        )
    }
  }

  // ── H0 (기본) — 모임 목록. 술자리가 아니라 **모임**이 첫 화면이다.
  //    모임을 열면 그 안의 술자리 목록으로 들어간다(다음 작업).
  return wrap(
    <GroupHomePage
      groups={groups}
      meName={authUser?.nickname}
      unread={notifications.filter((n) => !n.read).length}
      onOpen={(id) => navigate(`/jungsan/group/${id}`)}
      onCreate={() => navigate('/jungsan/new')}
      onSearch={() => navigate('/jungsan/search')}
      onAlerts={() => navigate('/jungsan/alerts')}
    />,
  )
}

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
 *
 * 백엔드가 붙기 전에는 mock 으로 돈다. 개발용 전환 바로 화면을 오갈 수 있다.
 */
import { useEffect, useMemo, useState } from 'react'
import './jeongsan.css'
import { fetchGathering, fetchGroup, fetchMe, fetchMyGroups, fetchPreview, isMock, kakaoLoginUrl } from './api'
import { mockGathering, mockGroupDetails, mockGroups, mockSettlement, MOCK_IDS } from './mock'
import type { Gathering, Id, Me, Settlement } from './types'
import { GroupHomePage } from './host/GroupHomePage'
import { CreateGroupPage } from './host/CreateGroupPage'
import { GroupDetailPage } from './host/GroupDetailPage'
import { CreatePage } from './host/CreatePage'
import { AmountPage } from './host/AmountPage'
import { CollectPage } from './host/CollectPage'
import { ConfirmPage } from './host/ConfirmPage'
import { RosterPage } from './host/RosterPage'
import { ResultPage } from './host/ResultPage'
import { JoinPage } from './participant/JoinPage'
import { CheckPage } from './participant/CheckPage'
import { MyResultPage } from './participant/MyResultPage'
import { AllPage } from './participant/AllPage'
import { LoginPage } from './LoginPage'
import { SideStreet } from './SideStreet'

type Props = {
  /** 현재 경로. 포트폴리오 App.tsx 가 넘긴다. */
  route: string
  navigate: (to: string) => void
}

export default function JeongsanApp({ route, navigate }: Props) {
  const [g, setG] = useState<Gathering>(mockGathering)
  const [s, setS] = useState<Settlement>(mockSettlement)
  const [groups, setGroups] = useState(mockGroups)
  const [groupDetail, setGroupDetail] = useState(mockGroupDetails[100])

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
    if (isMock()) {
      setGroupDetail(mockGroupDetails[id] ?? mockGroupDetails[100])
      return
    }
    void fetchGroup(id).then(setGroupDetail).catch(() => {})
  }, [route])

  useEffect(() => {
    if (isMock()) return
    const m = route.match(/^\/jungsan\/(\d+)/)
    if (!m) return
    const id = Number(m[1])
    void fetchGathering(id).then(setG).catch(() => {})
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

  // 화면 공통 껍데기. rootClass 는 화면별 변형이 필요할 때만 쓴다.
  //
  // 캔버스 도트 배경(PixelCitySky·PixelNightAlley)은 **떼어냈다.** 배경이 화려하면
  // 목록·금액 같은 정보가 안 읽힌다. 8비트 느낌은 배경이 아니라 **화면 요소 자체**
  // (각진 모서리·굵은 선·솔리드 그림자)로 낸다. 렌더러 파일은 남겨뒀다.
  const wrap = (node: React.ReactNode, rootClass = '') => (
    <div className={`js-root ${rootClass}`.trim()}>
      {/* 좌우 여백 배경. 넓은 화면에서만 보인다(CSS 가 결정). */}
      <SideStreet />
      {/* import.meta.env.DEV 로 가린다. isMock() 은 "백엔드가 아직 없다"일 뿐이고
          지금 jungsan.devkdk.com 배포도 백엔드가 없어 isMock() 이 true 다 —
          그걸로 가리면 실서비스에도 이 바가 그대로 떴다(실제로 떴었다).
          DEV 는 `vite build`(Vercel 이 만드는 것) 에서는 항상 false 다. */}
      {import.meta.env.DEV && dev}
      {node}
    </div>
  )

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
      return wrap(<CheckPage g={g} me={me!} onSubmit={() => alert('제출 완료 (mock)')} />)
    }
    return wrap(
      <MyResultPage g={g} me={me!} s={s} onViewAll={() => navigate(`/g/${token}/all`)} />,
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
    )
  }

  // 모임 만들기 — 번개/주기를 먼저 고른다.
  if (route === '/jungsan/new') {
    return wrap(
      <CreateGroupPage
        onCreate={(v) => {
          // TODO 서버 연동: POST /api/v1/groups → 응답의 id 로 이동한다.
          //      지금은 목업이라 첫 모임 상세로 보낸다.
          alert(`모임 생성 (mock)
${v.groupType} · ${v.name}`)
          navigate('/jungsan/group/100')
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
        onInvite={() => alert('초대 링크 복사 (mock)')}
        onBack={() => navigate('/jungsan')}
      />,
    )
  }

  // 술자리 만들기 (모임 안에서)
  if (route === '/jungsan/gathering/new') {
    return wrap(<CreatePage onNext={() => navigate('/jungsan/1/amount')} onBack={() => navigate('/jungsan')} />)
  }

  const host = route.match(/^\/jungsan\/(\d+)\/(\w+)$/)
  if (host) {
    const id = host[1]
    const page = host[2]
    const back = () => navigate(`/jungsan/${id}/collect`)
    switch (page) {
      case 'amount':
        return wrap(
          <AmountPage g={g} onNext={() => navigate(`/jungsan/${id}/collect`)} onBack={() => navigate('/jungsan')} />,
        )
      case 'collect':
        return wrap(
          <CollectPage
            g={g}
            onConfirm={() => navigate(`/jungsan/${id}/confirm`)}
            onRoster={() => navigate(`/jungsan/${id}/roster`)}
            onShare={() => alert('카카오톡 공유 (mock)')}
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
            onShare={() => alert('카카오톡 공유 (mock)')}
            onBack={back}
          />,
        )
      case 'roster':
        return wrap(<RosterPage g={g} onBack={back} onReissue={() => alert('링크 재발급 (mock)')} />)
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
            onShare={() => alert('카카오톡 공유 (mock)')}
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
      onOpen={(id) => navigate(`/jungsan/group/${id}`)}
      onCreate={() => navigate('/jungsan/new')}
    />,
  )
}

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
import { fetchGathering, fetchMyGatherings, fetchPreview, isMock } from './api'
import { mockGathering, mockSettlement, mockSummaries, MOCK_IDS } from './mock'
import type { Gathering, Id, Settlement } from './types'
import { HomePage } from './host/HomePage'
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
import { PixelCitySky } from './PixelCitySky'

type Props = {
  /** 현재 경로. 포트폴리오 App.tsx 가 넘긴다. */
  route: string
  navigate: (to: string) => void
}

export default function JeongsanApp({ route, navigate }: Props) {
  const [g, setG] = useState<Gathering>(mockGathering)
  const [s, setS] = useState<Settlement>(mockSettlement)
  const [summaries, setSummaries] = useState(mockSummaries)

  // 개발용 — 어떤 참여자 시점으로 볼지, 그리고 상태를 강제로 바꿔본다
  const [asId, setAsId] = useState<Id>(MOCK_IDS.재훈)
  const [joined, setJoined] = useState(true)
  // 주최자 로그인 상태. 실제로는 useAuthStore 의 user 유무로 판단한다.
  const [loggedIn, setLoggedIn] = useState(false)

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

  useEffect(() => {
    if (isMock()) return
    void fetchMyGatherings().then(setSummaries).catch(() => {})
  }, [])

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

  // 로그인 화면만 도트 도시를 화면 전체 배경으로 쓴다(js-login-mode).
  // 다른 화면(H0~W3)의 .js-shell(흰 배경)은 이 클래스가 없어 그대로다.
  //
  // PixelCitySky 를 .js-shell "안"이 아니라 .js-root 의 형제로 둔다 — 안에 두면
  // z-index 스택 규칙상(포지션 없는 일반 흐름 자식이 z-index:0 포지션 자식보다
  // 나중에 칠해진다) 아래 기능 카드들을 도시 배경이 덮어버린다. 형제로 빼야
  // .js-shell 의 backdrop-filter 도 실제로 이 배경을 흐리게 비칠 대상이 생긴다.
  const wrap = (node: React.ReactNode, rootClass = '') => (
    <div className={`js-root ${rootClass}`.trim()}>
      {rootClass.includes('js-login-mode') && <PixelCitySky />}
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
    return wrap(<LoginPage onLogin={() => setLoggedIn(true)} />, 'js-login-mode')
  }

  if (route === '/jungsan/new') {
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

  // ── H0 (기본)
  return wrap(
    <HomePage
      list={summaries}
      onOpen={(id) => navigate(`/jungsan/${id}/${g.status === 'CONFIRMED' ? 'result' : 'collect'}`)}
      onCreate={() => navigate('/jungsan/new')}
    />,
  )
}

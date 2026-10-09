/**
 * 정산어택 진입점 — 로그인 확인과 v3 라우터 연결만 한다.
 *
 * v2(모임) 화면은 2026-10-04에 지웠다(제품 v3: 일회용 술자리, 모임 없음). 화면 라우팅은 전부 `v3/AppV3`가 맡는다.
 * 옛 주소(`/g/{token}`, `/jungsan/group/…`, `/jungsan/alerts` 등)로 들어오면 첫 화면으로 보낸다.
 */
import { useEffect, useState } from 'react'
import './jeongsan.css'
import { api, isApiMode } from './v3/api'
import { gateway } from './v3/gateway'
import { LoginPage } from './LoginPage'
import { PixelCitySky } from './PixelCitySky'
import { SideStreet } from './SideStreet'
import { AppV3 } from './v3/AppV3'
import { isV3JoinRoute, isV3PublicRoute, isV3Route } from './v3/routes'
import { PrivacyPage, SupportPage } from './v3/PrivacyPage'

type Props = {
  /** 현재 경로. 포트폴리오 App.tsx 가 넘긴다. */
  route: string
  navigate: (to: string) => void
}

export default function JeongsanApp({ route, navigate }: Props) {
  // 로그인 상태. mock 모드에서는 로그인 버튼이 상태만 켠다.
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

  // 로그인 상태를 **서버에 물어본다.** 쿠키가 httpOnly 라 JS 로는 읽을 수 없어서
  // 프론트가 스스로 알 방법이 없다 — 이게 없으면 쿠키가 살아 있어도 새로고침할
  // 때마다 로그인 화면이 뜬다.
  // 로그인돼 있으면 내 정보(실명·닉네임·needsName)를 스토어에 넣는다 — 실명이 없으면 L2가 뜬다.
  useEffect(() => {
    void gateway.loadMe().then((ok) => {
      if (ok) setLoggedIn(true)
    })
  }, [])

  // 지워진 v2 화면의 주소는 첫 화면으로 보낸다. 렌더 중에 navigate 하지 않게 effect 로.
  const known = isV3JoinRoute(route) || isV3Route(route) || isV3PublicRoute(route)
  useEffect(() => {
    if (!known) navigate('/jungsan')
  }, [known, navigate])

  /**
   * 실제 흐름: 서버가 카카오 인가 화면으로 302 시킨다(API.md §2.1). 로그인 뒤 **지금 보던 주소로** 돌아오게
   * `returnTo`를 넘긴다(FC-014 1-2) — 카톡 링크(P1)로 들어온 사람이 첫 화면으로 튕기지 않게. mock 은 상태만 켠다
   */
  const login = () => {
    if (!isApiMode()) { setLoggedIn(true); return true }
    window.location.href = api.kakaoLoginUrl(route.startsWith('/jungsan/') ? route : undefined)
    return false
  }
  const logout = () => setLoggedIn(false)

  // v3 참여 입구(P1)는 로그인 확인 **앞**에서 받는다 — 링크를 누른 사람이 술자리부터 보고,
  // [참여]를 누를 때 로그인한다. 로그인 전·후 모두 같은 <AppV3>라 고르던 응답이 유지된다.
  // 실제 로그인은 카카오 인가로 페이지를 떠나므로 고르던 응답을 sessionStorage 에 남겨
  // 돌아와서 이어 붙여야 한다(flow-changes FC-009).
  // 개인정보처리방침·지원 — 로그인과 상관없이 누구나(스토어 심사관 포함) 읽을 수 있어야 한다
  if (isV3PublicRoute(route)) {
    const home = () => navigate('/jungsan')
    return route === '/jungsan/privacy' ? <PrivacyPage onHome={home} /> : <SupportPage onHome={home} />
  }

  if (isV3JoinRoute(route)) {
    return <AppV3 route={route} navigate={navigate} onLeave={logout} loggedIn={loggedIn} onLogin={login} />
  }

  // **로그인 화면만 도트 도시를 화면 전체 배경으로 쓴다(js-login-mode).**
  // PixelCitySky 를 .js-shell "안"이 아니라 .js-root 의 형제로 둔다 — 안에 두면
  // 카드 크기에 갇혀서 화면 전체를 못 덮는다.
  if (!loggedIn) {
    return (
      <div className="js-root js-login-mode">
        <PixelCitySky />
        {/* 좌우 여백 배경. 넓은 화면에서만, 그리고 로그인 화면이 아닐 때만(CSS 가 결정). */}
        <SideStreet />
        <LoginPage onLogin={() => { login() }} />
      </div>
    )
  }

  // 로그인 뒤 모든 화면은 v3 라우터가 맡는다. H1의 뒤로가기는 로그인 화면으로 —
  // 서버 로그아웃 API가 생기면 여기서 같이 부른다.
  return known ? <AppV3 route={route} navigate={navigate} onLeave={logout} /> : null
}

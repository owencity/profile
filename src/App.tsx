import { profile } from './profile'
import { useEffect, useMemo, useState } from 'react'
import { NearbyCafesPage } from './24hours/NearbyCafesPage'
import { TourismHubPage } from './tourism/TourismHubPage'
import { TourismDetailPage } from './tourism/TourismDetailPage'
import { LoginModal } from './auth/LoginModal'
import { AuthCallback } from './auth/AuthCallback'
import { ChatRoom } from './chat/ChatRoom'
import { useAuthStore } from './auth/useAuthStore'
import { SecretRoomPage } from './secret/SecretRoomPage'
import { DevGuidePage } from './devguide/DevGuidePage'

function App() {
  const appTarget = (import.meta.env.VITE_APP_TARGET as string | undefined) ?? ''
  const is24hoursStandalone = appTarget === '24hours'
  const is24hoursAppRoute = window.location.pathname === '/24hours/app'
  const isAppLikeMode = is24hoursStandalone || is24hoursAppRoute

  const [route, setRoute] = useState(() =>
    is24hoursStandalone ? '/24hours/app' : window.location.pathname || '/',
  )
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [doorOpening, setDoorOpening] = useState(false)
  const { user, logout } = useAuthStore()

  const enterSecret = () => {
    if (doorOpening) return
    setDoorOpening(true)
    window.setTimeout(() => {
      window.history.pushState({}, '', '/secret')
      setRoute('/secret')
      setDoorOpening(false)
    }, 1100)
  }

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (to: string) => {
    if (is24hoursStandalone && to !== '/24hours/app') return
    if (to === route) return
    window.history.pushState({}, '', to)
    setRoute(to)
  }

  // Keep URL pinned in standalone mode without setState-in-effect lint.
  if (is24hoursStandalone && window.location.pathname !== '/24hours/app') {
    window.history.replaceState({}, '', '/24hours/app')
  }

  const formatKoreanDate = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}. ${mm}. ${dd}.`
  }

  const [todayText, setTodayText] = useState(() => formatKoreanDate(new Date()))

  useEffect(() => {
    const update = () => setTodayText(formatKoreanDate(new Date()))
    update()
    const intervalId = window.setInterval(update, 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const pageTitle = useMemo(() => {
    if (route === '/valkyriefs') return 'ValkyrieFS'
    if (route === '/24hours/app') return '24시간이모자라'
    if (route === '/24hours') return '24시간이모자라'
    if (route === '/tourism') return '관광공사 API'
    if (route.startsWith('/tourism/')) return '관광공사 API'
    if (route.startsWith('/chat/')) return '채팅방'
    if (route === '/auth/callback') return '로그인 중'
    if (route === '/secret') return '비밀의 방'
    return 'Home'
  }, [route])

  const chatRoomName = useMemo(() => {
    if (!route.startsWith('/chat/')) return ''
    const roomId = route.replace('/chat/', '')
    const decoded = decodeURIComponent(roomId)
    return decoded.includes('cafe-') ? decoded.replace('cafe-', '') : decoded
  }, [route])

  if (isAppLikeMode) {
    if (window.location.pathname !== '/24hours/app') {
      window.history.replaceState({}, '', '/24hours/app')
    }
    return (
      <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900">
        <main className="min-h-[100dvh] w-full px-0 py-0">
          <NearbyCafesPage variant="app" />
        </main>
      </div>
    )
  }

  // 비밀의 방은 헤더/사이드바 없이 전체화면으로
  if (route === '/secret') {
    return <SecretRoomPage onBack={() => navigate('/')} />
  }

  // 개발 가이드 페이지 — 풀스크린 (헤더/프로필 없음)
  if (route === '/devguide') {
    return <DevGuidePage />
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900">
      {/* Wide-screen background decoration (subtle) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[url('/bg-grid.svg')] [background-size:24px_24px] opacity-20 2xl:block"
      />
      <div className="mx-auto w-full max-w-none px-3 py-4 sm:px-6 sm:py-10 lg:px-12 2xl:px-16">
        <header className="mb-4 sm:mb-10">
          <div className="flex w-full items-center justify-between gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:gap-6 sm:px-5 sm:py-3">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <a
                className="text-sm font-semibold tracking-tight text-indigo-700 transition hover:text-indigo-600"
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/')
                }}
              >
                {profile.brand}
              </a>
              <span className="hidden text-xs text-zinc-400 sm:inline">·</span>
              <span className="hidden text-sm text-zinc-500 sm:inline">{todayText}</span>
              {route !== '/' ? (
                <>
                  <span className="text-xs text-zinc-300">/</span>
                  <span className="text-xs font-medium text-zinc-600 sm:text-sm">
                    {pageTitle}
                  </span>
                </>
              ) : null}
            </div>

            {/* 로그인/유저 영역 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="비밀의 방"
                title="비밀의 방"
                onClick={enterSecret}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </button>

              {user ? (
                <>
                  <span className="hidden max-w-[6rem] truncate text-xs font-medium text-zinc-700 sm:inline">
                    {user.nickname}
                  </span>
                  <button
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm transition hover:bg-zinc-50"
                    onClick={logout}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                  onClick={() => setShowLoginModal(true)}
                >
                  로그인
                </button>
              )}
            </div>
          </div>
        </header>

        <main className={`grid gap-10 lg:gap-12 ${route.startsWith('/tourism') ? 'max-w-4xl mx-auto w-full' : 'lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[520px_minmax(0,1fr)] 2xl:grid-cols-[560px_minmax(0,1fr)]'}`}>
          <aside className={`hidden lg:sticky lg:top-10 lg:self-start ${route.startsWith('/tourism') ? '' : 'lg:block'}`}>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative z-0 h-20 bg-zinc-100">
                <div className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />
              </div>

              <div className="relative z-10 -mt-10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative z-10 h-20 w-20 overflow-hidden rounded-full bg-white ring-1 ring-indigo-200/70 sm:h-24 sm:w-24">
                      <img
                        className="h-full w-full object-cover"
                        src={profile.avatarUrl}
                        alt={`${profile.name} 프로필 사진`}
                        loading="lazy"
                        onError={(e) => {
                          const img = e.currentTarget
                          img.style.display = 'none'
                          const fallback = img.parentElement?.querySelector(
                            '[data-avatar-fallback="true"]',
                          ) as HTMLElement | null
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                      <div
                        data-avatar-fallback="true"
                        className="hidden h-full w-full items-center justify-center bg-zinc-100 text-lg font-bold text-zinc-700"
                      >
                        DK
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight">
                        {profile.name}
                      </h1>
                      <p className="mt-1 text-sm text-zinc-600">{profile.role}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    BE
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-zinc-700">
                  {profile.intro}
                </p>

                <div className="mt-6 grid gap-2">
                  <a
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                    href={profile.links.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>GitHub</span>
                    <span className="text-zinc-400 transition group-hover:text-zinc-500">
                      ↗
                    </span>
                  </a>
                  <a
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                    href={profile.links.blog}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Blog</span>
                    <span className="text-zinc-400 transition group-hover:text-zinc-500">
                      ↗
                    </span>
                  </a>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold text-zinc-700">현재</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {profile.projects[0].name} 확장 개발 중
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    {profile.projects[0].summary}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {route === '/auth/callback' ? (
            <AuthCallback
              onDone={(redirectTo) => {
                window.history.replaceState({}, '', redirectTo)
                setRoute(redirectTo)
              }}
            />
          ) : route.startsWith('/chat/') ? (
            <ChatRoom
              roomId={route.replace('/chat/', '')}
              roomName={chatRoomName || '채팅방'}
              onBack={() => navigate('/24hours')}
              onLoginRequired={() => setShowLoginModal(true)}
            />
          ) : route === '/valkyriefs' ? (
            <section className="space-y-10">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      ValkyrieFS Download
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      최신 릴리즈 설치 파일을 GitHub Releases에서 제공합니다. (Windows 전용)
                    </p>
                  </div>
                  <a
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                    href="/"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate('/')
                    }}
                  >
                    ← Back
                  </a>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-8 w-auto"
                        src={profile.valkyrieFs.logoUrl}
                        alt="ValkyrieFS 로고"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          ValkyrieFS
                        </p>
                        <p className="text-xs text-zinc-600">
                          Windows 전용 · C++ / Python
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                        href={profile.valkyrieFs.windowsInstallerUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        바로 다운로드
                      </a>
                      <a
                        className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                        href={profile.valkyrieFs.releaseLatestUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        GitHub Releases
                      </a>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-6 text-zinc-600">
                    “바로 다운로드”는 클릭 즉시 최신 릴리즈의{' '}
                    <span className="font-semibold">ValkyrieFS-Setup.exe</span>를
                    다운로드합니다.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      설치 방법
                    </h3>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
                      <li>“바로 다운로드”로 설치 파일을 받습니다.</li>
                      <li>설치 파일 실행 후 안내에 따라 설치합니다.</li>
                      <li>설치 완료 후 ValkyrieFS를 실행합니다.</li>
                    </ol>
                    <p className="mt-3 text-xs leading-6 text-zinc-500">
                      배포 파일/가이드는 릴리즈 시점에 지속적으로 업데이트합니다.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      안내 / FAQ
                    </h3>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-700">
                      <div>
                        <p className="font-medium text-zinc-900">
                          Windows 경고가 뜨면요?
                        </p>
                        <p className="text-zinc-700">
                          SmartScreen 경고가 뜰 수 있습니다. “추가 정보” → “실행”
                          흐름으로 진행합니다.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">
                          버그/요청은 어디에 남기나요?
                        </p>
                        <p className="text-zinc-700">
                          GitHub Issues로 정리할 예정입니다.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                        href={`${profile.valkyrieFs.releaseLatestUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        릴리즈 노트 보기
                      </a>
                      <a
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                        href="https://github.com/owencity/valkyrieFS/issues"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Issues
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pb-6" />
            </section>
          ) : route === '/tourism' ? (
            <TourismHubPage onNavigate={navigate} />
          ) : route.startsWith('/tourism/') ? (
            <TourismDetailPage
              apiId={route.replace('/tourism/', '')}
              onNavigate={navigate}
            />
          ) : route === '/24hours' ? (
            <section>
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="flex items-center gap-2">
                  <img
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    src="/24hours-logo.svg"
                    alt="24시간이모자라 로고"
                    loading="lazy"
                  />
                  <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                    24시간이모자라
                  </h2>
                </div>
                <a
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50"
                  href="/"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/')
                  }}
                >
                  ← Back
                </a>
              </div>

              <NearbyCafesPage
                onChatRoom={(roomId) => navigate(`/chat/${roomId}`)}
              />
            </section>
          ) : (
            <section className="space-y-10">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Projects
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">
                          {profile.projects[0].name}
                        </h3>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          {profile.projects[0].status}
                        </span>
                      </div>
                      <a
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                        href="/valkyriefs"
                        onClick={(e) => {
                          e.preventDefault()
                          navigate('/valkyriefs')
                        }}
                      >
                        다운로드 페이지
                      </a>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-zinc-700">
                      {profile.projects[0].details[0]} {profile.projects[0].details[1]}
                    </p>

                    <div className="mt-4">
                      <a
                        className="block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300"
                        href="/val_02.png"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="ValkyrieFS 사용 화면 스크린샷 열기"
                      >
                        <img
                          className="aspect-[16/9] w-full bg-white object-contain"
                          src="/val_02.png"
                          alt="ValkyrieFS 사용 화면 스크린샷"
                          loading="lazy"
                        />
                      </a>
                      <p className="mt-2 text-xs text-zinc-500">
                        스크린샷을 클릭하면 원본으로 열립니다.
                      </p>
                    </div>
                  </div>

                  <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">
                          {profile.projects[1].name}
                        </h3>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {profile.projects[1].status}
                        </span>
                      </div>
                      <a
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                        href="/24hours"
                        onClick={(e) => {
                          e.preventDefault()
                          navigate('/24hours')
                        }}
                      >
                        바로가기
                      </a>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-zinc-700">
                      {profile.projects[1].summary}
                    </p>
                    <p className="mt-3 text-xs leading-6 text-zinc-600">
                      {profile.projects[1].details[0]} {profile.projects[1].details[1]}
                    </p>
                  </div>

                </div>
              </div>

              {/* 비밀의 방 문 */}
              <button
                type="button"
                onClick={enterSecret}
                className="group relative block w-full overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 p-6 text-left shadow-xl transition hover:shadow-2xl hover:shadow-indigo-500/20"
                aria-label="비밀의 방으로 들어가기"
              >
                {/* 별 배경 */}
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute h-0.5 w-0.5 rounded-full bg-white"
                      style={{
                        left: `${(i * 53) % 100}%`,
                        top: `${(i * 89) % 100}%`,
                        opacity: 0.3 + ((i * 17) % 70) / 100,
                      }}
                    />
                  ))}
                </div>

                {/* 빛 새어나오는 효과 */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-10 -top-10 h-32 bg-gradient-to-b from-amber-300/30 via-amber-400/10 to-transparent blur-3xl transition-opacity duration-500 group-hover:from-amber-300/50"
                />

                <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                  {/* 문 SVG */}
                  <div className="relative flex h-32 w-24 flex-shrink-0 items-end justify-center sm:h-36 sm:w-28">
                    {/* 문틀 */}
                    <div className="absolute inset-x-0 bottom-0 h-full rounded-t-[3rem] border-2 border-amber-700/60 bg-gradient-to-b from-amber-950 to-zinc-950 shadow-inner" />
                    {/* 문짝 */}
                    <div className="relative mx-1 mb-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-t-[2.7rem] border border-amber-700/40 bg-gradient-to-b from-amber-900 via-amber-950 to-zinc-900 transition-transform duration-500 group-hover:translate-x-1 group-hover:rotate-y-3 group-hover:[transform-origin:left]">
                      {/* 문 패널 디테일 */}
                      <div className="absolute inset-x-3 top-3 h-10 rounded-md border border-amber-700/30" />
                      <div className="absolute inset-x-3 top-16 h-10 rounded-md border border-amber-700/30" />
                      {/* 손잡이 */}
                      <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.6)]" />
                    </div>
                    {/* 문 위 장식 (작은 자물쇠) */}
                    <svg
                      className="absolute -top-1 left-1/2 h-5 w-5 -translate-x-1/2 text-amber-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
                      <path d="M8 11V8a4 4 0 018 0v3" />
                    </svg>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                      ── Secret ──
                    </p>
                    <h3 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
                      비밀의 방
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm">
                      비밀번호를 알고 있는 사람만 들어올 수 있습니다.<br />
                      안에는… 옛 추억의 미니게임이 기다리고 있어요.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300/90 transition group-hover:gap-2.5 group-hover:text-amber-200">
                      문을 두드린다
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>

              <div className="pb-6" />
            </section>
          )}
        </main>
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {doorOpening && <DoorOpeningOverlay />}
    </div>
  )
}

function DoorOpeningOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black">
      {/* 황금 빛 폭발 */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2"
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(252,211,77,0.95) 0%, rgba(245,158,11,0.7) 30%, rgba(120,53,15,0.3) 60%, transparent 100%)',
          animation: 'doorBurst 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        }}
      />

      {/* 빛줄기 8방향 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute left-1/2 top-1/2 origin-left"
          style={{
            width: '50vw',
            height: 4,
            transform: `rotate(${(i * 360) / 8}deg)`,
            background:
              'linear-gradient(to right, rgba(252,211,77,0.9), rgba(252,211,77,0) 100%)',
            opacity: 0,
            animation: `doorRay 1.1s ${0.1 + i * 0.03}s ease-out forwards`,
          }}
        />
      ))}

      {/* 문 (점점 커지면서 사라짐) */}
      <div
        aria-hidden
        className="relative"
        style={{
          width: 80,
          height: 120,
          animation: 'doorZoom 1.1s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-full rounded-t-[2rem] border-2 border-amber-700/70 bg-gradient-to-b from-amber-900 via-amber-950 to-zinc-950" />
        <div className="absolute inset-x-2 bottom-1 top-1 rounded-t-[1.7rem] bg-gradient-to-b from-amber-300 via-amber-400 to-amber-700 opacity-90 mix-blend-screen" />
      </div>

      <p
        className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.5em] text-amber-300"
        style={{ animation: 'doorTextFade 1.1s ease-out forwards' }}
      >
        ── 비밀의 방 ──
      </p>

      <style>{`
        @keyframes doorBurst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          25% { transform: translate(-50%, -50%) scale(2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(35); opacity: 1; }
        }
        @keyframes doorZoom {
          0% { transform: scale(0.6); opacity: 0; }
          25% { transform: scale(1); opacity: 1; }
          70% { transform: scale(4); opacity: 0.8; }
          100% { transform: scale(8); opacity: 0; }
        }
        @keyframes doorRay {
          0% { opacity: 0; transform: rotate(var(--angle, 0deg)) scaleX(0); }
          40% { opacity: 1; transform: rotate(var(--angle, 0deg)) scaleX(1); }
          100% { opacity: 0; transform: rotate(var(--angle, 0deg)) scaleX(1.5); }
        }
        @keyframes doorTextFade {
          0%, 30% { opacity: 0; transform: translate(-50%, 10px); }
          60% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
      `}</style>
    </div>
  )
}

export default App

import { profile } from './profile'
import { useEffect, useMemo, useState } from 'react'

function App() {
  const [route, setRoute] = useState(() => window.location.pathname || '/')

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (to: string) => {
    if (to === route) return
    window.history.pushState({}, '', to)
    setRoute(to)
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
    if (route === '/24hours') return '24시간이모자라'
    return 'Home'
  }, [route])

  type PlaceCategory = '카페' | '음식점' | 'EV'

  const categoryMeta: Record<
    PlaceCategory,
    { label: PlaceCategory; dotClass: string; pillClass: string }
  > = {
    카페: {
      label: '카페',
      dotClass: 'bg-indigo-500',
      pillClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    음식점: {
      label: '음식점',
      dotClass: 'bg-emerald-500',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    EV: {
      label: 'EV',
      dotClass: 'bg-amber-500',
      pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  }

  const regions = [
    { label: '서울', left: '48%', top: '30%' },
    { label: '인천', left: '40%', top: '33%' },
    { label: '대전', left: '49%', top: '50%' },
    { label: '대구', left: '63%', top: '55%' },
    { label: '부산', left: '72%', top: '66%' },
    { label: '광주', left: '40%', top: '68%' },
    { label: '제주', left: '33%', top: '86%' },
  ] as const

  const mockPlacesByRegion: Record<
    (typeof regions)[number]['label'],
    Array<{
      id: string
      category: PlaceCategory
      name: string
      address: string
      note?: string
    }>
  > = {
    서울: [
      {
        id: 'seoul-cafe-1',
        category: '카페',
        name: '24H 스테이션 카페',
        address: '서울 • 강남구',
        note: '조용한 좌석/콘센트',
      },
      {
        id: 'seoul-food-1',
        category: '음식점',
        name: '심야 분식',
        address: '서울 • 마포구',
        note: '라면/떡볶이',
      },
      {
        id: 'seoul-ev-1',
        category: 'EV',
        name: 'EV 급속 충전소',
        address: '서울 • 송파구',
        note: '급속 2기',
      },
    ],
    인천: [
      {
        id: 'incheon-cafe-1',
        category: '카페',
        name: '항구뷰 24H 카페',
        address: '인천 • 중구',
      },
      {
        id: 'incheon-food-1',
        category: '음식점',
        name: '야식 국밥',
        address: '인천 • 부평구',
      },
      {
        id: 'incheon-ev-1',
        category: 'EV',
        name: 'EV 충전 존',
        address: '인천 • 연수구',
      },
    ],
    대전: [
      { id: 'daejeon-cafe-1', category: '카페', name: '밤샘 카페', address: '대전 • 서구' },
      { id: 'daejeon-food-1', category: '음식점', name: '24H 한식', address: '대전 • 유성구' },
      { id: 'daejeon-ev-1', category: 'EV', name: 'EV 충전소', address: '대전 • 중구' },
    ],
    대구: [
      { id: 'daegu-cafe-1', category: '카페', name: '심야 카페', address: '대구 • 수성구' },
      { id: 'daegu-food-1', category: '음식점', name: '24H 덮밥', address: '대구 • 달서구' },
      { id: 'daegu-ev-1', category: 'EV', name: 'EV 급속', address: '대구 • 동구' },
    ],
    부산: [
      { id: 'busan-cafe-1', category: '카페', name: '바다 24H 카페', address: '부산 • 해운대구' },
      { id: 'busan-food-1', category: '음식점', name: '심야 돼지국밥', address: '부산 • 부산진구' },
      { id: 'busan-ev-1', category: 'EV', name: 'EV 충전 스팟', address: '부산 • 남구' },
    ],
    광주: [
      { id: 'gwangju-cafe-1', category: '카페', name: '24H 스터디 카페', address: '광주 • 북구' },
      { id: 'gwangju-food-1', category: '음식점', name: '야식 김밥', address: '광주 • 서구' },
      { id: 'gwangju-ev-1', category: 'EV', name: 'EV 충전소', address: '광주 • 광산구' },
    ],
    제주: [
      { id: 'jeju-cafe-1', category: '카페', name: '제주 24H 카페', address: '제주 • 제주시' },
      { id: 'jeju-food-1', category: '음식점', name: '심야 라멘', address: '제주 • 제주시' },
      { id: 'jeju-ev-1', category: 'EV', name: 'EV 급속 충전', address: '제주 • 서귀포시' },
    ],
  }

  const [selectedRegion, setSelectedRegion] = useState<(typeof regions)[number]['label']>(
    '서울',
  )
  const [selectedCategories, setSelectedCategories] = useState<PlaceCategory[]>([
    '카페',
    '음식점',
    'EV',
  ])
  const [placeQuery, setPlaceQuery] = useState('')

  useEffect(() => {
    if (route !== '/24hours') return
    // keep default selection when first entering
    setSelectedRegion((prev) => prev || '서울')
  }, [route])

  const visiblePlaces = useMemo(() => {
    const all = mockPlacesByRegion[selectedRegion] ?? []
    const q = placeQuery.trim().toLowerCase()
    return all.filter((p) => {
      if (!selectedCategories.includes(p.category)) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.note ? p.note.toLowerCase().includes(q) : false)
      )
    })
  }, [mockPlacesByRegion, placeQuery, selectedCategories, selectedRegion])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900">
      {/* Wide-screen background decoration (subtle) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[url('/bg-grid.svg')] [background-size:24px_24px] opacity-20 2xl:block"
      />
      <div className="mx-auto w-full max-w-none px-4 py-10 sm:px-6 lg:px-12 2xl:px-16">
        <header className="mb-10">
          <div className="flex w-full items-center justify-start gap-6 rounded-full border border-zinc-200 bg-white px-5 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex items-baseline gap-3">
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
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-sm text-zinc-500">{todayText}</span>
              {route !== '/' ? (
                <>
                  <span className="text-xs text-zinc-300">/</span>
                  <span className="text-sm font-medium text-zinc-600">
                    {pageTitle}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="grid gap-10 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[520px_minmax(0,1fr)] 2xl:grid-cols-[560px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-10 lg:self-start">
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

          {route === '/valkyriefs' ? (
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
          ) : route === '/24hours' ? (
            <section className="space-y-10">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <img
                        className="h-9 w-9"
                        src="/24hours-logo.svg"
                        alt="24시간이모자라 로고"
                        loading="lazy"
                      />
                      <h2 className="text-xl font-semibold tracking-tight">
                        24시간이모자라
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      카페, 음식점, 전기차 충전소 등 24시간 운영하는 곳을 지도에서 쉽게 찾고 안내하는 웹앱입니다.
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

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-900">
                        지도 (UI 목업)
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                        {(Object.keys(categoryMeta) as PlaceCategory[]).map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1"
                          >
                            <span className={`h-2 w-2 rounded-full ${categoryMeta[c].dotClass}`} />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="relative aspect-[16/10] bg-[url('/bg-grid.svg')] [background-size:28px_28px]">
                      {/* cute map pins (mock) */}
                      {regions.map((p) => (
                        <div
                          key={p.label}
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                          style={{ left: p.left, top: p.top }}
                        >
                          <button
                            type="button"
                            className="group relative"
                            onClick={() => setSelectedRegion(p.label)}
                            aria-label={`${p.label} 선택`}
                          >
                            <div
                              className={[
                                'h-7 w-7 rounded-full border border-white shadow-sm ring-1 transition',
                                selectedRegion === p.label
                                  ? 'ring-indigo-300 bg-white'
                                  : 'ring-zinc-200/80 bg-white',
                              ].join(' ')}
                            >
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="text-sm">📍</span>
                              </div>
                            </div>
                            <div
                              className={[
                                'mt-1 w-max rounded-full border bg-white px-2 py-1 text-[11px] font-semibold shadow-sm transition',
                                selectedRegion === p.label
                                  ? 'border-indigo-200 text-indigo-700'
                                  : 'border-zinc-200 text-zinc-700',
                              ].join(' ')}
                            >
                              {p.label}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {selectedRegion} · 24시간 장소
                        </h3>
                        <p className="mt-1 text-xs text-zinc-600">
                          지도 SDK/실데이터 연결 전, UI 목업으로 흐름을 잡는 중입니다.
                        </p>
                      </div>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        UI
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        placeholder="검색 (예: 카페, 충전, 강남…) "
                        value={placeQuery}
                        onChange={(e) => setPlaceQuery(e.target.value)}
                      />

                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(categoryMeta) as PlaceCategory[]).map((c) => {
                          const active = selectedCategories.includes(c)
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setSelectedCategories((prev) => {
                                  if (prev.includes(c)) return prev.filter((x) => x !== c)
                                  return [...prev, c]
                                })
                              }}
                              className={[
                                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                                active
                                  ? `border-transparent ${categoryMeta[c].pillClass}`
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
                              ].join(' ')}
                            >
                              <span className={`h-2 w-2 rounded-full ${categoryMeta[c].dotClass}`} />
                              {c}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {visiblePlaces.length === 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                          결과가 없어요. 다른 키워드로 검색하거나 카테고리를 켜주세요. (´•᎑•`)
                        </div>
                      ) : (
                        visiblePlaces.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={[
                                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                                      categoryMeta[p.category].pillClass,
                                    ].join(' ')}
                                  >
                                    {p.category}
                                  </span>
                                  <span className="text-sm font-semibold text-zinc-900">
                                    {p.name}
                                  </span>
                                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                                    24H
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-600">{p.address}</p>
                                {p.note ? (
                                  <p className="mt-1 text-xs text-zinc-500">{p.note}</p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                disabled
                                className="cursor-not-allowed rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-400"
                                title="지도 SDK 연결 후 제공 예정"
                              >
                                길찾기(준비중)
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                      다음 단계: 실제 지도 SDK 연결 → 데이터 수집/정제 → 검색/필터 최적화
                    </div>
                  </div>
                </div>
              </div>

              <div className="pb-6" />
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

              <div className="pb-6" />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

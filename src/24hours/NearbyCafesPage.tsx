import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchNearbyCafes } from './api'
import { formatDistance } from './formatDistance'
import { loadNaverMaps } from './naverMapsLoader'
import { useGeolocationOrSeoul } from './useGeolocation'
import type { CafeNearbyItem } from './types'

type NaverLatLng = unknown
type NaverEventListener = unknown

type NaverMap = {
  setCenter: (center: NaverLatLng) => void
  getCenter: () => NaverLatLng
  panTo: (center: NaverLatLng, opts?: unknown) => void
}

type NaverMarker = {
  setMap: (map: NaverMap | null) => void
  setPosition: (pos: NaverLatLng) => void
}

type NaverMapsApi = {
  Map: new (
    el: HTMLElement,
    opts: {
      center: NaverLatLng
      zoom: number
      zoomControl?: boolean
      zoomControlOptions?: { position: unknown }
    },
  ) => NaverMap
  Marker: new (opts: {
    position: NaverLatLng
    map: NaverMap
    title?: string
    icon?: { content: string; size: unknown; anchor: unknown }
  }) => NaverMarker
  LatLng: new (lat: number, lng: number) => NaverLatLng
  Size: new (w: number, h: number) => unknown
  Point: new (x: number, y: number) => unknown
  Position: { TOP_RIGHT: unknown }
  Event: {
    addListener: (target: unknown, eventName: string, handler: () => void) => NaverEventListener
    removeListener: (listener: NaverEventListener) => void
  }
}

function getNaverMapsApi(): NaverMapsApi | null {
  const naver = window.naver
  if (!naver || typeof naver !== 'object') return null
  const maps = (naver as { maps?: unknown }).maps
  if (!maps || typeof maps !== 'object') return null
  return maps as NaverMapsApi
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return '오류가 발생했습니다.'
}

type LatLngLiteral = { latitude: number; longitude: number }

function toLatLngLiteral(value: unknown): LatLngLiteral | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { lat?: unknown; lng?: unknown }
  if (typeof v.lat === 'function' && typeof v.lng === 'function') {
    const latitude = (v.lat as () => unknown)()
    const longitude = (v.lng as () => unknown)()
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return { latitude, longitude }
    }
  }
  return null
}

function haversineMeters(a: LatLngLiteral, b: LatLngLiteral): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

type NearbyState = {
  items: CafeNearbyItem[]
  nextCursor: string | null
  hasMore: boolean
}

const DEFAULT_RADIUS_METERS = 5000
const DEFAULT_SIZE = 20

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" fill="none">` +
  `<path d="M14 0C6.268 0 0 6.268 0 14c0 5.25 3.024 10.174 7.6 14.374C11.072 31.674 14 36 14 36s2.928-4.326 6.4-7.626C24.976 24.174 28 19.25 28 14 28 6.268 21.732 0 14 0z" fill="#4338ca"/>` +
  `<circle cx="14" cy="13" r="5.5" fill="white"/>` +
  `</svg>`

type NearbyCafesPageProps = {
  variant?: 'web' | 'app'
}

export function NearbyCafesPage({ variant: _variant = 'web' }: NearbyCafesPageProps) {
  const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'
  const naverKeyId =
    (import.meta.env.VITE_NAVER_MAPS_KEY_ID as string | undefined) ??
    (import.meta.env.VITE_NAVER_MAPS_CLIENT_ID as string | undefined) ??
    ''

  const { status: geoStatus, location, message: geoMessage, locationText } =
    useGeolocationOrSeoul()

  const [radiusMeters, setRadiusMeters] = useState<number>(DEFAULT_RADIUS_METERS)
  const [searchCenter, setSearchCenter] = useState<LatLngLiteral | null>(null)
  const [pendingCenter, setPendingCenter] = useState<LatLngLiteral | null>(null)
  const [isAreaDirty, setIsAreaDirty] = useState(false)
  const searchCenterRef = useRef<LatLngLiteral | null>(null)
  const [nearby, setNearby] = useState<NearbyState>({
    items: [],
    nextCursor: null,
    hasMore: false,
  })
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<NaverMap | null>(null)
  const idleListenerRef = useRef<NaverEventListener | null>(null)
  const cafeMarkersRef = useRef<NaverMarker[]>([])
  const myMarkerRef = useRef<NaverMarker | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedCafeId, setSelectedCafeId] = useState<number | null>(null)
  const cafeCardRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const markerListenersRef = useRef<NaverEventListener[]>([])

  useEffect(() => {
    searchCenterRef.current = searchCenter
  }, [searchCenter])

  const resetAndLoad = useCallback(
    async (center: LatLngLiteral) => {
    abortRef.current?.abort()
    const abortController = new AbortController()
    abortRef.current = abortController

    setLoading(true)
    setErrorMessage(null)
    try {
      const data = await fetchNearbyCafes({
        baseUrl: apiBaseUrl,
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters,
        size: DEFAULT_SIZE,
        signal: abortController.signal,
      })
      setNearby({ items: data.items, nextCursor: data.nextCursor, hasMore: data.hasMore })
    } catch (e: unknown) {
      if (isAbortError(e)) return
      setNearby({ items: [], nextCursor: null, hasMore: false })
      setErrorMessage(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
    },
    [apiBaseUrl, radiusMeters],
  )

  const loadMore = useCallback(async () => {
    if (!searchCenter) return
    if (loading || loadingMore) return
    if (!nearby.hasMore || !nearby.nextCursor) return

    const abortController = new AbortController()

    setLoadingMore(true)
    setErrorMessage(null)
    try {
      const data = await fetchNearbyCafes({
        baseUrl: apiBaseUrl,
        latitude: searchCenter.latitude,
        longitude: searchCenter.longitude,
        radiusMeters,
        size: DEFAULT_SIZE,
        cursor: nearby.nextCursor,
        signal: abortController.signal,
      })
      setNearby((prev) => ({
        items: [...prev.items, ...data.items],
        nextCursor: data.nextCursor,
        hasMore: data.hasMore,
      }))
    } catch (e: unknown) {
      setErrorMessage(getErrorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }, [
    apiBaseUrl,
    loading,
    loadingMore,
    nearby.hasMore,
    nearby.nextCursor,
    radiusMeters,
    searchCenter,
  ])

  useEffect(() => {
    if (geoStatus !== 'ready') return
    const center = { latitude: location.latitude, longitude: location.longitude }
    setSearchCenter(center)
    setPendingCenter(null)
    setIsAreaDirty(false)
    void resetAndLoad(center)
  }, [geoStatus, location.latitude, location.longitude, resetAndLoad])

  const applyPendingArea = useCallback(() => {
    if (!pendingCenter) return
    setSearchCenter(pendingCenter)
    setIsAreaDirty(false)
    void resetAndLoad(pendingCenter)
  }, [pendingCenter, resetAndLoad])

  const recenterToMyLocation = useCallback(() => {
    const maps = getNaverMapsApi()
    const map = mapRef.current
    if (!maps || !map) return
    const center = new maps.LatLng(location.latitude, location.longitude)
    map.setCenter(center)
  }, [location.latitude, location.longitude])

  const radiusOptions = useMemo(
    () => [
      { label: '1km', value: 1000 },
      { label: '3km', value: 3000 },
      { label: '5km', value: 5000 },
      { label: '10km', value: 10000 },
    ],
    [],
  )

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        void loadMore()
      },
      { root: null, rootMargin: '300px 0px', threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  // Auth failure hook (called by Naver Maps script)
  useEffect(() => {
    window.navermap_authFailure = () => {
      setMapError(
        '네이버 지도 인증에 실패했습니다. (도메인 등록/키 값/VITE_NAVER_MAPS_KEY_ID 설정을 확인해주세요.)',
      )
    }

    return () => {
      window.navermap_authFailure = undefined
    }
  }, [])

  // Load and init Naver Map
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!mapContainerRef.current) return
      if (!naverKeyId) {
        setMapError('네이버 지도 Key ID가 설정되어 있지 않습니다. (VITE_NAVER_MAPS_KEY_ID)')
        return
      }

      try {
        await loadNaverMaps(naverKeyId)
        if (cancelled) return
        setMapError(null)

        const maps = getNaverMapsApi()
        if (!maps) throw new Error('네이버 지도 객체를 찾을 수 없습니다.')

        const center = new maps.LatLng(location.latitude, location.longitude)

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapContainerRef.current, {
            center,
            zoom: 14,
            zoomControl: true,
            zoomControlOptions: { position: maps.Position.TOP_RIGHT },
          })
        } else {
          mapRef.current.setCenter(center)
        }

        const map = mapRef.current
        if (!map) throw new Error('지도 초기화에 실패했습니다.')

        if (idleListenerRef.current) {
          maps.Event.removeListener(idleListenerRef.current)
          idleListenerRef.current = null
        }

        idleListenerRef.current = maps.Event.addListener(map, 'idle', () => {
          const current = toLatLngLiteral(map.getCenter())
          if (!current) return
          setPendingCenter(current)

          const base = searchCenterRef.current
          if (!base) {
            setIsAreaDirty(false)
            return
          }

          const moved = haversineMeters(base, current) >= 50
          setIsAreaDirty(moved)
        })

        // my location marker
        if (myMarkerRef.current) {
          myMarkerRef.current.setPosition(center)
        } else {
          myMarkerRef.current = new maps.Marker({
            position: center,
            map,
            title: '내 위치',
            icon: {
              content:
                '<div style="width:14px;height:14px;border-radius:9999px;background:#4f46e5;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.15)"></div>',
              size: new maps.Size(14, 14),
              anchor: new maps.Point(7, 7),
            },
          })
        }
      } catch (e: unknown) {
        setMapError(getErrorMessage(e))
      }
    }

    void run()
    return () => {
      cancelled = true
      const maps = getNaverMapsApi()
      if (maps && idleListenerRef.current) {
        maps.Event.removeListener(idleListenerRef.current)
        idleListenerRef.current = null
      }
    }
  }, [location.latitude, location.longitude, naverKeyId])

  const cafeLocationsRef = useRef<Map<number, LatLngLiteral>>(new Map())

  const selectCafe = useCallback((cafeId: number) => {
    setSelectedCafeId(cafeId)
    setShowList(true)

    const maps = getNaverMapsApi()
    const map = mapRef.current
    const loc = cafeLocationsRef.current.get(cafeId)
    if (maps && map && loc) {
      map.panTo(new maps.LatLng(loc.latitude, loc.longitude))
    }

    requestAnimationFrame(() => {
      const el = cafeCardRefs.current.get(cafeId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }, [])

  useEffect(() => {
    const maps = getNaverMapsApi()
    if (!maps) return
    const map = mapRef.current
    if (!map) return

    for (const l of markerListenersRef.current) {
      try { maps.Event.removeListener(l) } catch { /* ignore */ }
    }
    markerListenersRef.current = []

    for (const m of cafeMarkersRef.current) {
      try { m.setMap(null) } catch { /* ignore */ }
    }
    cafeMarkersRef.current = []

    const locMap = new Map<number, LatLngLiteral>()

    cafeMarkersRef.current = nearby.items.map((cafe) => {
      const label = cafe.name + (cafe.branch ? ` ${cafe.branch}` : '')
      const escapedLabel = label.replace(/'/g, '&#39;').replace(/"/g, '&quot;')
      locMap.set(cafe.id, { latitude: cafe.latitude, longitude: cafe.longitude })

      const marker = new maps.Marker({
        position: new maps.LatLng(cafe.latitude, cafe.longitude),
        map,
        title: label,
        icon: {
          content: `<div style="display:flex;align-items:flex-end;gap:2px;cursor:pointer">` +
            `<div style="flex-shrink:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25))">${PIN_SVG}</div>` +
            `<span style="font-size:11px;font-weight:600;color:#1e1b4b;background:white;padding:2px 6px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.12);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;margin-bottom:10px">${escapedLabel}</span>` +
            `</div>`,
          size: new maps.Size(160, 36),
          anchor: new maps.Point(14, 36),
        },
      })
      const listener = maps.Event.addListener(marker, 'click', () => {
        selectCafe(cafe.id)
      })
      markerListenersRef.current.push(listener)
      return marker
    })

    cafeLocationsRef.current = locMap
  }, [nearby.items, selectCafe])

  const [showList, setShowList] = useState(false)

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
      {/* ── Map panel ── */}
      <div className="min-w-0 overflow-hidden rounded-none border-b border-zinc-200 bg-zinc-50 lg:rounded-2xl lg:border">
        {/* Controls */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
          <p className="mr-auto truncate text-xs text-zinc-500">
            {locationText}
          </p>

          <select
            id="radius"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-300"
            value={radiusMeters}
            onChange={(e) => {
              const next = Number(e.target.value)
              setRadiusMeters(next)
              if (searchCenter) void resetAndLoad(searchCenter)
            }}
            disabled={loading}
          >
            {radiusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={recenterToMyLocation}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
            disabled={loading}
          >
            내 위치
          </button>

          {isAreaDirty ? (
            <button
              type="button"
              onClick={applyPendingArea}
              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              disabled={loading || !pendingCenter}
            >
              이 지역 검색
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!searchCenter) return
                void resetAndLoad(searchCenter)
              }}
              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              disabled={loading || !searchCenter}
            >
              새로고침
            </button>
          )}
        </div>

        <div className="border-b border-zinc-200 bg-indigo-50/60 px-3 py-2 text-xs leading-relaxed text-indigo-900">
          <span className="font-semibold">24시간 운영 카페</span>를 지도에서 찾아보세요.
          <span className="hidden sm:inline"> 지도를 이동한 뒤 </span>
          <span className="sm:hidden"> 지도 이동 후 </span>
          <span className="inline-flex items-center rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">이 지역 검색</span>
          <span className="hidden sm:inline"> 버튼을 누르면 해당 영역의 카페가 표시됩니다. 마커를 클릭하면 상세 정보를 확인할 수 있습니다.</span>
          <span className="sm:hidden"> 을 누르면 카페가 나타납니다.</span>
        </div>

        {geoMessage ? (
          <div className="border-b border-zinc-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {geoMessage}
          </div>
        ) : null}

        {mapError ? (
          <div className="border-b border-zinc-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            {mapError}
          </div>
        ) : null}

        <div className="relative">
          <div ref={mapContainerRef} className="aspect-square w-full bg-zinc-100 sm:aspect-[16/10]" />
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-zinc-700">
              불러오는 중…
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Mobile toggle ── */}
      <button
        type="button"
        onClick={() => setShowList((v) => !v)}
        className="sticky bottom-0 z-10 flex items-center justify-center gap-1.5 border-t border-zinc-200 bg-white py-3 text-sm font-semibold text-indigo-600 lg:hidden"
      >
        {showList ? '지도 보기' : `카페 목록 (${nearby.items.length}개)`}
        <svg
          className={`h-4 w-4 transition ${showList ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── List panel ── */}
      <div className={`min-w-0 rounded-none border-zinc-200 bg-white px-3 py-4 lg:rounded-2xl lg:border lg:p-5 lg:shadow-sm ${showList ? '' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">카페 목록</h3>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {nearby.items.length}개
          </span>
        </div>

        {errorMessage ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-3 space-y-2 overflow-auto lg:max-h-[60vh]">
          {nearby.items.length === 0 && !loading ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
              결과가 없어요. 반경을 늘리거나 새로고침을 눌러보세요.
            </div>
          ) : (
            nearby.items.map((cafe) => (
              <div
                key={cafe.id}
                ref={(el) => {
                  if (el) cafeCardRefs.current.set(cafe.id, el)
                  else cafeCardRefs.current.delete(cafe.id)
                }}
                onClick={() => selectCafe(cafe.id)}
                className={`cursor-pointer rounded-xl border p-2.5 shadow-sm transition ${selectedCafeId === cafe.id ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-zinc-900 leading-tight">
                    {cafe.name}
                    {cafe.branch ? (
                      <span className="text-zinc-500"> {cafe.branch}</span>
                    ) : null}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                    {formatDistance(cafe.distance)}
                  </span>
                  {typeof cafe.rating === 'number' ? (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      {cafe.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{cafe.address}</p>
                {cafe.phoneNumber ? (
                  <p className="text-xs text-zinc-400">{cafe.phoneNumber}</p>
                ) : null}
              </div>
            ))
          )}

          <div ref={sentinelRef} />

          {loadingMore ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              더 불러오는 중…
            </div>
          ) : null}

          {!nearby.hasMore && nearby.items.length > 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-500">
              더 이상 결과가 없습니다.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


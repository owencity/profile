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

type NearbyCafesPageProps = {
  variant?: 'web' | 'app'
}

export function NearbyCafesPage({ variant = 'web' }: NearbyCafesPageProps) {
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

  // Cafe markers update
  useEffect(() => {
    const maps = getNaverMapsApi()
    if (!maps) return
    const map = mapRef.current
    if (!map) return

    for (const m of cafeMarkersRef.current) {
      try {
        m.setMap(null)
      } catch {
        // ignore
      }
    }
    cafeMarkersRef.current = []

    cafeMarkersRef.current = nearby.items.map((cafe) => {
      const marker = new maps.Marker({
        position: new maps.LatLng(cafe.latitude, cafe.longitude),
        map,
        title: `${cafe.name}${cafe.branch ? ` ${cafe.branch}` : ''}`,
      })
      return marker
    })
  }, [nearby.items])

  const listMaxHeightClass =
    variant === 'app' ? 'max-h-[calc(100dvh-260px)]' : 'max-h-[60vh]'

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">내 주변 카페</p>
            <p className="mt-0.5 text-xs text-zinc-600">
              위치: <span className="font-medium">{locationText}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-600" htmlFor="radius">
              반경
            </label>
            <select
              id="radius"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
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
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              title="내 위치로 지도 이동"
            >
              내 위치로
            </button>

            {isAreaDirty ? (
              <button
                type="button"
                onClick={applyPendingArea}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || !pendingCenter}
              >
                이 지역에서 검색
              </button>
            ) : (
            <button
              type="button"
              onClick={() => {
                if (!searchCenter) return
                void resetAndLoad(searchCenter)
              }}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !searchCenter}
            >
              새로고침
            </button>
            )}
          </div>
        </div>

        {geoMessage ? (
          <div className="border-b border-zinc-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {geoMessage}
          </div>
        ) : null}

        {mapError ? (
          <div className="border-b border-zinc-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {mapError}
          </div>
        ) : null}

        <div className="relative">
          <div ref={mapContainerRef} className="aspect-[16/10] w-full bg-zinc-100" />
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-zinc-700">
              불러오는 중…
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">카페 목록</h3>
            <p className="mt-1 text-xs text-zinc-600">
              거리순으로 정렬됩니다. (무한 스크롤)
            </p>
          </div>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {nearby.items.length}개
          </span>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        <div className={`mt-4 space-y-2 overflow-auto pr-1 ${listMaxHeightClass}`}>
          {nearby.items.length === 0 && !loading ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              결과가 없어요. 반경을 늘리거나 새로고침을 눌러보세요.
            </div>
          ) : (
            nearby.items.map((cafe) => (
              <div
                key={cafe.id}
                className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        {cafe.name}
                        {cafe.branch ? (
                          <span className="text-zinc-600"> {cafe.branch}</span>
                        ) : null}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {formatDistance(cafe.distance)}
                      </span>
                      {typeof cafe.rating === 'number' ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          평점 {cafe.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-600">{cafe.address}</p>
                    {cafe.phoneNumber ? (
                      <p className="mt-1 text-xs text-zinc-500">{cafe.phoneNumber}</p>
                    ) : null}
                  </div>
                </div>
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
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              더 이상 결과가 없습니다.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


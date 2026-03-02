import { useEffect, useMemo, useState } from 'react'

export type LatLng = { latitude: number; longitude: number }

type GeoState =
  | { status: 'loading'; location: LatLng; message?: string }
  | { status: 'ready'; location: LatLng; message?: string }

const SEOUL_CITY_HALL: LatLng = { latitude: 37.5665, longitude: 126.978 }

export function useGeolocationOrSeoul() {
  const hasGeolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const [state, setState] = useState<GeoState>({
    status: hasGeolocation ? 'loading' : 'ready',
    location: SEOUL_CITY_HALL,
    message: hasGeolocation
      ? undefined
      : '이 브라우저에서는 위치 기능을 지원하지 않아 서울시청을 기본 위치로 사용합니다.',
  })

  useEffect(() => {
    if (!hasGeolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'ready',
          location: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        })
      },
      () => {
        setState({
          status: 'ready',
          location: SEOUL_CITY_HALL,
          message: '위치 권한을 사용할 수 없어 서울시청을 기본 위치로 사용합니다.',
        })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  }, [hasGeolocation])

  const locationText = useMemo(
    () => `${state.location.latitude.toFixed(5)}, ${state.location.longitude.toFixed(5)}`,
    [state.location.latitude, state.location.longitude],
  )

  return { ...state, locationText }
}


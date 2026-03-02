import type { ApiResponse, CafeNearbyItem, CursorPage } from './types'

export type FetchNearbyParams = {
  baseUrl: string
  latitude: number
  longitude: number
  radiusMeters?: number
  size?: number
  cursor?: string
  signal?: AbortSignal
}

export async function fetchNearbyCafes({
  baseUrl,
  latitude,
  longitude,
  radiusMeters,
  size,
  cursor,
  signal,
}: FetchNearbyParams): Promise<CursorPage<CafeNearbyItem>> {
  const url = new URL('/api/v1/cafes/nearby', baseUrl)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  if (typeof radiusMeters === 'number') url.searchParams.set('radius', String(radiusMeters))
  if (typeof size === 'number') url.searchParams.set('size', String(size))
  if (cursor) url.searchParams.set('cursor', cursor)

  const res = await fetch(url.toString(), { signal })
  const json = (await res.json()) as ApiResponse<CursorPage<CafeNearbyItem>>

  if (!json.success) {
    throw new Error(json.error?.message || '요청에 실패했습니다.')
  }

  return json.data
}


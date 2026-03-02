export type CafeNearbyItem = {
  id: number
  name: string
  branch: string | null
  address: string
  phoneNumber: string | null
  rating: number | null
  latitude: number
  longitude: number
  distance: number // meters (server-provided)
}

export type CursorPage<TItem> = {
  items: TItem[]
  nextCursor: string | null
  hasMore: boolean
}

export type ApiError = {
  code: string
  message: string
}

export type ApiResponse<TData> =
  | { success: true; data: TData; error: null }
  | { success: false; data: null; error: ApiError }


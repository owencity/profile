let loadPromise: Promise<void> | null = null

function hasNaverMaps(): boolean {
  const w = window as unknown as { naver?: unknown }
  const naver = w.naver
  if (!naver || typeof naver !== 'object') return false
  const maps = (naver as { maps?: unknown }).maps
  return Boolean(maps)
}

export async function loadNaverMaps(ncpKeyId: string): Promise<void> {
  if (hasNaverMaps()) return
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    if (!ncpKeyId) {
      reject(new Error('VITE_NAVER_MAPS_KEY_ID가 설정되어 있지 않습니다.'))
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-naver-maps="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('네이버 지도 스크립트 로드 실패')))
      return
    }

    const script = document.createElement('script')
    script.dataset.naverMaps = 'true'
    script.async = true
    script.defer = true
    // Docs: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(ncpKeyId)}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'))
    document.head.appendChild(script)
  })

  return loadPromise
}


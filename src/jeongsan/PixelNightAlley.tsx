/**
 * H0(내 모임) 전용 배경 — 골목 야경. `pixelAlley.ts` 의 얇은 React 래퍼.
 *
 * 로그인의 `PixelCitySky`(노을 도시)와 **다른 그림이다.** 화면마다 배경을
 * 새로 그린다는 규칙을 따른다.
 */
import { useEffect, useRef } from 'react'
import { init, destroy } from './pixelAlley'

export function PixelNightAlley() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    init(ref.current)
    return () => destroy()
  }, [])

  return <canvas ref={ref} className="js-pixelcity" aria-hidden="true" />
}

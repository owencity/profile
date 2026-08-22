/**
 * 로그인 화면 전체 배경 — docs/pixel-sunset-bg.html 을 그대로 포팅한
 * 캔버스 도트 렌더러(pixelSunset.ts)의 얇은 React 래퍼.
 *
 * 렌더링 로직은 전부 pixelSunset.ts 에 있다. 여기서는 canvas ref 를 잡아
 * init()/destroy() 만 연결한다.
 */
import { useEffect, useRef } from 'react'
import { init, destroy } from './pixelSunset'

export function PixelCitySky() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    init(ref.current)
    return () => destroy()
  }, [])

  return <canvas ref={ref} className="js-pixelcity" aria-hidden="true" />
}

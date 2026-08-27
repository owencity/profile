/**
 * 좌우 여백에 깔리는 밤골목 배경.
 *
 * **본문 뒤가 아니라 옆이다.** 데스크톱에서 본문이 880px 를 쓰고 남는 공간이
 * 그냥 비어 있었다. 배경을 본문 뒤에 깔면 글씨가 안 읽히므로 거터에만 넣는다.
 *
 * 좁은 화면에서는 거터 자체가 없으므로 CSS 로 숨긴다 — 모바일은 앱처럼
 * 화면을 꽉 채워야 한다.
 */
import { useEffect, useRef } from 'react'
import { init, destroy } from './pixelStreet'

export function SideStreet() {
  const left = useRef<HTMLCanvasElement>(null)
  const right = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // 한 장면을 계산해 양쪽에 함께 찍는다. 두 번 계산하면 CPU 를 두 배로 쓴다.
    init([left.current, right.current].filter(Boolean) as HTMLCanvasElement[])
    return () => destroy()
  }, [])

  return (
    <div className="js-sides" aria-hidden="true">
      <canvas ref={left} className="js-side js-side-l" />
      {/* 오른쪽은 좌우를 뒤집어 마주보게 한다 — 같은 그림이 두 번 있는 티가 덜 난다 */}
      <canvas ref={right} className="js-side js-side-r" />
    </div>
  )
}

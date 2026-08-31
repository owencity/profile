/**
 * 좌우 여백에 깔리는 밤골목 배경.
 *
 * **본문 뒤가 아니라 옆이다.** 데스크톱에서 본문이 880px 를 쓰고 남는 공간이
 * 그냥 비어 있었다. 배경을 본문 뒤에 깔면 글씨가 안 읽히므로 거터에만 넣는다.
 *
 * **좌우가 서로 다른 그림이다.** 왼쪽은 밤골목(벚나무·포장마차), 오른쪽은
 * 강변(다리·물 반사·편의점). 같은 그림을 뒤집어 쓰면 대칭이라 반복이 눈에 띈다.
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
    // 왼쪽 캔버스엔 골목, 오른쪽 캔버스엔 강변이 그려진다(pixelStreet 이 결정).
    init([left.current, right.current].filter(Boolean) as HTMLCanvasElement[])
    return () => destroy()
  }, [])

  return (
    <div className="js-sides" aria-hidden="true">
      <canvas ref={left} className="js-side js-side-l" />
      {/* 오른쪽은 왼쪽을 뒤집은 게 아니라 **다른 그림**이다 — 강변 야경 */}
      <canvas ref={right} className="js-side js-side-r" />
    </div>
  )
}

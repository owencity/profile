import { useEffect, useRef } from 'react'
import { SPRITE_H, SPRITE_W, drawHost, levelOf, titleOf } from './hostSprite'

/**
 * 국자 총무 캐릭터. `spoons`(누적 스푼)로 단계가 정해진다.
 * `px`는 논리 픽셀 하나의 CSS 크기 — 2.2면 약 44px, 5면 100px.
 */
export function HostCharacter({ spoons, px = 2.2 }: { spoons: number; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const lv = levelOf(spoons)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const scale = Math.max(1, Math.round(px * Math.min(window.devicePixelRatio || 1, 3)))
    cv.width = SPRITE_W * scale
    cv.height = SPRITE_H * scale

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    drawHost(ctx, lv, 0, scale)
    if (still) return
    const id = window.setInterval(() => drawHost(ctx, lv, ++frame, scale), 460)
    return () => window.clearInterval(id)
  }, [lv, px])

  return (
    <canvas
      ref={ref}
      className="js-hostchar"
      role="img"
      aria-label={`${titleOf(spoons)} 캐릭터`}
      style={{ width: SPRITE_W * px, height: SPRITE_H * px }}
    />
  )
}

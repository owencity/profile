/**
 * 로그인 히어로 배경 — 도트(픽셀아트) 느낌의 노을 도시, 정적 이미지가 아니라 움직인다.
 *
 * 참고 이미지(픽셀아트 노을 스카이라인)의 톤만 가져왔다 — 그대로 베끼지 않았다.
 * 색은 브랜드 토큰을 그대로 쓴다: 하늘 위쪽은 아이콘 배경(#1B4F9C~#2C74D6),
 * 지평선 쪽은 아이콘 ÷ 기호의 오렌지(#FFB03A~#FF9A3D) — 새 색을 도입하지 않았다.
 *
 * "도트 느낌"은 부드러운 그라디언트 대신 각진 사각형(rect)만으로 건물·구름·별을
 * 만들고 shape-rendering="crispEdges" 로 안티에일리어싱을 끈 것으로 낸다.
 *
 * 움직이는 것 셋 — 전부 opacity/transform 만 애니메이션한다(레이아웃 재계산 없음):
 *   ① 별 반짝임    각 별마다 다른 delay 로 opacity 가 오르내린다
 *   ② 창문 불빛    건물 창문 중 일부가 느리게 켜졌다 꺼진다
 *   ③ 구름 표류    저해상도 구름 덩어리가 아주 느리게 좌우로 흔들린다
 *
 * 좌표는 매 렌더마다 안 바뀌게 모듈 스코프에서 한 번만 만든다 — 재렌더 때마다
 * 별이 다른 자리에서 반짝이면 "움직인다"가 아니라 "깜빡거린다"로 보인다.
 */

type Star = { x: number; y: number; size: number; delay: number; dur: number }
type Window_ = { x: number; y: number; delay: number; dur: number }
type Building = { x: number; w: number; h: number }

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const rand = seeded(20260821)

const STARS: Star[] = Array.from({ length: 34 }, () => ({
  x: rand() * 400,
  y: rand() * 92,
  size: rand() > 0.82 ? 2 : 1,
  delay: rand() * 4,
  dur: 2.2 + rand() * 2.2,
}))

const BUILDINGS: Building[] = (() => {
  const list: Building[] = []
  let x = -6
  while (x < 406) {
    const w = 26 + Math.floor(rand() * 30)
    const h = 44 + Math.floor(rand() * 74)
    list.push({ x, w, h })
    x += w + 3 + Math.floor(rand() * 5)
  }
  return list
})()

const WINDOWS: Window_[] = BUILDINGS.flatMap((b) => {
  const cols = Math.max(1, Math.floor(b.w / 11))
  const rows = Math.max(1, Math.floor(b.h / 13))
  const out: Window_[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > 0.52) continue
      out.push({
        x: b.x + 4 + c * 11,
        y: 148 - b.h + 6 + r * 13,
        delay: rand() * 6,
        dur: 4 + rand() * 6,
      })
    }
  }
  return out
})

export function PixelCitySky() {
  return (
    <svg
      className="js-pixelcity"
      viewBox="0 0 400 148"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pcSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12386f" />
          <stop offset="38%" stopColor="#1b4f9c" />
          <stop offset="66%" stopColor="#a85a3d" />
          <stop offset="86%" stopColor="#e07b1c" />
          <stop offset="100%" stopColor="#ffb03a" />
        </linearGradient>
        <radialGradient id="pcSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity=".95" />
          <stop offset="60%" stopColor="#ff9a3d" stopOpacity=".55" />
          <stop offset="100%" stopColor="#ff9a3d" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="148" fill="url(#pcSky)" />

      <g className="js-pc-sun">
        <rect x="150" y="66" width="100" height="100" fill="url(#pcSun)" />
      </g>

      {STARS.map((s, i) => (
        <rect
          key={i}
          className="js-pc-star"
          x={s.x}
          y={s.y}
          width={s.size}
          height={s.size}
          fill="#ffffff"
          style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}

      <g className="js-pc-cloud js-pc-cloud-a" fill="#f3f8ff" opacity=".22">
        <rect x="30" y="26" width="14" height="4" />
        <rect x="24" y="30" width="30" height="4" />
        <rect x="34" y="34" width="16" height="4" />
      </g>
      <g className="js-pc-cloud js-pc-cloud-b" fill="#f3f8ff" opacity=".16">
        <rect x="260" y="16" width="12" height="4" />
        <rect x="252" y="20" width="28" height="4" />
        <rect x="264" y="24" width="14" height="4" />
      </g>

      <g fill="#12386f">
        {BUILDINGS.map((b, i) => (
          <rect key={i} x={b.x} y={148 - b.h} width={b.w} height={b.h} />
        ))}
      </g>

      {WINDOWS.map((w, i) => (
        <rect
          key={i}
          className="js-pc-window"
          x={w.x}
          y={w.y}
          width="4"
          height="5"
          fill="#ffcf87"
          style={{ animationDelay: `${w.delay}s`, animationDuration: `${w.dur}s` }}
        />
      ))}
    </svg>
  )
}

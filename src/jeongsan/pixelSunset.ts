/**
 * PixelSunset — 절차적 픽셀 도트 석양 시티뷰 (의존성 없음)
 *
 * docs/pixel-sunset-bg.html 에서 그대로 옮겼다. 그 파일 자체가 "그대로 컴포넌트로
 * 옮기면 된다"는 포팅용 완성본이라 알고리즘은 손대지 않았다 — 아래 항목은 원본
 * 주석이 명시적으로 경고한 것들이라 리팩터링하지 않는다:
 *
 *   - ctx.fillRect 대신 ImageData에 픽셀을 직접 쓴다. 안티에일리어싱을 완전히
 *     배제해야 "진짜 도트"로 보인다 — fillRect/drawImage로 바꾸면 뭉개진다.
 *   - 그라데이션은 CSS gradient가 아니라 13단계 팔레트 + 베이어 4x4 디더링이다.
 *   - fps 12는 의도한 값이다. 60fps로 올리면 도트 애니 특유의 느낌이 사라진다.
 *
 * PixelCitySky.tsx 가 useEffect 안에서 init(canvas) 를 부르고 cleanup 에서
 * destroy() 를 부른다. 모듈 스코프 상태를 쓰므로(원본과 동일) 동시에 두 개
 * 이상 마운트하지 않는다 — 로그인 화면 하나에서만 쓰므로 문제 없다.
 */

type RGB = number[]

const CFG = {
  seed: 20260821,
  fps: 12,
  targetArtWidth: 460,
  minPixel: 2,
  maxPixel: 12,
  glowX: 0.66,
}

const SKY: RGB[] = [
  [13, 17, 38], [19, 25, 52], [27, 32, 68], [39, 37, 82],
  [55, 44, 90], [76, 51, 94], [102, 58, 93], [131, 69, 87],
  [163, 84, 78], [194, 105, 71], [219, 131, 71], [237, 163, 85],
  [248, 196, 114],
]

const WATER: RGB[] = [
  [44, 31, 50], [38, 28, 48], [33, 26, 47],
  [29, 24, 46], [26, 23, 45], [24, 22, 44],
]

const C = {
  farBuild: [46, 42, 74],
  build: [17, 16, 33],
  buildAlt: [23, 21, 43],
  buildEdge: [31, 28, 54],
  win: [255, 205, 120],
  winWarm: [255, 172, 88],
  winPale: [255, 232, 176],
  winCool: [150, 190, 232],
  bridge: [14, 13, 28],
  bridgeLit: [255, 190, 110],
  fg: [7, 8, 18],
  fgSoft: [12, 13, 27],
  lamp: [255, 214, 140],
  phone: [176, 214, 255],
  star: [214, 224, 255],
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
const bayer = (x: number, y: number) => BAYER[y & 3][x & 3] / 16

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

let cv: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let img: ImageData
let data: Uint8ClampedArray
let W = 0, H = 0
let scene: any = null
let rafId = 0
let running = false
let startTime = 0
let lastDraw = -1e9
let resizeTimer = 0

function px(x: number, y: number, c: RGB) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = (y * W + x) << 2
  data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
}

function rect(x: number, y: number, w: number, h: number, c: RGB) {
  const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0)
  const x1 = Math.min(W, (x + w) | 0), y1 = Math.min(H, (y + h) | 0)
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) << 2
    for (let xx = x0; xx < x1; xx++) {
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
      i += 4
    }
  }
}

const hline = (x: number, y: number, len: number, c: RGB) => rect(x, y, len, 1, c)
const vline = (x: number, y: number, len: number, c: RGB) => rect(x, y, 1, len, c)

function warm(c: RGB, amt: number, x: number, y: number): RGB {
  const q = Math.floor(amt * 6 + bayer(x, y)) / 6
  if (q <= 0) return c
  return [
    clamp(c[0] + q * 92, 0, 255),
    clamp(c[1] + q * 56, 0, 255),
    clamp(c[2] + q * 22, 0, 255),
  ]
}

function buildScene(w: number, h: number) {
  const rnd = mulberry32(CFG.seed)
  const s: any = { W: w, H: h }

  s.pavementTop = h - clamp(Math.round(h * 0.085), 14, 26)
  s.railTop = s.pavementTop - clamp(Math.round(h * 0.075), 14, 24)
  s.horizonY = clamp(
    s.railTop - clamp(Math.round(h * 0.10), 18, 34),
    Math.round(h * 0.30), h - 50
  )
  s.glowCx = Math.round(w * CFG.glowX)

  s.far = []
  for (let x = -8; x < w + 10;) {
    const bw = 10 + Math.floor(rnd() * 22)
    const bh = 10 + Math.floor(rnd() * Math.min(46, s.horizonY - 16))
    s.far.push({ x, w: bw, h: bh })
    x += bw + Math.floor(rnd() * 4)
  }

  s.near = []
  for (let x = -6; x < w + 12;) {
    const bw = 9 + Math.floor(rnd() * 20)
    const bh = 16 + Math.floor(rnd() * Math.min(78, s.horizonY - 14))
    const top = s.horizonY - bh
    const b: any = {
      x, w: bw, h: bh, top,
      color: rnd() < 0.45 ? C.buildAlt : C.build,
      wins: [] as any[],
    }

    for (let wy = top + 3; wy < s.horizonY - 3; wy += 4) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
        if (rnd() < 0.30) continue
        const roll = rnd()
        const col = roll < 0.06 ? C.winCool
          : roll < 0.30 ? C.winPale
          : roll < 0.68 ? C.win
          : C.winWarm
        b.wins.push({
          x: wx, y: wy, c: col,
          base: rnd() < 0.58,
          phase: rnd() * 100,
          rate: 0.03 + rnd() * 0.10,
        })
      }
    }
    s.near.push(b)
    x += bw + (rnd() < 0.34 ? 1 + Math.floor(rnd() * 3) : 0)
  }

  const bx0 = Math.round(w * 0.01)
  const bx1 = Math.round(w * 0.36)
  const span = bx1 - bx0
  s.bridge = {
    x0: bx0, x1: bx1,
    t1: bx0 + Math.round(span * 0.30),
    t2: bx0 + Math.round(span * 0.76),
    deckY: s.horizonY - Math.round(clamp(h * 0.045, 10, 20)),
    towerH: Math.round(clamp(h * 0.17, 34, 62)),
    lights: [] as any[],
  }
  for (let x = bx0 + 3; x < bx1; x += 7) {
    s.bridge.lights.push({ x, phase: rnd() * 100 })
  }

  s.clouds = []
  const cloudN = 5 + Math.floor(rnd() * 3)
  for (let i = 0; i < cloudN; i++) {
    const cw = 30 + Math.floor(rnd() * 70)
    const ch = 3 + Math.floor(rnd() * 4)
    const rows = []
    for (let r = 0; r < ch; r++) {
      const inset = Math.round(Math.abs(r - (ch - 1) * 0.6) * (2 + rnd() * 4))
      rows.push({ dx: inset + Math.floor(rnd() * 4), w: cw - inset * 2 })
    }
    s.clouds.push({
      x: rnd() * (w + 120) - 60,
      y: Math.round(s.horizonY * (0.30 + rnd() * 0.58)),
      rows,
      speed: 0.9 + rnd() * 2.2,
    })
  }

  s.stars = []
  const starN = Math.round(w * h * 0.0009)
  for (let i = 0; i < starN; i++) {
    s.stars.push({
      x: Math.floor(rnd() * w),
      y: Math.floor(rnd() * s.horizonY * 0.52),
      phase: rnd() * 100,
      rate: 0.4 + rnd() * 1.6,
    })
  }

  s.reflect = []
  for (const b of s.near) {
    for (const wn of b.wins) {
      if (wn.y < s.horizonY - 26 && rnd() < 0.13) {
        s.reflect.push({ x: wn.x, c: wn.c, len: 2 + Math.floor(rnd() * 5), ph: rnd() * 100 })
      }
    }
  }

  s.lampX = Math.round(w * 0.085)
  s.personX = Math.round(w * 0.225)

  s.birds = []
  for (let i = 0; i < 6; i++) {
    s.birds.push({
      ox: i * 7 + Math.floor(rnd() * 5),
      oy: Math.floor(rnd() * 7) - 3,
      ph: rnd() * 6,
    })
  }
  s.birdY = Math.round(s.horizonY * 0.30)

  return s
}

function paintSky(t: number) {
  const s = scene, hz = s.horizonY, last = SKY.length - 1
  const glowR = Math.max(70, hz * 0.95)
  const gx = s.glowCx
  const pulse = 0.9 + Math.sin(t * 0.55) * 0.06

  for (let y = 0; y < hz; y++) {
    const f = (y / hz) * last
    const i0 = Math.floor(f), fr = f - i0
    const rowB = BAYER[y & 3]

    for (let x = 0; x < W; x++) {
      const idx = fr > rowB[x & 3] / 16 ? Math.min(i0 + 1, last) : i0
      let c = SKY[idx]

      const dx = (x - gx) * 0.62, dy = (y - hz) * 1.5
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < glowR) {
        const g = 1 - d / glowR
        c = warm(c, g * g * 0.85 * pulse, x, y)
      }
      const i = (y * W + x) << 2
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
    }
  }
}

function paintStars(t: number) {
  for (const st of scene.stars) {
    const tw = Math.sin(t * st.rate + st.phase)
    if (tw < -0.15) continue
    const a = 0.35 + tw * 0.35
    const base = SKY[Math.floor((st.y / scene.horizonY) * (SKY.length - 1))]
    px(st.x, st.y, [
      base[0] + (C.star[0] - base[0]) * a,
      base[1] + (C.star[1] - base[1]) * a,
      base[2] + (C.star[2] - base[2]) * a,
    ])
  }
}

function paintClouds(t: number) {
  const s = scene
  for (const cl of s.clouds) {
    let cx = cl.x + t * cl.speed
    const period = W + 160
    cx = ((cx % period) + period) % period - 80
    const cxi = Math.round(cx)

    const nearGlow = 1 - clamp(Math.abs(cl.y - s.horizonY) / (s.horizonY * 0.8), 0, 1)

    for (let r = 0; r < cl.rows.length; r++) {
      const row = cl.rows[r]
      const y = cl.y + r
      const isBottom = r >= cl.rows.length - 2
      const base = SKY[clamp(
        Math.floor((y / s.horizonY) * (SKY.length - 1)) + (isBottom ? 2 : -2),
        0, SKY.length - 1
      )]
      const lit = isBottom ? 0.30 + nearGlow * 0.55 : 0.05
      for (let x = cxi + row.dx; x < cxi + row.dx + row.w; x++) {
        px(x, y, warm(base, lit, x, y))
      }
    }
  }
}

function paintBirds(t: number) {
  const s = scene
  const cycle = 26
  const p = (t % cycle) / cycle
  if (p > 0.55) return
  const headX = -30 + (p * (W + 90)) / 0.55
  for (const b of s.birds) {
    const x = Math.round(headX - b.ox)
    const y = Math.round(s.birdY + b.oy + Math.sin(t * 0.5 + b.ph) * 3)
    const up = Math.sin(t * 7 + b.ph) > 0
    const c = [30, 30, 52]
    if (up) { px(x - 1, y - 1, c); px(x, y, c); px(x + 1, y - 1, c) }
    else { px(x - 1, y + 1, c); px(x, y, c); px(x + 1, y + 1, c) }
  }
}

function paintFarSkyline() {
  const s = scene
  for (const b of s.far) {
    const top = s.horizonY - b.h
    for (let y = top; y < s.horizonY; y++) {
      const k = (y - top) / Math.max(1, b.h)
      const sky = SKY[clamp(Math.floor((y / s.horizonY) * (SKY.length - 1)), 0, SKY.length - 1)]
      const c = [
        C.farBuild[0] + (sky[0] - C.farBuild[0]) * k * 0.55,
        C.farBuild[1] + (sky[1] - C.farBuild[1]) * k * 0.55,
        C.farBuild[2] + (sky[2] - C.farBuild[2]) * k * 0.55,
      ]
      hline(b.x, y, b.w, c)
    }
  }
}

function paintBridge(t: number) {
  const s = scene, br = s.bridge
  const towerTop1 = br.deckY - br.towerH
  const sag = Math.round(br.towerH * 0.55)

  const cableY = (x: number) => {
    if (x < br.t1) {
      const k = (x - br.x0) / Math.max(1, br.t1 - br.x0)
      return Math.round(br.deckY - 2 - (towerTop1 - br.deckY + 2) * -k)
    }
    if (x > br.t2) {
      const k = (x - br.t2) / Math.max(1, br.x1 - br.t2)
      return Math.round(towerTop1 + (br.deckY - 2 - towerTop1) * k)
    }
    const k = (x - br.t1) / Math.max(1, br.t2 - br.t1)
    return Math.round(towerTop1 + Math.sin(k * Math.PI) * sag)
  }

  for (let x = br.x0; x <= br.x1; x++) {
    const cy = cableY(x)
    px(x, cy, C.bridge)
    if (x % 5 === 0 && cy < br.deckY - 2) {
      vline(x, cy, br.deckY - cy, C.bridge)
    }
  }

  rect(br.x0, br.deckY, br.x1 - br.x0, 2, C.bridge)
  rect(br.t1 - 1, towerTop1, 2, br.deckY - towerTop1 + 2, C.bridge)
  rect(br.t2 - 1, towerTop1, 2, br.deckY - towerTop1 + 2, C.bridge)

  for (const l of br.lights) {
    const f = Math.sin(t * 1.6 + l.phase)
    if (f < -0.75) continue
    px(l.x, br.deckY - 1, C.bridgeLit)
    if (f > 0.6) {
      px(l.x, br.deckY - 2, [255, 224, 168])
    }
  }
}

function paintNearSkyline(t: number) {
  const s = scene
  for (const b of s.near) {
    rect(b.x, b.top, b.w, b.h, b.color)
    hline(b.x, b.top, b.w, C.buildEdge)

    for (const wn of b.wins) {
      const wave = Math.sin(t * wn.rate + wn.phase)
      const on = wn.base ? wave > -0.9 : wave > 0.86
      if (!on) continue
      rect(wn.x, wn.y, 2, 2, wn.c)
    }
  }
}

function paintWater(t: number) {
  const s = scene
  const top = s.horizonY, bot = s.pavementTop
  const depth = Math.max(1, bot - top)
  const wLast = WATER.length - 1

  for (let y = top; y < bot; y++) {
    const k = (y - top) / depth
    const f = k * wLast
    const i0 = Math.floor(f), fr = f - i0
    const rowB = BAYER[y & 3]
    const nearHz = Math.pow(1 - k, 3.4)

    for (let x = 0; x < W; x++) {
      const idx = fr > rowB[x & 3] / 16 ? Math.min(i0 + 1, wLast) : i0
      let c = WATER[idx]

      if (nearHz > 0.02) c = warm(c, nearHz * 0.16, x, y)

      const dcol = Math.abs(x - s.glowCx)
      const width = 8 + k * 40
      if (dcol < width) {
        const g = (1 - dcol / width) * (1 - k * 0.55)
        const wob = Math.sin(y * 0.9 + t * 2.4) * 0.5 + 0.5
        c = warm(c, g * g * 0.95 * (0.40 + wob * 0.60), x, y)
      }
      const i = (y * W + x) << 2
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
    }

    if ((y - top) % 3 === 1) {
      const off = Math.round(Math.sin(y * 1.7 + t * 1.9) * 9)
      const hl = WATER[clamp(i0 - 1, 0, wLast)]
      for (let x = ((off % 7) + 7) % 7; x < W; x += 7) {
        px(x, y, [hl[0] + 9, hl[1] + 7, hl[2] + 13])
      }
    }
  }

  for (const r of scene.reflect) {
    for (let i = 0; i < r.len; i++) {
      const y = top + 1 + i * 2
      if (y >= bot) break
      const wob = Math.round(Math.sin(t * 2.1 + r.ph + i * 0.9) * 1.7)
      const fade = (1 - i / r.len) * 0.34
      const base = WATER[clamp(Math.floor(((i * 2) / depth) * (WATER.length - 1)), 0, WATER.length - 1)]
      px(r.x + wob, y, [
        base[0] + r.c[0] * fade,
        base[1] + r.c[1] * fade * 0.8,
        base[2] + r.c[2] * fade * 0.55,
      ])
    }
  }

  hline(0, top, W, [12, 14, 32])
}

function paintForeground(t: number) {
  const s = scene

  rect(0, s.pavementTop, W, H - s.pavementTop, C.fg)
  for (let y = s.pavementTop + 2; y < H; y += 3) {
    for (let x = (y * 5) % 9; x < W; x += 9) px(x, y, C.fgSoft)
  }

  const railBot = s.pavementTop
  rect(0, s.railTop, W, 2, C.fg)
  hline(0, s.railTop - 1, W, [26, 26, 50])
  hline(0, railBot - 4, W, C.fg)
  for (let x = 0; x < W; x += 9) {
    vline(x, s.railTop, railBot - s.railTop - 3, C.fg)
  }

  const lx = s.lampX
  const lampTop = s.railTop - Math.round(clamp(H * 0.20, 34, 68))
  vline(lx, lampTop, s.pavementTop - lampTop, C.fg)
  hline(lx, lampTop, 6, C.fg)
  px(lx + 6, lampTop + 1, C.fg)
  const headX = lx + 6, headY = lampTop + 2

  const flick = 0.86 + Math.sin(t * 3.1) * 0.05 + Math.sin(t * 11.3) * 0.03
  const gr = 22
  for (let dy = -gr; dy <= gr; dy++) {
    for (let dx = -gr; dx <= gr; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > gr) continue
      const x = headX + dx, y = headY + dy
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const g = 1 - d / gr
      const i = (y * W + x) << 2
      const c = warm([data[i], data[i + 1], data[i + 2]], g * g * g * 1.15 * flick, x, y)
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]
    }
  }
  rect(headX - 1, headY, 3, 3, C.lamp)
  rect(headX - 1, headY + 3, 3, 1, [255, 236, 190])

  const pxx = s.personX, feet = s.pavementTop + 1
  const headTop = feet - 34
  rect(pxx - 2, headTop, 5, 5, C.fg)
  rect(pxx - 1, headTop + 5, 3, 2, C.fg)
  rect(pxx - 4, headTop + 6, 9, 13, C.fg)
  rect(pxx - 6, headTop + 9, 3, 7, C.fg)
  rect(pxx - 3, headTop + 19, 3, 15, C.fg)
  rect(pxx + 1, headTop + 19, 3, 15, C.fg)
  const ph = 0.65 + Math.sin(t * 1.3) * 0.35
  rect(pxx - 7, headTop + 10, 2, 2, [
    C.phone[0] * ph, C.phone[1] * ph, C.phone[2] * ph,
  ])
  px(pxx - 6, headTop + 7, [C.phone[0] * ph * 0.42 + 22, C.phone[1] * ph * 0.42 + 22, C.phone[2] * ph * 0.5 + 34])
  px(pxx - 5, headTop + 6, [C.phone[0] * ph * 0.22 + 18, C.phone[1] * ph * 0.22 + 18, C.phone[2] * ph * 0.3 + 28])

  const dx0 = pxx + 9
  rect(dx0, feet - 9, 10, 6, C.fg)
  rect(dx0 + 8, feet - 13, 4, 4, C.fg)
  px(dx0 + 8, feet - 14, C.fg)
  px(dx0 + 11, feet - 14, C.fg)
  rect(dx0 + 1, feet - 3, 2, 3, C.fg)
  rect(dx0 + 6, feet - 3, 2, 3, C.fg)
  const wag = Math.sin(t * 6) > 0 ? -2 : -4
  px(dx0 - 1, feet - 9, C.fg)
  rect(dx0 - 2, feet - 9 + wag, 2, 2, C.fg)

  const vh = Math.round(H * 0.16)
  for (let y = 0; y < vh; y++) {
    const a = (1 - y / vh) * 0.5
    const q = Math.floor(a * 5 + bayer(0, y)) / 5
    if (q <= 0) continue
    for (let x = 0; x < W; x++) {
      if (bayer(x, y) > a) continue
      const i = (y * W + x) << 2
      data[i] *= 0.55; data[i + 1] *= 0.55; data[i + 2] *= 0.62
    }
  }
}

function drawFrame(t: number) {
  paintSky(t)
  paintStars(t)
  paintClouds(t)
  paintBirds(t)
  paintFarSkyline()
  paintBridge(t)
  paintNearSkyline(t)
  paintWater(t)
  paintForeground(t)
  ctx.putImageData(img, 0, 0)
}

function loop(now: number) {
  if (!running) return
  rafId = requestAnimationFrame(loop)
  const interval = 1000 / CFG.fps
  if (now - lastDraw < interval) return
  lastDraw = now
  drawFrame((now - startTime) / 1000)
}

function resize() {
  const vw = Math.max(1, window.innerWidth)
  const vh = Math.max(1, window.innerHeight)
  const pixelSize = clamp(Math.round(vw / CFG.targetArtWidth), CFG.minPixel, CFG.maxPixel)

  W = Math.ceil(vw / pixelSize)
  H = Math.ceil(vh / pixelSize)

  cv.width = W
  cv.height = H
  ctx = cv.getContext('2d', { alpha: false })!
  ctx.imageSmoothingEnabled = false

  img = ctx.createImageData(W, H)
  data = img.data
  scene = buildScene(W, H)

  drawFrame((performance.now() - startTime) / 1000)
}

function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(resize, 140)
}

export function init(canvasEl: HTMLCanvasElement) {
  cv = canvasEl
  startTime = performance.now()
  resize()
  window.addEventListener('resize', onResize)

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  running = true
  rafId = requestAnimationFrame(loop)
}

export function destroy() {
  running = false
  cancelAnimationFrame(rafId)
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', onResize)
}

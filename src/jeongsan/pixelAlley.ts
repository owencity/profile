/**
 * PixelAlley — 절차적 픽셀 도트 골목 야경 (의존성 없음)
 *
 * H0(내 모임) 전용 배경. **로그인의 `pixelSunset` 과 다른 그림이다** —
 * 화면마다 배경을 새로 그린다는 규칙을 따른다.
 *
 * 왜 다르게 그리나
 *   로그인은 "들어오는 화면"이라 노을·개방감이 맞다.
 *   여기는 **목록 화면**이라 시선이 카드로 가야 한다. 그래서
 *   ① 전체를 어둡게 깔고 ② 밝은 것(등불·창문)을 화면 가장자리와 아래쪽에만 둔다.
 *   가운데를 비워야 카드가 읽힌다.
 *
 * 기법은 `pixelSunset` 과 같다 — ImageData 에 픽셀을 직접 쓰고, 베이어 4x4 디더링으로
 * 그라데이션을 도트로 흩뿌리고, 12fps 로 고정한다. fillRect/drawImage 로 바꾸면 뭉개진다.
 */

type RGB = number[]

const CFG = {
  seed: 20260826,
  fps: 12,
  targetArtWidth: 420, // 작을수록 픽셀이 굵어짐
  minPixel: 2,
  maxPixel: 12,
}

/**
 * 하늘 — 위쪽이 도시 불빛을 받아 붉게 뜨고 아래로 내려올수록 어두워진다.
 * 참고 이미지의 "역광 받은 녹슨 하늘"이 이 팔레트다.
 * **위쪽 4단계를 충분히 어둡게 유지한다** — 밝아지면 카드 위 흰 글씨가 죽는다.
 */
const SKY: RGB[] = [
  [ 26,  16,  20], [ 34,  20,  23], [ 44,  25,  26], [ 57,  30,  29],
  [ 72,  36,  32], [ 89,  44,  36], [106,  52,  40], [122,  60,  44],
  [136,  68,  49], [147,  76,  55],
]

const C = {
  farBuild:   [ 46,  30,  32],
  midBuild:   [ 30,  19,  22],
  nearBuild:  [ 16,  11,  14],
  edge:       [ 41,  27,  29],
  wire:       [ 10,   7,   9],
  pole:       [ 14,  10,  12],

  winWarm:    [255, 176,  96],
  winDim:     [186, 118,  66],
  winCool:    [140, 176, 190],

  lantern:    [217,  59,  43],
  lanternLit: [255, 122,  84],

  awning:     [ 22,  14,  17],
  stall:      [ 34,  22,  24],
  ground:     [ 19,  13,  16],
  groundWet:  [ 38,  24,  27],
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

/** 따뜻한 빛을 더한다. 6칸으로 끊고 디더링 → 그라데이션이 아니라 도트로 보인다. */
function warm(c: RGB, amt: number, x: number, y: number): RGB {
  const q = Math.floor(amt * 6 + bayer(x, y)) / 6
  if (q <= 0) return c
  return [
    clamp(c[0] + q * 104, 0, 255),
    clamp(c[1] + q * 52, 0, 255),
    clamp(c[2] + q * 26, 0, 255),
  ]
}

function buildScene(w: number, h: number) {
  const rnd = mulberry32(CFG.seed)
  const s: any = { W: w, H: h }

  s.groundY = h - clamp(Math.round(h * 0.16), 26, 70)
  s.skyBottom = Math.round(s.groundY * 0.52)

  /* --- 원경 건물: 하늘에 잠긴 실루엣 --- */
  s.far = []
  for (let x = -8; x < w + 10;) {
    const bw = 14 + Math.floor(rnd() * 26)
    const bh = 20 + Math.floor(rnd() * Math.round(s.skyBottom * 0.8))
    s.far.push({ x, w: bw, h: bh })
    x += bw + Math.floor(rnd() * 5)
  }

  /* --- 중경 건물 + 창문 --- */
  s.mid = []
  for (let x = -6; x < w + 12;) {
    const bw = 20 + Math.floor(rnd() * 30)
    const bh = Math.round(s.skyBottom * 0.55) + Math.floor(rnd() * Math.round(s.skyBottom * 0.7))
    const top = s.groundY - bh
    const b: any = { x, w: bw, h: bh, top, wins: [] }
    for (let wy = top + 5; wy < s.groundY - 8; wy += 6) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 6) {
        if (rnd() < 0.62) continue // 대부분 꺼져 있다 — 밝으면 카드가 안 읽힌다
        const roll = rnd()
        b.wins.push({
          x: wx, y: wy,
          c: roll < 0.12 ? C.winCool : roll < 0.55 ? C.winDim : C.winWarm,
          base: rnd() < 0.7,
          phase: rnd() * 100,
          rate: 0.04 + rnd() * 0.1,
        })
      }
    }
    s.mid.push(b)
    x += bw + (rnd() < 0.5 ? 1 + Math.floor(rnd() * 3) : 0)
  }

  /* --- 전신주와 전선 — 참고 이미지의 핵심 질감 --- */
  s.poles = []
  const poleGap = Math.max(46, Math.round(w * 0.3))
  for (let x = Math.round(poleGap * 0.4); x < w + poleGap; x += poleGap) {
    s.poles.push({
      x,
      top: s.groundY - Math.round(h * 0.34) - Math.floor(rnd() * 18),
      arms: 2 + Math.floor(rnd() * 2),
    })
  }

  /* --- 포장마차: 화면 아래 한쪽에만 둔다 --- */
  const stallW = Math.round(clamp(w * 0.3, 46, 96))
  s.stall = {
    x: Math.round(w * (rnd() < 0.5 ? 0.08 : 0.62)),
    w: stallW,
    h: Math.round(clamp(h * 0.1, 20, 44)),
  }

  /* --- 홍등: 포장마차 차양에 매단다 --- */
  s.lanterns = []
  const n = 3 + Math.floor(rnd() * 2)
  for (let i = 0; i < n; i++) {
    s.lanterns.push({
      x: s.stall.x + Math.round((stallW / (n + 1)) * (i + 1)),
      y: s.groundY - s.stall.h - 4 - Math.floor(rnd() * 3),
      r: 2 + Math.floor(rnd() * 2),
      phase: rnd() * 100,
      rate: 0.9 + rnd() * 1.4,
    })
  }

  /* --- 김(수증기): 포장마차에서 아주 느리게 오른다 --- */
  s.steam = []
  for (let i = 0; i < 7; i++) {
    s.steam.push({
      x: s.stall.x + Math.round(stallW * (0.25 + rnd() * 0.5)),
      off: rnd() * 100,
      speed: 2.2 + rnd() * 2.4,
      spread: 1 + rnd() * 2.5,
    })
  }

  return s
}

function paintSky(t: number) {
  const s = scene, last = SKY.length - 1
  const hz = s.skyBottom
  // 도시 불빛이 하늘에 반사되는 양이 아주 느리게 숨쉰다
  const pulse = 0.94 + Math.sin(t * 0.38) * 0.06

  for (let y = 0; y < s.groundY; y++) {
    // 하늘은 위(어두움)에서 skyBottom(가장 밝음)까지. 그 아래는 skyBottom 색 유지.
    const k = clamp(y / hz, 0, 1)
    const f = k * last
    const i0 = Math.floor(f), fr = f - i0
    const rowB = BAYER[y & 3]

    for (let x = 0; x < W; x++) {
      const idx = fr > rowB[x & 3] / 16 ? Math.min(i0 + 1, last) : i0
      let c = SKY[idx]
      if (k > 0.55) c = warm(c, (k - 0.55) * 0.5 * pulse, x, y)
      const i = (y * W + x) << 2
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
    }
  }
}

function paintFar() {
  const s = scene
  for (const b of s.far) {
    const top = s.groundY - b.h
    for (let y = top; y < s.groundY; y++) {
      // 아래로 갈수록 하늘빛에 잠긴다(대기 원근)
      const k = (y - top) / Math.max(1, b.h)
      const skyIdx = clamp(Math.floor((y / s.skyBottom) * (SKY.length - 1)), 0, SKY.length - 1)
      const sky = SKY[skyIdx]
      hline(b.x, y, b.w, [
        C.farBuild[0] + (sky[0] - C.farBuild[0]) * k * 0.5,
        C.farBuild[1] + (sky[1] - C.farBuild[1]) * k * 0.5,
        C.farBuild[2] + (sky[2] - C.farBuild[2]) * k * 0.5,
      ])
    }
  }
}

function paintMid(t: number) {
  const s = scene
  for (const b of s.mid) {
    rect(b.x, b.top, b.w, b.h, C.midBuild)
    hline(b.x, b.top, b.w, C.edge) // 옥상 한 줄 — 실루엣이 뭉치지 않게
    for (const wn of b.wins) {
      const wave = Math.sin(t * wn.rate + wn.phase)
      const on = wn.base ? wave > -0.88 : wave > 0.9
      if (!on) continue
      rect(wn.x, wn.y, 2, 2, wn.c)
    }
  }
}

/** 전신주와 전선. 전선은 늘어진 곡선(포물선)이라 직선으로 그으면 안 된다. */
function paintWires() {
  const s = scene
  for (let i = 0; i < s.poles.length; i++) {
    const p = s.poles[i]
    const next = s.poles[i + 1]

    vline(p.x, p.top, s.groundY - p.top, C.pole)
    for (let a = 0; a < p.arms; a++) {
      const ay = p.top + 4 + a * 5
      hline(p.x - 4, ay, 9, C.pole)
    }

    if (!next) continue
    const span = next.x - p.x
    for (let a = 0; a < Math.min(p.arms, next.arms); a++) {
      const y0 = p.top + 4 + a * 5
      const y1 = next.top + 4 + a * 5
      const sag = 4 + a * 2
      for (let x = p.x; x <= next.x; x++) {
        const k = (x - p.x) / Math.max(1, span)
        const y = Math.round(y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * sag)
        px(x, y, C.wire)
      }
    }
  }
}

function paintStall(t: number) {
  const s = scene
  const st = s.stall
  const top = s.groundY - st.h

  rect(st.x, top, st.w, st.h, C.stall)
  rect(st.x - 2, top - 3, st.w + 4, 3, C.awning) // 차양
  hline(st.x - 2, top - 4, st.w + 4, C.edge)

  // 안쪽에서 새어나오는 따뜻한 빛
  for (let y = top + 3; y < s.groundY - 2; y++) {
    for (let x = st.x + 2; x < st.x + st.w - 2; x++) {
      if (bayer(x, y) > 0.55) continue
      px(x, y, warm(C.stall, 0.5, x, y))
    }
  }

  // 홍등 — 불빛이 아주 살짝 흔들린다
  for (const l of s.lanterns) {
    const flick = 0.82 + Math.sin(t * l.rate + l.phase) * 0.1 + Math.sin(t * 5.7 + l.phase) * 0.06
    const gr = l.r + 5
    for (let dy = -gr; dy <= gr; dy++) {
      for (let dx = -gr; dx <= gr; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > gr) continue
        const x = l.x + dx, y = l.y + dy
        if (x < 0 || y < 0 || x >= W || y >= H) continue
        const g = 1 - d / gr
        const i = (y * W + x) << 2
        const c = warm([data[i], data[i + 1], data[i + 2]], g * g * g * 1.25 * flick, x, y)
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]
      }
    }
    rect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2 + 1, C.lantern)
    rect(l.x - l.r + 1, l.y - l.r + 1, l.r * 2 - 2, l.r * 2 - 1, C.lanternLit)
    vline(l.x, l.y - l.r - 2, 2, C.pole) // 매단 줄
  }

  // 김 — 위로 오르며 흩어진다
  for (const sm of s.steam) {
    for (let i = 0; i < 9; i++) {
      const age = ((t * sm.speed + sm.off + i * 2.4) % 22) / 22
      const y = Math.round(top - 4 - age * 26)
      const x = Math.round(sm.x + Math.sin(age * 5 + sm.off) * sm.spread * (0.4 + age))
      if (age > 0.92) continue
      const i2 = (y * W + x) << 2
      if (y < 0 || y >= H || x < 0 || x >= W) continue
      const fade = (1 - age) * 0.3
      data[i2] += (150 - data[i2]) * fade
      data[i2 + 1] += (128 - data[i2 + 1]) * fade
      data[i2 + 2] += (126 - data[i2 + 2]) * fade
    }
  }
}

function paintGround() {
  const s = scene
  rect(0, s.groundY, W, H - s.groundY, C.ground)
  hline(0, s.groundY, W, C.edge)

  // 젖은 바닥에 등불이 번진다 — 홍등 아래만 세로로 흔들리는 점선
  for (const l of scene.lanterns) {
    for (let i = 0; i < 7; i++) {
      const y = s.groundY + 2 + i * 2
      if (y >= H) break
      const fade = (1 - i / 7) * 0.5
      const wob = Math.round(Math.sin(i * 1.3 + l.phase) * 1.4)
      const x = l.x + wob
      if (x < 0 || x >= W) continue
      const idx = (y * W + x) << 2
      data[idx] += (C.lanternLit[0] - data[idx]) * fade
      data[idx + 1] += (C.lanternLit[1] - data[idx + 1]) * fade * 0.7
      data[idx + 2] += (C.lanternLit[2] - data[idx + 2]) * fade * 0.5
    }
  }

  // 바닥 질감
  for (let y = s.groundY + 3; y < H; y += 3) {
    for (let x = (y * 7) % 11; x < W; x += 11) px(x, y, C.groundWet)
  }
}

/**
 * 비네트 — **목록 화면이라 가운데를 더 눌러준다.**
 * 카드가 놓이는 중앙 세로 띠를 어둡게 해서 글씨가 배경과 안 싸우게 한다.
 */
function paintVignette() {
  const cx = W / 2
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - cx) / cx
      // 가운데(dx=0)에서 가장 어둡고 가장자리로 갈수록 밝기를 살린다
      const center = (1 - dx) * 0.34
      const edge = Math.pow(dx, 3) * 0.3
      const a = center + edge
      if (a <= 0.02) continue
      const q = Math.floor(a * 5 + bayer(x, y)) / 5
      if (q <= 0) continue
      const i = (y * W + x) << 2
      const k = 1 - q * 0.5
      data[i] *= k; data[i + 1] *= k; data[i + 2] *= k
    }
  }
}

function drawFrame(t: number) {
  paintSky(t)
  paintFar()
  paintMid(t)
  paintWires()
  paintStall(t)
  paintGround()
  paintVignette()
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

/**
 * PixelStreet — 절차적 픽셀 도트 밤골목 (의존성 없음)
 *
 * **화면 뒤가 아니라 좌우 여백에 깔린다.** 데스크톱에서 본문이 880px 를 쓰고 남는
 * 양옆 공간이 그냥 회색으로 비어 있었다. 배경을 본문 뒤에 깔면 글씨가 안 읽히므로,
 * 비어 있는 거터에만 넣는다.
 *
 * 세로로 긴 구도인 이유 — 거터가 좁고 길다. 참고한 그림도 세로 구도였다.
 *
 * 기법은 `pixelSunset`/`pixelAlley` 와 같다: ImageData 에 픽셀을 직접 쓰고,
 * 베이어 4x4 디더링으로 그라데이션을 도트로 흩뿌리고, 12fps 로 고정한다.
 * fillRect/drawImage 로 바꾸면 안티에일리어싱이 껴서 뭉개진다.
 *
 * **좌우가 서로 다른 그림이다.**
 *   왼쪽 — 밤골목: 벚나무·포장마차·홍등. 좁고 따뜻하고 빽빽하다.
 *   오른쪽 — 강변: 다리·건너편 스카이라인·물 위 긴 반사. 넓고 차갑고 비어 있다.
 * 같은 그림을 뒤집어 쓰면 양쪽이 대칭이라 눈에 띄게 반복으로 읽힌다. 대비를 주려고
 * 장면을 둘로 나눴다 — 그만큼 프레임마다 두 번 계산한다(12fps·150x420 이라 감당된다).
 */

type RGB = number[]

const CFG = {
  seed: 20260827,
  fps: 12,
  /** 거터 폭 기준 도트 크기. 작을수록 픽셀이 굵다. */
  artWidth: 150,
  artHeight: 420,
}

/** 밤하늘 — 위가 짙은 남보라, 아래로 갈수록 도시 불빛에 옅어진다. */
const SKY: RGB[] = [
  [ 46,  40,  56], [ 52,  45,  62], [ 58,  50,  68], [ 64,  55,  74],
  [ 70,  60,  80], [ 76,  65,  86], [ 82,  70,  92], [ 88,  75,  98],
]

const C = {
  farBuild:   [ 58,  54,  74],
  midBuild:   [ 44,  42,  60],
  nearBuild:  [ 30,  29,  44],
  roofTile:   [ 62,  46,  62],
  edge:       [ 74,  66,  90],

  trunk:      [ 34,  28,  40],
  branch:     [ 44,  36,  50],
  blossomA:   [148, 158, 214],
  blossomB:   [176, 186, 232],
  blossomC:   [120, 130, 190],

  awning:     [140,  52,  56],
  awningDark: [ 96,  36,  42],
  stall:      [ 58,  44,  44],
  stallLit:   [214, 158,  96],
  counter:    [ 84,  60,  50],

  lantern:    [222,  74,  62],
  lanternLit: [255, 138, 104],
  lanternBlue:[ 96, 148, 190],

  vendGlass:  [110, 180, 210],
  vendBody:   [ 44,  62,  76],
  vendLit:    [168, 226, 240],

  lampPost:   [ 40,  44,  56],
  lampGlow:   [190, 220, 226],

  ground:     [ 34,  32,  46],
  puddle:     [ 56,  60,  84],
  petal:      [190, 198, 236],
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

let targets: HTMLCanvasElement[] = []
let ctxs: CanvasRenderingContext2D[] = []
let img: ImageData
let data: Uint8ClampedArray
let W = 0, H = 0
let street: any = null
let river: any = null
let rafId = 0
let running = false
let startTime = 0
let lastDraw = -1e9

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

/** 빛을 더한다. 6칸으로 끊고 디더링 → 부드러운 번짐이 아니라 도트로 퍼진다. */
function glow(c: RGB, amt: number, x: number, y: number, tint: RGB): RGB {
  const q = Math.floor(amt * 6 + bayer(x, y)) / 6
  if (q <= 0) return c
  return [
    clamp(c[0] + (tint[0] - c[0]) * q * 0.9, 0, 255),
    clamp(c[1] + (tint[1] - c[1]) * q * 0.9, 0, 255),
    clamp(c[2] + (tint[2] - c[2]) * q * 0.9, 0, 255),
  ]
}

/** 광원 하나를 원형으로 번지게 한다. 이미 그려진 픽셀 위에 덧칠한다. */
function lightBlob(cx: number, cy: number, r: number, strength: number, tint: RGB) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > r) continue
      const x = cx + dx, y = cy + dy
      if (x < 0 || y < 0 || x >= W || y >= H) continue
      const g = (1 - d / r)
      const i = (y * W + x) << 2
      const c = glow([data[i], data[i + 1], data[i + 2]], g * g * strength, x, y, tint)
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]
    }
  }
}

function buildStreet(w: number, h: number) {
  const rnd = mulberry32(CFG.seed)
  const s: any = { W: w, H: h }

  s.groundY = Math.round(h * 0.78)
  s.skyBottom = Math.round(h * 0.34)

  /* --- 뒤쪽 빌딩 --- */
  s.far = []
  for (let x = -4; x < w + 6;) {
    const bw = 10 + Math.floor(rnd() * 16)
    const bh = 26 + Math.floor(rnd() * 58)
    s.far.push({ x, w: bw, h: bh, top: s.skyBottom - bh + 20 })
    x += bw + Math.floor(rnd() * 4)
  }

  /* --- 중간 건물: 창문이 몇 개 켜져 있다 --- */
  s.mid = []
  for (let x = -6; x < w + 8;) {
    const bw = 16 + Math.floor(rnd() * 20)
    const bh = 40 + Math.floor(rnd() * 60)
    const top = s.groundY - bh - 40
    const b: any = { x, w: bw, h: bh, top, wins: [] }
    for (let wy = top + 4; wy < top + bh - 5; wy += 7) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 6) {
        if (rnd() < 0.7) continue
        b.wins.push({ x: wx, y: wy, phase: rnd() * 100, rate: 0.05 + rnd() * 0.1 })
      }
    }
    s.mid.push(b)
    x += bw + 2 + Math.floor(rnd() * 4)
  }

  /* --- 벚나무: 화면 위쪽을 덮는다 --- */
  s.tree = { x: Math.round(w * 0.3), baseY: s.groundY - 6, h: Math.round(h * 0.42) }
  s.blossoms = []
  const bn = Math.round(w * 0.9)
  for (let i = 0; i < bn; i++) {
    // 나무 위쪽에 타원형으로 뭉친다
    const a = rnd() * Math.PI * 2
    const rr = Math.pow(rnd(), 0.6)
    s.blossoms.push({
      x: Math.round(s.tree.x + Math.cos(a) * rr * w * 0.36),
      y: Math.round(s.tree.baseY - s.tree.h + Math.sin(a) * rr * h * 0.13),
      c: rnd() < 0.34 ? C.blossomB : rnd() < 0.6 ? C.blossomA : C.blossomC,
      size: rnd() < 0.25 ? 2 : 1,
    })
  }
  s.branches = []
  for (let i = 0; i < 7; i++) {
    s.branches.push({
      a: -Math.PI * 0.85 + rnd() * Math.PI * 0.7,
      len: s.tree.h * (0.4 + rnd() * 0.45),
      from: 0.35 + rnd() * 0.4,
    })
  }

  /* --- 포장마차: 아래쪽 중앙 --- */
  const sw = Math.round(w * 0.62)
  s.stall = {
    x: Math.round(w * 0.06),
    w: sw,
    top: s.groundY - Math.round(h * 0.16),
    h: Math.round(h * 0.16),
  }

  /* --- 홍등 3개 (하나는 파랑) --- */
  s.lanterns = []
  for (let i = 0; i < 3; i++) {
    s.lanterns.push({
      x: s.stall.x + Math.round((sw / 4) * (i + 1)),
      y: s.stall.top - 5 - Math.floor(rnd() * 3),
      r: 3,
      blue: i === 1,
      phase: rnd() * 100,
      rate: 1 + rnd() * 1.6,
    })
  }

  /* --- 자판기: 오른쪽 끝. 이 그림에서 가장 밝은 물체다 --- */
  s.vend = {
    x: Math.round(w * 0.76),
    w: Math.round(w * 0.17),
    top: s.groundY - Math.round(h * 0.15),
    h: Math.round(h * 0.15),
  }

  /* --- 가로등 --- */
  s.lamp = { x: Math.round(w * 0.93), top: Math.round(h * 0.22), armLen: 8 }

  /* --- 떨어지는 꽃잎 --- */
  s.petals = []
  for (let i = 0; i < 14; i++) {
    s.petals.push({
      x: rnd() * w,
      off: rnd() * 100,
      speed: 6 + rnd() * 9,
      drift: 2 + rnd() * 5,
    })
  }

  return s
}

function paintSky() {
  const s = street, last = SKY.length - 1
  for (let y = 0; y < s.groundY; y++) {
    const k = clamp(y / s.groundY, 0, 1)
    const f = k * last
    const i0 = Math.floor(f), fr = f - i0
    const rowB = BAYER[y & 3]
    for (let x = 0; x < W; x++) {
      const idx = fr > rowB[x & 3] / 16 ? Math.min(i0 + 1, last) : i0
      const c = SKY[idx]
      const i = (y * W + x) << 2
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
    }
  }
}

function paintBuildings(t: number) {
  const s = street
  for (const b of s.far) rect(b.x, b.top, b.w, b.h + 60, C.farBuild)
  for (const b of s.mid) {
    rect(b.x, b.top, b.w, b.h + 44, C.midBuild)
    hline(b.x, b.top, b.w, C.edge)
    for (const wn of b.wins) {
      if (Math.sin(t * wn.rate + wn.phase) < -0.85) continue
      rect(wn.x, wn.y, 2, 2, C.stallLit)
    }
  }
}

/** 벚나무 — 줄기에서 가지가 뻗고 그 끝에 꽃이 뭉친다. */
function paintTree() {
  const s = street, tr = s.tree

  vline(tr.x, tr.baseY - tr.h, tr.h, C.trunk)
  vline(tr.x + 1, tr.baseY - tr.h, tr.h, C.trunk)

  for (const br of s.branches) {
    const sx = tr.x, sy = tr.baseY - tr.h * br.from
    for (let i = 0; i < br.len; i++) {
      // 위로 갈수록 살짝 휜다 — 직선이면 나무로 안 보인다
      const bend = (i / br.len) * (i / br.len) * 0.5
      const x = Math.round(sx + Math.cos(br.a + bend) * i)
      const y = Math.round(sy + Math.sin(br.a + bend) * i)
      px(x, y, C.branch)
    }
  }

  for (const b of s.blossoms) {
    if (b.size === 2) rect(b.x, b.y, 2, 2, b.c)
    else px(b.x, b.y, b.c)
  }
}

function paintStall(t: number) {
  const s = street, st = s.stall

  rect(st.x, st.top, st.w, st.h, C.stall)
  // 안쪽 조명 — 카운터 위가 밝다
  for (let y = st.top + 4; y < st.top + st.h - 4; y++) {
    for (let x = st.x + 2; x < st.x + st.w - 2; x++) {
      if (bayer(x, y) > 0.5) continue
      px(x, y, C.stallLit)
    }
  }
  rect(st.x + 1, st.top + st.h - 5, st.w - 2, 3, C.counter)

  // 줄무늬 차양 — 참고 그림의 붉은 천막
  for (let x = st.x - 2; x < st.x + st.w + 2; x++) {
    const stripe = Math.floor((x - st.x) / 3) % 2 === 0
    rect(x, st.top - 4, 1, 4, stripe ? C.awning : C.awningDark)
  }
  hline(st.x - 2, st.top - 5, st.w + 4, C.edge)

  // 홍등
  for (const l of s.lanterns) {
    const flick = 0.8 + Math.sin(t * l.rate + l.phase) * 0.12 + Math.sin(t * 6.3 + l.phase) * 0.08
    const tint = l.blue ? C.lanternBlue : C.lanternLit
    lightBlob(l.x, l.y, l.r + 6, flick * 0.85, tint)
    rect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2 + 1, l.blue ? C.lanternBlue : C.lantern)
    rect(l.x - l.r + 1, l.y - l.r + 1, l.r * 2 - 2, l.r * 2 - 1, tint)
    vline(l.x, l.y - l.r - 2, 2, C.branch)
  }
}

function paintVending(t: number) {
  const s = street, v = s.vend
  rect(v.x, v.top, v.w, v.h, C.vendBody)
  // 유리면 — 안이 환하다
  rect(v.x + 2, v.top + 2, v.w - 4, Math.round(v.h * 0.62), C.vendGlass)
  // 진열된 캔들
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = v.x + 3 + c * 3
      const y = v.top + 4 + r * 4
      px(x, y, C.vendLit)
      px(x, y + 1, C.vendLit)
    }
  }
  const pulse = 0.55 + Math.sin(t * 0.9) * 0.06
  lightBlob(Math.round(v.x + v.w / 2), Math.round(v.top + v.h * 0.3), Math.round(v.w * 1.5), pulse, C.vendLit)
}

function paintLamp(t: number) {
  const s = street, l = s.lamp
  vline(l.x, l.top, s.groundY - l.top, C.lampPost)
  hline(l.x - l.armLen, l.top, l.armLen + 1, C.lampPost)
  const head = { x: l.x - l.armLen, y: l.top + 1 }
  const flick = 0.7 + Math.sin(t * 2.6) * 0.04 + Math.sin(t * 9.1) * 0.03
  lightBlob(head.x, head.y, 14, flick, C.lampGlow)
  rect(head.x - 1, head.y, 3, 2, C.lampGlow)
}

/** 젖은 바닥 — 위의 밝은 것들이 흔들리며 비친다. 이게 있어야 "비 온 뒤 밤"이 된다. */
function paintGround(t: number) {
  const s = street
  rect(0, s.groundY, W, H - s.groundY, C.ground)
  hline(0, s.groundY, W, C.edge)

  const mirror = (srcX: number, tint: RGB, strength: number) => {
    const depth = H - s.groundY
    for (let i = 0; i < depth; i++) {
      const y = s.groundY + i
      if (y >= H) break
      // 물결 — 아래로 갈수록 크게 흔들린다
      const wob = Math.round(Math.sin(i * 0.55 + t * 1.7 + srcX) * (1 + i * 0.14))
      const x = srcX + wob
      if (x < 0 || x >= W) continue
      const fade = (1 - i / depth) * strength
      if (fade <= 0.02) continue
      const idx = (y * W + x) << 2
      const c = glow([data[idx], data[idx + 1], data[idx + 2]], fade, x, y, tint)
      data[idx] = c[0]; data[idx + 1] = c[1]; data[idx + 2] = c[2]
    }
  }

  for (const l of s.lanterns) mirror(l.x, l.blue ? C.lanternBlue : C.lanternLit, 0.6)
  mirror(Math.round(s.vend.x + s.vend.w / 2), C.vendLit, 0.7)
  mirror(s.lamp.x - s.lamp.armLen, C.lampGlow, 0.5)

  // 물웅덩이 얼룩
  for (let y = s.groundY + 2; y < H; y += 3) {
    for (let x = (y * 5) % 9; x < W; x += 9) px(x, y, C.puddle)
  }
}

/** 떨어지는 꽃잎 — 바람에 좌우로 흔들리며 내려온다. */
function paintPetals(t: number) {
  const s = street
  for (const p of s.petals) {
    const cycle = (t * p.speed + p.off * 4) % (s.groundY + 20)
    const y = Math.round(cycle - 10)
    if (y < 0 || y > s.groundY) continue
    const x = Math.round(p.x + Math.sin(cycle * 0.06 + p.off) * p.drift)
    px(x, y, C.petal)
  }
}


/* == 오른쪽 거터: 강변 야경 ===================================
   왼쪽 골목과 일부러 반대로 잡았다 - 좁음↔넓음, 따뜻함↔차가움, 빽빽함↔비어 있음.
   물 위의 긴 세로 반사가 이 그림의 핵심이라 수면에 화면의 3분의 1을 넘게 준다. */

/** 강변 하늘 - 골목보다 푸르고 맑다. 위가 거의 검고 아래는 도시 빛에 트인다. */
const SKY_R: RGB[] = [
  [ 18,  26,  44], [ 22,  32,  52], [ 26,  38,  60], [ 30,  45,  69],
  [ 35,  53,  78], [ 41,  62,  88], [ 48,  72,  98], [ 56,  83, 108],
]

const CR = {
  moon:       [232, 240, 255],
  star:       [188, 206, 236],
  farCity:    [ 34,  46,  70],
  farCityLit: [255, 206, 128],
  nearCity:   [ 24,  33,  52],
  bridge:     [ 40,  52,  76],
  bridgeDark: [ 26,  35,  54],
  cable:      [ 62,  80, 110],
  bridgeLit:  [255, 214, 150],
  towerLit:   [255, 120,  96],
  water:      [ 20,  30,  50],
  waterDeep:  [ 14,  22,  38],
  ripple:     [ 44,  62,  92],
  bank:       [ 22,  28,  40],
  railing:    [ 52,  64,  86],
  cvs:        [ 46,  58,  74],
  cvsLit:     [186, 232, 236],
  parasol:    [188,  74,  70],
  parasolD:   [132,  48,  50],
  table:      [ 70,  78,  92],
  canLit:     [255, 196, 120],
}

function buildRiver(w: number, h: number) {
  const rnd = mulberry32(CFG.seed + 7717)
  const s: any = { W: w, H: h }

  s.waterY = Math.round(h * 0.52)    // 수평선
  s.bankY = Math.round(h * 0.86)     // 이쪽 강둑
  // 상판은 **수면 바로 위**다. 예전엔 0.30h 에 둬서 도시보다 한참 위에 떠 있었는데,
  // 강을 건너는 다리라면 물에 닿을 듯 낮게 지나가고 주탑만 스카이라인을 뚫고 올라간다.
  s.bridgeY = s.waterY - Math.round(h * 0.035)
  s.towerH = Math.round(h * 0.19)     // 주탑 — 건물들과 겹칠 만큼 높다

  // 별 - 골목엔 없다. 하늘이 트여 있다는 걸 별로 말한다.
  s.stars = []
  for (let i = 0; i < 26; i++) {
    s.stars.push({
      x: Math.floor(rnd() * w),
      y: Math.floor(rnd() * (s.bridgeY - s.towerH) * 0.95),
      phase: rnd() * 100,
      rate: 0.6 + rnd() * 1.8,
    })
  }
  s.moon = { x: Math.round(w * 0.74), y: Math.round(h * 0.10), r: 7 }

  // 건너편 스카이라인 - 물에 비칠 것들이라 밝은 창을 넉넉히 준다
  s.city = []
  for (let x = -4; x < w + 6;) {
    const bw = 7 + Math.floor(rnd() * 13)
    const bh = 12 + Math.floor(rnd() * 40)
    const b: any = { x, w: bw, top: s.waterY - bh, wins: [] }
    for (let wy = b.top + 3; wy < s.waterY - 3; wy += 5) {
      for (let wx = x + 2; wx < x + bw - 2; wx += 4) {
        if (rnd() < 0.62) continue
        b.wins.push({ x: wx, y: wy, phase: rnd() * 100, rate: 0.04 + rnd() * 0.09 })
      }
    }
    s.city.push(b)
    x += bw + 1 + Math.floor(rnd() * 3)
  }

  // 다리 - 주탑 두 개에 케이블이 걸린다
  s.towers = [Math.round(w * 0.26), Math.round(w * 0.78)]
  s.deckLamps = []
  for (let x = 4; x < w; x += 11) s.deckLamps.push({ x, phase: rnd() * 100 })

  // 이쪽 강둑 - 편의점 파라솔 자리. "2차 끝나고 편의점 앞" 이 이 앱의 무대다.
  s.cvs = { x: Math.round(w * 0.06), w: Math.round(w * 0.30), h: Math.round(h * 0.085) }
  s.parasol = { x: Math.round(w * 0.62), y: s.bankY + Math.round(h * 0.03) }

  return s
}

function paintRiverSky(t: number) {
  const s = river, last = SKY_R.length - 1
  for (let y = 0; y < s.waterY; y++) {
    const f = clamp(y / s.waterY, 0, 1) * last
    const i0 = Math.floor(f), fr = f - i0
    const rowB = BAYER[y & 3]
    for (let x = 0; x < W; x++) {
      const idx = fr > rowB[x & 3] / 16 ? Math.min(i0 + 1, last) : i0
      const c = SKY_R[idx]
      const i = (y * W + x) << 2
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255
    }
  }
  // 별은 아주 느리게 깜빡인다. 빠르면 눈에 거슬린다.
  for (const st of s.stars) {
    if (Math.sin(t * st.rate + st.phase) < -0.4) continue
    px(st.x, st.y, CR.star)
  }
  // 달 - 가장자리를 디더링해 계단을 눌러준다
  const m = s.moon
  for (let dy = -m.r; dy <= m.r; dy++) {
    for (let dx = -m.r; dx <= m.r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > m.r) continue
      if (d > m.r - 1.2 && bayer(m.x + dx, m.y + dy) > 0.45) continue
      px(m.x + dx, m.y + dy, CR.moon)
    }
  }
  lightBlob(m.x, m.y, m.r + 9, 0.42, CR.moon)
}

function paintCity(t: number) {
  const s = river
  for (const b of s.city) {
    rect(b.x, b.top, b.w, s.waterY - b.top, CR.farCity)
    hline(b.x, b.top, b.w, CR.nearCity)
    for (const wn of b.wins) {
      if (Math.sin(t * wn.rate + wn.phase) < -0.88) continue
      rect(wn.x, wn.y, 2, 1, CR.farCityLit)
    }
  }
}

function paintBridge(t: number) {
  const s = river, y = s.bridgeY

  // 케이블 - 주탑 꼭대기에서 상판으로 늘어진다. 포물선이라야 다리로 보인다.
  const towerTop = y - s.towerH
  for (const tx of s.towers) {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 2; i < 30; i++) {
        const x = Math.round(tx + side * i * 1.4)
        if (x < 0 || x >= W) continue
        const drop = (i / 30) * (i / 30) * s.towerH
        const yy = Math.round(towerTop + drop)
        if (yy >= y) continue          // 상판 아래로는 안 내려간다
        px(x, yy, CR.cable)
      }
    }
  }

  rect(0, y, W, 3, CR.bridge)
  hline(0, y + 3, W, CR.bridgeDark)

  // 교각 - 상판에서 수면 아래로 내려가 물에 잠긴다
  for (let px0 = Math.round(W * 0.08); px0 < W; px0 += Math.round(W * 0.28)) {
    rect(px0 - 1, y + 3, 3, s.waterY - y + 4, CR.bridgeDark)
  }

  for (const tx of s.towers) {
    const top = towerTop
    rect(tx - 1, top, 3, y - top, CR.bridge)
    hline(tx - 2, top + 4, 5, CR.bridge)
    hline(tx - 2, top + Math.round(s.towerH * 0.45), 5, CR.bridge)   // 가로보
    // 항공장애등 - 붉게 천천히 깜빡인다
    if (Math.sin(t * 1.5 + tx) > 0) {
      px(tx, top - 1, CR.towerLit)
      lightBlob(tx, top - 1, 4, 0.7, CR.towerLit)
    }
  }

  // 상판 조명 - 물에 비칠 광원들
  for (const l of s.deckLamps) {
    const flick = 0.72 + Math.sin(t * 2.2 + l.phase) * 0.05
    px(l.x, y - 1, CR.bridgeLit)
    lightBlob(l.x, y - 1, 5, flick, CR.bridgeLit)
  }
}

/** 강 - 이 그림의 주인공. 위의 빛이 길게 늘어져 흔들린다. */
function paintWater(t: number) {
  const s = river
  const depth = s.bankY - s.waterY
  for (let y = s.waterY; y < s.bankY; y++) {
    const k = (y - s.waterY) / depth
    rect(0, y, W, 1, k < 0.5 ? CR.water : CR.waterDeep)
  }
  hline(0, s.waterY, W, CR.ripple)

  // 세로로 긴 반사. 골목의 젖은 바닥보다 훨씬 길게 끌어야 강으로 읽힌다.
  const streak = (srcX: number, tint: RGB, strength: number, len: number) => {
    for (let i = 0; i < len; i++) {
      const y = s.waterY + i
      if (y >= s.bankY) break
      const wob = Math.round(Math.sin(i * 0.4 + t * 1.3 + srcX * 0.7) * (1 + i * 0.1))
      const x = srcX + wob
      if (x < 0 || x >= W) continue
      const fade = (1 - i / len) * strength
      if (fade <= 0.02) continue
      const idx = (y * W + x) << 2
      const c = glow([data[idx], data[idx + 1], data[idx + 2]], fade, x, y, tint)
      data[idx] = c[0]; data[idx + 1] = c[1]; data[idx + 2] = c[2]
      // 가끔 옆으로 한 칸 번져야 물결로 읽힌다
      if (bayer(x, y) < 0.3 && x + 1 < W) {
        const j = (y * W + x + 1) << 2
        const c2 = glow([data[j], data[j + 1], data[j + 2]], fade * 0.5, x + 1, y, tint)
        data[j] = c2[0]; data[j + 1] = c2[1]; data[j + 2] = c2[2]
      }
    }
  }

  streak(s.moon.x, CR.moon, 0.55, Math.round(depth * 0.9))
  for (const l of s.deckLamps) streak(l.x, CR.bridgeLit, 0.5, Math.round(depth * 0.55))
  for (const b of s.city) {
    if (b.wins.length === 0) continue
    streak(b.x + (b.w >> 1), CR.farCityLit, 0.3, Math.round(depth * 0.35))
  }
}

/** 이쪽 강둑 - 편의점과 파라솔 테이블. 이 앱이 실제로 쓰이는 자리다. */
function paintBank(t: number) {
  const s = river
  rect(0, s.bankY, W, H - s.bankY, CR.bank)
  hline(0, s.bankY, W, CR.railing)

  // 난간
  for (let x = 2; x < W; x += 6) vline(x, s.bankY - 4, 4, CR.railing)
  hline(0, s.bankY - 4, W, CR.railing)

  // 편의점 - 통유리가 환하다
  const c = s.cvs
  const top = H - c.h - 2
  rect(c.x, top, c.w, c.h, CR.cvs)
  rect(c.x + 2, top + 3, c.w - 4, c.h - 6, CR.cvsLit)
  hline(c.x, top, c.w, CR.railing)
  lightBlob(Math.round(c.x + c.w / 2), top + 4, Math.round(c.w * 1.2), 0.5, CR.cvsLit)

  // 파라솔 + 캔 두 개 - 밖에 앉아 마시는 자리
  const pz = s.parasol
  for (let i = -7; i <= 7; i++) {
    const dy = Math.abs(i) > 4 ? 1 : 0
    px(pz.x + i, pz.y + dy, i % 3 === 0 ? CR.parasolD : CR.parasol)
  }
  vline(pz.x, pz.y + 1, 9, CR.table)
  hline(pz.x - 5, pz.y + 10, 11, CR.table)
  if (Math.sin(t * 1.1) > -0.5) {
    px(pz.x - 2, pz.y + 9, CR.canLit)
    px(pz.x + 2, pz.y + 9, CR.canLit)
  }
}

function drawRiver(t: number) {
  paintRiverSky(t)
  paintCity(t)
  paintBridge(t)
  paintWater(t)
  paintBank(t)
}

function drawStreet(t: number) {
  paintSky()
  paintBuildings(t)
  paintTree()
  paintStall(t)
  paintVending(t)
  paintLamp(t)
  paintGround(t)
  paintPetals(t)
}

/** 왼쪽엔 골목, 오른쪽엔 강변. 버퍼 하나를 두 번 그려 각각 찍는다. */
function drawFrame(t: number) {
  drawStreet(t)
  ctxs[0]?.putImageData(img, 0, 0)
  if (ctxs[1]) {
    drawRiver(t)
    ctxs[1].putImageData(img, 0, 0)
  }
}

function loop(now: number) {
  if (!running) return
  rafId = requestAnimationFrame(loop)
  const interval = 1000 / CFG.fps
  if (now - lastDraw < interval) return
  lastDraw = now
  drawFrame((now - startTime) / 1000)
}

export function init(canvases: HTMLCanvasElement[]) {
  targets = canvases.filter(Boolean)
  if (targets.length === 0) return

  W = CFG.artWidth
  H = CFG.artHeight

  ctxs = targets.map((cv) => {
    cv.width = W
    cv.height = H
    const c = cv.getContext('2d', { alpha: false })!
    c.imageSmoothingEnabled = false
    return c
  })

  img = ctxs[0].createImageData(W, H)
  data = img.data
  street = buildStreet(W, H)
  river = buildRiver(W, H)
  startTime = performance.now()
  drawFrame(0)

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  running = true
  rafId = requestAnimationFrame(loop)
}

export function destroy() {
  running = false
  cancelAnimationFrame(rafId)
  targets = []
  ctxs = []
}

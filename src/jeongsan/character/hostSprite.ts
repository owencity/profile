/**
 * 국자 총무 캐릭터 — 도트 데이터의 원본.
 *
 * **이 파일이 유일한 원본이다.** 앱(`jungsan_app` `pixelart/HostSprite.kt`)은 이 격자를
 * 글자 하나 바꾸지 않고 옮긴다. 캐릭터를 고칠 땐 여기부터 고치고 앱을 따라 맞춘다
 * (`docs/SCREENS.md` §6).
 *
 * 20×21 논리 픽셀. 맨 위 한 줄은 위아래로 흔들릴 여유다. 레이어를 아래 순서로 겹친다:
 * 들고 있는 도구 → 몸 → 앞치마 → 모자/왕관 → 반짝임. 도구를 몸보다 먼저 그려야
 * 손잡이 끝이 손 뒤로 숨는다.
 */

export const SPRITE_W = 20
export const SPRITE_H = 21

/** 칭호 구간 — `REQUIREMENTS.md` §8.3. 경계값은 위 단계로 친다. */
export const TITLES = [
  { level: 1, name: '새내기 총무', min: 0 },
  { level: 2, name: '믿음직한 총무', min: 100 },
  { level: 3, name: '프로 총무', min: 1_000 },
  { level: 4, name: '전설의 총무', min: 10_000 },
] as const

export type HostLevel = 1 | 2 | 3 | 4

export function levelOf(spoons: number): HostLevel {
  let lv: HostLevel = 1
  for (const t of TITLES) if (spoons >= t.min) lv = t.level
  return lv
}

export function titleOf(spoons: number): string {
  return TITLES[levelOf(spoons) - 1].name
}

const PAL: Record<string, string> = {
  K: '#2A2238', H: '#3B2F4A', S: '#FFD9B5', C: '#FF9DB0', T: '#4A8CE8', P: '#3D4A66',
  A: '#FF9A3D', a: '#E07B1C', W: '#FFFFFF', w: '#DCE6F2',
  o: '#C98A4B', O: '#8A5A2B',
  G: '#F2B233', g: '#C98A12', Y: '#FFF3B0',
}

/** 숟가락·국자 재질. `m` 본체, `h` 광택. */
const METAL: Record<'steel' | 'silver' | 'gold', Record<string, string>> = {
  steel: { m: '#A9B7C9', h: '#EAF0F7' },
  silver: { m: '#CFD9E6', h: '#FFFFFF' },
  gold: { m: '#F2B233', h: '#FFE58A' },
}

// ── 격자 ('.'는 투명) ─────────────────────────
const BODY = [
  '....KKKKKKKK....',
  '...KHHHHHHHHK...',
  '..KHHHHHHHHHHK..',
  '..KHHSSSSSSHHK..',
  '..KHSSSSSSSSHK..',
  '..KSSKSSSSKSSK..',
  '..KSSKSSSSKSSK..',
  '..KSCSSKKSSCSK..',
  '...KSSSSSSSSK...',
  '....KKTTTTKK....',
  '...KTTTTTTTTK...',
  '..KSKTTTTTTKSK..',
  '..KKKTTTTTTKKK..',
  '...KPPPPPPPPK...',
  '...KPPPKKPPPK...',
  '...KKKK..KKKK...',
]
const APRON = [
  '.....A....A.....',
  '......AAAA......',
  '.....AAAAAA.....',
  '.....AAaaAA.....',
  '....AAAAAAAA....',
]
const CHEF_HAT = [
  '.....KKKKKK.....',
  '....KWWWWWWK....',
  '...KWWWWWWWWK...',
  '...KWwWWwWWwK...',
]
const CROWN = [
  '....G..GG..G....',
  '....GGgYYgGG....',
  '....gggggggg....',
]
/** 머리와 겹치지 않게 오른쪽 위로 뻗는다. */
const SPOON_WOOD = ['..o..', '.ooo.', '.oOo.', '..o..', '..O..', '.O...', '.O...', 'O....', 'O....']
const SPOON_METAL = ['..mm.', '.mmmm', '.mhmm', '.mmmm', '..mm.', '..m..', '.m...', '.m...', 'm....', 'm....']

/** 전설의 반짝임 — 세 무리가 번갈아 꺼진다. 좌표는 캔버스 기준(흔들림 오프셋 없음). */
const SPARKS: [number, number][][] = [
  [[2, 2], [1, 3], [2, 3], [3, 3], [2, 4]],
  [[18, 16], [17, 17], [18, 17], [19, 17], [18, 18]],
  [[17, 2]],
]

type Layer = { grid: string[]; x: number; y: number; map?: Record<string, string> }

function layersFor(lv: HostLevel): Layer[] {
  const tool: Layer =
    lv === 1
      ? { grid: SPOON_WOOD, x: 14, y: 8 }
      : { grid: SPOON_METAL, x: 14, y: 6, map: METAL[lv === 2 ? 'steel' : lv === 3 ? 'silver' : 'gold'] }
  const layers: Layer[] = [tool, { grid: BODY, x: 1, y: 4 }]
  if (lv >= 2) layers.push({ grid: APRON, x: 1, y: 13 })
  if (lv === 3) layers.push({ grid: CHEF_HAT, x: 1, y: 0 })
  if (lv === 4) layers.push({ grid: CROWN, x: 1, y: 1 })
  return layers
}

/**
 * 한 프레임을 그린다. `scale`은 논리 픽셀 하나의 실제 픽셀 크기(기기 배율 포함).
 * `frame`이 홀수면 한 칸 위로 떠 있다 — 대기 애니메이션.
 */
export function drawHost(ctx: CanvasRenderingContext2D, lv: HostLevel, frame: number, scale: number) {
  ctx.clearRect(0, 0, SPRITE_W * scale, SPRITE_H * scale)
  const bob = frame % 2 === 1 ? -1 : 0
  for (const { grid, x, y, map } of layersFor(lv)) {
    grid.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const ch = row[rx]
        if (ch === '.') continue
        const color = map?.[ch] ?? PAL[ch]
        if (!color) continue
        ctx.fillStyle = color
        ctx.fillRect((x + rx) * scale, (y + ry + 1 + bob) * scale, scale, scale)
      }
    })
  }
  if (lv === 4) {
    SPARKS.forEach((group, k) => {
      if ((frame + k) % 3 === 2) return
      ctx.fillStyle = k === 2 ? PAL.Y : PAL.G
      for (const [px, py] of group) ctx.fillRect(px * scale, (py + bob) * scale, scale, scale)
    })
  }
}

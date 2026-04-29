import { useCallback, useEffect, useRef, useState } from 'react'

// === 게임 상수 ===
const TILE = 32
const COLS = 16
const ROWS = 14
const W = TILE * COLS // 512
const H = TILE * ROWS // 448

const GRAVITY = 1400
const MOVE_SPEED = 170
const JUMP_VELOCITY = -600
const BUBBLE_SPEED = 360
const BUBBLE_FLOAT_SPEED = -60
const BUBBLE_LIFE_MS = 7000
const BUBBLE_TRAP_TIME_MS = 4000
const BUBBLE_COOLDOWN_MS = 220
const ENEMY_SPEED = 70
const STUN_MS = 2000
const STUN_INVULN_MS = 1200
const STUN_BOUNCE = -260

// 레벨: '#' = 벽, '=' = 통과형 발판 (위에서만 착지), ' ' = 빈공간
// 좌우 wrap 가능 (보글보블 클래식)
const LEVELS: string[][] = [
  [
    '################',
    '                ',
    '                ',
    '                ',
    '   ========     ',
    '                ',
    '======   =======',
    '                ',
    '   ========     ',
    '                ',
    '                ',
    '================',
    '                ',
    '                ',
  ],
  [
    '################',
    '                ',
    '   =====        ',
    '                ',
    '          ===== ',
    '                ',
    '  =====         ',
    '                ',
    '          ===== ',
    '                ',
    '   =====        ',
    '================',
    '                ',
    '                ',
  ],
]

type GameState = 'idle' | 'playing' | 'paused' | 'won' | 'gameover'

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  facing: 1 | -1
  onGround: boolean
  bubbleCooldown: number
  invuln: number
  stunned: number
  dropThroughUntil: number
}

interface Enemy {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  alive: boolean
  trapped: boolean
  trappedAt: number
  facing: 1 | -1
}

interface Bubble {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  born: number
  trappedEnemyId: number | null
  popping: boolean
  popAt: number
}

interface Fruit {
  id: number
  x: number
  y: number
  vy: number
  emoji: string
  born: number
  landed: boolean
}

const FRUITS = ['🍎', '🍓', '🍌', '🍇', '🍒']

const HIGH_SCORE_KEY = 'bobble_game_high_score'

export function BubbleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const stateRef = useRef<GameState>('idle')
  const focusedRef = useRef(false)

  const playerRef = useRef<Player | null>(null)
  const enemiesRef = useRef<Enemy[]>([])
  const bubblesRef = useRef<Bubble[]>([])
  const fruitsRef = useRef<Fruit[]>([])
  const levelIdxRef = useRef(0)
  const idCounterRef = useRef(0)
  const stunCountRef = useRef(0)
  const scoreRef = useRef(0)
  const keysRef = useRef<Record<string, boolean>>({})
  const jumpQueuedRef = useRef(false)
  const fireQueuedRef = useRef(false)

  const [state, setState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [stunCount, setStunCount] = useState(0)
  const [levelIdx, setLevelIdx] = useState(0)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    const saved = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? '0')
    if (!Number.isNaN(saved)) setHighScore(saved)
  }, [])

  // === 충돌 헬퍼 ===
  const getTile = (level: string[], col: number, row: number): string => {
    if (row < 0 || row >= ROWS) return '#'
    const c = ((col % COLS) + COLS) % COLS // 좌우 wrap
    return level[row]?.[c] ?? ' '
  }

  const isSolid = (ch: string) => ch === '#'
  const isPlatform = (ch: string) => ch === '='

  // 직사각형이 솔리드 벽과 겹치는지
  const collidesSolid = (level: string[], x: number, y: number, w: number, h: number): boolean => {
    const minCol = Math.floor(x / TILE)
    const maxCol = Math.floor((x + w - 1) / TILE)
    const minRow = Math.floor(y / TILE)
    const maxRow = Math.floor((y + h - 1) / TILE)

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (isSolid(getTile(level, c, r))) return true
      }
    }
    return false
  }

  // === 레벨 로드 ===
  const loadLevel = useCallback((idx: number) => {
    const level = LEVELS[idx % LEVELS.length]
    levelIdxRef.current = idx % LEVELS.length
    setLevelIdx(idx % LEVELS.length)

    playerRef.current = {
      x: 2 * TILE,
      y: (ROWS - 4) * TILE,
      vx: 0,
      vy: 0,
      w: 24,
      h: 26,
      facing: 1,
      onGround: false,
      bubbleCooldown: 0,
      invuln: 0,
      stunned: 0,
      dropThroughUntil: 0,
    }

    bubblesRef.current = []
    fruitsRef.current = []

    // 적 스폰 위치 (레벨에 따라 다르게)
    const spawnPositions =
      idx % 2 === 0
        ? [
            { col: 12, row: 9 },
            { col: 8, row: 5 },
            { col: 4, row: 5 },
          ]
        : [
            { col: 12, row: 5 },
            { col: 3, row: 9 },
            { col: 8, row: 1 },
            { col: 13, row: 9 },
          ]

    void level

    enemiesRef.current = spawnPositions.map((p, i) => ({
      id: idCounterRef.current++,
      x: p.col * TILE + 4,
      y: p.row * TILE + 6,
      vx: i % 2 === 0 ? -ENEMY_SPEED : ENEMY_SPEED,
      vy: 0,
      w: 24,
      h: 24,
      alive: true,
      trapped: false,
      trappedAt: 0,
      facing: i % 2 === 0 ? -1 : 1,
    }))
  }, [])

  // === 시작 ===
  const startGame = useCallback(() => {
    stunCountRef.current = 0
    scoreRef.current = 0
    setStunCount(0)
    setScore(0)
    loadLevel(0)
    stateRef.current = 'playing'
    setState('playing')
    lastTickRef.current = performance.now()
    requestAnimationFrame((t) => tickWrapperRef.current?.(t))
  }, [loadLevel])

  // === 적이 죽었을 때 (방울 터트림) ===
  const killEnemy = useCallback((enemy: Enemy) => {
    enemy.alive = false
    scoreRef.current += 100
    setScore(scoreRef.current)
    fruitsRef.current.push({
      id: idCounterRef.current++,
      x: enemy.x,
      y: enemy.y,
      vy: 0,
      emoji: FRUITS[Math.floor(Math.random() * FRUITS.length)],
      born: performance.now(),
      landed: false,
    })
  }, [])

  // === 메인 게임 루프 ===
  const tick = useCallback((now: number) => {
    if (stateRef.current !== 'playing') return

    const dt = Math.min(0.033, (now - lastTickRef.current) / 1000)
    lastTickRef.current = now

    const level = LEVELS[levelIdxRef.current]
    const player = playerRef.current
    if (!player) return

    // === 플레이어 입력 ===
    const keys = keysRef.current

    // 기절 중에는 입력 무시 + 좌우 마찰로 천천히 멈춤
    if (player.stunned > 0) {
      player.stunned -= dt * 1000
      player.vx *= 0.85
      // 기절 끝나는 순간 회복 무적 부여
      if (player.stunned <= 0) {
        player.stunned = 0
        player.invuln = STUN_INVULN_MS
      }
      // 점프/발사 큐는 소진 (기절 중 누른 입력은 무시)
      jumpQueuedRef.current = false
      fireQueuedRef.current = false
    } else {
      let ax = 0
      if (keys['ArrowLeft'] || keys['KeyA']) ax -= 1
      if (keys['ArrowRight'] || keys['KeyD']) ax += 1
      player.vx = ax * MOVE_SPEED
      if (ax !== 0) player.facing = ax > 0 ? 1 : -1

      // 아래키 누르면 통과형 발판 통과 (250ms 동안)
      const wantDrop = keys['ArrowDown'] || keys['KeyS']
      if (wantDrop && player.onGround) {
        // 발 바로 아래가 통과형 발판일 때만 통과 가능
        const r = Math.round((player.y + player.h) / TILE)
        const minCol = Math.floor(player.x / TILE)
        const maxCol = Math.floor((player.x + player.w - 1) / TILE)
        let onPlatform = false
        for (let c = minCol; c <= maxCol; c++) {
          if (isPlatform(getTile(level, c, r))) {
            onPlatform = true
            break
          }
        }
        if (onPlatform) {
          player.onGround = false
          player.dropThroughUntil = now + 250
          player.y += 2
        }
      }

      if (jumpQueuedRef.current) {
        jumpQueuedRef.current = false
        if (player.onGround) {
          player.vy = JUMP_VELOCITY
          player.onGround = false
        }
      }

      if (fireQueuedRef.current && player.bubbleCooldown <= 0) {
        fireQueuedRef.current = false
        player.bubbleCooldown = BUBBLE_COOLDOWN_MS
        bubblesRef.current.push({
          id: idCounterRef.current++,
          x: player.x + player.w / 2 + (player.facing === 1 ? 4 : -16),
          y: player.y + 4,
          vx: player.facing * BUBBLE_SPEED,
          vy: 0,
          born: now,
          trappedEnemyId: null,
          popping: false,
          popAt: 0,
        })
      }
    }

    if (player.bubbleCooldown > 0) player.bubbleCooldown -= dt * 1000
    if (player.invuln > 0) player.invuln -= dt * 1000

    // === 플레이어 물리 ===
    // 땅에 있으면 중력 무시, 공중이면 중력 적용
    if (player.onGround) {
      player.vy = 0
    } else {
      player.vy += GRAVITY * dt
    }

    // 좌우 이동
    let newX = player.x + player.vx * dt
    if (newX + player.w < 0) newX = W
    else if (newX > W) newX = -player.w
    if (!collidesSolid(level, newX, player.y, player.w, player.h)) {
      player.x = newX
    }

    // 상하 이동
    const newY = player.y + player.vy * dt
    if (collidesSolid(level, player.x, newY, player.w, player.h)) {
      if (player.vy > 0) {
        player.y = Math.floor((newY + player.h) / TILE) * TILE - player.h
        player.vy = 0
        player.onGround = true
      } else if (player.vy < 0) {
        player.y = Math.ceil(newY / TILE) * TILE
        player.vy = 0
      }
    } else {
      // 통과형 발판: 떨어지는 중이고 dropThrough 모드 아닐 때만
      let landed = false
      const canCheckPlatform = player.vy >= 0 && now > player.dropThroughUntil

      if (canCheckPlatform) {
        const oldFootY = player.y + player.h
        const newFootY = newY + player.h
        const startRow = Math.floor(oldFootY / TILE) + 1
        const endRow = Math.floor(newFootY / TILE) + 1

        for (let r = startRow; r <= endRow; r++) {
          const lineY = r * TILE
          // 발판 라인을 가로지르거나 정확히 닿는지
          if (lineY + 0.5 >= oldFootY && lineY <= newFootY + 0.5) {
            const minCol = Math.floor(player.x / TILE)
            const maxCol = Math.floor((player.x + player.w - 1) / TILE)
            let found = false
            for (let c = minCol; c <= maxCol; c++) {
              if (isPlatform(getTile(level, c, r))) {
                found = true
                break
              }
            }
            if (found) {
              player.y = lineY - player.h
              player.vy = 0
              player.onGround = true
              landed = true
              break
            }
          }
        }
      }

      if (!landed) {
        player.y = newY
      }
    }

    // 매 프레임 onGround 검증: 발 아래에 지지 없으면 떨어지기 시작
    if (player.onGround) {
      const footY = player.y + player.h
      const r = Math.round(footY / TILE)
      let supported = false

      if (Math.abs(footY - r * TILE) < 1) {
        const minCol = Math.floor(player.x / TILE)
        const maxCol = Math.floor((player.x + player.w - 1) / TILE)
        for (let c = minCol; c <= maxCol; c++) {
          const tile = getTile(level, c, r)
          if (isSolid(tile) || (isPlatform(tile) && now > player.dropThroughUntil)) {
            supported = true
            break
          }
        }
      }
      if (!supported) {
        player.onGround = false
      }
    }

    // 화면 밖으로 너무 내려가면 위에서 다시 등장
    if (player.y > H) {
      player.y = -player.h
    }

    // === 비눗방울 업데이트 ===
    for (const b of bubblesRef.current) {
      if (b.popping) continue
      const age = now - b.born

      if (b.trappedEnemyId === null && age < 350) {
        // 직선 비행
        b.x += b.vx * dt
        // wrap
        if (b.x + 16 < 0) b.x = W
        else if (b.x > W) b.x = -16
        // 솔리드 부딪히면 직선 정지 후 떠오름
        if (collidesSolid(level, b.x, b.y, 16, 16)) {
          b.x -= b.vx * dt
          b.vx = 0
        }
      } else {
        // 떠오름
        b.vx *= 0.92
        b.vy = BUBBLE_FLOAT_SPEED * (1 + Math.sin((now + b.id * 100) / 250) * 0.2)
        b.x += b.vx * dt + Math.sin((now + b.id * 50) / 400) * 0.4
        b.y += b.vy * dt
      }

      // 천장 충돌
      if (b.y < TILE) {
        b.y = TILE
      }

      // 적 가두기
      if (b.trappedEnemyId === null && age > 80) {
        for (const e of enemiesRef.current) {
          if (!e.alive || e.trapped) continue
          if (rectsOverlap(b.x, b.y, 16, 16, e.x, e.y, e.w, e.h)) {
            b.trappedEnemyId = e.id
            e.trapped = true
            e.trappedAt = now
            e.vx = 0
            e.vy = 0
            break
          }
        }
      }

      // 갇힌 적의 위치를 방울에 따라 업데이트
      if (b.trappedEnemyId !== null) {
        const e = enemiesRef.current.find((x) => x.id === b.trappedEnemyId)
        if (e) {
          e.x = b.x - 4
          e.y = b.y - 4
        }
      }

      // 방울 수명 만료 → 갇힌 적 탈출
      if (
        age > BUBBLE_LIFE_MS ||
        (b.trappedEnemyId !== null && now - (enemiesRef.current.find((x) => x.id === b.trappedEnemyId)?.trappedAt ?? 0) > BUBBLE_TRAP_TIME_MS)
      ) {
        b.popping = true
        b.popAt = now
        if (b.trappedEnemyId !== null) {
          const e = enemiesRef.current.find((x) => x.id === b.trappedEnemyId)
          if (e) {
            e.trapped = false
            e.vx = (Math.random() < 0.5 ? -1 : 1) * ENEMY_SPEED
            e.facing = e.vx > 0 ? 1 : -1
          }
        }
      }

      // 플레이어 점프해서 부딪히면 터짐
      if (
        !b.popping &&
        rectsOverlap(b.x, b.y, 16, 16, player.x, player.y, player.w, player.h)
      ) {
        // 갇힌 적이 있으면 적 사망
        if (b.trappedEnemyId !== null) {
          const e = enemiesRef.current.find((x) => x.id === b.trappedEnemyId)
          if (e) {
            killEnemy(e)
          }
          b.popping = true
          b.popAt = now
          // 터지면서 약간의 점프 부스트
          if (player.vy > 0) {
            player.vy = JUMP_VELOCITY * 0.6
          }
        }
      }
    }

    bubblesRef.current = bubblesRef.current.filter((b) => {
      if (b.popping) return now - b.popAt < 250
      return true
    })

    // === 적 업데이트 ===
    for (const e of enemiesRef.current) {
      if (!e.alive || e.trapped) continue
      e.vy += GRAVITY * dt

      let nx = e.x + e.vx * dt
      if (nx + e.w < 0) nx = W
      else if (nx > W) nx = -e.w
      if (collidesSolid(level, nx, e.y, e.w, e.h)) {
        e.vx *= -1
        e.facing = e.vx > 0 ? 1 : -1
      } else {
        e.x = nx
      }

      const ny = e.y + e.vy * dt
      let landed = false
      if (collidesSolid(level, e.x, ny, e.w, e.h)) {
        if (e.vy > 0) {
          e.y = Math.floor((ny + e.h) / TILE) * TILE - e.h
          e.vy = 0
          landed = true
        } else if (e.vy < 0) {
          e.y = Math.ceil(ny / TILE) * TILE
          e.vy = 0
        }
      } else {
        e.y = ny

        // 통과형 발판
        if (e.vy > 0) {
          const oldFootY = e.y - e.vy * dt + e.h
          const newFootY = e.y + e.h
          const oldRow = Math.floor(oldFootY / TILE)
          const newRow = Math.floor(newFootY / TILE)
          if (oldRow < newRow) {
            for (let r = oldRow + 1; r <= newRow; r++) {
              const minCol = Math.floor(e.x / TILE)
              const maxCol = Math.floor((e.x + e.w - 1) / TILE)
              let found = false
              for (let c = minCol; c <= maxCol; c++) {
                if (isPlatform(getTile(level, c, r))) {
                  found = true
                  break
                }
              }
              if (found) {
                e.y = r * TILE - e.h
                e.vy = 0
                landed = true
                break
              }
            }
          }
        }
      }

      void landed

      if (e.y > H) e.y = -e.h

      // 발판 끝 → 방향 전환 (떨어지지 않게)
      // 단순화: 매 0.5초마다 발판 끝이면 방향 전환
      // 여기선 그냥 벽 만나면 회전 + 가끔 점프
      if (Math.random() < 0.005) {
        e.vy = JUMP_VELOCITY * 0.7
      }

      // 플레이어 충돌 → 기절
      if (
        player.invuln <= 0 &&
        player.stunned <= 0 &&
        rectsOverlap(e.x, e.y, e.w, e.h, player.x, player.y, player.w, player.h)
      ) {
        player.stunned = STUN_MS
        // 적 반대 방향으로 살짝 튕겨냄
        const knockDir = player.x + player.w / 2 < e.x + e.w / 2 ? -1 : 1
        player.vx = knockDir * 180
        player.vy = STUN_BOUNCE
        stunCountRef.current += 1
        setStunCount(stunCountRef.current)
      }
    }

    // === 과일 업데이트 ===
    for (const f of fruitsRef.current) {
      if (!f.landed) {
        f.vy += GRAVITY * dt
        const ny = f.y + f.vy * dt
        if (collidesSolid(level, f.x, ny, 22, 22)) {
          f.y = Math.floor((ny + 22) / TILE) * TILE - 22
          f.vy = 0
          f.landed = true
        } else {
          f.y = ny
          // 발판
          const oldFootY = f.y - f.vy * dt + 22
          const newFootY = f.y + 22
          const oldRow = Math.floor(oldFootY / TILE)
          const newRow = Math.floor(newFootY / TILE)
          if (oldRow < newRow) {
            for (let r = oldRow + 1; r <= newRow; r++) {
              const minCol = Math.floor(f.x / TILE)
              const maxCol = Math.floor((f.x + 22 - 1) / TILE)
              let found = false
              for (let c = minCol; c <= maxCol; c++) {
                if (isPlatform(getTile(level, c, r))) {
                  found = true
                  break
                }
              }
              if (found) {
                f.y = r * TILE - 22
                f.vy = 0
                f.landed = true
                break
              }
            }
          }
        }
      }

      if (rectsOverlap(f.x, f.y, 22, 22, player.x, player.y, player.w, player.h)) {
        scoreRef.current += 50
        setScore(scoreRef.current)
        f.born = -1
      }
    }
    fruitsRef.current = fruitsRef.current.filter((f) => {
      if (f.born === -1) return false
      if (now - f.born > 8000) return false
      return true
    })

    // === 클리어 체크 ===
    if (enemiesRef.current.every((e) => !e.alive)) {
      const next = levelIdxRef.current + 1
      if (next >= LEVELS.length) {
        stateRef.current = 'won'
        setState('won')
        if (scoreRef.current > highScore) {
          localStorage.setItem(HIGH_SCORE_KEY, String(scoreRef.current))
          setHighScore(scoreRef.current)
        }
        return
      }
      scoreRef.current += 1000
      setScore(scoreRef.current)
      loadLevel(next)
    }

    // === 렌더링 ===
    renderRef.current?.(now)

    rafRef.current = requestAnimationFrame((t) => tickWrapperRef.current?.(t))
  }, [highScore, killEnemy, loadLevel])

  const tickWrapperRef = useRef<((t: number) => void) | null>(null)
  const renderRef = useRef<((t: number) => void) | null>(null)
  useEffect(() => {
    tickWrapperRef.current = tick
  }, [tick])

  // === 렌더링 ===
  const render = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const level = LEVELS[levelIdxRef.current]
    const player = playerRef.current

    // 배경
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#1e1b4b')
    bg.addColorStop(1, '#312e81')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // 별 배경
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + ((now / 30) % W)) % W
      const y = (i * 53) % H
      ctx.fillRect(x, y, 2, 2)
    }

    // 타일
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = level[r]?.[c] ?? ' '
        if (ch === '#') {
          // 솔리드 벽 (그라디언트)
          const tg = ctx.createLinearGradient(0, r * TILE, 0, r * TILE + TILE)
          tg.addColorStop(0, '#4f46e5')
          tg.addColorStop(1, '#312e81')
          ctx.fillStyle = tg
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE)
          ctx.strokeStyle = 'rgba(165, 180, 252, 0.5)'
          ctx.lineWidth = 1
          ctx.strokeRect(c * TILE + 0.5, r * TILE + 0.5, TILE - 1, TILE - 1)
        } else if (ch === '=') {
          // 통과형 발판
          ctx.fillStyle = '#a78bfa'
          ctx.fillRect(c * TILE, r * TILE, TILE, 6)
          ctx.fillStyle = '#7c3aed'
          ctx.fillRect(c * TILE, r * TILE + 6, TILE, 4)
        }
      }
    }

    // 과일
    for (const f of fruitsRef.current) {
      const blink = !f.landed || (now - f.born) % 600 < 400
      if (blink) {
        ctx.font = '22px sans-serif'
        ctx.textBaseline = 'top'
        ctx.fillText(f.emoji, f.x, f.y - 2)
      }
    }

    // 비눗방울
    for (const b of bubblesRef.current) {
      const r = 14
      const cx = b.x + 8
      const cy = b.y + 8
      if (b.popping) {
        const elapsed = now - b.popAt
        const prog = Math.min(1, elapsed / 250)
        ctx.save()
        ctx.globalAlpha = 1 - prog
        ctx.strokeStyle = '#a5f3fc'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx, cy, r * (1 + prog * 0.6), 0, Math.PI * 2)
        ctx.stroke()
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 * i) / 6
          ctx.beginPath()
          ctx.arc(cx + Math.cos(ang) * r * prog * 1.4, cy + Math.sin(ang) * r * prog * 1.4, 2, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.restore()
        continue
      }

      // 갇힌 적 표시
      if (b.trappedEnemyId !== null) {
        const e = enemiesRef.current.find((x) => x.id === b.trappedEnemyId)
        if (e) {
          ctx.save()
          ctx.font = '18px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('👹', cx, cy)
          ctx.restore()
        }
      }

      // 방울 (반투명 원 + 하이라이트)
      ctx.save()
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, r)
      grad.addColorStop(0, 'rgba(255,255,255,0.85)')
      grad.addColorStop(0.5, 'rgba(165,243,252,0.5)')
      grad.addColorStop(1, 'rgba(34,211,238,0.2)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      // 하이라이트
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath()
      ctx.ellipse(cx - 4, cy - 5, 4, 2.5, -0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // 적
    for (const e of enemiesRef.current) {
      if (!e.alive || e.trapped) continue
      ctx.save()
      ctx.font = '22px sans-serif'
      ctx.textBaseline = 'top'
      ctx.fillText('👹', e.x + 1, e.y - 1)
      ctx.restore()
    }

    // 플레이어 (드래곤)
    if (player) {
      ctx.save()
      const isStunned = player.stunned > 0
      // 무적 깜빡임
      if (player.invuln > 0 && Math.floor(now / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4
      }
      // 기절 시 살짝 기울이기
      if (isStunned) {
        const tilt = Math.sin(now / 100) * 0.25
        ctx.translate(player.x + player.w / 2, player.y + player.h / 2)
        ctx.rotate(tilt)
        ctx.translate(-(player.x + player.w / 2), -(player.y + player.h / 2))
      }
      ctx.font = '24px sans-serif'
      ctx.textBaseline = 'top'
      const dragonEmoji = isStunned ? '😵' : '🐲'
      if (player.facing === -1 && !isStunned) {
        ctx.translate(player.x + player.w, player.y)
        ctx.scale(-1, 1)
        ctx.fillText(dragonEmoji, 0, -2)
      } else {
        ctx.fillText(dragonEmoji, player.x, player.y - 2)
      }
      ctx.restore()

      // 기절 별 빙글빙글
      if (isStunned) {
        ctx.save()
        ctx.font = '14px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        const cx = player.x + player.w / 2
        const cy = player.y - 4
        for (let i = 0; i < 3; i++) {
          const ang = now / 200 + (Math.PI * 2 * i) / 3
          const sx = cx + Math.cos(ang) * 14
          const sy = cy + Math.sin(ang) * 4
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now / 150 + i)
          ctx.fillText('⭐', sx, sy)
        }
        ctx.restore()
      }
    }

    // 라이프 / 점수 HUD는 React 컴포넌트로 렌더
  }, [])

  useEffect(() => {
    renderRef.current = render
  }, [render])

  // === 키 이벤트 ===
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // 게임이 활성 상태일 때만 화살표 키 막기
      if (
        focusedRef.current &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)
      ) {
        e.preventDefault()
      }
      keysRef.current[e.code] = true
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        jumpQueuedRef.current = true
      }
      if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'KeyJ') {
        fireQueuedRef.current = true
      }
    }
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // 컨테이너에 포커스 들어왔을 때만 화살표키 prevent
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onEnter = () => (focusedRef.current = true)
    const onLeave = () => (focusedRef.current = false)
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // === 모바일 터치 버튼 핸들러 ===
  const setKey = (code: string, down: boolean) => {
    keysRef.current[code] = down
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* HUD */}
      <div className="grid w-full max-w-[512px] grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">스테이지</p>
          <p className="text-lg font-bold tabular-nums text-zinc-900">{levelIdx + 1} / {LEVELS.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">점수</p>
          <p className="text-lg font-bold tabular-nums text-indigo-600">{score}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">헤롱</p>
          <p className="text-lg font-bold tabular-nums text-amber-500">
            {stunCount > 0 ? '💫'.repeat(Math.min(stunCount, 5)) + (stunCount > 5 ? `+${stunCount - 5}` : '') : '—'}
          </p>
        </div>
      </div>

      {/* 게임 캔버스 */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border-2 border-indigo-900 shadow-2xl shadow-indigo-500/20"
        style={{ width: W, height: H, maxWidth: '100%' }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full h-full"
          tabIndex={0}
        />

        {state === 'idle' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-indigo-950/85 backdrop-blur-sm">
            <div className="text-5xl">🐲💭</div>
            <h3 className="text-2xl font-bold tracking-tight text-white">뽀글뽀글</h3>
            <div className="text-center text-xs leading-6 text-indigo-200">
              <p>드래곤이 되어 비눗방울로 적을 가두자!</p>
              <p className="mt-2 text-[11px] text-indigo-300">
                <kbd className="rounded bg-indigo-900 px-1.5 py-0.5 font-mono">←→</kbd>{' '}
                <kbd className="rounded bg-indigo-900 px-1.5 py-0.5 font-mono">A/D</kbd> 이동{' '}
                ·{' '}
                <kbd className="rounded bg-indigo-900 px-1.5 py-0.5 font-mono">Space</kbd>{' '}
                <kbd className="rounded bg-indigo-900 px-1.5 py-0.5 font-mono">↑</kbd> 점프{' '}
                ·{' '}
                <kbd className="rounded bg-indigo-900 px-1.5 py-0.5 font-mono">Z</kbd>{' '}
                <kbd className="rounded bg-indigo-900 px-1.5 py-0.5 font-mono">X</kbd> 방울 발사
              </p>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="rounded-full bg-gradient-to-br from-amber-400 to-amber-500 px-8 py-3 text-sm font-bold text-zinc-900 shadow-lg shadow-amber-500/30 transition hover:scale-105 active:scale-95"
            >
              게임 시작
            </button>
            {highScore > 0 ? (
              <p className="text-xs font-medium text-indigo-300">
                최고점수: <span className="font-bold text-amber-400">{highScore}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {state === 'gameover' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-rose-950/85 backdrop-blur-sm">
            <div className="text-5xl">💀</div>
            <h3 className="text-2xl font-bold text-white">GAME OVER</h3>
            <div className="rounded-2xl border border-rose-300 bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-200">최종 점수</p>
              <p className="text-3xl font-bold tabular-nums text-white">{score}</p>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-rose-600 shadow-lg transition hover:scale-105 active:scale-95"
            >
              다시 도전
            </button>
          </div>
        ) : null}

        {state === 'won' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/85 backdrop-blur-sm">
            <div className="text-5xl">🏆</div>
            <h3 className="text-2xl font-bold text-white">CLEAR!</h3>
            <div className="rounded-2xl border border-emerald-300 bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200">최종 점수</p>
              <p className="text-3xl font-bold tabular-nums text-white">{score}</p>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-emerald-600 shadow-lg transition hover:scale-105 active:scale-95"
            >
              다시 하기
            </button>
          </div>
        ) : null}
      </div>

      {/* 모바일 터치 컨트롤 */}
      <div className="grid w-full max-w-[512px] grid-cols-2 gap-2 lg:hidden">
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onPointerDown={() => setKey('ArrowLeft', true)}
            onPointerUp={() => setKey('ArrowLeft', false)}
            onPointerCancel={() => setKey('ArrowLeft', false)}
            onPointerLeave={() => setKey('ArrowLeft', false)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-700 shadow-sm active:bg-zinc-300"
          >
            ←
          </button>
          <button
            type="button"
            onPointerDown={() => setKey('ArrowRight', true)}
            onPointerUp={() => setKey('ArrowRight', false)}
            onPointerCancel={() => setKey('ArrowRight', false)}
            onPointerLeave={() => setKey('ArrowRight', false)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-700 shadow-sm active:bg-zinc-300"
          >
            →
          </button>
        </div>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onPointerDown={() => {
              fireQueuedRef.current = true
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-200 text-xl font-bold text-cyan-800 shadow-sm active:bg-cyan-300"
          >
            🫧
          </button>
          <button
            type="button"
            onPointerDown={() => {
              jumpQueuedRef.current = true
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-200 text-xl font-bold text-amber-800 shadow-sm active:bg-amber-300"
          >
            ⬆
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-zinc-400">
        💡 비눗방울로 적을 가둔 뒤, 점프해서 부딪히면 터지면서 과일이 떨어집니다.
      </p>
    </div>
  )
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

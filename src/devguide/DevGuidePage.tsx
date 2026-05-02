type RoleKey = '기획자' | '디자이너' | '앱개발자' | '백엔드'
type RoleLevel = '주도' | '참여' | '검토'

const ROLES: Record<RoleKey, { color: string; bg: string; border: string; emoji: string }> = {
  기획자:   { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', emoji: '💡' },
  디자이너: { color: '#5b21b6', bg: '#ede9fe', border: '#c4b5fd', emoji: '🎨' },
  앱개발자: { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', emoji: '📱' },
  백엔드:   { color: '#1e3a8a', bg: '#dbeafe', border: '#93c5fd', emoji: '⚙️' },
}

interface PhaseItem {
  label: string
  desc: string
  icon: string
  highlight?: boolean
  roles: { key: RoleKey; level: RoleLevel }[]
}

interface Phase {
  id: number
  emoji: string
  title: string
  subtitle: string
  color: { bg: string; border: string; accent: string; badge: string; badgeBg: string }
  intro: string
  rolesSummary: { key: RoleKey; level: RoleLevel; note: string }[]
  items: PhaseItem[]
}

const PHASES: Phase[] = [
  {
    id: 1,
    emoji: '💡',
    title: '기획',
    subtitle: 'Planning',
    color: { bg: '#fef9c3', border: '#fde047', accent: '#a16207', badge: '#78350f', badgeBg: '#fef08a' },
    intro: '기획은 관점을 가져야 한다. 기획은 생각하는 그 자체.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '전체 주도' },
      { key: '디자이너', level: '참여', note: '경쟁 서비스 UI 분석' },
      { key: '앱개발자', level: '참여', note: '기술 실현 가능성 의견' },
      { key: '백엔드',   level: '참여', note: '기술 실현 가능성 의견' },
    ],
    items: [
      { label: '타겟 유저', desc: '페르소나 설정 — 누가 쓸지 명확히 정의', icon: '🎯',
        roles: [{ key: '기획자', level: '주도' }] },
      { label: '핵심 기능', desc: '꼭 있어야 할 기능을 최소한으로 정리', icon: '⚡',
        roles: [{ key: '기획자', level: '주도' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '경쟁 서비스 분석', desc: '비슷한 서비스를 뜯어보고 약점 파악', icon: '🔍',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }] },
      { label: '차별화 전략', desc: '우리가 어떻게 다를지 명확히 정의', icon: '🚀',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
    ],
  },
  {
    id: 2,
    emoji: '📐',
    title: '설계',
    subtitle: 'Architecture',
    color: { bg: '#eff6ff', border: '#93c5fd', accent: '#1d4ed8', badge: '#1e3a8a', badgeBg: '#bfdbfe' },
    intro: '사용자가 쓰게 될 화면이 핵심. 모두가 함께 만드는 단계.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '화면 흐름 · 시나리오 · 기능 목록' },
      { key: '디자이너', level: '주도', note: '화면 설계 · UX · 디자인 가이드' },
      { key: '앱개발자', level: '주도', note: '앱 기술 스택 · 화면 구조 의견' },
      { key: '백엔드',   level: '주도', note: '데이터 설계 · API 설계' },
    ],
    items: [
      { label: '화면 설계', desc: '사용자 흐름 중심으로 모든 화면 설계', icon: '🖥',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '주도' }, { key: '앱개발자', level: '참여' }] },
      { label: '시나리오', desc: '어떤 과정으로 목표에 도달하는지 흐름 정의', icon: '📋',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }] },
      { label: 'UX', desc: '사용자 경험 — 쓰기 쉽고, 쓰고 싶게', icon: '✨',
        roles: [{ key: '디자이너', level: '주도' }, { key: '기획자', level: '참여' }] },
      { label: '데이터 설계 (ERD)', desc: '테이블 구조, ERD 작성', icon: '🗄',
        roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '검토' }] },
      { label: 'API 설계', desc: '기능과 연결되는 엔드포인트 정의', icon: '🔌',
        roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
      { label: '기능 확정 / 디자인 가이드', desc: '기능 목록 최종 확정 + 디자인 가이드라인', icon: '🎨',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '주도' }] },
    ],
  },
  {
    id: 3,
    emoji: '🔨',
    title: '개발',
    subtitle: 'Development',
    color: { bg: '#f0fdf4', border: '#86efac', accent: '#15803d', badge: '#14532d', badgeBg: '#bbf7d0' },
    intro: '기초부터 탄탄하게. 프론트 · 백엔드 · 연동 순서로.',
    rolesSummary: [
      { key: '기획자',   level: '참여', note: 'QA · 기획 보완 · 우선순위 조정' },
      { key: '디자이너', level: '주도', note: '화면 디자인 시스템 · 에셋 제작' },
      { key: '앱개발자', level: '주도', note: '앱 화면 개발 · 연동' },
      { key: '백엔드',   level: '주도', note: 'API · CRUD · 비즈니스 로직 · DB' },
    ],
    items: [
      { label: '앱 화면 개발', desc: '기초 화면 개발 — 설계 기반으로 구현 (Kotlin)', icon: '📱',
        roles: [{ key: '앱개발자', level: '주도' }, { key: '디자이너', level: '참여' }] },
      { label: '백엔드 개발', desc: 'API · CRUD · 비즈니스 로직 · 예외처리 · DB 구축', icon: '⚙️',
        roles: [{ key: '백엔드', level: '주도' }] },
      { label: '프론트 ↔ 백엔드 연동', desc: '실제 API 연결 + 통합 테스트', icon: '🔗',
        roles: [{ key: '앱개발자', level: '주도' }, { key: '백엔드', level: '주도' }] },
      { label: '테스트', desc: '시나리오 기반 테스트 — 기획자가 정의한 흐름대로 검증', icon: '✅', highlight: true,
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '소스 관리 (GitHub)', desc: 'GitHub + 브랜치 전략 (개발 / 운영 분리)', icon: '📦', highlight: true,
        roles: [{ key: '앱개발자', level: '주도' }, { key: '백엔드', level: '주도' }] },
    ],
  },
  {
    id: 4,
    emoji: '🚀',
    title: '배포',
    subtitle: 'Deploy',
    color: { bg: '#fdf4ff', border: '#e879f9', accent: '#86198f', badge: '#581c87', badgeBg: '#f5d0fe' },
    intro: '서버를 세우고 실제 세상으로 내보낸다.',
    rolesSummary: [
      { key: '기획자',   level: '참여', note: '스토어 설명문 · 마케팅 텍스트 작성' },
      { key: '디자이너', level: '참여', note: '스토어 아이콘 · 스크린샷 제작' },
      { key: '앱개발자', level: '주도', note: '앱 빌드 · 구글 플레이 등록' },
      { key: '백엔드',   level: '주도', note: '서버 구축 (OCI) · HTTPS 적용' },
    ],
    items: [
      { label: '서버 구축', desc: 'OCI 인프라 세팅 (이미 준비 완료 ✅)', icon: '🖥',
        roles: [{ key: '백엔드', level: '주도' }] },
      { label: '앱 등록', desc: '구글 플레이 스토어 심사 + 등록', icon: '📲',
        roles: [{ key: '앱개발자', level: '주도' }, { key: '기획자', level: '참여' }, { key: '디자이너', level: '참여' }] },
      { label: 'HTTPS 적용', desc: 'SSL 인증서 — 보안 필수 항목', icon: '🔒',
        roles: [{ key: '백엔드', level: '주도' }] },
    ],
  },
  {
    id: 5,
    emoji: '🏁',
    title: '출시 이후',
    subtitle: 'Post-Launch',
    color: { bg: '#fff7ed', border: '#fdba74', accent: '#c2410c', badge: '#7c2d12', badgeBg: '#fed7aa' },
    intro: '"완료가 시작이다." — 출시 후가 진짜 시작.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '사용자 피드백 수집 · 기능 개선 기획' },
      { key: '디자이너', level: '참여', note: 'UI 개선 · 신규 화면 디자인' },
      { key: '앱개발자', level: '참여', note: '버그 수정 · 기능 추가 개발' },
      { key: '백엔드',   level: '참여', note: '장애 대응 · 서버 모니터링' },
    ],
    items: [
      { label: '유지보수', desc: '버그 수정, 서버 안정성 관리', icon: '🔧',
        roles: [{ key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '코드 관리', desc: '기술 부채 정리, 리팩토링', icon: '📁',
        roles: [{ key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '기능 추가 / 개선', desc: '사용자 피드백 기반 지속 개선 → 기획 단계로 순환', icon: '➕',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '장애 대응', desc: '이슈 발생 시 빠른 탐지 + 복구', icon: '🚨', highlight: true,
        roles: [{ key: '백엔드', level: '주도' }, { key: '앱개발자', level: '참여' }] },
    ],
  },
  {
    id: 6,
    emoji: '💰',
    title: '수익화',
    subtitle: 'Monetization',
    color: { bg: '#f0fdfa', border: '#5eead4', accent: '#0f766e', badge: '#134e4a', badgeBg: '#99f6e4' },
    intro: '기획 단계부터 반드시 고민해야 한다.',
    rolesSummary: [
      { key: '기획자',   level: '주도', note: '수익 모델 설계 · 정책 수립' },
      { key: '디자이너', level: '참여', note: '구독/결제 UI 디자인' },
      { key: '앱개발자', level: '참여', note: '인앱 결제 모듈 연동' },
      { key: '백엔드',   level: '참여', note: '결제 API · 구독 관리 서버' },
    ],
    items: [
      { label: '광고', desc: '앱 내 광고 수익 (배너, 전면 광고 등)', icon: '📢',
        roles: [{ key: '기획자', level: '주도' }, { key: '앱개발자', level: '참여' }] },
      { label: '구독', desc: '월정액 프리미엄 기능 제공', icon: '🔄',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
      { label: '유료 서비스', desc: '특정 기능 / 콘텐츠 일회성 결제', icon: '💳',
        roles: [{ key: '기획자', level: '주도' }, { key: '디자이너', level: '참여' }, { key: '앱개발자', level: '참여' }, { key: '백엔드', level: '참여' }] },
    ],
  },
]

const LEVEL_STYLE: Record<RoleLevel, { label: string; opacity: string }> = {
  주도: { label: '주도', opacity: 'opacity-100' },
  참여: { label: '참여', opacity: 'opacity-60' },
  검토: { label: '검토', opacity: 'opacity-40' },
}

function RoleBadge({ roleKey, level, size = 'sm' }: { roleKey: RoleKey; level: RoleLevel; size?: 'xs' | 'sm' }) {
  const role = ROLES[roleKey]
  const isLead = level === '주도'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'} ${LEVEL_STYLE[level].opacity}`}
      style={{
        background: role.bg,
        borderColor: role.border,
        color: role.color,
        fontWeight: isLead ? 700 : 500,
      }}
    >
      <span>{role.emoji}</span>
      <span>{roleKey}</span>
      {size === 'sm' && (
        <span
          className="rounded-full px-1 text-[9px]"
          style={{ background: role.border, color: role.color, opacity: 0.85 }}
        >
          {level}
        </span>
      )}
    </span>
  )
}

export function DevGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 text-white">
      {/* 배경 그리드 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Team Side Project · Development Guide
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            서비스 개발
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              전체 과정
            </span>
          </h1>
        </div>

        {/* 역할 범례 */}
        <div className="mb-14 flex flex-wrap justify-center gap-2">
          {(Object.keys(ROLES) as RoleKey[]).map((key) => {
            const r = ROLES[key]
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ background: r.bg, borderColor: r.border, color: r.color }}
              >
                {r.emoji} {key}
              </span>
            )
          })}
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            <span className="font-bold text-white">주도</span> = 메인 담당
            <span className="mx-1 opacity-40">|</span>
            <span className="opacity-60">참여</span> = 함께 관여
          </span>
        </div>

        {/* 타임라인 */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-[28px] top-8 hidden w-0.5 bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-800 sm:block"
            style={{ height: 'calc(100% - 4rem)' }}
          />

          <div className="space-y-8">
            {PHASES.map((phase) => (
              <div key={phase.id} className="flex gap-5 sm:gap-8">
                {/* 스텝 원형 */}
                <div className="relative flex-shrink-0">
                  <div
                    className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl shadow-lg"
                    style={{ background: phase.color.bg, borderColor: phase.color.border }}
                  >
                    {phase.emoji}
                  </div>
                </div>

                {/* 카드 */}
                <div
                  className="flex-1 overflow-hidden rounded-2xl border shadow-lg"
                  style={{
                    background: `${phase.color.bg}12`,
                    borderColor: `${phase.color.border}50`,
                  }}
                >
                  {/* 카드 헤더 */}
                  <div
                    className="border-b px-6 py-5"
                    style={{ borderColor: `${phase.color.border}35` }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                        style={{ background: phase.color.badgeBg, color: phase.color.badge }}
                      >
                        0{phase.id}
                      </span>
                      <h2 className="text-xl font-bold tracking-tight" style={{ color: phase.color.accent }}>
                        {phase.title}
                      </h2>
                      <span className="text-sm font-medium text-zinc-500">{phase.subtitle}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{phase.intro}</p>

                    {/* 역할 요약 */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {phase.rolesSummary.map((r) => {
                        const role = ROLES[r.key]
                        return (
                          <div
                            key={r.key}
                            className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                            style={{ background: `${role.bg}60`, borderColor: `${role.border}60` }}
                          >
                            <span className="text-base">{role.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold" style={{ color: role.color }}>{r.key}</span>
                                <span
                                  className={`rounded px-1 py-0.5 text-[9px] font-bold ${r.level === '주도' ? 'opacity-100' : 'opacity-60'}`}
                                  style={{ background: role.border, color: role.color }}
                                >
                                  {r.level}
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-zinc-500">{r.note}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 세부 항목 */}
                  <div className="grid gap-2.5 p-5 sm:grid-cols-2 sm:p-6">
                    {phase.items.map((item) => (
                      <div
                        key={item.label}
                        className={`group relative flex flex-col gap-2.5 rounded-xl border p-4 transition ${
                          item.highlight ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/5 hover:bg-white/[0.07]'
                        }`}
                      >
                        {item.highlight && (
                          <div
                            className="pointer-events-none absolute -inset-px rounded-xl opacity-25"
                            style={{ border: `1.5px solid ${phase.color.border}` }}
                          />
                        )}
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex-shrink-0 text-lg leading-none">{item.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-zinc-200 leading-tight">
                              {item.label}
                              {item.highlight && (
                                <span
                                  className="ml-1.5 inline-block rounded px-1 py-0.5 text-[9px] font-black uppercase tracking-wider"
                                  style={{ background: phase.color.border, color: phase.color.badge }}
                                >
                                  중요
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs leading-5 text-zinc-500">{item.desc}</p>
                          </div>
                        </div>
                        {/* 담당 역할 태그 */}
                        <div className="flex flex-wrap gap-1">
                          {item.roles.map((r) => (
                            <RoleBadge key={r.key} roleKey={r.key} level={r.level} size="xs" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-800/40 px-8 py-5 backdrop-blur-sm">
            <span className="text-2xl">🏁</span>
            <div className="text-left">
              <p className="text-sm font-bold text-white">완료가 시작이다.</p>
              <p className="mt-0.5 text-xs text-zinc-400">출시 후가 진짜 서비스의 시작입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

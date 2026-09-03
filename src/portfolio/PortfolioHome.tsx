import { useRef, useState } from 'react'
import { profile } from '../profile'
import { portfolio, STATUS_STYLES, formatCareerDuration } from './data'
import { ProjectContent } from './ProjectContent'
import { ProjectModal } from './ProjectModal'

const LONG_PRESS_MS = 800
const CAPTURE_SCALE = 2

const CATEGORY_BANNER: Record<string, string> = {
  아키텍처: 'bg-indigo-50 text-indigo-700',
  '데이터 처리': 'bg-amber-50 text-amber-700',
  마이그레이션: 'bg-purple-50 text-purple-700',
  안정성: 'bg-rose-50 text-rose-700',
  '사이드 프로젝트': 'bg-sky-50 text-sky-700',
}

function CategoryIcon({ category }: { category: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (category) {
    case '아키텍처':
      return (
        <svg {...common}>
          <path d="M12 2 2 7l10 5 10-5-10-5Z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
    case '데이터 처리':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
          <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
        </svg>
      )
    case '마이그레이션':
      return (
        <svg {...common}>
          <path d="M8 3 4 7l4 4" />
          <path d="M4 7h16" />
          <path d="M16 21l4-4-4-4" />
          <path d="M20 17H4" />
        </svg>
      )
    case '안정성':
      return (
        <svg {...common}>
          <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
        </svg>
      )
    case '사이드 프로젝트':
      return (
        <svg {...common}>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      )
    default:
      return null
  }
}

export function PortfolioHome() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const pdfContentRef = useRef<HTMLDivElement>(null)
  const pdfProjectPagesRef = useRef<HTMLDivElement>(null)
  const pressTimerRef = useRef<number | null>(null)

  const clearPressTimer = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const exportPdf = async () => {
    const target = pdfContentRef.current
    if (!target || isExporting) return
    setIsExporting(true)
    try {
      // 웹폰트(Pretendard)가 아직 안 불러와진 상태로 찍히면 글자 폭이 달라져
      // 화면과 다른 레이아웃으로 캡처된다 — 로드 완료를 기다린 뒤 캡처한다.
      await document.fonts.ready

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])

      const captureOpts = {
        scale: CAPTURE_SCALE,
        backgroundColor: '#fafafa',
        useCORS: true,
      }

      const canvas = await html2canvas(target, {
        ...captureOpts,
        // 캡처용 내부 렌더링 창 크기를 명시해서 sm/lg/2xl 반응형 스타일이
        // 실제 화면과 다르게 계산되는 걸 막는다.
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      })

      // 이메일·GitHub처럼 실제 링크였던 요소는 PDF에서도 클릭 가능하도록
      // 좌표를 계산해 링크 주석으로 덧붙인다 (캡처 이미지 자체엔 링크가 없다).
      const containerRect = target.getBoundingClientRect()
      const links = Array.from(
        target.querySelectorAll<HTMLAnchorElement>('[data-pdf-link]'),
      ).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          url: el.href,
          x: (r.left - containerRect.left) * CAPTURE_SCALE,
          y: (r.top - containerRect.top) * CAPTURE_SCALE,
          width: r.width * CAPTURE_SCALE,
          height: r.height * CAPTURE_SCALE,
        }
      })

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, canvas.width, canvas.height)
      for (const link of links) {
        pdf.link(link.x, link.y, link.width, link.height, { url: link.url })
      }

      // 카드를 눌러야 보이는 모달 상세 내용(문제/해결/결과)은 화면 캡처에 안 잡히니,
      // 화면 밖에 렌더해둔 같은 내용을 프로젝트당 한 페이지씩 뒤에 붙인다.
      const projectPageEls = pdfProjectPagesRef.current
        ? Array.from(
            pdfProjectPagesRef.current.querySelectorAll<HTMLElement>('[data-pdf-project]'),
          )
        : []
      for (const el of projectPageEls) {
        const projectCanvas = await html2canvas(el, captureOpts)
        pdf.addPage(
          [projectCanvas.width, projectCanvas.height],
          projectCanvas.width > projectCanvas.height ? 'landscape' : 'portrait',
        )
        pdf.addImage(
          projectCanvas.toDataURL('image/jpeg', 0.92),
          'JPEG',
          0,
          0,
          projectCanvas.width,
          projectCanvas.height,
        )
      }

      pdf.save('김동규_백엔드개발자_포트폴리오.pdf')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePressStart = () => {
    clearPressTimer()
    pressTimerRef.current = window.setTimeout(() => {
      pressTimerRef.current = null
      void exportPdf()
    }, LONG_PRESS_MS)
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div
        ref={pdfContentRef}
        className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-8 sm:py-14 lg:px-16 lg:py-16 2xl:px-24"
      >
        <div className="mb-10 sm:mb-14">
          <span
            className={`select-none text-sm font-semibold tracking-tight text-indigo-700 transition ${isExporting ? 'opacity-50' : ''}`}
            style={{ touchAction: 'none' }}
            onPointerDown={handlePressStart}
            onPointerUp={clearPressTimer}
            onPointerLeave={clearPressTimer}
            onPointerCancel={clearPressTimer}
          >
            {profile.brand}
          </span>
        </div>

        {/* Hero / Intro */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 sm:grid-cols-[280px_minmax(0,1fr)] sm:items-start sm:gap-12">
            <div className="relative">
              <img
                className="w-full rounded-xl object-contain"
                src={portfolio.photoUrl}
                alt={`${profile.name} 프로필 사진`}
                loading="lazy"
              />
              <img
                src={portfolio.mascotUrl}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute -left-4 -top-4 h-16 w-16 -rotate-12 rounded-full border-2 border-white bg-white object-cover p-0.5 shadow-md sm:h-20 sm:w-20"
              />
            </div>

            <div>
              <div className="space-y-4 text-base leading-7 text-zinc-700 sm:text-lg sm:leading-8">
                {portfolio.introParagraphs.map((paragraph, i) => (
                  <p key={i} className={i === 0 ? 'font-bold text-zinc-900' : undefined}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-6 grid gap-3 text-base text-zinc-600 sm:grid-cols-2 sm:text-lg">
                <ContactRow
                  icon="✉️"
                  text={portfolio.contact.email}
                  href={`mailto:${portfolio.contact.email}`}
                  pdfLinkId="email"
                />
                <ContactRow
                  icon="🐙"
                  text={portfolio.contact.githubLabel}
                  href={portfolio.contact.githubUrl}
                  pdfLinkId="github"
                />
              </div>
            </div>
          </div>
        </section>

        <SectionHeading emoji="🔍" title="Profile" />
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <p className="text-sm font-semibold text-blue-700">
              경력 ({formatCareerDuration(portfolio.career.startDate)})
            </p>
            <p className="mt-2 text-base font-semibold text-zinc-900 sm:text-lg">
              {portfolio.career.company}
            </p>
            <p className="mt-0.5 text-sm text-zinc-900">{portfolio.career.period}</p>
            <ul className="mt-3 space-y-2 text-base leading-7 text-zinc-900">
              {portfolio.career.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
            <p className="text-sm font-semibold text-zinc-900">학력</p>
            <p className="mt-2 text-base font-semibold text-zinc-900 sm:text-lg">
              {portfolio.education.school}
            </p>
            <p className="mt-0.5 text-sm text-zinc-900">{portfolio.education.period}</p>
            <p className="mt-4 text-sm font-semibold text-zinc-900">학사 학위</p>
            <p className="mt-1.5 text-base text-zinc-900">{portfolio.education.degree}</p>
            <p className="mt-4 text-sm font-semibold text-zinc-900">교육</p>
            <p className="mt-1.5 text-base text-zinc-900">{portfolio.education.bootcamp}</p>
            <p className="mt-4 text-sm font-semibold text-zinc-900">자격증</p>
            <ul className="mt-1.5 space-y-1 text-base text-zinc-900">
              {portfolio.education.certificates.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>

        <SectionHeading emoji="🛠" title="Skills" />
        <section className="grid gap-4 sm:grid-cols-2">
          <SkillCard title="Backend" tone="blue" items={portfolio.skills.backend} />
          <SkillCard
            title="Tools & Observability"
            tone="emerald"
            items={portfolio.skills.tools}
          />
        </section>

        <SectionHeading emoji="🚀" title="Projects" />
        {portfolio.projectGroups.map((group) => (
          <div key={group.name} className="mb-10 last:mb-0">
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-lg font-bold text-zinc-900">{group.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  group.kind === '회사 프로젝트'
                    ? 'bg-zinc-100 text-zinc-700'
                    : 'bg-sky-50 text-sky-700'
                }`}
              >
                {group.kind}
              </span>
              {group.period && <span className="text-sm text-zinc-500">{group.period}</span>}
            </div>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.projects.map((project) => (
                <button
                  key={project.slug}
                  type="button"
                  onClick={() => setOpenSlug(project.slug)}
                  className="group flex flex-col items-stretch overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <div
                    className={`flex items-center gap-2 border-b border-black/5 px-5 py-3 text-sm font-semibold ${
                      CATEGORY_BANNER[project.category] ?? 'bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    <CategoryIcon category={project.category} />
                    {project.category}
                  </div>
                  <div className="flex flex-1 flex-col items-start p-5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATUS_STYLES[project.status]}`}
                    >
                      {project.status}
                    </span>
                    <h3 className="mt-3 text-base font-semibold leading-6 text-zinc-900">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-zinc-900">{project.org}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-900"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-1.5">
                      자세히 보기
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </button>
              ))}
            </section>
          </div>
        ))}

        <div className="pb-10" />
      </div>

      {openSlug && <ProjectModal slug={openSlug} onClose={() => setOpenSlug(null)} />}

      {/* PDF 내보내기 전용 — 카드를 눌러야 보이는 모달 상세를 화면 밖에 항상 렌더해둔다 */}
      <div aria-hidden className="pointer-events-none fixed left-[-99999px] top-0">
        <div ref={pdfProjectPagesRef}>
          {portfolio.projectGroups.flatMap((g) => g.projects).map((project) => (
            <div
              key={project.slug}
              data-pdf-project={project.slug}
              className="w-[900px] bg-[#fafafa] p-10"
            >
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <ProjectContent project={project} forPdf />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="mb-4 mt-14 flex items-center gap-2 sm:mt-16">
      <span className="text-xl">{emoji}</span>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h2>
    </div>
  )
}

function ContactRow({
  icon,
  text,
  href,
  pdfLinkId,
}: {
  icon: string
  text: string
  href?: string
  pdfLinkId?: string
}) {
  const content = (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="text-xl">
        {icon}
      </span>
      <span>{text}</span>
    </span>
  )
  if (!href) return <div>{content}</div>
  return (
    <a
      className="transition hover:text-indigo-600"
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      data-pdf-link={pdfLinkId}
    >
      {content}
    </a>
  )
}

function SkillCard({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'blue' | 'emerald'
  items: string[]
}) {
  const toneStyles =
    tone === 'blue'
      ? {
          border: 'border-blue-100',
          bg: 'bg-blue-50/60',
          chip: 'bg-blue-100 text-blue-700',
          label: 'text-blue-700',
        }
      : {
          border: 'border-emerald-100',
          bg: 'bg-emerald-50/60',
          chip: 'bg-emerald-100 text-emerald-700',
          label: 'text-emerald-700',
        }
  return (
    <div className={`rounded-2xl border ${toneStyles.border} ${toneStyles.bg} p-5 sm:p-6`}>
      <p className={`text-sm font-semibold ${toneStyles.label}`}>{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-full px-3 py-1 text-sm font-medium ${toneStyles.chip}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

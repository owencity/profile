import { useRef, useState } from 'react'
import { profile } from '../profile'
import { portfolio, CATEGORY_STYLES, STATUS_STYLES, formatCareerDuration } from './data'
import { ProjectModal } from './ProjectModal'

const LONG_PRESS_MS = 800
const CAPTURE_SCALE = 2

export function PortfolioHome() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const pdfContentRef = useRef<HTMLDivElement>(null)
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

      const canvas = await html2canvas(target, {
        scale: CAPTURE_SCALE,
        backgroundColor: '#fafafa',
        useCORS: true,
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

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
      for (const link of links) {
        pdf.link(link.x, link.y, link.width, link.height, { url: link.url })
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
      <div className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-8 sm:py-14 lg:px-16 lg:py-16 2xl:px-24">
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

        <div ref={pdfContentRef}>
        {/* Hero / Intro */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 sm:grid-cols-[280px_minmax(0,1fr)] sm:items-start sm:gap-12">
            <img
              className="w-full rounded-xl object-contain"
              src={portfolio.photoUrl}
              alt={`${profile.name} 프로필 사진`}
              loading="lazy"
            />

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                {portfolio.headline}
              </h1>
              <div className="mt-4 space-y-4 text-base leading-7 text-zinc-700 sm:text-lg sm:leading-8">
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
            <p className="mt-0.5 text-sm text-zinc-500">{portfolio.career.period}</p>
            <ul className="mt-3 space-y-2 text-base leading-7 text-zinc-700">
              {portfolio.career.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
            <p className="text-sm font-semibold text-zinc-600">학력</p>
            <p className="mt-2 text-base font-semibold text-zinc-900 sm:text-lg">
              {portfolio.education.school}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">{portfolio.education.period}</p>
            <p className="mt-4 text-sm font-semibold text-zinc-600">교육</p>
            <p className="mt-1.5 text-base text-zinc-700">{portfolio.education.bootcamp}</p>
            <p className="mt-4 text-sm font-semibold text-zinc-600">자격증</p>
            <ul className="mt-1.5 space-y-1 text-base text-zinc-700">
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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.projects.map((project) => (
            <button
              key={project.slug}
              type="button"
              onClick={() => setOpenSlug(project.slug)}
              className="group flex flex-col items-start rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
            >
              <img
                src={portfolio.mascotUrl}
                alt=""
                aria-hidden
                loading="lazy"
                className="h-16 w-16 rounded-full border border-zinc-100 bg-white object-cover p-1"
              />
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-sm font-semibold ${
                    CATEGORY_STYLES[project.category] ??
                    'border-zinc-100 bg-zinc-50 text-zinc-600'
                  }`}
                >
                  {project.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${STATUS_STYLES[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold leading-6 text-zinc-900">
                {project.title}
              </h3>
              <p className="mt-2 text-sm leading-5 text-zinc-500">{project.org}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.techStack.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
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
            </button>
          ))}
        </section>
        </div>

        <div className="pb-10" />
      </div>

      {openSlug && <ProjectModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
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

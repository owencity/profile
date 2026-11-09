import { useRef, useState } from 'react'
import { profile } from '../profile'
import { portfolio, type PortfolioProject } from './data'
import { ProjectContent } from './ProjectContent'
import { ProjectModal } from './ProjectModal'

const LONG_PRESS_MS = 800
const CAPTURE_SCALE = 2

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


  const { hero, stats, contact } = portfolio

  return (
    <div className="min-h-screen break-keep bg-zinc-50 text-zinc-900">
      <div ref={pdfContentRef} className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-7">
          <span
            className={`select-none font-mono text-base font-bold text-indigo-700 transition ${isExporting ? 'opacity-50' : ''}`}
            style={{ touchAction: 'none' }}
            onPointerDown={handlePressStart}
            onPointerUp={clearPressTimer}
            onPointerLeave={clearPressTimer}
            onPointerCancel={clearPressTimer}
          >
            {profile.brand}
          </span>
          <nav className="flex flex-wrap items-center gap-2">
            <a
              href="#projects"
              className="px-4 py-3 text-[15px] font-medium text-zinc-700 transition hover:text-zinc-900"
            >
              프로젝트
            </a>
            <a
              href={profile.links.externalBlog}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 text-[15px] font-medium text-zinc-700 transition hover:text-zinc-900"
            >
              블로그
            </a>
            <a
              href={contact.githubUrl}
              target="_blank"
              rel="noreferrer"
              data-pdf-link
              className="rounded-full bg-zinc-900 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-zinc-700"
            >
              GitHub
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="flex flex-wrap items-center gap-12 pb-14 pt-10 sm:pt-16">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <span className="self-start rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {hero.badge}
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-[56px] sm:leading-[1.2]">
              {hero.headlineLead}
              <br />
              <span className="text-indigo-700">{hero.headlineAccent}</span> {hero.headlineTail}
            </h1>
            <p className="max-w-[640px] text-lg leading-[1.75] text-zinc-600 sm:text-[19px]">
              {hero.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${contact.email}`}
                data-pdf-link
                className="rounded-xl bg-indigo-700 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-800"
              >
                {contact.email}
              </a>
              <a
                href={contact.githubUrl}
                target="_blank"
                rel="noreferrer"
                data-pdf-link
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3.5 text-base font-semibold text-zinc-900 transition hover:border-zinc-900"
              >
                {contact.githubLabel}
              </a>
            </div>
          </div>
          {/* 사진 두 장을 기울여 겹쳐 놓고, 마우스를 올리면 살짝 벌어진다 */}
          <div className="group relative mx-auto aspect-[20/21] w-full max-w-[380px] flex-[1_1_300px]">
            <img
              src={portfolio.photos.back.src}
              alt={portfolio.photos.back.alt}
              className="absolute left-0 top-0 aspect-[4/5] w-[60%] -rotate-3 rounded-[22px] border-[6px] border-white object-cover shadow-xl transition duration-500 group-hover:-translate-x-2 group-hover:-rotate-6 sm:-rotate-[5deg]"
            />
            <img
              src={portfolio.photos.front.src}
              alt={portfolio.photos.front.alt}
              className="absolute bottom-0 right-0 aspect-[4/5] w-[68%] rotate-2 rounded-[22px] border-[6px] border-white object-cover shadow-2xl transition duration-500 group-hover:translate-x-2 group-hover:rotate-[5deg] sm:rotate-3"
            />
          </div>
        </section>

        {/* 핵심 성과 */}
        <section
          aria-label="핵심 성과"
          className="grid grid-cols-2 gap-3 pb-20 sm:gap-4 lg:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1.5 rounded-[20px] border border-zinc-200 bg-white p-4 sm:p-6"
            >
              <span className="font-mono text-[28px] font-bold leading-none sm:text-[40px] tracking-tight text-indigo-700">
                {s.value}
              </span>
              <span className="mt-2 text-[15px] font-semibold text-zinc-900">{s.label}</span>
              <span className="text-sm text-zinc-600">{s.sub}</span>
            </div>
          ))}
        </section>

        <div id="projects" className="flex flex-col gap-20 pb-24">
          {portfolio.projectGroups.map((group) => {
            const visibleProjects = group.projects.filter((project) => !project.hidden)
            if (visibleProjects.length === 0) return null
            const isCompany = group.kind === '회사 프로젝트'
            return (
              <section key={group.name} className="flex flex-col gap-7">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-zinc-900 pt-5">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-[32px]">{group.name}</h2>
                  {(group.period ?? group.subtitle) && (
                    <span className="text-[15px] text-zinc-600">
                      {group.period ?? group.subtitle}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.slug}
                      project={project}
                      isCompany={isCompany}
                      onOpen={() => setOpenSlug(project.slug)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-zinc-200 pb-12 pt-8 text-sm text-zinc-600">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span>Java · Kotlin · Spring Boot · PostgreSQL · RabbitMQ</span>
        </footer>
      </div>

      {openSlug && <ProjectModal slug={openSlug} onClose={() => setOpenSlug(null)} />}

      {/* PDF 내보내기 전용 — 카드를 눌러야 보이는 모달 상세를 화면 밖에 항상 렌더해둔다 */}
      <div aria-hidden className="pointer-events-none fixed left-[-99999px] top-0">
        <div ref={pdfProjectPagesRef}>
          {portfolio.projectGroups
            .flatMap((g) => g.projects)
            .filter((project) => !project.hidden)
            .map((project) => (
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

function ProjectCard({
  project,
  isCompany,
  onOpen,
}: {
  project: PortfolioProject
  isCompany: boolean
  onOpen: () => void
}) {
  const { highlight } = project
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col gap-[18px] rounded-[20px] border border-zinc-200 bg-white p-7 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg"
    >
      <span
        className={`self-start rounded-lg px-2.5 py-1 text-[13px] font-semibold ${
          isCompany ? 'bg-indigo-50 text-indigo-800' : 'bg-sky-100 text-sky-800'
        }`}
      >
        {project.category}
      </span>
      <h3 className="text-[21px] font-bold leading-snug">{project.title}</h3>
      {highlight && (
        <div className="flex flex-col gap-2 rounded-2xl bg-zinc-100 p-[18px]">
          <span className="text-[13px] font-semibold text-zinc-600">{highlight.label}</span>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className={`text-base text-zinc-600 line-through ${isCompany ? 'font-mono' : ''}`}>
              {highlight.before}
            </span>
            <span aria-hidden className="text-zinc-600">
              →
            </span>
            <span
              className={`font-bold text-indigo-700 ${isCompany ? 'font-mono text-[30px] leading-none' : 'text-2xl'}`}
            >
              {highlight.after}
            </span>
          </div>
          <span className="text-sm font-semibold text-zinc-900">{highlight.delta}</span>
        </div>
      )}
      <p className="text-base leading-[1.7] text-zinc-700">{project.tagline ?? project.summary[0]}</p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {project.techStack.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-zinc-200 px-2.5 py-1 text-[13px] text-zinc-700"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="inline-flex items-center gap-1 py-1.5 text-[15px] font-semibold text-indigo-700 transition-all group-hover:gap-2">
        자세히 보기
        <span aria-hidden>→</span>
      </span>
    </button>
  )
}

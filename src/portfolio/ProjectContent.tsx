import type { ReactNode } from 'react'
import {
  CATEGORY_STYLES,
  STATUS_STYLES,
  type PortfolioProject,
  type ProjectBullet,
  type ProjectDiagram,
  type ProjectSolution,
} from './data'

export function ProjectContent({
  project,
  forPdf,
}: {
  project: PortfolioProject
  forPdf?: boolean
}) {
  const hasResult =
    project.result && (project.result.before || project.result.after || project.result.note)

  return (
    <div>
      <p className="text-xs font-medium text-zinc-900">{project.org}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            CATEGORY_STYLES[project.category] ?? 'border-zinc-100 bg-zinc-50 text-zinc-600'
          }`}
        >
          {project.category}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[project.status]}`}
        >
          {project.status}
        </span>
        {project.period && <span className="text-xs text-zinc-900">{project.period}</span>}
      </div>
      <h1 className="mt-3 pr-8 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        {project.title}
      </h1>

      {project.diagram && (
        <DiagramFigure diagram={project.diagram} forPdf={forPdf} className="mt-6" />
      )}


      {project.diagrams?.map((d) => (
        <DiagramFigure key={d.src} diagram={d} forPdf={forPdf} className="mt-4" />
      ))}

      {project.problemPoints && project.problemPoints.length > 0 ? (
        <DetailSection title="문제">
          <BulletList bullets={project.problemPoints} forPdf={forPdf} />
        </DetailSection>
      ) : (
        project.problem && (
          <DetailSection title="문제">
            <p className="text-lg leading-9 text-zinc-900">{project.problem}</p>
          </DetailSection>
        )
      )}

      {project.solutionPoints && project.solutionPoints.length > 0 ? (
        <DetailSection title="해결">
          <BulletList bullets={project.solutionPoints} forPdf={forPdf} emphasizeTitle />
        </DetailSection>
      ) : project.solutionGroups && project.solutionGroups.length > 0 ? (
        <DetailSection title="해결">
          <div className="space-y-6">
            {project.solutionGroups.map((group) => (
              <div key={group.title}>
                <p className="text-base font-bold text-zinc-900">{group.title}</p>
                <div className="mt-3 space-y-4 border-l-2 border-zinc-100 pl-4">
                  {group.items.map((s) => (
                    <SolutionItem key={s.label} solution={s} forPdf={forPdf} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : (
        project.solutions &&
        project.solutions.length > 0 && (
          <DetailSection title="해결">
            <div className="space-y-4">
              {project.solutions.map((s) => (
                <SolutionItem key={s.label} solution={s} forPdf={forPdf} />
              ))}
            </div>
          </DetailSection>
        )
      )}

      {project.resultPoints && project.resultPoints.length > 0 ? (
        <DetailSection title="결과">
          <BulletList bullets={project.resultPoints} forPdf={forPdf} />
        </DetailSection>
      ) : hasResult && (
        <DetailSection title="결과">
          {(project.result?.before || project.result?.after) && (
            <div className="mb-3 flex max-w-[640px] items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex-1 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-900">
                  Before
                </p>
                <p className="mt-1 text-base font-bold text-zinc-900">{project.result?.before}</p>
              </div>
              <span className="text-zinc-300">→</span>
              <div className="flex-1 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                  After
                </p>
                <p className="mt-1 text-base font-bold text-emerald-700">
                  {project.result?.after}
                </p>
              </div>
            </div>
          )}
          {project.result?.note && (
            <p className="text-lg leading-9 text-zinc-900">{project.result.note}</p>
          )}
        </DetailSection>
      )}


      {project.techStack.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-6">
          {project.techStack.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-900"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function BulletList({
  bullets,
  forPdf,
  emphasizeTitle,
}: {
  bullets: ProjectBullet[]
  forPdf?: boolean
  emphasizeTitle?: boolean
}) {
  return (
    <ul className="space-y-4">
      {bullets.map((b) => (
        <li key={b.text}>
          <div className="flex gap-3">
            <span className="mt-[0.95rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-900" />
            <span
              className={`text-lg leading-9 text-zinc-900${emphasizeTitle ? ' font-bold' : ''}`}
            >
              {b.text}
            </span>
          </div>
          {b.sub && b.sub.length > 0 && (
            <ul className="mt-2 space-y-2 pl-[1.3rem]">
              {b.sub.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-[0.95rem] h-1.5 w-1.5 flex-shrink-0 rounded-full border border-zinc-900" />
                  <span className="text-[17px] leading-9 text-zinc-900">{line}</span>
                </li>
              ))}
            </ul>
          )}
          {b.diagram && (
            <DiagramFigure diagram={b.diagram} forPdf={forPdf} className="mt-3" />
          )}
        </li>
      ))}
    </ul>
  )
}

function SolutionItem({
  solution,
  forPdf,
}: {
  solution: ProjectSolution
  forPdf?: boolean
}) {
  return (
    <div>
      <p className="text-base font-semibold text-zinc-900">{solution.label}</p>
      <p className="mt-1 text-lg leading-9 text-zinc-900">{solution.desc}</p>
      {solution.diagram && (
        <DiagramFigure diagram={solution.diagram} forPdf={forPdf} className="mt-3" />
      )}
    </div>
  )
}

function DiagramFigure({
  diagram,
  forPdf,
  className,
}: {
  diagram: ProjectDiagram
  forPdf?: boolean
  className?: string
}) {
  const image = <img src={forPdf ? diagram.pdfSrc : diagram.src} alt={diagram.alt} className="w-full" />

  return (
    <figure
      className={`mx-auto max-w-[1240px] rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition ${
        diagram.href ? 'hover:border-blue-400' : ''
      } ${className ?? ''}`}
    >
      {diagram.href ? (
        <a href={diagram.href} target="_blank" rel="noreferrer" className="block">
          {image}
        </a>
      ) : (
        image
      )}
      {diagram.caption && (
        <figcaption className="mt-3 max-w-[100ch] border-t border-zinc-200 pt-3 text-sm leading-7 text-zinc-900">
          {diagram.caption}
        </figcaption>
      )}
    </figure>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8">
      <p className="text-lg font-bold tracking-tight text-blue-700">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

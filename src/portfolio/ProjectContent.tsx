import type { ReactNode } from 'react'
import {
  CATEGORY_STYLES,
  STATUS_STYLES,
  type PortfolioProject,
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
      <h1 className="mt-3 pr-8 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
        {project.title}
      </h1>

      {project.summary.length > 0 ? (
        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-xs font-semibold text-indigo-700">3줄 요약</p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-zinc-900">
            {project.summary.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-400" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm leading-6 text-zinc-900">
            아직 상세 내용을 정리 중인 프로젝트입니다.
          </p>
        </div>
      )}

      {project.diagram && (
        <DiagramFigure diagram={project.diagram} forPdf={forPdf} className="mt-6" />
      )}

      {project.problem && (
        <DetailSection title="문제">
          <p className="text-sm leading-7 text-zinc-900">{project.problem}</p>
        </DetailSection>
      )}

      {project.solutionGroups && project.solutionGroups.length > 0 ? (
        <DetailSection title="해결">
          <div className="space-y-6">
            {project.solutionGroups.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-bold text-zinc-900">{group.title}</p>
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

      {hasResult && (
        <DetailSection title="결과">
          {(project.result?.before || project.result?.after) && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
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
            <p className="text-sm leading-6 text-zinc-900">{project.result.note}</p>
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

function SolutionItem({
  solution,
  forPdf,
}: {
  solution: ProjectSolution
  forPdf?: boolean
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900">{solution.label}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-900">{solution.desc}</p>
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
  return (
    <figure className={`rounded-xl border border-zinc-200 bg-zinc-50 p-3 ${className ?? ''}`}>
      <img src={forPdf ? diagram.pdfSrc : diagram.src} alt={diagram.alt} className="w-full" />
      <figcaption className="mt-3 border-t border-zinc-200 pt-3 text-xs leading-6 text-zinc-900">
        {diagram.caption}
      </figcaption>
    </figure>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-900">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

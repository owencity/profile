import { useEffect } from 'react'
import { getProjectBySlug } from './data'
import { ProjectContent } from './ProjectContent'

export interface ProjectModalProps {
  slug: string
  onClose: () => void
}

export function ProjectModal({ slug, onClose }: ProjectModalProps) {
  const project = getProjectBySlug(slug)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!project) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/50 p-4 backdrop-blur-sm sm:items-center sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <ProjectContent project={project} />
        </div>
      </div>
    </div>
  )
}

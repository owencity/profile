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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-3"
    >
      <div
        className="relative my-0 w-full max-w-none rounded-none bg-white shadow-2xl sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="fixed right-5 top-5 z-20 flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-900 shadow-lg transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white sm:right-8 sm:top-8"
        >
          <svg
            width="30"
            height="30"
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
        <div className="max-h-[100dvh] overflow-y-auto p-5 pt-20 sm:max-h-[98vh] sm:p-10 sm:pt-12 lg:px-16">
          <ProjectContent project={project} />
        </div>
      </div>
    </div>
  )
}

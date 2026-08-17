import { getBlogPostBySlug } from './posts'

export interface BlogPostProps {
  slug: string
  onBack?: () => void
}

export function BlogPost({ slug, onBack }: BlogPostProps) {
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          onClick={onBack}
        >
          ← Back
        </button>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-center text-zinc-600">글을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <div />
        {onBack && (
          <button
            type="button"
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            onClick={onBack}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Article Container */}
      <article className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <header className="mb-8 border-b border-zinc-200 pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            {formattedDate}
          </p>
        </header>

        {/* Content */}
        <div
          className="prose prose-sm max-w-none text-zinc-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Footer */}
      <div className="pb-6" />
    </div>
  )
}

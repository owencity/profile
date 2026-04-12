import { API_CONFIGS } from './api'

type Props = {
  onNavigate: (path: string) => void
}

export function TourismHubPage({ onNavigate }: Props) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between sm:mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">한국관광공사 Open API</h2>
          <p className="mt-1 text-sm text-zinc-500">공공데이터포털 승인 API 6종 데이터 탐색기</p>
        </div>
        <a
          className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('/')
          }}
        >
          ← Back
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {API_CONFIGS.map((api) => (
          <button
            key={api.id}
            type="button"
            onClick={() => onNavigate(`/tourism/${api.id}`)}
            className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md ${api.color}`}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <span className="text-3xl" role="img" aria-label={api.name}>{api.icon}</span>
              <span className="mt-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200/60">
                50개 / 페이지
              </span>
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900 leading-tight">{api.name}</p>
              <p className="mt-0.5 text-[11px] font-medium text-zinc-400 tracking-wide">{api.nameEn}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{api.description}</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-zinc-500 transition group-hover:text-zinc-800">
              데이터 보기
              <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        데이터 제공: 한국관광공사 · 공공데이터포털 (data.go.kr)
      </p>
    </section>
  )
}

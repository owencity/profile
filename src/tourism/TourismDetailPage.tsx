import { useEffect, useRef, useState } from 'react'
import { fetchTourismList, formatCellValue, getApiConfig, getDemandLevel } from './api'
import type { ApiConfig, TourismItem } from './types'

const ITEMS_PER_PAGE = 50

type Props = {
  apiId: string
  onNavigate: (path: string) => void
}

export function TourismDetailPage({ apiId, onNavigate }: Props) {
  const config = getApiConfig(apiId)

  const [items, setItems] = useState<TourismItem[]>([])
  const [pageNo, setPageNo] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))

  useEffect(() => {
    if (!config) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)
    fetchTourismList(config, pageNo, ITEMS_PER_PAGE, ctrl.signal)
      .then((res) => {
        setItems(res.items)
        setTotalCount(res.totalCount)
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [config, pageNo])

  if (!config) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        알 수 없는 API입니다.{' '}
        <button className="underline" onClick={() => onNavigate('/tourism')}>목록으로</button>
      </div>
    )
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <h2 className="text-lg font-semibold tracking-tight">{config.name}</h2>
          </div>
          {totalCount > 0 && (
            <p className="mt-1 text-xs text-zinc-400">
              전체 {totalCount.toLocaleString()}건 · {pageNo}/{totalPages} 페이지
            </p>
          )}
        </div>
        <a
          className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50"
          href="/tourism"
          onClick={(e) => { e.preventDefault(); onNavigate('/tourism') }}
        >
          ← 목록
        </a>
      </div>

      {/* 데이터 설명 배너 */}
      <div className={`mb-5 rounded-xl border p-4 text-sm leading-relaxed text-zinc-700 ${config.color}`}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">이 데이터는?</p>
        {config.explainText}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      )}

      {/* Items */}
      {!loading && items.length > 0 && (
        <div className="space-y-2.5">
          {(() => {
            // stats 타입일 때 현재 페이지 내 최대값 계산
            const maxVal = config.renderType === 'stats' && config.valueKey
              ? Math.max(...items.map((it) => Number(it[config.valueKey!]) || 0), 1)
              : 100

            return items.map((item, idx) => {
              const globalIdx = (pageNo - 1) * ITEMS_PER_PAGE + idx + 1
              if (config.renderType === 'stats') return (
                <StatsCard key={idx} item={item} config={config} idx={globalIdx} maxVal={maxVal} />
              )
              if (config.renderType === 'course') return (
                <CourseCard key={idx} item={item} config={config} idx={globalIdx} />
              )
              return (
                <PlaceCard key={idx} item={item} config={config} idx={globalIdx} />
              )
            })
          })()}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
          데이터가 없습니다.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          <button type="button" disabled={pageNo <= 1}
            onClick={() => setPageNo((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40">
            ← 이전
          </button>
          {buildPageNumbers(pageNo, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="px-1 text-xs text-zinc-400">…</span>
            ) : (
              <button key={p} type="button" onClick={() => setPageNo(p as number)}
                className={`min-w-[2rem] rounded-lg border px-2 py-1.5 text-xs font-semibold shadow-sm transition ${pageNo === p ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'}`}>
                {p}
              </button>
            )
          )}
          <button type="button" disabled={pageNo >= totalPages}
            onClick={() => setPageNo((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40">
            다음 →
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-400">
        데이터 제공: 한국관광공사 · 공공데이터포털 (data.go.kr)
      </p>
    </section>
  )
}

/* ── 카드 컴포넌트 ── */

function PlaceCard({ item, config, idx }: { item: TourismItem; config: ApiConfig; idx: number }) {
  const title = formatCellValue(config.titleKey, item[config.titleKey])
  const address = config.addressKey ? formatCellValue(config.addressKey, item[config.addressKey]) : null
  const image = config.imageKey ? (item[config.imageKey] as string | undefined) : undefined
  const extraCols = config.columns.filter(
    (c) => c.key !== config.titleKey && c.key !== config.addressKey && c.key !== config.imageKey,
  )

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <span className="mt-0.5 min-w-[2rem] text-right text-xs font-semibold text-zinc-300">{idx}</span>
      {image && (
        <img src={image} alt={title} loading="lazy"
          className="h-16 w-16 flex-shrink-0 rounded-lg bg-zinc-100 object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }} />
      )}
        <div className="min-w-0 flex-1">
          {/* 연관 관광지 관계 표시 (subKey가 연관지명인 경우) */}
          {config.subKey && config.subKey !== config.addressKey ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold leading-tight text-zinc-900">{title}</p>
              {formatCellValue(config.subKey, item[config.subKey]) !== '—' && (
                <>
                  <span className="text-xs text-zinc-400">→</span>
                  <p className="text-sm font-medium leading-tight text-indigo-700">
                    {formatCellValue(config.subKey, item[config.subKey])}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="truncate text-sm font-semibold leading-tight text-zinc-900">{title}</p>
          )}
          {address && address !== '—' && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">{address}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {extraCols.map((col) => {
              const val = formatCellValue(col.key, item[col.key])
              if (val === '—') return null
              // subKey는 위에서 이미 표시했으면 뱃지에서 제외
              if (col.key === config.subKey) return null
              return (
                <span key={col.key}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                  <span className="text-zinc-400">{col.label}</span>{val}
                </span>
              )
            })}
          </div>
        </div>
    </div>
  )
}

function StatsCard({ item, config, idx, maxVal }: { item: TourismItem; config: ApiConfig; idx: number; maxVal: number }) {
  const title = formatCellValue(config.titleKey, item[config.titleKey])
  const sub = config.subKey ? formatCellValue(config.subKey, item[config.subKey]) : null
  const rawVal = config.valueKey ? Number(item[config.valueKey]) : null
  const pct = rawVal !== null && !isNaN(rawVal) ? Math.min(100, (rawVal / maxVal) * 100) : null
  const level = rawVal !== null && !isNaN(rawVal) ? getDemandLevel(rawVal) : null

  // 지표명에서 카테고리 구분 (SNS/소비액/검색량)
  const getCategory = (name: string) => {
    if (name.includes('SNS')) return { label: 'SNS 언급량', color: 'bg-pink-100 text-pink-700' }
    if (name.includes('소비액')) return { label: '카드 소비액', color: 'bg-orange-100 text-orange-700' }
    if (name.includes('검색량')) return { label: '내비 검색량', color: 'bg-blue-100 text-blue-700' }
    return { label: '기타', color: 'bg-zinc-100 text-zinc-600' }
  }
  const category = getCategory(title)

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${category.color}`}>
              {category.label}
            </span>
            {sub && sub !== '—' && (
              <span className="text-xs text-zinc-400">{sub}</span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-zinc-900 leading-tight">{title}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          {rawVal !== null && !isNaN(rawVal) ? (
            <>
              <p className={`text-lg font-bold ${level?.textColor}`}>{rawVal.toFixed(1)}</p>
              <p className={`text-[11px] font-semibold ${level?.textColor}`}>{level?.label}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">—</p>
          )}
        </div>
      </div>

      {/* 프로그레스 바 */}
      {pct !== null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all ${level?.barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-zinc-400">기준: 0~100 지수</p>
        </div>
      )}
    </div>
  )
}

function CourseCard({ item, config, idx }: { item: TourismItem; config: ApiConfig; idx: number }) {
  const title = formatCellValue(config.titleKey, item[config.titleKey])
  const extraCols = config.columns.filter((c) => c.key !== config.titleKey)

  const LEVEL_MAP: Record<string, { label: string; color: string }> = {
    '1': { label: '하 (쉬움)', color: 'bg-emerald-100 text-emerald-700' },
    '2': { label: '중 (보통)', color: 'bg-amber-100 text-amber-700' },
    '3': { label: '상 (어려움)', color: 'bg-rose-100 text-rose-700' },
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <span className="mt-0.5 min-w-[2rem] text-right text-xs font-semibold text-zinc-300">{idx}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-zinc-900">{title}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {extraCols.map((col) => {
            const raw = item[col.key]
            const val = formatCellValue(col.key, raw)
            if (val === '—') return null
            if (col.key === 'level') {
              const lv = LEVEL_MAP[String(raw)] ?? { label: val, color: 'bg-zinc-100 text-zinc-600' }
              return (
                <span key={col.key} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${lv.color}`}>
                  {lv.label}
                </span>
              )
            }
            return (
              <span key={col.key}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                <span className="text-zinc-400">{col.label}</span>{val}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

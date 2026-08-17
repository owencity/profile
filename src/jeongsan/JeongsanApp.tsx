/**
 * 정산어택 서브앱 진입점.
 *
 * 라우팅 (SPEC §3 · §8)
 *   /jeongsan               H0 내 모임
 *   /jeongsan/new           H1 모임 만들기
 *   /jeongsan/:id/amount    H2 금액 입력
 *   /jeongsan/:id/collect   H3 수집 현황
 *   /jeongsan/:id/confirm   H3-b 확정 미리보기
 *   /jeongsan/:id/roster    H5 명단
 *   /jeongsan/:id/result    H4 결과·입금
 *
 *   /g/:token       ← 한 URL이 상태에 따라 분기한다
 *                     미참여+COLLECTING → W0-1/W0-2 · 미참여+CONFIRMED → W0-차단
 *                     참여+COLLECTING   → W1      · 참여+CONFIRMED    → W2
 *   /g/:token/all   W3 전체 내역
 *
 * 백엔드가 붙기 전에는 mock 으로 돈다. 개발용 전환 바로 화면을 오갈 수 있다.
 */
import { useEffect, useMemo, useState } from 'react'
import './jeongsan.css'
import { fetchGathering, fetchMyGatherings, fetchPreview, isMock } from './api'
import { mockGathering, mockSettlement, mockSummaries, MOCK_IDS } from './mock'
import type { Gathering, Id, Settlement } from './types'
import { HomePage } from './host/HomePage'
import { CreatePage } from './host/CreatePage'
import { AmountPage } from './host/AmountPage'
import { CollectPage } from './host/CollectPage'
import { ConfirmPage } from './host/ConfirmPage'
import { RosterPage } from './host/RosterPage'
import { ResultPage } from './host/ResultPage'
import { JoinPage } from './participant/JoinPage'
import { CheckPage } from './participant/CheckPage'
import { MyResultPage } from './participant/MyResultPage'
import { AllPage } from './participant/AllPage'

type Props = {
  /** 현재 경로. 포트폴리오 App.tsx 가 넘긴다. */
  route: string
  navigate: (to: string) => void
}

export default function JeongsanApp({ route, navigate }: Props) {
  const [g, setG] = useState<Gathering>(mockGathering)
  const [s, setS] = useState<Settlement>(mockSettlement)
  const [summaries, setSummaries] = useState(mockSummaries)

  // 개발용 — 어떤 참여자 시점으로 볼지, 그리고 상태를 강제로 바꿔본다
  const [asId, setAsId] = useState<Id>(MOCK_IDS.재훈)
  const [joined, setJoined] = useState(true)

  useEffect(() => {
    if (isMock()) return
    void fetchMyGatherings().then(setSummaries).catch(() => {})
  }, [])

  useEffect(() => {
    if (isMock()) return
    const m = route.match(/^\/jeongsan\/(\d+)/)
    if (!m) return
    const id = Number(m[1])
    void fetchGathering(id).then(setG).catch(() => {})
    void fetchPreview(id).then(setS).catch(() => {})
  }, [route])

  const me = useMemo(() => g.participants.find((p) => p.id === asId), [g, asId])
  const token = g.shareToken

  const dev = (
    <div className="js-dev">
      <span>mock</span>
      {g.participants.map((p) => (
        <button key={p.id} className={p.id === asId ? 'on' : ''} onClick={() => setAsId(p.id)}>
          {p.name}
        </button>
      ))}
      <button
        className={g.status === 'CONFIRMED' ? 'on' : ''}
        onClick={() =>
          setG({ ...g, status: g.status === 'CONFIRMED' ? 'COLLECTING' : 'CONFIRMED' })
        }
      >
        {g.status === 'CONFIRMED' ? '확정됨' : '수집중'}
      </button>
      <button className={joined ? 'on' : ''} onClick={() => setJoined(!joined)}>
        {joined ? '참여함' : '미참여'}
      </button>
    </div>
  )

  const wrap = (node: React.ReactNode) => (
    <div className="js-root">
      {dev}
      {node}
    </div>
  )

  // ── 참여자 웹 ────────────────────────────────
  const share = route.match(/^\/g\/([^/]+)(\/all)?$/)
  if (share) {
    const isAll = Boolean(share[2])
    if (isAll) {
      return wrap(<AllPage g={g} s={s} onBack={() => navigate(`/g/${token}`)} />)
    }
    if (!joined) {
      return wrap(
        <JoinPage
          g={g}
          onJoined={() => setJoined(true)}
          onViewAll={() => navigate(`/g/${token}/all`)}
        />,
      )
    }
    if (g.status === 'COLLECTING') {
      return wrap(<CheckPage g={g} me={me!} onSubmit={() => alert('제출 완료 (mock)')} />)
    }
    return wrap(
      <MyResultPage g={g} me={me!} s={s} onViewAll={() => navigate(`/g/${token}/all`)} />,
    )
  }

  // ── 주최자 앱 ────────────────────────────────
  if (route === '/jeongsan/new') {
    return wrap(<CreatePage onNext={() => navigate('/jeongsan/1/amount')} onBack={() => navigate('/jeongsan')} />)
  }

  const host = route.match(/^\/jeongsan\/(\d+)\/(\w+)$/)
  if (host) {
    const id = host[1]
    const page = host[2]
    const back = () => navigate(`/jeongsan/${id}/collect`)
    switch (page) {
      case 'amount':
        return wrap(
          <AmountPage g={g} onNext={() => navigate(`/jeongsan/${id}/collect`)} onBack={() => navigate('/jeongsan')} />,
        )
      case 'collect':
        return wrap(
          <CollectPage
            g={g}
            onConfirm={() => navigate(`/jeongsan/${id}/confirm`)}
            onRoster={() => navigate(`/jeongsan/${id}/roster`)}
            onShare={() => alert('카카오톡 공유 (mock)')}
            onBack={() => navigate('/jeongsan')}
          />,
        )
      case 'confirm':
        return wrap(
          <ConfirmPage
            g={g}
            s={s}
            onAccept={() => {
              setG({ ...g, status: 'CONFIRMED' })
              navigate(`/jeongsan/${id}/result`)
            }}
            onRoster={() => navigate(`/jeongsan/${id}/roster`)}
            onShare={() => alert('카카오톡 공유 (mock)')}
            onBack={back}
          />,
        )
      case 'roster':
        return wrap(<RosterPage g={g} onBack={back} onReissue={() => alert('링크 재발급 (mock)')} />)
      case 'result':
        return wrap(
          <ResultPage
            g={g}
            s={s}
            joinRequest="지원"
            onReopen={() => {
              setG({ ...g, status: 'COLLECTING' })
              navigate(`/jeongsan/${id}/collect`)
            }}
            onBack={() => navigate('/jeongsan')}
            onShare={() => alert('카카오톡 공유 (mock)')}
          />,
        )
    }
  }

  // ── H0 (기본)
  return wrap(
    <HomePage
      list={summaries}
      onOpen={(id) => navigate(`/jeongsan/${id}/${g.status === 'CONFIRMED' ? 'result' : 'collect'}`)}
      onCreate={() => navigate('/jeongsan/new')}
    />,
  )
}

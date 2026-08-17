/**
 * H5 — 명단. **제거와 링크 재발급만** 한다.
 *
 * 주최자가 이름을 대신 적는 기능은 없다 (v6 ⑫). 참여는 로그인으로만 이뤄지고,
 * 확정 후 나타난 사람은 되돌리기로 받는다.
 *
 * 제거가 남은 이유는 SPEC §2-b — 링크만 알면 아무나 들어올 수 있으므로
 * 주최자가 빼낼 수단이 있어야 한다. 확정 경고의 **초과** 케이스에서 쓰인다.
 */
import type { Gathering } from '../types'
import { shareUrlLabel } from '../api'
import { Bar, PersonRow, Shell } from '../ui'

export function RosterPage({
  g, onBack, onReissue,
}: {
  g: Gathering
  onBack: () => void
  onReissue: () => void
}) {
  const expected = g.expectedCount
  return (
    <Shell>
      <Bar
        title="명단"
        onBack={onBack}
        step={expected ? `${g.participants.length} / ${expected}명` : `${g.participants.length}명`}
      />

      <div className="js-hint" style={{ marginTop: 0 }}>
        <b>링크로 들어와 로그인한 사람만</b> 목록에 있습니다.
        주최자가 이름을 대신 적는 기능은 없습니다.
      </div>

      {g.participants.map((p) => (
        <PersonRow
          key={p.id}
          p={p}
          sub={`${p.provider === 'kakao' ? '카카오' : '구글'}${p.payout ? ' · 계좌 등록됨' : ''}`}
          right={
            p.isHost ? undefined : (
              <button
                className="js-tag no"
                style={{ border: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => alert(`${p.name} 제거 (mock)`)}
              >
                제거
              </button>
            )
          }
        />
      ))}

      <div className="js-hint">
        링크만 알면 아무나 들어올 수 있으니 <b>모르는 사람은 여기서 뺍니다.</b>
      </div>

      {/*
        공유 링크는 백엔드 호스트다. 이 앱 주소(jungsan.devkdk.com)를 뿌리면
        카카오톡 카드가 안 뜬다 — 크롤러가 JS 를 실행하지 않아서다 (ADR-007).
      */}
      <div className="js-lab">공유 링크</div>
      <div className="js-url" style={{ marginBottom: 6 }}>
        {shareUrlLabel(g.shareToken).replace(`/g/${g.shareToken}`, '')}
        <b>/g/{g.shareToken}</b>
      </div>
      <div className="js-hint">
        링크에는 <b>참석자 이름과 금액</b>이 담깁니다. 엉뚱한 곳에 공유했다면 재발급하세요.
        <b> 기존 링크는 즉시 무효</b>가 됩니다.
      </div>

      <button className="js-cta2 warn" style={{ marginTop: 'auto' }} onClick={onReissue}>
        링크 재발급
      </button>
    </Shell>
  )
}

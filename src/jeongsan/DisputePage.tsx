/**
 * 이의제기 채팅 — `/jungsan/dispute/{id}`
 *
 * **정산에서 다투는 지점은 늘 같다.** 총무는 "왔다면서 왜 안 왔다고 하냐",
 * 참여자는 "내 금액이 왜 이렇게 나오냐". 이걸 단톡방에서 하면 모두가 보는 앞에서
 * 돈 얘기를 하게 되고, 대개 아무도 말을 안 꺼내고 총무가 손해를 본다.
 *
 * 그래서 **둘만의 방**을 연다. 이의제기 하나에 방 하나다.
 *
 * 위쪽에 **무엇에 대한 이의인지**를 계속 붙여둔다 — 채팅이 길어지면
 * 원래 무슨 얘기였는지 잊어버리고 감정만 남는다.
 */
import { useEffect, useRef, useState } from 'react'
import type { Dispute, Id } from './types'
import { Bar, Shell } from './ui'

const KIND_LABEL: Record<Dispute['kind'], { tag: string; desc: string }> = {
  ATTENDANCE: { tag: '차수 확인', desc: '참석한 차수가 맞는지' },
  PAYMENT: { tag: '입금 확인', desc: '입금이 됐는지 · 금액이 맞는지' },
  AMOUNT: { tag: '금액 확인', desc: '매겨진 금액이 맞는지' },
}

function timeOf(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`
}

export function DisputePage({
  dispute, meId, counterpartName, onSend, onResolve, onBack,
}: {
  dispute: Dispute
  meId: Id
  counterpartName: string
  onSend: (text: string) => void
  /** 조율이 끝났을 때. 건 사람만 닫을 수 있다 — 걸린 사람이 닫으면 무마가 된다. */
  onResolve: () => void
  onBack: () => void
}) {
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const kind = KIND_LABEL[dispute.kind]
  const iRaised = dispute.raisedBy === meId
  const closed = dispute.status !== 'OPEN'

  // 새 메시지가 오면 아래로. 대화는 마지막 줄이 중요하다.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [dispute.messages.length])

  return (
    <Shell narrow>
      <Bar title={counterpartName} onBack={onBack} />

      {/* 무엇에 대한 이의인지 — 스크롤해도 이유가 안 사라지게 위에 고정한다 */}
      <div className={`js-dispute-head${closed ? ' done' : ''}`}>
        <div className="k">
          <span className="js-tag warn">{kind.tag}</span>
          {closed && <span className="js-tag done">해결됨</span>}
        </div>
        <div className="r">{dispute.reason}</div>
        <div className="d">{kind.desc}를 확인하는 중입니다</div>
      </div>

      <div className="js-chat">
        {dispute.messages.map((m) => {
          const mine = m.senderId === meId
          return (
            <div key={m.id} className={`js-msg${mine ? ' mine' : ''}`}>
              {!mine && <div className="who">{m.senderName}</div>}
              <div className="row">
                <div className="bub">{m.text}</div>
                <span className="t">{timeOf(m.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {closed ? (
        <div className="js-hint" style={{ textAlign: 'center', marginTop: 14 }}>
          해결된 이의제기입니다. 다시 문제가 있으면 새로 걸어주세요.
        </div>
      ) : (
        <>
          <div className="js-chatbar">
            <input
              className="js-inp"
              value={text}
              placeholder="메시지"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || !text.trim()) return
                onSend(text.trim())
                setText('')
              }}
            />
            <button
              className="js-send"
              disabled={!text.trim()}
              onClick={() => { onSend(text.trim()); setText('') }}
            >
              보내기
            </button>
          </div>

          {/* 건 사람만 닫을 수 있다. 걸린 사람이 닫으면 그냥 무마하는 게 된다. */}
          {iRaised && (
            <button className="js-cta2" style={{ marginTop: 10 }} onClick={onResolve}>
              해결됐어요 — 이의제기 닫기
            </button>
          )}
          {!iRaised && (
            <div className="js-hint" style={{ textAlign: 'center' }}>
              {counterpartName} 님이 확인하면 닫힙니다.
            </div>
          )}
        </>
      )}
    </Shell>
  )
}

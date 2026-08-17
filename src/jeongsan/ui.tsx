/** 정산어택 공통 UI 조각. 목업의 클래스를 그대로 컴포넌트로 옮긴 것. */
import type { ReactNode } from 'react'
import type { Participant } from './types'
import { won } from './api'

export function Shell({ children }: { children: ReactNode }) {
  return <div className="js-shell">{children}</div>
}

export function Bar({
  title, onBack, step, tone,
}: {
  title: string
  onBack?: () => void
  step?: string
  tone?: 'on' | 'warn'
}) {
  return (
    <div className="js-bar">
      {onBack && (
        <button className="js-back" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
      )}
      <b>{title}</b>
      {step && <div className={`js-step${tone ? ` ${tone}` : ''}`}>{step}</div>}
    </div>
  )
}

/**
 * 주소창 장식. **"이건 앱이 아니라 웹페이지다"** 를 참여자에게 알리는 것이
 * 목적이므로(`ADR-003`) 실제 호스트를 쓴다.
 *
 * 하드코딩하면 배포처마다 틀린다 — 로컬은 `localhost:5173`,
 * 독립 배포는 `jungsan.devkdk.com`, 포트폴리오 경유는 `www.devkdk.com` 이다.
 *
 * ⚠ 여기 보이는 주소는 **공유용이 아니다.** 단톡방에 뿌리는 것은
 *   `api.ts` 의 `shareUrl()` — 백엔드 호스트다 (`ADR-007`).
 */
export function Url({ path }: { path: string }) {
  return (
    <div className="js-url">
      {window.location.host}
      <b>{path}</b>
    </div>
  )
}

export function Avatar({ p, off }: { p: Participant; off?: boolean }) {
  const cls = p.isHost ? 'me' : off ? 'off' : ''
  return (
    <div className={`js-av ${cls}`}>
      {p.profileImage ? <img src={p.profileImage} alt="" /> : p.name.slice(0, 1)}
    </div>
  )
}

export function PersonRow({
  p, sub, right, off,
}: {
  p: Participant
  sub?: ReactNode
  right?: ReactNode
  off?: boolean
}) {
  return (
    <div className="js-prow">
      <Avatar p={p} off={off} />
      <div>
        <div className="js-pn" style={off ? { color: 'var(--ink3)' } : undefined}>
          {p.name}
          {p.isHost && <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 5 }}>주최자</span>}
        </div>
        {sub && <div className="js-ps">{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function Progress({
  value, total, unit, right, onEdit, ok,
}: {
  value: number
  total: number
  unit: string
  right?: ReactNode
  onEdit?: () => void
  ok?: boolean
}) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div className="js-prog">
      {onEdit && (
        <button
          onClick={onEdit}
          style={{
            float: 'right', fontSize: 11, fontWeight: 800, color: 'var(--p600)',
            background: '#fff', border: '1px solid var(--p100)', padding: '4px 10px',
            borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          인원 수정
        </button>
      )}
      <div className="n">
        {value} <small>/ {total}{unit}</small>
      </div>
      {right}
      <div className="js-track">
        <div className={`js-fill${ok ? ' ok' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Toggle({
  label, on, onToggle, sub, disabled,
}: {
  label: string
  on: boolean
  onToggle: () => void
  sub?: boolean
  disabled?: boolean
}) {
  return (
    <button
      className={`js-tog${on ? ' on' : ''}${sub ? ' sub' : ''}`}
      onClick={disabled ? undefined : onToggle}
      style={disabled ? { opacity: 0.45 } : undefined}
      type="button"
    >
      <span className="tl">{label}</span>
      <span className="js-sw" />
    </button>
  )
}

export function Radio({
  label, on, onSelect,
}: {
  label: ReactNode
  on: boolean
  onSelect: () => void
}) {
  return (
    <button className={`js-radio${on ? ' on' : ''}`} onClick={onSelect} type="button">
      <span className="js-dot" />
      <span>{label}</span>
    </button>
  )
}

export function Card({ title, right, children }: { title?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="js-card">
      {title && (
        <div className="t">
          {title}
          {right && <em>{right}</em>}
        </div>
      )}
      {children}
    </div>
  )
}

export function KV({ k, v, sub }: { k: ReactNode; v?: ReactNode; sub?: boolean }) {
  return (
    <div className={`js-kv${sub ? ' sub' : ''}`}>
      <span>{k}</span>
      {v !== undefined && <b>{v}</b>}
    </div>
  )
}

export function TransferRow({ from, to, amount }: { from?: string; to: string; amount: number }) {
  return (
    <div className="js-tf">
      {from ? (
        <>
          <b>{from}</b>
          <span className="js-arw">→</span>
          <b>{to}</b>
        </>
      ) : (
        <b>{to}</b>
      )}
      <span className="r">{won(amount)}</span>
    </div>
  )
}

export function WarnBox({
  title, children, actions,
}: {
  title: string
  children: ReactNode
  actions?: { label: string; onClick: () => void; primary?: boolean }[]
}) {
  return (
    <div className="js-box">
      <div className="bt">{title}</div>
      <div className="bn">{children}</div>
      {actions && (
        <div className="bb">
          {actions.map((a) => (
            <button key={a.label} className={a.primary ? 'a' : 'b'} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** SPEC §6 고정 안내 문구 — 단위에서 생성한다. 결과 화면과 체크 화면에 반드시 표시. */
export function FixedNotice({ unit, extra }: { unit: number; extra?: ReactNode }) {
  return (
    <div className="js-notice">
      <b>
        {unit}원 단위로 올림 처리되며, 가장 많이 결제한 분의 부담을 조금이나마 덜기 위함입니다.
      </b>
      {extra && <> {extra}</>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
      {children}
    </div>
  )
}

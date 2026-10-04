/** 정산어택 공통 UI 조각. 모임(v2) 화면용 조각은 화면과 함께 지웠다 — v3 조각은 `v3/` 안에 있다. */
import type { ReactNode } from 'react'

/**
 * 화면 공통 껍데기.
 *
 * `narrow` — **읽는 폭을 좁게 유지해야 하는 화면**에 쓴다(로그인·폼·근거 화면).
 * 목록은 넓을수록 좋지만, 입력란과 문장은 한 줄이 길어지면 오히려 읽기 힘들다.
 * 데스크톱에서만 차이가 나고 모바일은 어차피 화면을 꽉 채운다.
 */
export function Shell({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`js-shell${narrow ? ' narrow' : ''}`}>{children}</div>
}

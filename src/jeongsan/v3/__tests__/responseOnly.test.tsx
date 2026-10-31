import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EntryPage } from '../EntryPage'
import { useV3 } from '../store'

describe('로그인한 참여자의 공유 링크', () => {
  const room = useV3.getInitialState().rooms[101]
  const render = (meUserId: number, responseOnly: boolean) => renderToStaticMarkup(createElement(EntryPage, {
    g: room, meUserId, responseOnly, loggedIn: true, onLogin: () => true,
    onJoin: () => true, onOpenRoom: () => {}, onHome: () => {},
  }))
  it('기존 신원으로 응답 완료와 수정만 안내하며 방으로 이동시키지 않는다', () => {
    const html = render(2, true)
    expect(html).toContain('응답을 총무에게 보냈어요')
    expect(html).toContain('내 응답 수정')
    expect(html).not.toContain('정산방으로')
    expect(html).not.toContain('보냈어요</button>')
  })
  it('새 회원 참여자도 응답 화면에 금액이나 방 이동을 표시하지 않는다', () => {
    const html = render(6, true)
    expect(html).toContain('응답 보내기')
    expect(html).not.toContain('내 술자리로')
    expect(html).not.toContain('정산방으로')
    expect(html).not.toContain(room.rounds[0].total.toLocaleString('ko-KR'))
  })
  it('총무의 기존 방 이동은 유지한다', () => {
    expect(render(1, false)).toContain('정산방으로')
  })
})

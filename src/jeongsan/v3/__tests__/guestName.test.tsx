import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ParticipantSheet } from '../ParticipantSheet'
import { useV3 } from '../store'

describe('총무 이름 정정 진입', () => {
  const original = useV3.getInitialState().rooms[101]
  const participant = original.participants.find((person) => person.userId !== original.hostUserId)!
  const render = (guest: boolean, confirmed: boolean) => renderToStaticMarkup(createElement(ParticipantSheet, {
    g: { ...original, status: confirmed ? 'SETTLING' : 'OPEN', participants: original.participants.map((person) =>
      person.id === participant.id && guest ? { ...person, userId: null } : person) },
    participantId: participant.id, onClose: () => {}, onExempt: () => {}, onRemove: () => {}, onRename: async () => null,
  }))
  it('OPEN 비회원에게만 이름 입력과 저장을 제공한다', () => {
    expect(render(true, false)).toContain('참여자 이름 정정')
    expect(render(true, false)).toContain('이름 저장')
    expect(render(false, false)).not.toContain('이름 저장')
    expect(render(true, true)).not.toContain('이름 저장')
  })
})
